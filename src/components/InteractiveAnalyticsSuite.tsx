import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  HeartPulse,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  FileCheck,
  Activity,
  Layers,
  ChevronRight,
  Filter,
  Building2,
} from 'lucide-react';
import { OffenderCase, StaffRole, TabId } from '../types';
import { getOffenderPos, formatPathwayName } from '../utils/aiLogic';

interface InteractiveAnalyticsSuiteProps {
  cases: OffenderCase[];
  activeRole: StaffRole;
  selectedCaseId?: string;
  onSelectCase: (caseId: string) => void;
  onSelectTab: (tab: TabId) => void;
}

export const InteractiveAnalyticsSuite: React.FC<InteractiveAnalyticsSuiteProps> = ({
  cases,
  activeRole,
  selectedCaseId,
  onSelectCase,
  onSelectTab,
}) => {
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<'all' | 'L1' | 'L2' | 'L3' | 'L4'>('all');
  const [activeChartTab, setActiveChartTab] = useState<'distribution' | 'radar' | 'trends'>('distribution');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<string | null>(null);

  const totalCases = cases.length;

  // Cohort breakdown
  const cohortGroups = useMemo(() => {
    const l1: OffenderCase[] = [];
    const l2: OffenderCase[] = [];
    const l3: OffenderCase[] = [];
    const l4: OffenderCase[] = [];

    cases.forEach((c) => {
      const pos = getOffenderPos(c);
      if (pos == null || pos <= 2) l1.push(c);
      else if (pos <= 5) l2.push(c);
      else if (pos <= 8) l3.push(c);
      else l4.push(c);
    });

    return { l1, l2, l3, l4 };
  }, [cases]);

  // Filtered cases based on cohort selection
  const filteredCases = useMemo(() => {
    if (selectedCohortFilter === 'L1') return cohortGroups.l1;
    if (selectedCohortFilter === 'L2') return cohortGroups.l2;
    if (selectedCohortFilter === 'L3') return cohortGroups.l3;
    if (selectedCohortFilter === 'L4') return cohortGroups.l4;
    return cases;
  }, [selectedCohortFilter, cohortGroups, cases]);

  // Gate domain averages
  const domainAverages = useMemo(() => {
    if (totalCases === 0) return { edu: 0, beh: 0, wb: 0, skl: 0 };
    return {
      edu: Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.edu || 0), 0) / totalCases),
      beh: Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.beh || 0), 0) / totalCases),
      wb: Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.wb || 0), 0) / totalCases),
      skl: Math.round(cases.reduce((sum, c) => sum + (c.gate_scores?.skl || 0), 0) / totalCases),
    };
  }, [cases, totalCases]);

  // Selected case gate scores
  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || cases[0] || null;
  }, [cases, selectedCaseId]);

  // 5-Cycle longitudinal trajectory averages
  const cycleTrends = useMemo(() => {
    const cycleLabels = ['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4', 'Cycle 5'];
    const scores = [0, 0, 0, 0, 0];
    const gates = [0, 0, 0, 0, 0];
    const moods = [0, 0, 0, 0, 0];

    if (totalCases === 0) return { cycleLabels, scores, gates, moods };

    cases.forEach((c) => {
      const sh = c.score_history || [60, 65, 70, 75, 80];
      const gh = c.gate_history || [55, 60, 68, 72, 78];
      const mh = c.mood_history || [3, 3, 4, 4, 4];

      for (let i = 0; i < 5; i++) {
        scores[i] += sh[i] || 70;
        gates[i] += gh[i] || 65;
        moods[i] += (mh[i] || 3) * 20; // scale 1-5 to 0-100
      }
    });

    return {
      cycleLabels,
      scores: scores.map((s) => Math.round(s / totalCases)),
      gates: gates.map((g) => Math.round(g / totalCases)),
      moods: moods.map((m) => Math.round(m / totalCases)),
    };
  }, [cases, totalCases]);

  // Radar chart SVG calculations (4-axis diamond/quadrant)
  const radarSvgData = useMemo(() => {
    const cx = 130;
    const cy = 130;
    const r = 95;

    // 4 Axes: Top (EDU), Right (BEH), Bottom (WB), Left (SKL)
    const getPoint = (val: number, angle: number) => {
      const dist = (Math.min(100, Math.max(0, val)) / 100) * r;
      const rad = (angle * Math.PI) / 180;
      return {
        x: cx + dist * Math.sin(rad),
        y: cy - dist * Math.cos(rad),
      };
    };

    const targetPoints = [
      getPoint(70, 0),
      getPoint(70, 90),
      getPoint(70, 180),
      getPoint(70, 270),
    ];

    const avgPoints = [
      getPoint(domainAverages.edu, 0),
      getPoint(domainAverages.beh, 90),
      getPoint(domainAverages.wb, 180),
      getPoint(domainAverages.skl, 270),
    ];

    const casePoints = selectedCase?.gate_scores
      ? [
          getPoint(selectedCase.gate_scores.edu, 0),
          getPoint(selectedCase.gate_scores.beh, 90),
          getPoint(selectedCase.gate_scores.wb, 180),
          getPoint(selectedCase.gate_scores.skl, 270),
        ]
      : avgPoints;

    const toPath = (pts: { x: number; y: number }[]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

    return {
      cx,
      cy,
      r,
      targetPath: toPath(targetPoints),
      avgPath: toPath(avgPoints),
      casePath: toPath(casePoints),
      avgPoints,
      casePoints,
    };
  }, [domainAverages, selectedCase]);

  return (
    <div className="space-y-6 min-w-0 max-w-full" data-analytics-suite>
      {/* Chart Section Header with Interactive Mode Tabs */}
      <div className="flex min-w-0 flex-col gap-4 border-b border-slate-800 pb-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-[#5cc2bd] uppercase tracking-wider block">
            Real-Time Analytical Engine
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-serif text-white flex items-center gap-2 mt-0.5">
            <TrendingUp className="w-5 h-5 text-[#0284c7]" />
            <span>Interactive Rehabilitation Analytics</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Dynamic telemetry computed directly from active offender records across all four rehabilitation domains.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div role="group" aria-label="Analytics view" className="grid w-full min-w-0 grid-cols-1 gap-1 rounded-xl border border-[#172a45] bg-[#081324] p-1 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveChartTab('distribution')}
            className={`min-w-0 w-full px-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeChartTab === 'distribution'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pathway Cohorts
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('radar')}
            className={`min-w-0 w-full px-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeChartTab === 'radar'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4-Domain Radar
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('trends')}
            className={`min-w-0 w-full px-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeChartTab === 'trends'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5-Cycle Trajectories
          </button>
        </div>
      </div>

      {/* VIEW 1: Interactive Pathway Cohort Distribution */}
      {activeChartTab === 'distribution' && (
        <div className="space-y-4 animate-fade-in">
          {/* Cohort filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Cohort:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCohortFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedCohortFilter === 'all'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                  : 'bg-[#0f2744] text-slate-400 border-[#1e3a5f] hover:text-white'
              }`}
            >
              All Cohorts ({totalCases})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCohortFilter('L1')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedCohortFilter === 'L1'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-[#0f2744] text-slate-400 border-[#1e3a5f] hover:text-white'
              }`}
            >
              L1 Foundation ({cohortGroups.l1.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCohortFilter('L2')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedCohortFilter === 'L2'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                  : 'bg-[#0f2744] text-slate-400 border-[#1e3a5f] hover:text-white'
              }`}
            >
              L2 Development ({cohortGroups.l2.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCohortFilter('L3')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedCohortFilter === 'L3'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                  : 'bg-[#0f2744] text-slate-400 border-[#1e3a5f] hover:text-white'
              }`}
            >
              L3 Capability ({cohortGroups.l3.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCohortFilter('L4')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedCohortFilter === 'L4'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#0f2744] text-slate-400 border-[#1e3a5f] hover:text-white'
              }`}
            >
              L4 Reintegration ({cohortGroups.l4.length})
            </button>
          </div>

          {/* Interactive Cohort SVG Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#081324] border border-[#172a45]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
              {[
                {
                  id: 'L1',
                  name: 'Level 1: Foundation',
                  count: cohortGroups.l1.length,
                  pct: totalCases > 0 ? Math.round((cohortGroups.l1.length / totalCases) * 100) : 0,
                  color: '#10b981',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/30',
                  desc: 'Custodial induction, intake assessment, basic stabilization',
                },
                {
                  id: 'L2',
                  name: 'Level 2: Development',
                  count: cohortGroups.l2.length,
                  pct: totalCases > 0 ? Math.round((cohortGroups.l2.length / totalCases) * 100) : 0,
                  color: '#38bdf8',
                  bg: 'bg-sky-500/10',
                  border: 'border-sky-500/30',
                  desc: 'Classroom curriculum, cognitive behavioural programmes',
                },
                {
                  id: 'L3',
                  name: 'Level 3: Capability',
                  count: cohortGroups.l3.length,
                  pct: totalCases > 0 ? Math.round((cohortGroups.l3.length / totalCases) * 100) : 0,
                  color: '#c084fc',
                  bg: 'bg-purple-500/10',
                  border: 'border-purple-500/30',
                  desc: 'Vocational trade qualifications, peer mentoring, advanced workshops',
                },
                {
                  id: 'L4',
                  name: 'Level 4: Reintegration',
                  count: cohortGroups.l4.length,
                  pct: totalCases > 0 ? Math.round((cohortGroups.l4.length / totalCases) * 100) : 0,
                  color: '#fbbf24',
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/30',
                  desc: 'Pre-release handover, housing confirmation, probation continuity',
                },
              ].map((c) => {
                const isSelected = selectedCohortFilter === 'all' || selectedCohortFilter === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() =>
                      setSelectedCohortFilter(selectedCohortFilter === c.id ? 'all' : (c.id as any))
                    }
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? `${c.bg} ${c.border} shadow-sm` : 'bg-[#0f2744]/40 border-slate-800 opacity-60'
                    } hover:opacity-100 hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.color }}>
                        {c.name.split(':')[0]}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                        {c.pct}%
                      </span>
                    </div>
                    <span className="text-base font-bold text-white font-serif block">
                      {c.name.split(':')[1]}
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-bold font-serif" style={{ color: c.color }}>
                        {c.count}
                      </span>
                      <span className="text-xs text-slate-400">cases</span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {c.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Visual Cohort Bar Chart Representation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Cohort Balance Across Institution</span>
                <span className="font-mono">{totalCases} Total Offender Records</span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-900 overflow-hidden flex p-0.5 gap-0.5 border border-slate-800">
                <div
                  style={{ width: `${totalCases > 0 ? (cohortGroups.l1.length / totalCases) * 100 : 25}%` }}
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 hover:opacity-90 cursor-pointer"
                  title={`Level 1 Foundation: ${cohortGroups.l1.length} cases`}
                  onClick={() => setSelectedCohortFilter('L1')}
                />
                <div
                  style={{ width: `${totalCases > 0 ? (cohortGroups.l2.length / totalCases) * 100 : 25}%` }}
                  className="h-full bg-sky-400 transition-all duration-500 hover:opacity-90 cursor-pointer"
                  title={`Level 2 Development: ${cohortGroups.l2.length} cases`}
                  onClick={() => setSelectedCohortFilter('L2')}
                />
                <div
                  style={{ width: `${totalCases > 0 ? (cohortGroups.l3.length / totalCases) * 100 : 25}%` }}
                  className="h-full bg-purple-400 transition-all duration-500 hover:opacity-90 cursor-pointer"
                  title={`Level 3 Capability: ${cohortGroups.l3.length} cases`}
                  onClick={() => setSelectedCohortFilter('L3')}
                />
                <div
                  style={{ width: `${totalCases > 0 ? (cohortGroups.l4.length / totalCases) * 100 : 25}%` }}
                  className="h-full bg-amber-400 rounded-r-full transition-all duration-500 hover:opacity-90 cursor-pointer"
                  title={`Level 4 Reintegration: ${cohortGroups.l4.length} cases`}
                  onClick={() => setSelectedCohortFilter('L4')}
                />
              </div>
            </div>

            {/* Clickable Cases in Selected Cohort */}
            <div className="mt-4 pt-3 border-t border-[#172a45]">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Cases in {selectedCohortFilter === 'all' ? 'All Cohorts' : selectedCohortFilter} (Click to inspect dossier):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filteredCases.map((c) => {
                  const isCur = selectedCase?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectCase(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCur
                          ? 'bg-[#0284c7] text-white shadow-sm ring-1 ring-sky-300'
                          : 'bg-[#0f2744] hover:bg-[#163860] text-slate-300 border border-[#1e3a5f]'
                      }`}
                    >
                      <span className="font-mono text-[11px]">{c.id}</span>
                      <span>
                        {c.first_name} {c.last_name}
                      </span>
                      {c.decision && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400">
                          Verified
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Interactive 4-Domain Radar Chart */}
      {activeChartTab === 'radar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-[#081324] border border-[#172a45] animate-fade-in">
          {/* Radar Diagram */}
          <div className="flex flex-col items-center justify-center relative">
            <svg width="260" height="260" className="overflow-visible" aria-label="4-Domain Gate Radar Chart">
              {/* Concentric Grid Rings (25%, 50%, 75%, 100%) */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => (
                <polygon
                  key={idx}
                  points={`130,${130 - 95 * ratio} ${130 + 95 * ratio},130 130,${130 + 95 * ratio} ${130 - 95 * ratio},130`}
                  fill="none"
                  stroke="#1e3a5f"
                  strokeWidth="1"
                  strokeDasharray={idx === 2 ? 'none' : '2,2'}
                />
              ))}

              {/* 4 Axis Lines */}
              <line x1="130" y1="35" x2="130" y2="225" stroke="#1e3a5f" strokeWidth="1" />
              <line x1="35" y1="130" x2="225" y2="130" stroke="#1e3a5f" strokeWidth="1" />

              {/* 70% Statutory Target Benchmark Polygon */}
              <path
                d={radarSvgData.targetPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                opacity="0.8"
              />

              {/* Institutional Average Polygon */}
              <path
                d={radarSvgData.avgPath}
                fill="rgba(56, 189, 248, 0.2)"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Selected Case Polygon */}
              {selectedCase && (
                <path
                  d={radarSvgData.casePath}
                  fill="rgba(245, 158, 11, 0.25)"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
              )}

              {/* Axis Labels */}
              <text x="130" y="24" textAnchor="middle" fill="#38bdf8" className="text-[10.5px] font-bold">
                EDU: {domainAverages.edu}%
              </text>
              <text x="238" y="134" textAnchor="start" fill="#10b981" className="text-[10.5px] font-bold">
                BEH: {domainAverages.beh}%
              </text>
              <text x="130" y="246" textAnchor="middle" fill="#ec4899" className="text-[10.5px] font-bold">
                WB: {domainAverages.wb}%
              </text>
              <text x="22" y="134" textAnchor="end" fill="#c084fc" className="text-[10.5px] font-bold">
                SKL: {domainAverages.skl}%
              </text>
            </svg>

            {/* Radar Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-0.5 bg-[#f43f5e] border-b border-dashed" />
                <span>Statutory 70% Target</span>
              </span>
              <span className="flex items-center gap-1.5 text-sky-300">
                <span className="w-3 h-3 rounded-sm bg-[#38bdf8]/40 border border-[#38bdf8]" />
                <span>Caseload Average</span>
              </span>
              {selectedCase && (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-3 h-3 rounded-sm bg-[#f59e0b]/40 border border-[#f59e0b]" />
                  <span>{selectedCase.id} ({selectedCase.first_name})</span>
                </span>
              )}
            </div>
          </div>

          {/* Radar Metric Breakdown */}
          <div className="space-y-3.5 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-white font-serif">
              4-Domain Fulfillment Status
            </h3>

            {[
              {
                key: 'edu',
                name: 'Education & Literacy (edu)',
                avg: domainAverages.edu,
                val: selectedCase?.gate_scores?.edu ?? domainAverages.edu,
                color: 'text-sky-400',
                bar: 'from-[#0284c7] to-[#38bdf8]',
              },
              {
                key: 'beh',
                name: 'Behaviour & Conduct (beh)',
                avg: domainAverages.beh,
                val: selectedCase?.gate_scores?.beh ?? domainAverages.beh,
                color: 'text-emerald-400',
                bar: 'from-[#059669] to-[#10b981]',
              },
              {
                key: 'wb',
                name: 'Psychological & Well-being (wb)',
                avg: domainAverages.wb,
                val: selectedCase?.gate_scores?.wb ?? domainAverages.wb,
                color: 'text-pink-400',
                bar: 'from-[#db2777] to-[#ec4899]',
              },
              {
                key: 'skl',
                name: 'Practical & Vocational Skills (skl)',
                avg: domainAverages.skl,
                val: selectedCase?.gate_scores?.skl ?? domainAverages.skl,
                color: 'text-purple-400',
                bar: 'from-[#7c3aed] to-[#c084fc]',
              },
            ].map((d) => {
              const pass = d.val >= 70;
              return (
                <div key={d.key} className="p-3 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-200">{d.name}</span>
                    <span className={`font-mono font-bold ${pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {d.val}% {pass ? '(Satisfied)' : '(Deficit)'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative">
                    <div
                      className={`h-full bg-gradient-to-r ${d.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, d.val)}%` }}
                    />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10" style={{ left: '70%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: 5-Cycle Longitudinal Trajectories */}
      {activeChartTab === 'trends' && (
        <div className="p-5 rounded-2xl bg-[#081324] border border-[#172a45] space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                Longitudinal Trajectory Across 5 Review Cycles
              </h3>
              <p className="text-xs text-slate-400">
                Tracking historical score velocity, gate completion benchmarks, and emotional stability indices.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40">
              +{cycleTrends.scores[4] - cycleTrends.scores[0]} pts overall progress
            </span>
          </div>

          {/* SVG Multi-Line Trend Visualizer */}
          <div className="h-56 w-full relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Horizontal gridlines for 25, 50, 75, 100 */}
              {[50, 100, 150].map((y, idx) => (
                <line key={idx} x1="30" y1={y} x2="480" y2={y} stroke="#172a45" strokeWidth="1" strokeDasharray="3,3" />
              ))}

              {/* 70% statutory line */}
              <line x1="30" y1="60" x2="480" y2="60" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4,2" />
              <text x="485" y="64" fill="#f43f5e" className="text-[9px] font-mono">70% Target</text>

              {/* Line 1: Placement Scores */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points={cycleTrends.scores
                  .map((val, idx) => `${40 + idx * 105},${200 - val * 1.8}`)
                  .join(' ')}
              />

              {/* Line 2: Gate History */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={cycleTrends.gates
                  .map((val, idx) => `${40 + idx * 105},${200 - val * 1.8}`)
                  .join(' ')}
              />

              {/* Line 3: Well-being / Mood */}
              <polyline
                fill="none"
                stroke="#ec4899"
                strokeWidth="2"
                strokeDasharray="4,2"
                points={cycleTrends.moods
                  .map((val, idx) => `${40 + idx * 105},${200 - val * 1.8}`)
                  .join(' ')}
              />

              {/* Interactive Data Nodes */}
              {cycleTrends.cycleLabels.map((lbl, idx) => {
                const x = 40 + idx * 105;
                const scoreY = 200 - cycleTrends.scores[idx] * 1.8;
                return (
                  <g key={lbl} className="cursor-pointer">
                    <circle cx={x} cy={scoreY} r="4" fill="#38bdf8" stroke="#081324" strokeWidth="2" />
                    <text x={x} y="195" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono">
                      {lbl}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Trend Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#172a45] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <span className="w-3 h-0.5 bg-[#38bdf8]" />
                <span>Placement Score: {cycleTrends.scores[4]}</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-3 h-0.5 bg-[#10b981]" />
                <span>Avg Gate Completion: {cycleTrends.gates[4]}%</span>
              </span>
              <span className="flex items-center gap-1.5 text-pink-400 font-medium">
                <span className="w-3 h-0.5 bg-[#ec4899] border-b border-dashed" />
                <span>Well-being Index: {cycleTrends.moods[4]}%</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('prog')}
              className="text-xs text-sky-400 hover:underline font-semibold"
            >
              Examine Full 12-Stage Matrix →
            </button>
          </div>
        </div>
      )}

      {/* ROLE-SPECIFIC TAILORED VISUALIZATIONS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1a30] border border-[#1e3a5f]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {activeRole === 'Warden' && <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />}
            {activeRole === 'Psychologist' && <HeartPulse className="w-4.5 h-4.5 text-pink-400" />}
            {activeRole === 'Educator' && <Award className="w-4.5 h-4.5 text-purple-400" />}
            {activeRole === 'Case Manager' && <Users className="w-4.5 h-4.5 text-sky-400" />}
            {activeRole === 'Community Rehabilitation Officer' && <Compass className="w-4.5 h-4.5 text-emerald-400" />}
            {activeRole === 'Administrator' && <Building2 className="w-4.5 h-4.5 text-slate-300" />}

            <h3 className="text-sm sm:text-base font-bold font-serif text-white">
              {activeRole} Focus Telemetry &amp; Specialized Workflows
            </h3>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#0f2744] text-sky-300 font-mono border border-[#1e3a5f]">
            {activeRole} Console
          </span>
        </div>

        {/* Specialized details per role */}
        {activeRole === 'Warden' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Human Verification Rate</span>
              <span className="text-xl font-bold font-serif text-emerald-400">
                {cases.filter((c) => c.decision).length} / {totalCases}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {cases.filter((c) => !c.decision).length} awaiting signed executive approval
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Statutory Gate Pass Rate</span>
              <span className="text-xl font-bold font-serif text-sky-400">
                {Math.round(((domainAverages.edu >= 70 ? 1 : 0) + (domainAverages.beh >= 70 ? 1 : 0) + (domainAverages.wb >= 70 ? 1 : 0) + (domainAverages.skl >= 70 ? 1 : 0)) / 4 * 100)}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                4 of 4 domains satisfy the 70% threshold
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Audit Compliance</span>
              <span className="text-xl font-bold font-serif text-emerald-400">100%</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Zero tamper violations across all caseload records
              </span>
            </div>
          </div>
        )}

        {activeRole === 'Psychologist' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Active Well-being Alert Cases</span>
              <span className="text-xl font-bold font-serif text-amber-400">
                {cases.filter((c) => c.low_mood_count > 0).length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Screened for low-mood frequency and decompensation risk
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Cognitive Engagement Avg</span>
              <span className="text-xl font-bold font-serif text-pink-400">
                {(cases.reduce((sum, c) => sum + (c.programme_engagement || 3), 0) / (totalCases || 1)).toFixed(1)} / 5.0
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                High therapeutic adherence across clinical group sessions
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Clinical Note Privacy</span>
              <span className="text-xl font-bold font-serif text-emerald-400">Restricted</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Confidential psychotherapy notes masked for non-clinical tiers
              </span>
            </div>
          </div>
        )}

        {activeRole === 'Educator' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Attendance Benchmark (≥75%)</span>
              <span className="text-xl font-bold font-serif text-emerald-400">
                {cases.filter((c) => c.session_attendance >= 75).length} / {totalCases}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {cases.filter((c) => c.session_attendance < 75).length} needing attendance intervention
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Trade Certifications Issued</span>
              <span className="text-xl font-bold font-serif text-purple-400">
                {cases.reduce((sum, c) => sum + (c.certifications?.length || 0), 0)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                City &amp; Guilds, Carpentry, Health &amp; Safety, Digital
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Vocational Skills Gate Avg</span>
              <span className="text-xl font-bold font-serif text-sky-400">
                {domainAverages.skl}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Target ≥ 70% for progression to Capability stage
              </span>
            </div>
          </div>
        )}

        {activeRole === 'Case Manager' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Plans Adhering to Milestones</span>
              <span className="text-xl font-bold font-serif text-sky-400">
                {cases.filter((c) => c.session_attendance >= 75 && c.programme_engagement >= 3).length} / {totalCases}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Individual rehabilitation plans on scheduled pace
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">28-Day Reviews Scheduled</span>
              <span className="text-xl font-bold font-serif text-amber-400">
                {cases.filter((c) => !c.decision || c.session_attendance < 75).length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Upcoming multidisciplinary case conferences
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Cross-Domain Variance</span>
              <span className="text-xl font-bold font-serif text-emerald-400">Low (Balanced)</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Consistent progress across EDU, BEH, WB, and SKL
              </span>
            </div>
          </div>
        )}

        {activeRole === 'Community Rehabilitation Officer' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Level 4 Reintegration Caseload</span>
              <span className="text-xl font-bold font-serif text-amber-400">
                {cohortGroups.l4.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Eligible for parole board review and community licensing
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Community Support Network Avg</span>
              <span className="text-xl font-bold font-serif text-emerald-400">
                {(cases.reduce((sum, c) => sum + (c.support_network || 3), 0) / (totalCases || 1)).toFixed(1)} / 5.0
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Verified family accommodation and external mentorship
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Handover Brief Readiness</span>
              <span className="text-xl font-bold font-serif text-sky-400">100% Prepared</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Tamper-evident PDF export ready for external probation services
              </span>
            </div>
          </div>
        )}

        {activeRole === 'Administrator' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Multi-Tenant Isolation</span>
              <span className="text-xl font-bold font-serif text-emerald-400">Active &amp; Verified</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Complete data separation by institutional tenant boundary
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Concurrency Locks</span>
              <span className="text-xl font-bold font-serif text-sky-400">Enforced</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Optimistic version locking protects multi-officer edits
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#081324] border border-[#172a45]">
              <span className="text-slate-400 block mb-1">Audit Trail Logging</span>
              <span className="text-xl font-bold font-serif text-emerald-400">100% Captured</span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Immutable event recording for forensic inspection
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
