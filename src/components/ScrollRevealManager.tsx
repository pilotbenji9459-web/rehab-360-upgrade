import { useEffect } from 'react';

/**
 * Progressive-enhancement reveal controller. Existing content stays visible if
 * JavaScript, IntersectionObserver, or animations are unavailable.
 */
export function ScrollRevealManager() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || typeof IntersectionObserver === 'undefined') return;

    const root = document.getElementById('root');
    if (!root) return;
    const targets = [
      '[data-motion-scope="landing"] img',
      '[data-motion-scope="landing"] .reveal-feature',
      '[data-motion-scope="dashboard"] .reveal-feature',
    ].join(', ');
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('scroll-pop-visible');
        observer.unobserve(el);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px 60px 0px' });

    const register = () => {
      root.querySelectorAll<HTMLElement>(targets).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        // Above-the-fold items should render immediately, not flash or pop
        // after load. Only elements genuinely below the viewport animate.
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 40) return;
        element.classList.add('scroll-pop-pending');
        observer.observe(element);
      });
    };
    register();

    let pending = 0;
    const mutations = new MutationObserver(() => {
      window.cancelAnimationFrame(pending);
      pending = window.requestAnimationFrame(register);
    });
    mutations.observe(root, { subtree: true, childList: true });
    return () => {
      window.cancelAnimationFrame(pending);
      mutations.disconnect();
      observer.disconnect();
      root.querySelectorAll<HTMLElement>('.scroll-pop-pending').forEach(el => {
        el.classList.remove('scroll-pop-pending');
        el.classList.add('scroll-pop-visible');
      });
    };
  }, []);
  return null;
}
