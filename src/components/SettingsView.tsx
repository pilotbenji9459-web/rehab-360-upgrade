import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { StaffRole } from '../types';
import {
  Building2,
  ShieldCheck,
  Palette,
  Sliders,
  Database,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  showAlert: (message: string, title?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ showAlert }) => {
  const { user, institution, systemStatus, refreshInstitution } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const [name, setName] = useState(institution?.name || 'RehabPath360');
  const [code, setCode] = useState(institution?.code || 'REHAB-360');
  const [logoUrl, setLogoUrl] = useState(institution?.logo_url || '');

  const [designations, setDesignations] = useState<Record<StaffRole, string>>({
    Administrator: institution?.staff_designations?.Administrator || 'Executive Administrator',
    Warden: institution?.staff_designations?.Warden || 'Governing Governor / Warden',
    Psychologist: institution?.staff_designations?.Psychologist || 'Clinical Psychologist',
    'Case Manager': institution?.staff_designations?.['Case Manager'] || 'Rehabilitation Case Manager',
    Educator: institution?.staff_designations?.Educator || 'Vocational Education Officer',
    'Community Rehabilitation Officer':
      institution?.staff_designations?.['Community Rehabilitation Officer'] ||
      'Community Rehabilitation Officer',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cleanSetupToken, setCleanSetupToken] = useState('');

  // Personal appearance is browser/account-specific; it is not institution branding.
  const DEFAULT_PRIMARY = '#0284c7';
  const DEFAULT_TEAL = '#5cc2bd';
  const isValidHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
  const [personalPrimary, setPersonalPrimary] = useState(DEFAULT_PRIMARY);
  const [personalTeal, setPersonalTeal] = useState(DEFAULT_TEAL);
  const personalThemeKey = user?.id ? `rehabpath360:personal-theme:${user.id}` : '';

  useEffect(() => {
    if (!personalThemeKey) {
      document.documentElement.style.setProperty('--acc', DEFAULT_PRIMARY);
      document.documentElement.style.setProperty('--teal', DEFAULT_TEAL);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(personalThemeKey) || '{}');
      setPersonalPrimary(typeof saved.primary === 'string' && isValidHex(saved.primary) ? saved.primary : DEFAULT_PRIMARY);
      setPersonalTeal(typeof saved.teal === 'string' && isValidHex(saved.teal) ? saved.teal : DEFAULT_TEAL);
    } catch {
      setPersonalPrimary(DEFAULT_PRIMARY);
      setPersonalTeal(DEFAULT_TEAL);
    }
  }, [personalThemeKey]);

  // Re-apply the account's saved theme after state hydration and on account changes.
  useEffect(() => {
    document.documentElement.style.setProperty('--acc', isValidHex(personalPrimary) ? personalPrimary : DEFAULT_PRIMARY);
    document.documentElement.style.setProperty('--teal', isValidHex(personalTeal) ? personalTeal : DEFAULT_TEAL);
  }, [personalPrimary, personalTeal]);

  const savePersonalTheme = () => {
    if (!personalThemeKey || !isValidHex(personalPrimary) || !isValidHex(personalTeal)) {
      showAlert('Use six-digit hex colours such as #0284c7.', 'Invalid Personal Colours');
      return;
    }
    try {
      localStorage.setItem(personalThemeKey, JSON.stringify({ primary: personalPrimary, teal: personalTeal }));
      document.documentElement.style.setProperty('--acc', personalPrimary);
      document.documentElement.style.setProperty('--teal', personalTeal);
      showAlert('Your colours were saved to this browser for your account.', 'Personal Appearance Saved');
    } catch {
      showAlert('Could not save your personal colours in this browser.', 'Save Failed');
    }
  };

  const resetPersonalTheme = () => {
    try {
      if (personalThemeKey) localStorage.removeItem(personalThemeKey);
      setPersonalPrimary(DEFAULT_PRIMARY);
      setPersonalTeal(DEFAULT_TEAL);
      document.documentElement.style.setProperty('--acc', DEFAULT_PRIMARY);
      document.documentElement.style.setProperty('--teal', DEFAULT_TEAL);
      showAlert('Your personal appearance has been reset.', 'Personal Appearance Reset');
    } catch {
      showAlert('Could not reset your saved appearance.', 'Reset Failed');
    }
  };
  const switchMode = async () => {
    if (!isAdmin) return;
    const nextMode = systemStatus?.mode === 'deployment' ? 'demo' : 'deployment';
    const label = nextMode === 'deployment' ? 'Clean Deployment Mode' : 'Exhibition Demo Mode';
    const confirmed = window.confirm(`Switch to ${label}? The two modes use separate databases. Your current session will end and you will be returned to the appropriate start screen. No records are copied or deleted.`);
    if (!confirmed) return;
    setIsSaving(true);
    try {
      await Api.switchSystemMode(nextMode, nextMode === 'deployment' ? cleanSetupToken.trim() : undefined);
      window.sessionStorage.clear();
      window.location.assign(window.location.pathname);
    } catch (err: any) {
      showAlert(err.message || 'Could not switch application mode.', 'Mode Switch Failed');
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (institution) {
      setName(institution.name || 'RehabPath360');
      setCode(institution.code);
      setLogoUrl(institution.logo_url || '');
      if (institution.staff_designations) {
        setDesignations(institution.staff_designations);
      }
    }
  }, [institution]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showAlert('Only administrators are authorized to update institutional configuration.', 'Permission Denied');
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await Api.updateInstitution({
        name,
        code,
        logo_url: logoUrl,
        staff_designations: designations,
      });

      await refreshInstitution();
      setSavedSuccess(true);
      showAlert('Institutional configuration and custom staff designations updated.', 'Settings Saved');
    } catch (err: any) {
      showAlert(err.message || 'Failed to update settings.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Settings Header */}
      <div className="card bg-[#0b1a30] border-t-3 border-[#0284c7]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-[#0284c7]" />
              <span>Settings</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure facility branding, custom staff designations, and inspect database isolation boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {institution?.is_demo ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                Exhibition Demo Mode
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                Clean Deployment Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Institution parameters have been saved to the persistent database.</span>
        </div>
      )}

      {/* Individual account appearance only; no institution-wide colour editor. */}
      <section className="card bg-[#0b1a30]">
        <h2 className="text-base font-bold font-serif text-white mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--teal)]" />
          Personal Appearance
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Choose your own interface accent colours. Saved for your account on this browser; does not change anyone else's settings.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs text-slate-300">
            Primary accent
            <span className="flex gap-2 mt-1">
              <input type="color" aria-label="Choose personal primary colour" value={isValidHex(personalPrimary) ? personalPrimary : DEFAULT_PRIMARY} onChange={(e) => setPersonalPrimary(e.target.value)} className="h-9 w-12 rounded bg-slate-900" />
              <input type="text" value={personalPrimary} onChange={(e) => setPersonalPrimary(e.target.value)} className="flex-1 min-w-0 px-3 rounded-lg bg-slate-900 border border-slate-700 font-mono" />
            </span>
          </label>
          <label className="text-xs text-slate-300">
            Secondary accent
            <span className="flex gap-2 mt-1">
              <input type="color" aria-label="Choose personal secondary colour" value={isValidHex(personalTeal) ? personalTeal : DEFAULT_TEAL} onChange={(e) => setPersonalTeal(e.target.value)} className="h-9 w-12 rounded bg-slate-900" />
              <input type="text" value={personalTeal} onChange={(e) => setPersonalTeal(e.target.value)} className="flex-1 min-w-0 px-3 rounded-lg bg-slate-900 border border-slate-700 font-mono" />
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={savePersonalTheme} className="px-4 py-2 rounded-lg bg-[#0369a1] text-white text-xs font-semibold">Save My Colours</button>
          <button type="button" onClick={resetPersonalTheme} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 text-xs">Reset My Colours</button>
        </div>
      </section>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Facility Identity */}
        <div className="card bg-[#0b1a30]">
          <h2 className="text-base font-bold font-serif text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5cc2bd]" />
            <span>Facility Identity &amp; Branding</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Displayed on navigation headers, official PDF reports, and encrypted parole handover briefs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Institution Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HMP Frankland Correctional Centre"
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Institution Code / Acronym
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. HMP-FRK"
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white disabled:opacity-60 font-mono"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Custom Staff Designations */}
        <div className="card bg-[#0b1a30]">
          <h2 className="text-base font-bold font-serif text-white mb-1 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#38bdf8]" />
            <span>Configurable Staff Designations</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Customize the official designations used across dashboards and audit logs to match institutional naming standards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                'Administrator',
                'Warden',
                'Psychologist',
                'Case Manager',
                'Educator',
                'Community Rehabilitation Officer',
              ] as StaffRole[]
            ).map((role) => (
              <div key={role}>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default: <span className="text-[#38bdf8]">{role}</span>
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={designations[role] || ''}
                  onChange={(e) =>
                    setDesignations({
                      ...designations,
                      [role]: e.target.value,
                    })
                  }
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Data Isolation & Deployment Architecture */}
        <div className="card bg-[#0b1a30]">
          <h2 className="text-base font-bold font-serif text-white mb-1 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenancy &amp; Deployment Architecture</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Verification of database isolation parameters, active storage, and zero-leakage boundaries.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0f2744] border border-[#1e3a5f] space-y-2">
              <span className="text-xs font-semibold text-white block">Active Storage Engine</span>
              <div className="text-xs text-slate-300 font-mono bg-slate-900 p-2 rounded-lg border border-slate-700">
                {systemStatus?.database_file || 'rehabpath360.demo.db.json'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Demo records and clean deployment data live in strictly distinct database files.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0f2744] border border-[#1e3a5f] space-y-2">
              <span className="text-xs font-semibold text-white block">Tenant Scoping Mode</span>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300 font-semibold font-mono">
                  institution_id: {institution?.id || 'inst-demo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All API reads, writes, searches, and exports strictly verify matching institution IDs on the server.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-white block mb-1">Switch application mode</span>
            <p className="text-[11px] text-slate-400 mb-3">Demo and clean deployment records are kept in separate databases. Switching does not copy or delete records. Clean mode starts with no staff or case records and opens the first-administrator setup screen.</p>
            {isAdmin && systemStatus?.mode !== 'deployment' && (
              <label className="block text-xs text-slate-300 mb-3">
                First-administrator setup token (required when clean database has no staff)
                <input
                  type="password"
                  autoComplete="off"
                  value={cleanSetupToken}
                  onChange={(event) => setCleanSetupToken(event.target.value)}
                  placeholder="Enter the configured SETUP_TOKEN if initializing clean mode"
                  className="mt-1 w-full min-w-0 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </label>
            )}
            {isAdmin && <button type="button" onClick={switchMode} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{isSaving ? 'Switching…' : systemStatus?.mode === 'deployment' ? 'Switch to Exhibition Demo Mode' : 'Switch to Clean Deployment Mode'}</button>}
          </div>
        </div>

        {/* Save button (Admin only) */}
        {isAdmin && (
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0274b0] hover:to-[#025a8b] text-white font-semibold text-xs shadow-md shadow-[#0284c7]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Parameters...' : 'Save Institutional Configuration'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
