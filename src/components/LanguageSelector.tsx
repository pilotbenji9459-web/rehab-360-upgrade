import React, { useState } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps { compact?: boolean; }
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(item => item.code === language) || LANGUAGES[0];
  return (
    <div className="relative z-[60]">
      <button type="button" onClick={() => setOpen(value => !value)} aria-haspopup="listbox" aria-expanded={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#31516e] bg-[#10263e] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#173653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd]">
        <Languages className="h-4 w-4 shrink-0 text-[#5cc2bd]" />
        {!compact && <span className="hidden sm:inline">{t('language')}:</span>}
        <span>{current.nativeName}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>
      {open && <>
        <button aria-label="Close language menu" className="fixed inset-0 z-[-1] cursor-default" onClick={() => setOpen(false)} />
        <div role="listbox" aria-label={t('chooseLanguage')} className="absolute right-0 top-full mt-2 max-h-[min(70vh,28rem)] w-64 overflow-y-auto rounded-xl border border-[#31516e] bg-[#0b1a30] p-2 shadow-2xl">
          <p className="px-2 pb-2 pt-1 text-[11px] leading-relaxed text-slate-400">{t('selectLanguageHint')}</p>
          <div className="grid grid-cols-1 gap-1">
            {LANGUAGES.map(item => (
              <button key={item.code} type="button" role="option" aria-selected={language === item.code}
                onClick={() => { setLanguage(item.code); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#173653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] ${language === item.code ? 'bg-[#123452] text-white' : 'text-slate-200'}`}>
                <span className="min-w-0"><span className="block font-semibold">{item.nativeName}</span><span className="block text-[11px] text-slate-400">{item.name}</span></span>
                {language === item.code && <Check className="h-4 w-4 shrink-0 text-[#5cc2bd]" />}
              </button>
            ))}
          </div>
        </div>
      </>}
    </div>
  );
};
