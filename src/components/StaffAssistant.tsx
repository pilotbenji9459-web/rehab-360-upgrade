import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, ChevronDown, Compass, Loader2, MessageCircle, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import type { OffenderCase, StaffRole, TabId } from '../types';
import './staffAssistant.css';

const suggested: Record<StaffRole, string[]> = {
  Administrator: ['Where do I manage permissions?', 'Show me the audit trail', 'How do I review placements?'],
  Warden: ['Where are progression gates?', 'How do I review placement?', 'Show me case documents'],
  Psychologist: ['Open clinical notes', 'Where are well-being indicators?', 'How do I review a case?'],
  'Case Manager': ['Open rehabilitation plans', 'Show me case documents', 'How do I manage evidence?'],
  Educator: ['Where are education scores?', 'Open progression gates', 'How do I find case evidence?'],
  'Community Rehabilitation Officer': ['Open parole handover', 'Where are rehabilitation plans?', 'How do I review a case?'],
};
type ChatMessage = { role: 'user' | 'assistant'; text: string; navigate_to?: TabId; notice?: string; mode?: 'ai' | 'guide' | 'case' | 'offline' };
interface Props {
  cases: OffenderCase[];
  selectedCaseId?: string;
  onNavigate: (tab: TabId, caseId?: string) => void;
}
export const StaffAssistant: React.FC<Props> = ({ cases, selectedCaseId, onNavigate }) => {
  const { user, institution } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [caseId, setCaseId] = useState(selectedCaseId || '');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the request alive while showing progress instead of cutting off at 12s.
  useEffect(() => {
    if (!busy) { setWaitingSeconds(0); return; }
    const start = Date.now();
    const timer = window.setInterval(() => setWaitingSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);
  useEffect(() => { setCaseId(selectedCaseId || ''); }, [selectedCaseId]);
  useEffect(() => { setIsOpen(false); setMessages([]); setDraft(''); }, [user?.id]);
  useEffect(() => { setMessages([]); }, [caseId]);
  useEffect(() => { if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy, isOpen]);
  if (!user) return null;

  const current = cases.find(item => item.id === caseId);
  const ask = async (text: string) => {
    const question = text.trim();
    if (busy || !question || question.length > 1000) return;
    const history = messages.slice(-6).map(({ role, text }) => ({ role, text: text.slice(0, 450) }));
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setDraft('');
    setBusy(true);
    try {
      const result = await Api.askStaffAssistant(question, caseId || undefined, history);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.answer,
        mode: result.mode,
        ...(result.notice ? { notice: result.notice } : {}),
        ...(result.navigate_to ? { navigate_to: result.navigate_to } : {}),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: err instanceof Error ? err.message : 'I could not connect. Please try again.',
      }]);
    } finally {
      setBusy(false);
    }
  };
  const openDestination = (tab: TabId) => {
    onNavigate(tab, caseId || undefined);
    setIsOpen(false);
  };
  const questions = current
    ? ['What is their current attendance?', 'Which progression gate is lowest?', 'What is the placement status?', 'Where are the case files?']
    : suggested[user.role];

  return (
    <div className="pathway-ai-layer">
      {isOpen && (
        <section className="pathway-ai-window" role="dialog" aria-modal="false" aria-label="Pathway AI assistant">
          <div className="pathway-ai-header">
            <div className="pathway-ai-brand-icon"><Sparkles size={22}/></div>
            <div className="pathway-ai-brand-copy">
              <div className="pathway-ai-title">Pathway <span>AI</span></div>
              <p>{t('ai.companion')}</p>
            </div>
            <button type="button" className="pathway-ai-icon-button" onClick={() => setIsOpen(false)} aria-label="Close assistant"><X size={19}/></button>
          </div>
          <div className="pathway-ai-context">
            <div className="pathway-ai-context-top"><ShieldCheck size={15}/><span>{user.role} access</span><span className="pathway-ai-context-dot"/> <span>{institution?.is_demo ? t('ai.demo') : t('ai.protected')}</span></div>
            <label htmlFor="pathway-case-context">{t('ai.working')}</label>
            <div className="pathway-ai-select-wrap">
              <select id="pathway-case-context" disabled={busy} value={caseId} onChange={event => setCaseId(event.target.value)}>
                <option value="">{t('ai.general')}</option>
                {cases.map(item => <option value={item.id} key={item.id}>{item.id} · {item.first_name} {item.last_name}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true"/>
            </div>
          </div>
          <div className="pathway-ai-conversation" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && (
              <div className="pathway-ai-welcome">
                <div className="pathway-ai-welcome-mark"><Bot size={24}/></div>
                <h3>{t('ai.welcome')}</h3>
                <p>{current
                  ? `${t('ai.welcome_case')} (${current.id})`
                  : t('ai.welcome_general')}</p>
                <div className="pathway-ai-suggestions">
                  {questions.map(question => (
                    <button key={question} disabled={busy} type="button" onClick={() => void ask(question)}>
                      <Sparkles size={14}/><span>{question}</span><ArrowRight size={14}/>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`pathway-ai-message pathway-ai-message--${message.role}`}>
                {message.role === 'assistant' && <div className="pathway-ai-mini-avatar"><Sparkles size={14}/></div>}
                <div className="pathway-ai-message-content">
                  {message.role === 'assistant' && (
                    <div className="pathway-ai-response-mode">
                      {message.mode === 'ai' ? 'Gemini AI' : message.mode === 'offline' ? 'Offline guidance · AI unavailable' : 'Verified record'}
                    </div>
                  )}
                  {message.notice && <div className="pathway-ai-service-notice" role="status">{message.notice}</div>}
                  <div className="pathway-ai-bubble">{message.text}</div>
                  {message.navigate_to && (
                    <button type="button" className="pathway-ai-open-link" onClick={() => openDestination(message.navigate_to!)}>
                      <Compass size={16}/> {t('ai.open')} <ArrowRight size={15}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="pathway-ai-thinking" role="status">
                <Loader2 size={16} className="pathway-ai-spinner"/>
                <span>
                  {t('ai.thinking')} {waitingSeconds > 0 ? `(${waitingSeconds}s)` : ''}
                  {waitingSeconds >= 20 && (
                    <span className="block text-xs opacity-75">Gemini is still working. Your question has not been cancelled.</span>
                  )}
                </span>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <form className="pathway-ai-composer" onSubmit={event => { event.preventDefault(); void ask(draft); }}>
            <div className="pathway-ai-composer-row">
              <label htmlFor="pathway-ai-prompt" className="sr-only">Ask Pathway AI</label>
              <textarea id="pathway-ai-prompt" rows={2} maxLength={1000} value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(draft); } }}
                placeholder={current ? t('ai.placeholder_case') : t('ai.placeholder_general')}/>
              <button type="submit" className="pathway-ai-send" disabled={busy || !draft.trim()} aria-label="Send message"><Send size={19}/></button>
            </div>
            <p>{t('ai.disclaimer')}</p>
          </form>
        </section>
      )}
      <button type="button" className="pathway-ai-launcher" onClick={() => setIsOpen(open => !open)} aria-expanded={isOpen}>
        {isOpen ? <X size={20}/> : <MessageCircle size={21}/>}
        <span>{isOpen ? t('ai.close') : t('ai.launch')}</span>
        {!isOpen && <Sparkles size={15} className="pathway-ai-launcher-sparkle"/>}
      </button>
    </div>
  );
};
