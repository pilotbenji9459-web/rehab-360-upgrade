import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ModalAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ModalAlert: React.FC<ModalAlertProps> = ({
  isOpen,
  title = 'Notice',
  message,
  onClose,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    >
      <div
        className="w-full max-w-md rounded-lg p-5 shadow-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)]"
        style={{ borderTop: '3px solid var(--acc)' }}
      >
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-sm text-[var(--ink)] mb-5 whitespace-pre-wrap leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-[var(--acc)] text-white font-medium hover:opacity-90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
