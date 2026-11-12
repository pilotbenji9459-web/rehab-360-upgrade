import React from 'react';
import progressRingLogo from '../assets/images/rehabpath360_progress_ring_icon.svg';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { TabId, StaffRole, WorkspaceMode, OffenderCase } from '../types';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  FileText,
  ShieldAlert,
  History,
  Settings,
  BookOpen,
  HeartPulse,
  Award,
  Lock,
  LogOut,
  Building2,
  ChevronRight,
  ShieldCheck,
  User,
  ArrowLeft,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  workspace: WorkspaceMode;
  onSelectWorkspace: (ws: WorkspaceMode) => void;
  selectedCase?: OffenderCase;
  onGoFacilityOverview: () => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: StaffRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  workspace,
  onSelectWorkspace,
  selectedCase,
  onGoFacilityOverview,
}) => {
  const { user, institution, systemStatus, logout } = useAuth();
  const { t } = useI18n();
  const isDemo = institution?.is_demo ?? (systemStatus?.mode === 'demo');

  const getNavLabel = (item: NavItem): string => {
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
    const key = keyByTab[item.id];
    return key ? t(key, item.label) : item.label;
  };

  // Facility Workspace navigation modules
  const facilityNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Facility Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'cases',
      label: 'Caseload Management',
      icon: Users,
    },
    {
      id: 'intake',
      label: 'Document Intake Centre',
      icon: FileSpreadsheet,
      badge: 'AI Verified',
    },
    {
      id: 'rep',
      label: 'Facility Reports & CSV',
      icon: FileText,
      allowedRoles: ['Administrator', 'Warden', 'Case Manager', 'Community Rehabilitation Officer'],
    },
    {
      id: 'staff',
      label: 'Staff & Permissions',
      icon: ShieldAlert,
      allowedRoles: ['Administrator', 'Warden'],
    },
    {
      id: 'audit',
      label: 'Facility Audit Trail',
      icon: History,
      allowedRoles: ['Administrator', 'Warden'],
    },
    {
      id: 'settings',
      label: 'System & Database',
      icon: Settings,
    },
    {
      id: 'guide',
      label: 'Operational Blueprint',
      icon: BookOpen,
    },
  ];

  // Person Workspace navigation modules (scoped to selected individual)
  const personNavItems: NavItem[] = [
    {
      id: 'cases',
      label: 'Case File & Profile',
      icon: User,
    },
    {
      id: 'plan',
      label: 'Rehabilitation Trajectory',
      icon: FileCheck,
      allowedRoles: ['Administrator', 'Warden', 'Case Manager'],
    },
    {
      id: 'prog',
      label: 'Progression Gates',
      icon: TrendingUp,
      allowedRoles: ['Administrator', 'Warden', 'Educator', 'Case Manager', 'Psychologist'],
    },
    {
      id: 'mx',
      label: 'Domain Matrix',
      icon: LayoutDashboard,
      allowedRoles: ['Administrator', 'Warden', 'Educator', 'Case Manager', 'Psychologist', 'Community Rehabilitation Officer'],
    },
    {
      id: 'trend',
      label: 'Progress Trends',
      icon: TrendingUp,
      allowedRoles: ['Administrator', 'Warden', 'Educator', 'Case Manager', 'Psychologist'],
    },
    {
      id: 'clinical',
      label: 'Clinical Notes',
      icon: Lock,
      badge: 'Protected',
      allowedRoles: ['Administrator', 'Psychologist'],
    },
    {
      id: 'flags',
      label: 'Wellbeing Indicators',
      icon: HeartPulse,
      allowedRoles: ['Administrator', 'Psychologist', 'Warden'],
    },
    {
      id: 'person_intake',
      label: 'Case Evidence & Documents',
      icon: FolderOpen,
    },
    {
      id: 'hand',
      label: 'Parole Handover Brief',
      icon: Award,
      allowedRoles: ['Administrator', 'Warden', 'Community Rehabilitation Officer'],
    },
  ];

  const activeItems = workspace === 'facility' ? facilityNavItems : personNavItems;

  // Filter items based on signed-in user's role
  const visibleItems = activeItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  const getCustomDesignation = (role: StaffRole): string => {
    if (institution?.staff_designations && institution.staff_designations[role]) {
      return institution.staff_designations[role];
    }
    return role;
  };

  const handleItemClick = (id: TabId) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar backdrop"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onCloseMobile();
          }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <aside
        data-app-sidebar
        data-motion-scope="sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#071325] border-r border-[#1e3a5f] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Institution Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e3a5f]/80 bg-[#0b1a30]/60">
          <button
            type="button"
            onClick={onGoFacilityOverview}
            aria-label="RehabPath360 — go to Facility Overview"
            title="Go to Facility Overview"
            className="rp-brand-home group flex w-full min-w-0 items-center gap-3 rounded-xl p-1 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <img src={progressRingLogo} alt="" aria-hidden="true" className="h-11 w-11 shrink-0 object-contain transition-transform group-hover:scale-105" />
            <span className="min-w-0 flex-1">
              <span className="rp-brand-title block truncate font-serif text-base font-bold tracking-tight">
                REHABPATH<span className="text-[var(--teal)]">360</span>
              </span>
              <span className="block truncate text-[11px] font-medium text-slate-400">
                {institution?.name || 'Correctional Facility'}
              </span>
            </span>
          </button>

          {/* Mode Pill: Exhibition Demo vs Clean Deployment */}
          <div className="mt-3 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#0f2744] border border-[#1e3a5f] text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
              <Building2 className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
              <span className="truncate">{institution?.code || 'FACILITY'}</span>
            </span>
            {isDemo ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold shrink-0">
                Demo Exhibition
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold shrink-0">
                Clean Deployment
              </span>
            )}
          </div>
        </div>

        {/* WORKSPACE SELECTION SWITCHER */}
        <div className="p-3 border-b border-[#1e3a5f] bg-[#071325]">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1.5 tracking-wider">
            Workspace Mode
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0b1a30] rounded-xl border border-[#1e3a5f]">
            <button
              type="button"
              onClick={() => onSelectWorkspace('facility')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                workspace === 'facility'
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#0f2744]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('workspace.facility.short')}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectWorkspace('person')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                workspace === 'person'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#0f2744]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('workspace.person.short')}</span>
            </button>
          </div>

          {/* Person Context Box when in Person Workspace */}
          {workspace === 'person' && selectedCase && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-[#0f2744] to-[#0b1a30] border border-sky-500/30 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Active Case File
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                  {selectedCase.id}
                </span>
              </div>
              <div className="font-semibold text-white text-sm mt-0.5 truncate">
                {selectedCase.first_name} {selectedCase.last_name}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {selectedCase.crime_type} · {selectedCase.sentence_length_months} mos
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin" aria-label="Main Navigation">
          <div className="px-2 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            {t(workspace === 'facility' ? 'workspace.facility.modules' : 'workspace.person.modules')}
          </div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                data-nav-item
                data-active={isActive ? 'true' : 'false'}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--acc)] to-[var(--teal)] text-white shadow-md shadow-[#0284c7]/25 font-semibold'
                    : 'text-slate-200 hover:text-white hover:bg-[#0f2744]/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{getNavLabel(item)}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#5cc2bd]/20 text-[var(--teal)] border border-[#5cc2bd]/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Staff User Profile Footer */}
        {user && (
          <div className="p-3 border-t border-[#1e3a5f] bg-[#0b1a30]/80">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0f2744] border border-[#1e3a5f]/80">
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-white truncate">
                  {user.full_name}
                </span>
                <span className="block text-[11px] text-[var(--teal)] font-semibold truncate">
                  {getCustomDesignation(user.role)}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  #{user.badge_number} · {user.department}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out of portal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-800 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
