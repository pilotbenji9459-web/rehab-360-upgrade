import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Only fixed, developer-authored UI copy from the server allowlist is translated.
// Case records, clinical notes, uploaded files and user-entered values are excluded.
type Manifest = { strings: string[]; available: boolean };
const normalize = (value: string) => value.replace(/\\s+/g, ' ').trim();
const preserveWhitespace = (original: string, translated: string) =>
  (original.match(/^\\s*/)?.[0] || '') + translated + (original.match(/\\s*$/)?.[0] || '');
const attributes = ['placeholder', 'title', 'aria-label', 'alt'] as const;
let manifestPromise: Promise<Manifest> | null = null;
function loadManifest(): Promise<Manifest> {
  return manifestPromise ?? (manifestPromise = fetch('/api/i18n/ui-strings')
    .then(response => {
      if (!response.ok) throw new Error('UI phrase manifest unavailable');
      return response.json() as Promise<Manifest>;
    })
    .catch(error => { manifestPromise = null; throw error; }));
}
const translationCache = new Map<string, string>();
const excluded = 'SCRIPT,STYLE,NOSCRIPT,INPUT,TEXTAREA,CODE,PRE,[contenteditable="true"],[data-no-translate]';
const numericOnly = /^(?:RP-\\d+|[\\d\\s.,:;/%+-]+)$/;

export function UiTranslationOverlay() {
  const { language } = useLanguage();
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let timer: number | undefined;
    const touchedText = new Set<Text>();
    const touchedElements = new Set<Element>();
    const originalText = new WeakMap<Text, string>();
    const translatedText = new WeakMap<Text, string>();
    const originalAttrs = new WeakMap<Element, Map<string, string>>();
    const translatedAttrs = new WeakMap<Element, Map<string, string>>();

    const restore = () => {
      observer?.disconnect();
      for (const node of touchedText) {
        const translated = translatedText.get(node);
        const original = originalText.get(node);
        // Restore only if our translation is still present. Never overwrite newer React content.
        if (node.isConnected && translated !== undefined && original !== undefined && node.nodeValue === translated) {
          node.nodeValue = original;
        }
      }
      for (const element of touchedElements) {
        const originals = originalAttrs.get(element);
        const translated = translatedAttrs.get(element);
        if (!element.isConnected || !originals || !translated) continue;
        for (const [name, value] of originals) {
          if (translated.has(name) && element.getAttribute(name) === translated.get(name)) {
            element.setAttribute(name, value);
          }
        }
      }
    };

    if (language === 'en') return restore;
    void loadManifest().then(({ strings, available }) => {
      if (cancelled || !available) return;
      const ids = new Map(strings.map((value, index) => [normalize(value), index]));
      // Capture the exact original value per node when queued. Async results are applied
      // only if React has not reused or changed that node in the meantime.
      const pending = new Set<number>();
      const queuedText = new Map<number, Map<Text, string>>();
      const queuedAttrs = new Map<number, Array<{ element: Element; name: string; original: string }>>();
      let sending = false;

      const queueText = (id: number, node: Text, original: string) => {
        const group = queuedText.get(id) || new Map<Text, string>();
        group.set(node, original);
        queuedText.set(id, group);
        pending.add(id);
      };
      const queueAttr = (id: number, element: Element, name: string, original: string) => {
        const group = queuedAttrs.get(id) || [];
        if (!group.some(item => item.element === element && item.name === name)) group.push({ element, name, original });
        queuedAttrs.set(id, group);
        pending.add(id);
      };

      const scan = () => {
        if (cancelled) return;
        const root = document.getElementById('root') || document.body;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const element = node.parentElement;
            if (!element || element.closest(excluded)) return NodeFilter.FILTER_REJECT;
            const value = normalize(node.nodeValue || '');
            return value.length >= 2 && !numericOnly.test(value) && ids.has(value)
              ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          },
        });
        let current: Node | null;
        while ((current = walker.nextNode())) {
          const node = current as Text;
          const original = node.nodeValue || '';
          const id = ids.get(normalize(original));
          if (id === undefined) continue;
          touchedText.add(node);
          const cached = translationCache.get(language + ':' + id);
          if (cached) {
            const translated = preserveWhitespace(original, cached);
            originalText.set(node, original);
            translatedText.set(node, translated);
            if (node.nodeValue !== translated) node.nodeValue = translated;
          } else queueText(id, node, original);
        }

        root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(element => {
          if (element.closest('[data-no-translate]')) return;
          for (const name of attributes) {
            const original = element.getAttribute(name);
            if (!original) continue;
            const id = ids.get(normalize(original));
            if (id === undefined) continue;
            touchedElements.add(element);
            const originals = originalAttrs.get(element) || new Map<string, string>();
            if (!originals.has(name)) originals.set(name, original);
            originalAttrs.set(element, originals);
            const cached = translationCache.get(language + ':' + id);
            if (cached) {
              const translated = translatedAttrs.get(element) || new Map<string, string>();
              translated.set(name, cached);
              translatedAttrs.set(element, translated);
              if (element.getAttribute(name) !== cached) element.setAttribute(name, cached);
            } else queueAttr(id, element, name, original);
          }
        });
        if (pending.size && !sending) void send();
      };

      const send = async () => {
        if (sending || cancelled || pending.size === 0) return;
        sending = true;
        const batch = [...pending].slice(0, 24);
        batch.forEach(id => pending.delete(id));
        const textSnapshot = new Map(batch.map(id => [id, new Map(queuedText.get(id) || [])]));
        const attrSnapshot = new Map(batch.map(id => [id, [...(queuedAttrs.get(id) || [])]]));
        batch.forEach(id => { queuedText.delete(id); queuedAttrs.delete(id); });
        try {
          const response = await fetch('/api/i18n/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, ids: batch }),
          });
          if (!response.ok) throw new Error('UI translation temporarily unavailable');
          const data = await response.json();
          if (cancelled) return;
          for (const id of batch) {
            const value = data.translations?.[String(id)];
            if (typeof value !== 'string' || !value.trim()) continue;
            translationCache.set(language + ':' + id, value);
            for (const [node, capturedOriginal] of textSnapshot.get(id) || []) {
              if (!node.isConnected || node.nodeValue !== capturedOriginal) continue;
              const translated = preserveWhitespace(capturedOriginal, value);
              originalText.set(node, capturedOriginal);
              translatedText.set(node, translated);
              node.nodeValue = translated;
            }
            for (const { element, name, original } of attrSnapshot.get(id) || []) {
              if (!element.isConnected || element.getAttribute(name) !== original) continue;
              const translated = translatedAttrs.get(element) || new Map<string, string>();
              translated.set(name, value);
              translatedAttrs.set(element, translated);
              element.setAttribute(name, value);
            }
          }
        } catch (error) {
          // Leave source copy intact rather than showing a guessed translation.
          console.warn('UI translation skipped:', error);
        } finally {
          sending = false;
          if (pending.size && !cancelled) timer = window.setTimeout(() => void send(), 120);
        }
      };

      observer = new MutationObserver(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(scan, 100);
      });
      scan();
      observer.observe(document.getElementById('root') || document.body, {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: [...attributes],
      });
    }).catch(error => console.warn('UI phrase manifest unavailable:', error));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      restore();
    };
  }, [language]);
  return null;
}
