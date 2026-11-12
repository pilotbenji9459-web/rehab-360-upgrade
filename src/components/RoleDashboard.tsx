import React, { useEffect, useState } from 'react';
import { CaseExplorer } from './CaseExplorer';
import { ExhibitionTour } from './ExhibitionTour';
import { InteractiveAnalyticsSuite } from './InteractiveAnalyticsSuite';
import { useAuth } from '../context/AuthContext';
import { LANGUAGE_LOCALES, useI18n } from '../context/I18nContext';
import { OffenderCase, TabId, StaffRole } from '../types';
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Award,
  Sparkles,
  HeartPulse,
  Lock,
  Download,
  Info,
} from 'lucide-react';
import { formatPathwayName, getOffenderPos, getMissingGates } from '../utils/aiLogic';

interface RoleDashboardProps {
  cases: OffenderCase[];
  onSelectTab: (tab: TabId) => void;
  onSelectCase: (caseId: string) => void;
  onOpenNewCaseModal?: () => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({
  cases,
  onSelectTab,
  onSelectCase,
  onOpenNewCaseModal,
}) => {
  const { user, institution, systemStatus } = useAuth();
  const { language, t } = useI18n();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const updateLocalHour = () => setCurrentHour(new Date().getHours());
    const intervalId = window.setInterval(updateLocalHour, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);
  if (!user) return null;

  
  const greetingKey = currentHour < 12 ? 'greeting.morning' : currentHour < 17 ? 'greeting.afternoon' : 'greeting.evening';
  const greeting = t(greetingKey);
  const todayLabel = new Intl.DateTimeFormat(LANGUAGE_LOCALES[language], { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  const isDemo = institution?.is_demo ?? (systemStatus?.mode === 'demo');

  // Compute live dashboard metrics from current institution's cases
  const totalCases = cases.length;
  const canViewClinicalSignals = user.role === 'Psychologist' || user.role === 'Administrator';
  const pendingDecisions = cases.filter((c) => !c.decision).length;
  const plansOnTrack = cases.filter(
    (c) => c.session_attendance >= 75 && c.programme_engagement >= 3
  ).length;
  const scheduledCheckins = cases.filter((c) => {
    // Review due if assessment is in progress or pending verification
    return !c.decision || c.session_attendance < 75 || (canViewClinicalSignals && c.low_mood_count > 0);
  }).length;

  // Cohort distribution for rehabilitation progress chart
  const foundationCohort = cases.filter((c) => {
    const pos = getOffenderPos(c);
    return pos == null || pos <= 2;
  }).length;

  const developmentCohort = cases.filter((c) => {
    const pos = getOffenderPos(c);
    return pos != null && pos >= 3 && pos <= 5;
  }).length;

  const capabilityCohort = cases.filter((c) => {
    const pos = getOffenderPos(c);
    return pos != null && pos >= 6 && pos <= 8;
  }).length;

  const reintegrationCohort = cases.filter((c) => {
    const pos = getOffenderPos(c);
    return pos != null && pos >= 9;
  }).length;

  // Gate averages
  const avgEdu = totalCases > 0 ? Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.edu || 0), 0) / totalCases) : 0;
  const avgBeh = totalCases > 0 ? Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.beh || 0), 0) / totalCases) : 0;
  const avgWb = totalCases > 0 ? Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.wb || 0), 0) / totalCases) : 0;
  const avgSkl = totalCases > 0 ? Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.skl || 0), 0) / totalCases) : 0;

  // Attention reminders (workflow queue)
  const attentionItems: {
    id: string;
    title: string;
    description: string;
    severity: 'warning' | 'urgent' | 'info';
    actionTab: TabId;
    caseId?: string;
  }[] = [];

  // 1. Pending human verification
  const pendingCase = cases.find((c) => !c.decision);
  if (pendingCase) {
    attentionItems.push({
      id: 'pending-ai-decision',
      title: `${pendingDecisions} Placement Review(s) Pending`,
      description: `Warden review required for ${pendingCase.id} (${pendingCase.first_name} ${pendingCase.last_name}). Explainable AI recommendation requires human sign-off.`,
      severity: 'warning',
      actionTab: 'cases',
      caseId: pendingCase.id,
    });
  }

  // 2. Attendance alerts (<70%)
  const lowAttendanceCase = cases.find((c) => c.session_attendance < 70);
  if (lowAttendanceCase) {
    const count = cases.filter((c) => c.session_attendance < 70).length;
    attentionItems.push({
      id: 'attendance-alert',
      title: `${count} Session Attendance Alert(s) (<70%)`,
      description: `${lowAttendanceCase.id} has dropped to ${lowAttendanceCase.session_attendance}% attendance. Case management outreach recommended.`,
      severity: 'urgent',
      actionTab: 'cases',
      caseId: lowAttendanceCase.id,
    });
  }

  // 3. Clinical well-being notice (Safely summarized: DO NOT expose confidential psychotherapy details!)
  const clinicalFlagCase = canViewClinicalSignals ? cases.find(
    (c) => c.low_mood_count >= 3 || (c.mental_wellbeing && c.mental_wellbeing <= 2)
  ) : undefined;
  if (clinicalFlagCase) {
    attentionItems.push({
      id: 'clinical-flag',
      title: 'Clinical Well-Being Review Scheduled',
      description: `Low-mood and engagement indicators detected on case ${clinicalFlagCase.id}. Assigned clinical psychologist notified.`,
      severity: 'warning',
      actionTab: user.role === 'Psychologist' || user.role === 'Administrator' ? 'clinical' : 'flags',
      caseId: clinicalFlagCase.id,
    });
  }

  // 4. Progression ready
  const advanceReadyCase = cases.find((c) => {
    const pos = getOffenderPos(c);
    return pos != null && pos < 11 && getMissingGates(c).length === 0;
  });
  if (advanceReadyCase) {
    attentionItems.push({
      id: 'advance-ready',
      title: `Pathway Advancement Milestone Ready (${advanceReadyCase.id})`,
      description: `Candidate has met all 4 gate evidentiary benchmarks (≥70%). Ready for stage elevation.`,
      severity: 'info',
      actionTab: 'prog',
      caseId: advanceReadyCase.id,
    });
  }

  const getCustomDesignation = (role: StaffRole): string => {
    if (institution?.staff_designations && institution.staff_designations[role]) {
      return institution.staff_designations[role];
    }
    return role;
  };

  return (
    <div data-motion-scope="dashboard" data-dashboard className="dashboard-shell space-y-6 animate-fade-in min-w-0">
      {/* Top Welcome & Institutional Status Strip */}
      <div className="dashboard-hero relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="dashboard-hero__glow" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0284c7]/30 border border-[#0284c7] text-[#38bdf8] text-xs font-semibold uppercase tracking-wider">
                {getCustomDesignation(user.role)}
              </span>
              <span className="text-xs text-slate-300 font-mono">Badge #{user.badge_number}</span>
              {isDemo ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
                  {t('dashboard.demo')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                  {t('dashboard.clean')}
                </span>
              )}
            </div>

            <div className="dashboard-hero__date">{todayLabel}</div>
            <h1 className="dashboard-hero__title">
              {greeting}, {user.full_name}
            </h1>
            <p className="dashboard-hero__subtitle">
              {institution?.name || 'RehabPath360'} <span aria-hidden="true">·</span> {user.department}
              <span className="dashboard-hero__context">{t('dashboard.context')}</span>
            </p>
          </div>

          {/* Quick Actions Header Strip */}
          <div className="dashboard-hero__actions flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSelectTab('intake')}
              className="px-4 py-2.5 rounded-xl bg-[#0f2744] hover:bg-[#163860] text-slate-200 border border-[#1e3a5f] text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#5cc2bd]" />
              <span>{t('dashboard.import_document')}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cases')}
              className="px-4 py-2.5 rounded-xl bg-[#0f2744] hover:bg-[#163860] text-slate-200 border border-[#1e3a5f] text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>{t('dashboard.view_directory')}</span>
              <ArrowRight className="w-4 h-4 text-[#38bdf8]" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="kpi-summary-cards">
        {/* Card 1: Active Cases */}
        <div className="dashboard-kpi dashboard-kpi--blue reveal-feature">
          <div className="flex items-center justify-between">
            <span className="dashboard-kpi__label text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t('metric.active_cases')}
            </span>
            <div className="dashboard-kpi__icon">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="dashboard-kpi__value text-3xl sm:text-4xl font-bold mt-2 font-serif tabular-nums">{totalCases}</div>
          <span className="text-xs text-[#38bdf8] font-medium block mt-1.5">
            {isDemo ? 'Fictional demo records' : 'Verified institutional files'}
          </span>
        </div>

        {/* Card 2: Reviews Pending */}
        <div className="dashboard-kpi dashboard-kpi--amber reveal-feature">
          <div className="flex items-center justify-between">
            <span className="dashboard-kpi__label text-xs sm:text-sm font-bold uppercase tracking-wider">
              {t('metric.pending_reviews')}
            </span>
            <div className="dashboard-kpi__icon">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="dashboard-kpi__value text-3xl sm:text-4xl font-bold mt-2 font-serif tabular-nums">{pendingDecisions}</div>
          <span className="text-xs text-slate-300 font-medium block mt-1.5">
            Requires human officer verification
          </span>
        </div>

        {/* Card 3: Rehabilitation Plans On Track */}
        <div className="dashboard-kpi dashboard-kpi--green reveal-feature">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
              {t('metric.on_track')}
            </span>
            <div className="dashboard-kpi__icon">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="dashboard-kpi__value text-3xl sm:text-4xl font-bold mt-2 font-serif tabular-nums">{plansOnTrack}</div>
          <span className="text-xs text-emerald-400 font-medium block mt-1.5">
            {totalCases > 0 ? Math.round((plansOnTrack / totalCases) * 100) : 0}% adhering to milestones
          </span>
        </div>

        {/* Card 4: Scheduled Check-ins */}
        <div className="dashboard-kpi dashboard-kpi--teal reveal-feature">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
              {t('metric.reviews_due')}
            </span>
            <div className="dashboard-kpi__icon">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="dashboard-kpi__value text-3xl sm:text-4xl font-bold mt-2 font-serif tabular-nums">{scheduledCheckins}</div>
          <span className="text-xs text-slate-300 font-medium block mt-1.5">
            Upcoming 28-day review cycle
          </span>
        </div>
      </div>

      <div data-tour="case-explorer-section">
        <CaseExplorer cases={cases} onSelectCase={onSelectCase} onSelectTab={onSelectTab} />
      </div>

      <ExhibitionTour
        cases={cases}
        onSelectCase={onSelectCase}
        onSelectTab={onSelectTab}
        
      />

      {/* Main Grid: Interactive Analytics Suite + Needs Attention Queue */}
      <div className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-3">
        {/* Interactive Analytics Suite (2 Cols) */}
        <div className="dashboard-panel reveal-feature 2xl:col-span-2 card min-w-0 max-w-full overflow-hidden" data-tour="dashboard-progression-chart">
          <InteractiveAnalyticsSuite
            cases={cases}
            activeRole={user.role}
            selectedCaseId={cases[0]?.id}
            onSelectCase={onSelectCase}
            onSelectTab={onSelectTab}
          />
        </div>

        {/* Needs Attention Panel (1 Col) */}
        <div className="dashboard-panel reveal-feature card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold font-serif text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>{t('section.needs_attention')}</span>
              </h2>
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {attentionItems.length} {t('dash.actionable')}
              </span>
            </div>

            <div className="space-y-3">
              {attentionItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-[#0f2744] rounded-xl border border-[#1e3a5f]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-xs font-semibold text-white">{t('section.all_up_to_date')}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t('section.no_urgent')}
                  </p>
                </div>
              ) : (
                attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      item.severity === 'urgent'
                        ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-600'
                        : item.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-800/80 hover:border-amber-600'
                        : 'bg-[#0f2744] border-[#1e3a5f] hover:border-[#0284c7]'
                    }`}
                    onClick={() => {
                      if (item.caseId) onSelectCase(item.caseId);
                      onSelectTab(item.actionTab);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-white truncate">{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e3a5f] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#5cc2bd]" />
              <span>{t('dash.privacy')}</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('flags')}
              className="text-[#38bdf8] hover:underline cursor-pointer"
            >
              All indicators →
            </button>
          </div>
        </div>
      </div>

      {/* Multidisciplinary Governance Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl flex flex-col md:flex-row items-stretch" data-tour="gate-matrix-section">
        <div className="md:w-5/12 h-48 md:h-auto overflow-hidden bg-slate-950 shrink-0">
          <img
            src="/assets/images/milestone_gate_review_1792261681316.jpg"
            alt="Multidisciplinary Case Conference Review Team"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5cc2bd] inline-block" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5cc2bd]">
              Multidisciplinary Review Board Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mb-2">
            {t('dash.board_title')}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Every 28-day review cycle requires multidisciplinary sign-off. Wardens, Clinical Psychologists, Case Managers, and Educators collaborate to audit evidentiary milestones before any stage advancement is approved.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('guide')}
              className="px-4 py-2 rounded-xl bg-[#0f2744] hover:bg-[#163860] border border-[#1e3a5f] text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              {t('dash.inspect_protocol')} →
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('prog')}
              className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              {t('dash.verify_gates')} →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Case Activity Table */}
      <div className="dashboard-panel reveal-feature card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif text-white">{t('section.recent_activity')}</h2>
            <p className="text-xs text-slate-400">
              Active individual records in {institution?.name || 'this facility'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('cases')}
              className="text-xs text-[#38bdf8] hover:underline font-medium cursor-pointer"
            >
              {t('dash.view_cases')} ({totalCases}) →
            </button>
          </div>
        </div>

        {totalCases === 0 ? (
          <div className="p-8 text-center bg-[#0f2744] rounded-xl border border-[#1e3a5f]">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-500" />
            <h3 className="text-sm font-semibold text-white">{"Cases"} </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              This institution currently has zero active case files. Upload document evaluations or manually create an initial case profile.
            </p>
            <div className="flex items-center justify-center gap-3">
              {onOpenNewCaseModal && (
                <button
                  type="button"
                  onClick={onOpenNewCaseModal}
                  className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0274b0] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t('dash.register')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('intake')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#5cc2bd]" />
                <span>{t('dash.intake')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="scroll-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>{t('dash.case_id')}</th>
                  <th>{t('dash.individual')}</th>
                  <th>{t('dash.severity')}</th>
                  <th>{t('dash.pathway')}</th>
                  <th>{t('dash.attendance')}</th>
                  <th>{t('dash.status')}</th>
                  <th>{t('dash.updated')}</th>
                  <th className="text-right">{t('dash.action')}</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 6).map((c) => {
                  const pos = getOffenderPos(c);
                  return (
                    <tr key={c.id}>
                      <td className="font-semibold text-xs text-[#38bdf8] font-mono">{c.id}</td>
                      <td className="font-medium text-xs text-white">
                        {c.first_name} {c.last_name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {c.age_band} · {c.crime_type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            c.crime_severity >= 4 ? 'b' : c.crime_severity >= 3 ? 'w' : 'o'
                          }`}
                        >
                          {c.crime_severity}/5
                        </span>
                      </td>
                      <td className="text-xs text-slate-200">{formatPathwayName(pos)}</td>
                      <td>
                        <span
                          className={`font-semibold text-xs ${
                            c.session_attendance < 70 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {c.session_attendance}%
                        </span>
                      </td>
                      <td>
                        {c.decision ? (
                          <span className="tag o capitalize">{c.decision}</span>
                        ) : (
                          <span className="tag w">{t('status.pending_review')}</span>
                        )}
                      </td>
                      <td className="text-[11px] text-slate-400">
                        {new Date(c.updated_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCase(c.id);
                            onSelectTab('cases');
                          }}
                          className="sec text-xs px-2.5 py-1 rounded-lg"
                        >
                          {t('action.inspect_file')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};



