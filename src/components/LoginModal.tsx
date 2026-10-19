import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { StaffRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEMO_ACCOUNTS: { role: StaffRole; email: string; name: string; dept: string }[] = [
  { role: 'Administrator', email: 'admin@rehabpath.gov', name: 'Arthur Pendelton', dept: 'Executive Admin' },
  { role: 'Warden', email: 'warden@rehabpath.gov', name: 'Marcus Vance', dept: 'Custodial & Ops' },
  { role: 'Psychologist', email: 'psychologist@rehabpath.gov', name: 'Dr. Fiona Gallagher', dept: 'Clinical Psych' },
  { role: 'Case Manager', email: 'casemanager@rehabpath.gov', name: 'David Reynolds', dept: 'Case Care' },
  { role: 'Educator', email: 'educator@rehabpath.gov', name: 'Elena Rostova', dept: 'Vocational Training' },
  { role: 'Community Rehabilitation Officer', email: 'probation@rehabpath.gov', name: 'Hannah Brooks', dept: 'Community Parole' },
];

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('warden@rehabpath.gov');
  const [password, setPassword] = useState('RehabPath360!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('RehabPath360!');
    setError(null);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0c1c36] border border-slate-700 text-slate-100 shadow-2xl p-6 sm:p-8 overflow-hidden my-8">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0079d6] via-[#5cc2bd] to-[#38bdf8]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0079d6] to-[#5cc2bd] flex items-center justify-center shadow-lg shadow-[#0079d6]/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-white">REHABPATH360 Staff Login</h2>
            <p className="text-xs text-slate-400">Authorized Correctional &amp; Clinical Staff Portal</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!showForgot ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    style={{ paddingLeft: '48px' }}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@rehabpath.gov"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#0079d6] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    style={{ paddingLeft: '48px' }}
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#0079d6] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0079d6] to-[#0284c7] hover:from-[#006bbd] hover:to-[#0274b0] text-white font-semibold text-sm shadow-md shadow-[#0079d6]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Secure Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Picker */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                Quick Test: Select Staff Role Account
              </span>
              <p className="text-[11px] text-slate-400 mb-3">
                Click any pre-provisioned role below to fill credentials and test role-based permissions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectDemo(acc.email)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-[#0079d6] text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white truncate">{acc.role}</div>
                      <div className="text-[10px] text-slate-400 truncate">{acc.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Reset Institutional Access</h3>
            <p className="text-xs text-slate-400">
              Enter your registered institutional email to initiate password recovery. A secure single-use recovery token will be dispatched to your supervisor.
            </p>

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Recovery Token Dispatched</span>
                  <span>If an account matches {forgotEmail}, instructions have been routed to custodial admin.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="officer@rehabpath.gov"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#0079d6]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0079d6] hover:bg-[#006bbd] text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Request Password Reset
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotSent(false);
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              ← Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
