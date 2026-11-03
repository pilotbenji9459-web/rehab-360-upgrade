import React from 'react';
import { useAuth } from '../context/AuthContext';
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
  if (!user) return null;

  const isDemo = institution?.is_demo ?? (systemStatus?.mode === 'demo');

  // Compute live dashboard metrics from current institution's cases
  const totalCases = cases.length;
  const pendingDecisions = cases.filter((c) => !c.decision).length;
  const plansOnTrack = cases.filter(
    (c) => c.session_attendance >= 75 && c.programme_engagement >= 3
  ).length;
  const scheduledCheckins = cases.filter((c) => {
    // Review due if assessment is in progress or pending verification
    return !c.decision || c.session_attendance < 75 || c.low_mood_count > 0;
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
      title: `${pendingDecisions} AI Placement Verification(s) Pending`,
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
  const clinicalFlagCase = cases.find(
    (c) => c.low_mood_count >= 3 || (c.mental_wellbeing && c.mental_wellbeing <= 2)
  );
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
    <div className="space-y-6 animate-fade-in min-w-0">
      {/* Top Welcome & Institutional Status Strip */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0b1a30] via-[#0f2744] to-[#123158] border border-[#1e3a5f] text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#0284c7]/20 to-[#5cc2bd]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0284c7]/30 border border-[#0284c7] text-[#38bdf8] text-xs font-semibold uppercase tracking-wider">
                {getCustomDesignation(user.role)}
              </span>
              <span className="text-xs text-slate-300 font-mono">Badge #{user.badge_number}</span>
              {isDemo ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
                  Exhibition Demo · Fictional Caseload
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                  Clean Institutional Deployment
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
              {institution?.name || 'Rehabilitation Management'}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              Welcome back, <strong className="text-white font-semibold">{user.full_name}</strong>.
              Signed into <span className="text-[#5cc2bd] font-semibold">{user.department}</span> with institutional row-level data isolation active.
            </p>
          </div>

          {/* Quick Actions Header Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenNewCaseModal && (
              <button
                type="button"
                onClick={onOpenNewCaseModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0274b0] hover:to-[#025a8b] text-white text-sm font-semibold shadow-md shadow-[#0284c7]/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Case</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectTab('intake')}
              className="px-4 py-2.5 rounded-xl bg-[#0f2744] hover:bg-[#163860] text-slate-200 border border-[#1e3a5f] text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#5cc2bd]" />
              <span>Import Document</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cases')}
              className="px-4 py-2.5 rounded-xl bg-[#0f2744] hover:bg-[#163860] text-slate-200 border border-[#1e3a5f] text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>View Directory</span>
              <ArrowRight className="w-4 h-4 text-[#38bdf8]" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Cases */}
        <div className="card border-t-3 border-[#0284c7] bg-[#0b1a30] hover:border-[#38bdf8] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-slate-200 uppercase tracking-wider">
              Active Cases
            </span>
            <Users className="w-5 h-5 text-[#0284c7]" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-white mt-2 font-serif">{totalCases}</div>
          <span className="text-xs sm:text-sm text-[#38bdf8] font-medium block mt-1.5">
            {isDemo ? 'Fictional demo records' : 'Verified institutional files'}
          </span>
        </div>

        {/* Card 2: Reviews Pending */}
        <div className="card border-t-3 border-amber-500 bg-[#0b1a30] hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-slate-200 uppercase tracking-wider">
              Reviews Pending
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-amber-400 mt-2 font-serif">{pendingDecisions}</div>
          <span className="text-xs sm:text-sm text-slate-300 font-medium block mt-1.5">
            Requires human officer verification
          </span>
        </div>

        {/* Card 3: Rehabilitation Plans On Track */}
        <div className="card border-t-3 border-emerald-500 bg-[#0b1a30] hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-slate-200 uppercase tracking-wider">
              Plans On Track
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mt-2 font-serif">{plansOnTrack}</div>
          <span className="text-xs sm:text-sm text-emerald-400 font-medium block mt-1.5">
            {totalCases > 0 ? Math.round((plansOnTrack / totalCases) * 100) : 0}% adhering to milestones
          </span>
        </div>

        {/* Card 4: Scheduled Check-ins */}
        <div className="card border-t-3 border-[#5cc2bd] bg-[#0b1a30] hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-slate-200 uppercase tracking-wider">
              Scheduled Check-ins
            </span>
            <Calendar className="w-5 h-5 text-[#5cc2bd]" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-[#5cc2bd] mt-2 font-serif">{scheduledCheckins}</div>
          <span className="text-xs sm:text-sm text-slate-300 font-medium block mt-1.5">
            Upcoming 28-day review cycle
          </span>
        </div>
      </div>

      {/* Main Grid: Rehabilitation Progress Chart + {"Well-being"} Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rehabilitation Progress Chart (2 Cols) */}
        <div className="lg:col-span-2 card min-w-0 bg-[#0b1a30]">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white flex items-start gap-2 leading-snug">
                <TrendingUp className="w-5 h-5 text-[#0284c7] shrink-0 mt-1" />
                <span>{"Dashboard"}</span>
              </h2>
              <p className="text-sm text-slate-300 mt-0.5">
                Population distribution across 4-level pathway and average domain gate fulfillment
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('prog')}
              className="text-sm text-[#38bdf8] hover:underline font-semibold cursor-pointer shrink-0 self-start whitespace-nowrap"
            >
              Progression Matrix →
            </button>
          </div>

          {totalCases === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-base font-medium">No progress records available</p>
              <p className="text-sm text-slate-400 mt-1">Register cases or import documents to visualize rehabilitation trends.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 4 Pathway Cohorts Bar Chart */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                  Pathway Level Distribution
                </span>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 text-center text-xs">
                  <div className="p-2 sm:p-3 min-w-0 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Level 1
                    </span>
                    <span className="font-bold text-sm sm:text-base text-white font-serif block break-words leading-tight">Foundation</span>
                    <span className="text-2xl font-bold text-emerald-400 mt-1 block">{foundationCohort}</span>
                    <span className="text-xs text-slate-300">
                      {Math.round((foundationCohort / totalCases) * 100)}% cohort
                    </span>
                  </div>

                  <div className="p-2 sm:p-3 min-w-0 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
                    <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider block">
                      Level 2
                    </span>
                    <span className="font-bold text-sm sm:text-base text-white font-serif block break-words leading-tight">Development</span>
                    <span className="text-2xl font-bold text-[#38bdf8] mt-1 block">{developmentCohort}</span>
                    <span className="text-xs text-slate-300">
                      {Math.round((developmentCohort / totalCases) * 100)}% cohort
                    </span>
                  </div>

                  <div className="p-2 sm:p-3 min-w-0 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                      Level 3
                    </span>
                    <span className="font-bold text-sm sm:text-base text-white font-serif block break-words leading-tight">Capability</span>
                    <span className="text-2xl font-bold text-purple-400 mt-1 block">{capabilityCohort}</span>
                    <span className="text-xs text-slate-300">
                      {Math.round((capabilityCohort / totalCases) * 100)}% cohort
                    </span>
                  </div>

                  <div className="p-2 sm:p-3 min-w-0 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Level 4
                    </span>
                    <span className="font-bold text-sm sm:text-base text-white font-serif block break-words leading-tight">Reintegration</span>
                    <span className="text-2xl font-bold text-amber-400 mt-1 block">{reintegrationCohort}</span>
                    <span className="text-xs text-slate-300">
                      {Math.round((reintegrationCohort / totalCases) * 100)}% cohort
                    </span>
                  </div>
                </div>
              </div>

              {/* Average Gate Domain Achievements */}
              <div className="p-4 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Average Gate Domain Fulfilment (70% Threshold Line)
                  </span>
                  <span className="text-[10px] font-semibold text-[#5cc2bd] bg-[#5cc2bd]/10 px-2 py-0.5 rounded-full border border-[#5cc2bd]/20">
                    Target: ≥ 70%
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-300">Education &amp; Literacy (edu)</span>
                      <span className={avgEdu >= 70 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {avgEdu}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#0284c7] to-[#5cc2bd] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, avgEdu)}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                        style={{ left: '70%' }}
                        title="70% Gate Target"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-300">Behaviour &amp; Conduct (beh)</span>
                      <span className={avgBeh >= 70 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {avgBeh}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#0284c7] to-[#5cc2bd] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, avgBeh)}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                        style={{ left: '70%' }}
                        title="70% Gate Target"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-300">Psychological &amp; Well-being (wb)</span>
                      <span className={avgWb >= 70 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {avgWb}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#0284c7] to-[#5cc2bd] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, avgWb)}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                        style={{ left: '70%' }}
                        title="70% Gate Target"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-300">Practical &amp; Vocational Skills (skl)</span>
                      <span className={avgSkl >= 70 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {avgSkl}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#0284c7] to-[#5cc2bd] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, avgSkl)}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                        style={{ left: '70%' }}
                        title="70% Gate Target"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Needs Attention Panel (1 Col) */}
        <div className="card bg-[#0b1a30] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold font-serif text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Needs Attention</span>
              </h2>
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {attentionItems.length} Actionable
              </span>
            </div>

            <div className="space-y-3">
              {attentionItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-[#0f2744] rounded-xl border border-[#1e3a5f]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-xs font-semibold text-white">All Workflows Up To Date</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    No overdue placements, critical attendance barriers, or urgent reviews in this facility.
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
              <span>Psychological privacy preserved</span>
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
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl flex flex-col md:flex-row items-stretch">
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
            {"Guide"} 
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
              Inspect 15-Step Clinical Protocol →
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('prog')}
              className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              Verify Progression Gates →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Case Activity Table */}
      <div className="card bg-[#0b1a30]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif text-white">{"Audit Trail"} </h2>
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
              View complete caseload directory ({totalCases}) →
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
                  <span>Register First Case</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('intake')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#5cc2bd]" />
                <span>Document Intake</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="scroll-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Individual</th>
                  <th>Crime Severity</th>
                  <th>Rehabilitation Pathway</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th className="text-right">Action</th>
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
                          <span className="tag w">Pending Review</span>
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
                          Inspect File
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
