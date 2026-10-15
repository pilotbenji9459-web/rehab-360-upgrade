import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TabId, StaffRole } from '../types';
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
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
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
}) => {
  const { user, institution, systemStatus, logout } = useAuth();

  const isDemo = institution?.is_demo ?? (systemStatus?.mode === 'demo');

  // Define navigation items with RBAC permissions
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'cases',
      label: 'Case Management',
      icon: Users,
    },
    {
      id: 'intake',
      label: 'Document Intake',
      icon: FileSpreadsheet,
      badge: 'AI',
    },
    {
      id: 'plan',
      label: 'Rehabilitation Plans',
      icon: FileCheck,
      allowedRoles: ['Administrator', 'Warden', 'Case Manager'],
    },
    {
      id: 'clinical',
      label: 'Clinical Notes',
      icon: Lock,
      badge: 'Protected',
      allowedRoles: ['Administrator', 'Psychologist'],
    },
    {
      id: 'prog',
      label: 'Progress Tracking',
      icon: TrendingUp,
      allowedRoles: ['Administrator', 'Warden', 'Educator', 'Case Manager', 'Psychologist'],
    },
    {
      id: 'flags',
      label: 'Clinical Indicators',
      icon: HeartPulse,
      allowedRoles: ['Administrator', 'Psychologist', 'Warden'],
    },
    {
      id: 'hand',
      label: 'Parole Handover',
      icon: Award,
      allowedRoles: ['Administrator', 'Warden', 'Community Rehabilitation Officer'],
    },
    {
      id: 'rep',
      label: 'Reports',
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
      label: 'Audit Trail',
      icon: History,
      allowedRoles: ['Administrator', 'Warden'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
    {
      id: 'guide',
      label: 'System Guide',
      icon: BookOpen,
    },
  ];

  // Filter items based on signed-in user's role
  const visibleItems = navItems.filter((item) => {
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#071325] border-r border-[#1e3a5f] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Institution Brand Header */}
        <div className="p-5 border-b border-[#1e3a5f]/80 bg-[#0b1a30]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#5cc2bd] flex items-center justify-center text-white shadow-lg shadow-[#0284c7]/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base text-white tracking-tight">
                  REHABPATH<span className="text-[#5cc2bd]">360</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate font-medium">
                {institution?.name || 'Correctional Facility'}
              </p>
            </div>
          </div>

          {/* Mode Pill: Exhibition Demo vs Clean Deployment */}
          <div className="mt-3.5 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#0f2744] border border-[#1e3a5f] text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
              <Building2 className="w-3.5 h-3.5 text-[#5cc2bd] shrink-0" />
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

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-1 scrollbar-thin" aria-label="Main Navigation">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Institutional Portal
          </div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-md shadow-[#0284c7]/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#0f2744]/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#5cc2bd]/20 text-[#5cc2bd] border border-[#5cc2bd]/30'
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
          <div className="p-3.5 border-t border-[#1e3a5f] bg-[#0b1a30]/80">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0f2744] border border-[#1e3a5f]/80">
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-white truncate">
                  {user.full_name}
                </span>
                <span className="block text-[10px] text-[#5cc2bd] font-medium truncate">
                  {getCustomDesignation(user.role)}
                </span>
                <span className="block text-[9px] text-slate-400 font-mono">
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
