import React, { useState } from 'react';
import { Api, AuthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Building2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BootstrapSetupModalProps {
  onSuccess: () => void;
}

export const BootstrapSetupModal: React.FC<BootstrapSetupModalProps> = ({ onSuccess }) => {
  const { refreshSystemStatus } = useAuth();
  const [instName, setInstName] = useState('National Correctional Facility');
  const [instCode, setInstCode] = useState('NCF-01');
  const [adminName, setAdminName] = useState('Chief Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminBadge, setAdminBadge] = useState('ADM-01');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !password || !instName.trim() || !instCode.trim()) {
      setError('Please provide all mandatory institution and administrator fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long for security compliance.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await Api.bootstrapAdmin({
        institution_name: instName.trim(),
        institution_code: instCode.trim().toUpperCase(),
        admin_email: adminEmail.trim().toLowerCase(),
        admin_password: password,
        admin_name: adminName.trim(),
        admin_badge: adminBadge.trim(),
        setup_token: setupToken.trim() || undefined,
      });

      AuthService.setToken(res.token);
      await refreshSystemStatus();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Bootstrap initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0c1c36] border border-slate-700 text-slate-100 shadow-2xl p-6 sm:p-8 my-8">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0284c7] via-[#5cc2bd] to-[#10b981]" />

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#5cc2bd] flex items-center justify-center text-white shadow-lg shadow-[#0284c7]/30 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider mb-1">
              Initial Deployment Setup
            </div>
            <h2 className="text-xl font-bold font-serif text-white">First-Administrator Initialization</h2>
            <p className="text-xs text-slate-400">Zero staff accounts exist. Configure initial facility administrator.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5cc2bd] block">
              1. Institutional Identity
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="e.g. HMP Oakwood"
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Facility Code *</label>
                <input
                  type="text"
                  required
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  placeholder="e.g. HMP-OAK"
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8] block">
              2. First Administrator Account
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Staff Badge ID</label>
                <input
                  type="text"
                  value={adminBadge}
                  onChange={(e) => setAdminBadge(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@rehabilitation.gov"
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password (Min 8 chars) *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Setup Token (Optional — only required if configured in server environment)
            </label>
            <input
              type="password"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              placeholder="Leave blank if SETUP_TOKEN is not enforced"
              className="w-full text-xs py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0274b0] hover:to-[#025a8b] text-white font-semibold text-xs shadow-lg shadow-[#0284c7]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Initializing Facility Security...' : 'Initialize Facility & Claim Administrator Account'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Security notice: Once claimed, this bootstrap endpoint is permanently locked. Subsequent staff accounts must be provisioned by this administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
