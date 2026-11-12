import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, LanguageCode } from '../context/I18nContext';
import { OffenderCase, TabId, StaffRole, WorkspaceMode } from '../types';
import {
  Menu,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Building2,
  PlusCircle,
  User,
  Sliders,
  ChevronDown,
  Languages,
  ArrowRight,
} from 'lucide-react';

interface HeaderProps {
  selectedCaseId: string;
  onCaseChange: (caseId: string) => void;
  cases: OffenderCase[];
  currentTab: TabId;
  onOpenLogin: () => void;
  onGoHome: () => void;
  onToggleSidebar: () => void;
  onOpenNewCaseModal?: () => void;
  onSelectTab: (tab: TabId) => void;
  workspace: WorkspaceMode;
  onSelectWorkspace: (ws: WorkspaceMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCaseId,
  onCaseChange,
  cases,
  currentTab,
  onOpenLogin,
  onGoHome,
  onToggleSidebar,
  onOpenNewCaseModal,
  onSelectTab,
  workspace,
  onSelectWorkspace,
}) => {
  const { user, institution, systemStatus, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('rehabpath360:theme');
      if (stored === 'light') return false;
      if (stored === 'dark') return true;
    } catch {
      // Storage fallback
    }
    return document.documentElement.getAttribute('data-theme') !== 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    try {
      localStorage.setItem('rehabpath360:theme', isDark ? 'dark' : 'light');
    } catch {
      // Optional storage
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((value) => !value);

  const getCustomDesignation = (role: StaffRole): string => {
    if (institution?.staff_designations && institution.staff_designations[role]) {
      return institution.staff_designations[role];
    }
    return role;
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const getTabLabel = (tId: TabId): string => {
    const keyByTab: Partial<Record<TabId, string>> = {
      dashboard: 'nav.dashboard',
      cases: workspace === 'person' ? 'nav.case_file' : 'nav.cases',
      intake: 'nav.intake',
      person_intake: 'nav.person_intake',
      plan: 'nav.plan',
      prog: 'nav.prog',
      clinical: 'nav.clinical',
      flags: 'nav.flags',
      trend: 'nav.trend',
      mx: 'nav.mx',
      hand: 'nav.hand',
      rep: 'nav.rep',
      staff: 'nav.staff',
      audit: 'nav.audit',
      settings: 'nav.settings',
      guide: 'nav.guide',
    };
    return keyByTab[tId] ? t(keyByTab[tId]!) : tId;
  };

  return (
    <header data-app-header className="app-header sticky top-0 z-30 flex items-center justify-between gap-2 px-2 sm:px-4 lg:px-6 py-2.5 min-w-0 w-full backdrop-blur-md border-b shadow-sm">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0f2744] border border-[#1e3a5f] cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* WORKSPACE & HIERARCHICAL BREADCRUMB */}
        <div className="hidden xl:flex items-center gap-2 text-sm min-w-0">
          <Building2 className="w-4 h-4 text-[var(--teal)] shrink-0" />
          <span
            className="font-semibold text-white tracking-tight truncate max-w-[130px] 2xl:max-w-[200px]"
            title={institution?.name || 'Rehabilitation Management Facility'}
          >
            {institution?.name || 'Facility'}
          </span>
          <span className="text-slate-500 shrink-0">&rarr;</span>

          {workspace === 'facility' ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8] text-xs font-semibold">
                {t('workspace.facility')}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200 font-medium text-xs">
                {getTabLabel(currentTab)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-sky-600/30 to-indigo-600/30 border border-sky-500/40 text-sky-200 text-xs font-semibold">
                {t('workspace.person')}: {selectedCase ? `${selectedCase.id} (${selectedCase.first_name} ${selectedCase.last_name})` : selectedCaseId}
              </span>
              <span className="text-slate-500">&rarr;</span>
              <span className="text-slate-200 font-medium text-xs">
                {getTabLabel(currentTab)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
        {/* Workspace Quick Switcher Pill (Desktop) */}
        <div className="hidden md:flex items-center gap-1 p-0.5 bg-[#071325] rounded-xl border border-[#1e3a5f] text-xs">
          <button
            type="button"
            onClick={() => onSelectWorkspace('facility')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              workspace === 'facility'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('workspace.facility.short')}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectWorkspace('person')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              workspace === 'person'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('workspace.person.short')}</span>
          </button>
        </div>

        {/* Case selector: STRICTLY SHOWN ONLY IN PERSON WORKSPACE */}
        {workspace === 'person' && cases.length > 0 && (
          <div className="flex items-center gap-1 min-w-0">
            <label htmlFor="case-selector" className="text-xs font-semibold text-slate-300 hidden lg:inline">
              Switch Case:
            </label>
            <select
              id="case-selector"
              value={selectedCaseId}
              onChange={(e) => onCaseChange(e.target.value)}
              className="text-xs sm:text-sm py-1.5 px-3 rounded-xl border border-[#1e3a5f] bg-[#0f2744] text-white font-semibold focus:border-[var(--acc)] cursor-pointer w-[130px] min-[420px]:w-[160px] sm:w-[190px] xl:w-[240px] max-w-full truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0b1a30]">
                  {c.id} · {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick New Case button if permitted */}
        {onOpenNewCaseModal && (user?.role === 'Administrator' || user?.role === 'Warden' || user?.role === 'Case Manager') && (
          <button
            type="button"
            onClick={onOpenNewCaseModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284c7]/20 hover:bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/40 text-xs font-semibold cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Case</span>
          </button>
        )}

        {/* Language selector toggle */}
        <div className="flex items-center">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="text-xs py-1.5 px-2 rounded-xl border border-[#1e3a5f] bg-[#0f2744] text-slate-200 cursor-pointer font-medium"
            title={t('language.select')}
            aria-label={t('language.select')}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#0b1a30]">
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Persistent, accessible light/dark appearance switch */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={!isDark}
          className="app-theme-switch"
        >
          {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          <span className="hidden min-[520px]:inline text-xs">{isDark ? t('theme.light') : t('theme.dark')}</span>
        </button>

        {/* User Profile / Menu */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#0f2744] hover:bg-[#143258] border border-[#1e3a5f] text-left cursor-pointer transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[var(--acc)] to-[var(--teal)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block min-w-0 max-w-[140px]">
                <span className="block text-xs font-semibold text-white truncate leading-tight">
                  {user.full_name}
                </span>
                <span className="block text-[10px] text-[var(--teal)] truncate font-semibold">
                  {getCustomDesignation(user.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Close profile dropdown"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0b1a30] border border-[#1e3a5f] shadow-2xl z-50 p-2 space-y-1">
                  <div className="p-2 border-b border-[#1e3a5f]/60 text-xs">
                    <span className="font-bold text-white block">{user.full_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      #{user.badge_number} · {user.department}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#0f2744] rounded-lg transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Facility Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 rounded-xl bg-[#0284c7] text-white text-xs font-semibold cursor-pointer shadow-md"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
