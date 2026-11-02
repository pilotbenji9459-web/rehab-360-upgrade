import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { StaffRole, InstitutionConfig } from '../types';
import {
  Building2,
  ShieldCheck,
  Palette,
  Sliders,
  Database,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  showAlert: (message: string, title?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ showAlert }) => {
  const { user, institution, systemStatus, refreshInstitution } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const [name, setName] = useState(institution?.name || '');
  const [code, setCode] = useState(institution?.code || '');
  const [logoUrl, setLogoUrl] = useState(institution?.logo_url || '');
  const [themePrimary, setThemePrimary] = useState(institution?.theme_primary || '#0284c7');
  const [themeTeal, setThemeTeal] = useState(institution?.theme_teal || '#5cc2bd');

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
  const [personalPrimary, setPersonalPrimary] = useState('#0284c7');
  const [personalTeal, setPersonalTeal] = useState('#5cc2bd');
  const personalThemeKey = user?.id ? `rehabpath360:personal-theme:${user.id}` : '';

  useEffect(() => {
    if (!personalThemeKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(personalThemeKey) || '{}');
      setPersonalPrimary(isValidHex(saved.primary) ? saved.primary : '#0284c7');
      setPersonalTeal(isValidHex(saved.teal) ? saved.teal : '#5cc2bd');
    } catch {
      setPersonalPrimary('#0284c7');
      setPersonalTeal('#5cc2bd');
    }
  }, [personalThemeKey]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--acc', personalPrimary);
    root.style.setProperty('--teal', personalTeal);
  }, [personalPrimary, personalTeal]);

  const savePersonalTheme = () => {
    if (!personalThemeKey || !isValidHex(personalPrimary) || !isValidHex(personalTeal)) {
      showAlert('Enter valid six-digit hex colours before saving.', 'Invalid Personal Colours');
      return;
    }
    localStorage.setItem(personalThemeKey, JSON.stringify({ primary: personalPrimary, teal: personalTeal }));
    showAlert('Your personal colours are saved for this account on this browser.', 'Personal Appearance Saved');
  };

  const resetInstitutionAppearance = async () => {
    if (!isAdmin) return;
    const confirmed = window.confirm('Reset shared institution branding and staff designations to the RehabPath360 defaults?');
    if (!confirmed) return;
    setIsSaving(true);
    try {
      await Api.updateInstitution({
        name,
        code,
        logo_url: logoUrl,
        theme_primary: '#0284c7',
        theme_teal: '#5cc2bd',
        staff_designations: {
          Administrator: 'Executive Administrator',
          Warden: 'Governing Governor / Warden',
          Psychologist: 'Clinical Psychologist',
          'Case Manager': 'Rehabilitation Case Manager',
          Educator: 'Vocational Education Officer',
          'Community Rehabilitation Officer': 'Community Rehabilitation Officer',
        },
      });
      setThemePrimary('#0284c7');
      setThemeTeal('#5cc2bd');
      setDesignations({
        Administrator: 'Executive Administrator',
        Warden: 'Governing Governor / Warden',
        Psychologist: 'Clinical Psychologist',
        'Case Manager': 'Rehabilitation Case Manager',
        Educator: 'Vocational Education Officer',
        'Community Rehabilitation Officer': 'Community Rehabilitation Officer',
      });
      await refreshInstitution();
      showAlert('Shared branding and role labels have been restored. Institution name, code, and logo were kept unchanged.', 'Defaults Restored');
    } catch (err: any) {
      showAlert(err.message || 'Could not reset institutional appearance.', 'Reset Failed');
    } finally {
      setIsSaving(false);
    }
  };
  const isValidHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
  const primaryPreview = isValidHex(themePrimary) ? themePrimary : '#0284c7';
  const tealPreview = isValidHex(themeTeal) ? themeTeal : '#5cc2bd';

  useEffect(() => {
    if (institution) {
      setName(institution.name);
      setCode(institution.code);
      setLogoUrl(institution.logo_url || '');
      setThemePrimary(institution.theme_primary || '#0284c7');
      setThemeTeal(institution.theme_teal || '#5cc2bd');
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

    if (!isValidHex(themePrimary) || !isValidHex(themeTeal)) {
      showAlert('Enter valid six-digit hex colours, e.g. #0284c7 or #5cc2bd.', 'Invalid Brand Colour');
      return;
    }
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await Api.updateInstitution({
        name,
        code,
        logo_url: logoUrl,
        theme_primary: themePrimary,
        theme_teal: themeTeal,
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
              <span>Institution Settings &amp; Configuration</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure facility branding, custom staff designations, and inspect database isolation boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
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

      <div className="card bg-[#0b1a30]">
        <h2 className="text-base font-bold font-serif text-white mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#5cc2bd]" />
          <span>Personal Appearance</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Personal accent colours are stored separately for your signed-in account on this browser. They do not change other staff accounts.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs text-slate-300">Primary accent
            <div className="flex gap-2 mt-1">
              <input type="color" value={isValidHex(personalPrimary) ? personalPrimary : '#0284c7'} onChange={e => setPersonalPrimary(e.target.value)} className="h-9 w-12 rounded bg-slate-900" />
              <input value={personalPrimary} onChange={e => setPersonalPrimary(e.target.value)} className="flex-1 min-w-0 px-3 rounded-lg bg-slate-900 border border-slate-700 font-mono" />
            </div>
          </label>
          <label className="text-xs text-slate-300">Secondary accent
            <div className="flex gap-2 mt-1">
              <input type="color" value={isValidHex(personalTeal) ? personalTeal : '#5cc2bd'} onChange={e => setPersonalTeal(e.target.value)} className="h-9 w-12 rounded bg-slate-900" />
              <input value={personalTeal} onChange={e => setPersonalTeal(e.target.value)} className="flex-1 min-w-0 px-3 rounded-lg bg-slate-900 border border-slate-700 font-mono" />
            </div>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={savePersonalTheme} className="px-4 py-2 rounded-lg bg-[#0369a1] text-white text-xs font-semibold">Save My Colours</button>
          <button type="button" onClick={() => { setPersonalPrimary('#0284c7'); setPersonalTeal('#5cc2bd'); if (personalThemeKey) localStorage.removeItem(personalThemeKey); }} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 text-xs">Reset My Colours</button>
        </div>
      </div>

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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  disabled={!isAdmin}
                  value={primaryPreview}
                  onChange={(e) => setThemePrimary(e.target.value)}
                  aria-label="Pick primary accent colour"
                  className="w-9 h-9 rounded-lg border border-slate-700 p-0.5 cursor-pointer bg-slate-900"
                />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Secondary Teal Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  disabled={!isAdmin}
                  value={tealPreview}
                  onChange={(e) => setThemeTeal(e.target.value)}
                  aria-label="Pick secondary teal colour"
                  className="w-9 h-9 rounded-lg border border-slate-700 p-0.5 cursor-pointer bg-slate-900"
                />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={themeTeal}
                  onChange={(e) => setThemeTeal(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-[#2b4660] bg-[#07172d] p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Brand Colour Preview</p>
            <div className="flex flex-wrap gap-2 items-center">
              <span style={{ background: primaryPreview }} className="rounded-lg px-4 py-2 text-white text-xs font-semibold">Primary accent</span>
              <span style={{ background: tealPreview }} className="rounded-lg px-4 py-2 text-[#071325] text-xs font-semibold">Secondary accent</span>
              <span className="text-xs text-slate-400">Save to apply to shared UI theme colours.</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Some fixed navy/blue design elements retain their original colours.</p>
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
            <span className="font-semibold text-white block mb-1">To run Clean Deployment Mode:</span>
            <code className="text-[#38bdf8] font-mono text-[11px] block bg-slate-950 p-2 rounded border border-slate-800">
              APP_MODE=deployment npm run start
            </code>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Starts with zero staff accounts and zero case records. Initial administrator must be claimed via secure bootstrap.
            </span>
          </div>
        </div>

        {/* Save button (Admin only) */}
        {isAdmin && (
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={resetInstitutionAppearance}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-rose-500/50 text-rose-200 hover:bg-rose-950/40 text-xs font-semibold disabled:opacity-50"
            >
              Reset Institutional Defaults
            </button>
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
