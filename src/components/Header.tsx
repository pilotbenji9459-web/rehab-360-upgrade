import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { OffenderCase, TabId, StaffRole } from '../types';
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
}) => {
  const { user, institution, systemStatus, isAuthenticated, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.getAttribute('data-theme') !== 'light'
      );
    }
    return true;
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const isDemo = institution?.is_demo ?? (systemStatus?.mode === 'demo');

  const getCustomDesignation = (role: StaffRole): string => {
    if (institution?.staff_designations && institution.staff_designations[role]) {
      return institution.staff_designations[role];
    }
    return role;
  };

  const hideCaseSelector = ['dashboard', 'intake', 'staff', 'audit', 'settings', 'guide'].includes(currentTab);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-2 sm:px-4 lg:px-6 py-3 min-w-0 w-full bg-[#0b1a30]/95 backdrop-blur-md border-b border-[#1e3a5f] shadow-sm">
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

        {/* Institution breadcrumb */}
        <div className="hidden xl:flex items-center gap-2 text-sm min-w-0">
          <Building2 className="w-5 h-5 text-[var(--teal)] shrink-0" />
          <span className="font-semibold text-white tracking-tight truncate max-w-[140px] 2xl:max-w-[240px]" title={institution?.name || 'Rehabilitation Management Facility'}>
            {institution?.name || 'Rehabilitation Management Facility'}
          </span>
          <span className="text-slate-500 shrink-0">/</span>
          <span className="text-slate-300 capitalize font-medium shrink-0">
            {currentTab === 'dashboard'
              ? 'Executive Dashboard'
              : currentTab === 'cases'
              ? 'Case Management'
              : currentTab === 'intake'
              ? 'Document Intake'
              : currentTab}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
        {/* Case selector for case-specific views */}
        {!hideCaseSelector && cases.length > 0 && (
          <div className="flex items-center gap-1 min-w-0">
            <label htmlFor="case-selector" className="text-sm font-semibold text-slate-200 hidden md:inline">
              Selected Case:
            </label>
            <select
              id="case-selector"
              value={selectedCaseId}
              onChange={(e) => onCaseChange(e.target.value)}
              className="text-sm sm:text-base py-2 px-3.5 rounded-xl border border-[#1e3a5f] bg-[#0f2744] text-white font-semibold focus:border-[var(--acc)] cursor-pointer w-[132px] min-[420px]:w-[160px] sm:w-[200px] xl:w-[260px] max-w-full truncate"
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
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0284c7]/20 hover:bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/40 text-sm font-semibold cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>New Case</span>
          </button>
        )}

        {/* Dark / Light Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0f2744] border border-[#1e3a5f] transition-colors cursor-pointer"
          title="Toggle light/dark contrast"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-slate-300" />}
        </button>

        {/* User Profile / Menu */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#0f2744] hover:bg-[#143258] border border-[#1e3a5f] text-left cursor-pointer transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--acc)] to-[var(--teal)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block min-w-0 max-w-[160px]">
                <span className="block text-sm font-semibold text-white truncate leading-tight">
                  {user.full_name}
                </span>
                <span className="block text-xs text-[var(--teal)] truncate font-semibold">
                  {getCustomDesignation(user.role)}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setProfileDropdownOpen(false);
                  }}
                />
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0c1c36] border border-[#1e3a5f] shadow-2xl py-2 z-50 animate-fade-in text-sm">
                  <div className="px-4 py-2.5 border-b border-[#1e3a5f]">
                    <span className="block font-bold text-white text-sm">{user.full_name}</span>
                    <span className="block text-xs text-[var(--teal)] font-semibold">{getCustomDesignation(user.role)}</span>
                    <span className="block text-xs text-slate-400 font-mono mt-0.5">
                      Badge #{user.badge_number} · {user.email}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-[#0f2744] flex items-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Facility Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={onGoHome}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-[#0f2744] flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--teal)]" />
                    <span>Public Overview</span>
                  </button>

                  <div className="border-t border-[#1e3a5f] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white text-xs font-semibold shadow hover:from-[#0274b0] hover:to-[#025a8b] transition-all cursor-pointer"
          >
            Staff Portal Sign In
          </button>
        )}
      </div>
    </header>
  );
};
