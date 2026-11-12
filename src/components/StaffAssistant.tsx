import React, { useEffect, useState } from 'react';
import { Bot, Send, X, ShieldCheck, Loader2 } from 'lucide-react';
import { Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { StaffRole, OffenderCase } from '../types';

const prompts: Record<StaffRole, string[]> = {
  Administrator: ['How do I manage staff permissions?', 'Where is the audit trail?'],
  Warden: ['How do I verify placement?', 'How do progression gates work?'],
  Psychologist: ['Where do I enter clinical notes?', 'How do I update well-being?'],
  'Case Manager': ['How do I manage a case?', 'Where are rehabilitation plans?'],
  Educator: ['How do I update education evidence?', 'Where is document intake?'],
  'Community Rehabilitation Officer': ['Where is parole handover?', 'How do I plan reintegration?'],
};
type Message = { sender: 'assistant' | 'user'; text: string };

interface StaffAssistantProps {
  cases: OffenderCase[];
  selectedCaseId?: string;
}

export const StaffAssistant: React.FC<StaffAssistantProps> = ({ cases, selectedCaseId }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [caseId, setCaseId] = useState(selectedCaseId || '');
  useEffect(() => { setCaseId(selectedCaseId || ''); }, [selectedCaseId]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => { setOpen(false); setMessages([]); setInput(''); }, [user?.id]);
  useEffect(() => { setMessages([]); }, [caseId]);
  if (!user) return null;
  const selectedCase = cases.find(c => c.id === caseId);

  const send = async (value: string) => {
    const question = value.trim();
    if (!question || busy || question.length > 1000) return;
    setMessages(prev => [...prev, { sender: 'user', text: question }]);
    setInput('');
    setBusy(true);
    try {
      const response = await Api.askStaffAssistant(question, caseId || undefined);
      setMessages(prev => [...prev, { sender: 'assistant', text: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'assistant', text: error instanceof Error ? error.message : 'The assistant is unavailable. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
      {open && (
        <section aria-label="Staff AI assistant" className="mb-3 w-[390px] max-w-full h-[min(550px,calc(100dvh-7rem))] min-h-[280px] flex flex-col overflow-hidden rounded-2xl border border-sky-700/60 bg-[#0b1a30] shadow-2xl text-slate-100">
          <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-700 bg-[#0e2946]">
            <div className="flex items-start gap-3 min-w-0">
              <Bot className="w-6 h-6 text-sky-300 shrink-0" aria-hidden="true"/>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold m-0 text-white">Staff AI Assistant</h2>
                <p className="text-sm text-slate-300 mt-1 mb-0 break-words">Guidance for {user.role}</p>
              </div>
            </div>
            <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="shrink-0 bg-transparent p-1.5 text-slate-200 hover:bg-slate-700"><X className="w-5 h-5"/></button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-200 bg-emerald-900/20 border-b border-slate-700">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true"/>
            <span>{selectedCase ? 'Case data stays on the app server; no case data sent to Gemini.' : 'General app help. Avoid typing sensitive personal details.'}</span>
          </div>
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/80">
            <label htmlFor="assistant-case-selector" className="block mb-1 text-sm text-slate-200 font-semibold">Case context</label>
            <select id="assistant-case-selector" value={caseId} onChange={event => setCaseId(event.target.value)} disabled={busy}
              className="w-full min-w-0 rounded-lg bg-slate-800 text-slate-100 text-sm border border-slate-600 px-2 py-2">
              <option value="">General app help (no case)</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.id} · {c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && (
              <>
                <p className="text-base leading-relaxed text-slate-200">{selectedCase ? `Ask about ${selectedCase.id}: case summary, linked files, attendance, placement, or progression gates.` : 'Choose a case above for answers from saved records, or ask about app workflows.'}</p>
                <div className="grid gap-2">
                  {(selectedCase ? ['Summarize this case', 'List linked files', 'Is this case ready to advance?', 'Show attendance and engagement'] : prompts[user.role]).map(prompt => (
                    <button type="button" key={prompt} onClick={() => void send(prompt)} className="text-left text-sm leading-relaxed bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2 border border-slate-600 text-slate-100">{prompt}</button>
                  ))}
                </div>
              </>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`max-w-[95%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words ${message.sender === 'user' ? 'ml-auto bg-sky-700 text-white' : 'mr-auto bg-slate-800 text-slate-100'}`}>
                {message.text}
              </div>
            ))}
            {busy && <p className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true"/> Thinking...</p>}
          </div>
          <form className="flex gap-2 items-end p-3 border-t border-slate-700" onSubmit={(event) => { event.preventDefault(); void send(input); }}>
            <label htmlFor="staff-ai-question" className="sr-only">Ask the staff assistant</label>
            <textarea id="staff-ai-question" rows={2} maxLength={1000} value={input} onChange={event => setInput(event.target.value)} placeholder={selectedCase ? "Ask about this case..." : "Ask about a feature or task..."} className="flex-1 min-w-0 max-h-28 resize-none text-sm bg-slate-900 border border-slate-600 p-2.5 rounded-lg text-white" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send question" className="shrink-0 p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl"><Send className="w-5 h-5"/></button>
          </form>
        </section>
      )}
      <button type="button" aria-label={open ? 'Hide staff AI assistant' : 'Open staff AI assistant'} aria-expanded={open} onClick={() => setOpen(!open)} className="ml-auto flex items-center gap-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-xl border border-sky-400 px-4 py-3 text-base font-semibold">
        <Bot className="w-5 h-5" aria-hidden="true" /> {open ? 'Close AI' : 'Ask Staff AI'}
      </button>
    </div>
  );
};
