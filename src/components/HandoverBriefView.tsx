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
    <div className="card">
      <h2>Parole &amp; Post-Release Handover Package: {c.id}</h2>

      {!isReintegration && (
        <div className="note-box mb-3 text-xs">
          {c.id} has not yet reached the Reintegration level. This brief is displayed in advisory preview mode.
        </div>
      )}

      <pre className="app-pre mb-4">{briefText}</pre>

      <div className="row items-center gap-3">
        <button
          type="button"
          disabled={!canDecide || isEncrypting}
          onClick={handleEncrypt}
          className="px-4 py-2 bg-[#0079d6] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
        >
          {isEncrypting ? 'Encrypting via AES-256-GCM...' : 'Generate Encrypted Handover Package'}
        </button>
        {!canDecide && (
          <span className="mute text-xs">
            Custodial officers generate packages. Community probation officers receive them.
          </span>
        )}
      </div>

      {hasEncrypted && (
        <div className="mt-4 pt-3 border-t border-[var(--line)]">
          <h3 className="text-sm font-semibold mb-1">
            Authenticated Ciphertext Package (AES-256-GCM WebCrypto)
          </h3>
          <p className="mute text-xs mb-2">
            Encrypted in-browser using Web Crypto API. Ready for secure transmission to community probation services.
          </p>
          <pre className="app-pre text-xs">{encryptedPackage.ct.slice(0, 400)}…</pre>
        </div>
      )}
    </div>
  );
};
