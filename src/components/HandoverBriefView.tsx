import React, { useState } from 'react';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getOffenderPos,
  generateHandoverBrief,
  canPerform,
  encryptHandoverBrief,
} from '../utils/aiLogic';

interface HandoverBriefViewProps {
  currentRecord: OffenderCase;
  encryptedPackage: { id: string; ct: string } | null;
  onSetEncryptedPackage: (pkg: { id: string; ct: string }, byteLength: number) => void;
}

export const HandoverBriefView: React.FC<HandoverBriefViewProps> = ({
  currentRecord,
  encryptedPackage,
  onSetEncryptedPackage,
}) => {
  const { user } = useAuth();
  const c = currentRecord;
  const p = getOffenderPos(c);
  const isReintegration = p != null && p >= 9;
  const briefText = generateHandoverBrief(c);
  const userRole = user?.role || 'Warden';
  const canDecide = canPerform(userRole, 'decide');
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleEncrypt = async () => {
    try {
      setIsEncrypting(true);
      const res = await encryptHandoverBrief(c);
      onSetEncryptedPackage({ id: res.id, ct: res.ct }, res.byteLength);
    } catch (err) {
      console.error('Encryption failed:', err);
    } finally {
      setIsEncrypting(false);
    }
  };

  const hasEncrypted = encryptedPackage && encryptedPackage.id === c.id;

  return (
    <div className="space-y-6">
      {/* Community Handover Visual Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl flex flex-col md:flex-row items-stretch">
        <div className="md:w-5/12 h-52 md:h-auto overflow-hidden bg-slate-950 shrink-0">
          <img
            src="/assets/images/parole_handover_secure.svg"
            alt="Cryptographic parole handover dossier and secure probation dispatch protocol"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Post-Release Continuity Protocol
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white mb-2">
            {"Handover"} 
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Coordinating safe transition from institutional custody to community supervision. Package includes verifiable course milestones, psychometric summaries, and risk-need profiles cryptographically sealed for community probation officers.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2>Parole &amp; Post-Release Handover Package: {c.id}</h2>

        {!isReintegration && (
          <div className="note-box text-sm">
            {c.id} has not yet reached the Reintegration level. This brief is displayed in advisory preview mode.
          </div>
        )}

        <pre className="app-pre text-sm">{briefText}</pre>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={!canDecide || isEncrypting}
            onClick={handleEncrypt}
            className="px-5 py-2.5 bg-gradient-to-r from-[#0079d6] to-[#0284c7] hover:from-[#006bbd] hover:to-[#0274b0] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-md"
          >
            {isEncrypting ? 'Encrypting via AES-256-GCM...' : 'Generate Encrypted Handover Package'}
          </button>
          {!canDecide && (
            <span className="text-sm text-slate-400">
              Custodial officers generate packages. Community probation officers receive them.
            </span>
          )}
        </div>

        {hasEncrypted && (
          <div className="mt-5 pt-4 border-t border-[#1e3a5f] space-y-2">
            <h3 className="text-base font-semibold text-white">
              Authenticated Ciphertext Package (AES-256-GCM WebCrypto)
            </h3>
            <p className="text-sm text-slate-300">
              Encrypted in-browser using Web Crypto API. Ready for secure transmission to community probation services.
            </p>
            <pre className="app-pre text-xs overflow-x-auto text-emerald-400 font-mono">{encryptedPackage.ct.slice(0, 400)}…</pre>
          </div>
        )}
      </div>

      {/* Multi-Agency Civic Network Map */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="px-6 py-4 bg-[#0a1a33] border-b border-[#1e3a5f] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5cc2bd]">
            Multi-Agency Civic Infrastructure
          </span>
          <span className="text-xs text-slate-400 font-mono">End-to-End Interoperability</span>
        </div>
        <img
          src="/assets/images/community_transition_network.svg"
          alt="Multi-agency civic transition network diagram linking custody, probation, housing, healthcare, and employment"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-cover max-h-[300px]"
        />
        <div className="p-5 bg-[#071325] text-xs text-slate-300 leading-relaxed border-t border-[#1e3a5f]">
          Cross-agency coordination ensures all critical services (housing, medical prescriptions, employment interviews, and community mentoring) are synchronized prior to gate completion.
        </div>
      </div>
    </div>
  );
};
