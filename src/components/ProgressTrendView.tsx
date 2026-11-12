import React from 'react';
import { TH } from '../data/constants';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import { isRoleRestricted } from '../utils/aiLogic';
import { TrendingUp, AlertCircle, Calendar, ShieldCheck, Info } from 'lucide-react';

interface ProgressTrendViewProps {
  currentRecord: OffenderCase;
}

export const ProgressTrendView: React.FC<ProgressTrendViewProps> = ({ currentRecord }) => {
  const { user } = useAuth();
  const c = currentRecord;
  const userRole = user?.role || 'Warden';
  const isRestricted = isRoleRestricted(userRole);

  const rawScoreHistory = Array.isArray(c.score_history) ? c.score_history : [];
  const rawGateHistory = Array.isArray(c.gate_history) ? c.gate_history : [];

  // Filter out invalid/empty records and handle insufficient historical records
  const validScores = rawScoreHistory.filter((v) => typeof v === 'number' && !isNaN(v));
  const validGates = rawGateHistory.filter((v) => typeof v === 'number' && !isNaN(v));

  const totalCycles = Math.max(validScores.length, validGates.length);
  const isInsufficient = totalCycles < 2;

  const W = 640;
  const H = 260;
  const leftPad = 52;
  const rightPad = 48;
  const topPad = 30;
  const bottomPad = 40;

  const x = (i: number, maxI: number) => {
    if (maxI <= 0) return leftPad;
    return leftPad + (i * (W - leftPad - rightPad)) / maxI;
  };

  const y = (v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    return H - bottomPad - (clamped * (H - topPad - bottomPad)) / 100;
  };

  // Trajectory calculation
  const firstScore = validScores[0] ?? null;
  const lastScore = validScores[validScores.length - 1] ?? null;
  const delta = firstScore !== null && lastScore !== null ? lastScore - firstScore : null;
  const deltaStr = delta !== null ? (delta >= 0 ? `+${delta}` : `${delta}`) : 'N/A';

  const renderDataLine = (data: number[], color: string, isDashed = false) => {
    if (data.length < 2) return null;
    const maxIndex = data.length - 1;
    const pointsStr = data.map((v, i) => `${x(i, maxIndex)},${y(v)}`).join(' ');

    return (
      <g>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={isDashed ? '6 4' : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />
        {data.map((v, i) => (
          <g key={i}>
            <circle
              cx={x(i, maxIndex)}
              cy={y(v)}
              r={5}
              fill={color}
              stroke="#071325"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:r-7"
            >
              <title>{`Review Cycle ${i + 1}: ${v}%`}</title>
            </circle>
            <text
              x={x(i, maxIndex)}
              y={y(v) - 9}
              textAnchor="middle"
              fill={color}
              fontSize="11"
              fontWeight="700"
              className="font-mono"
            >
              {v}%
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Telemetry Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
          <img
            src="/assets/images/wellbeing_trend_analytics.svg"
            alt="Longitudinal placement and gate completion trend telemetry"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-transparent to-transparent" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/50 text-xs font-mono text-[#38bdf8] backdrop-blur-sm">
            LONGITUDINAL TELEMETRY · REHABILITATION TRAJECTORY
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white m-0">
              {c.id} ({c.first_name} {c.last_name}): Progress Across Review Cycles
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Multi-cycle comparative trajectory monitoring placement scores and gate benchmark completion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-[#071325] border border-[#1e3a5f] text-xs font-mono text-slate-300">
              Recorded Cycles: <strong className="text-white">{totalCycles}</strong>
            </span>
            {delta !== null && (
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                delta >= 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
              }`}>
                Net Trajectory: {deltaStr} pts
              </span>
            )}
          </div>
        </div>

        {/* Insufficient historical records notice */}
        {isInsufficient ? (
          <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-950/20 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-amber-200 m-0">
              Insufficient Historical Review Cycles
            </h3>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              Longitudinal trend charts require at least 2 distinct periodic review cycles to calculate multi-point progress velocity and trajectory trends without fabricating historical points.
            </p>
            <div className="inline-flex items-center gap-4 text-xs font-mono text-amber-300/90 bg-[#071325] py-2 px-4 rounded-lg border border-[#1e3a5f]">
              <span>Current Cycle: Cycle 1 (Baseline: {validScores[0] ?? 50}%)</span>
              <span>•</span>
              <span>Next Review: 28-Day Periodic Interval</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1e3a5f] p-4 bg-[#071325]">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto min-w-[540px]"
              role="img"
              aria-label="Progress trend lines across review cycles"
            >
              {/* Horizontal gridlines */}
              {[0, 25, 50, 75, 100].map((v) => (
                <React.Fragment key={v}>
                  <line
                    x1={leftPad}
                    x2={W - rightPad}
                    y1={y(v)}
                    y2={y(v)}
                    stroke="var(--line)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={leftPad - 12}
                    y={y(v) + 4}
                    textAnchor="end"
                    fill="var(--mute)"
                    fontSize="11"
                    fontWeight="600"
                    className="font-mono"
                  >
                    {v}%
                  </text>
                </React.Fragment>
              ))}

              {/* 70% Gate threshold line */}
              <line
                x1={leftPad}
                x2={W - rightPad}
                y1={y(TH)}
                y2={y(TH)}
                stroke="var(--warn)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text
                x={W - rightPad - 4}
                y={y(TH) - 6}
                fill="var(--warn)"
                textAnchor="end"
                fontSize="11"
                fontWeight="700"
              >
                70% Gate Mandate Threshold ({TH}%)
              </text>

              {/* Cycle X-axis labels */}
              {Array.from({ length: totalCycles }).map((_, i) => (
                <text
                  key={i}
                  x={x(i, totalCycles - 1)}
                  y={H - 12}
                  textAnchor="middle"
                  fill="var(--mute)"
                  fontSize="11"
                  fontWeight="600"
                  className="font-mono"
                >
                  Cycle {i + 1}
                </text>
              ))}

              {/* Render Lines */}
              {renderDataLine(validScores, 'var(--acc)')}
              {renderDataLine(validGates, 'var(--warn)', true)}
            </svg>
          </div>
        )}

        {/* Legend and Analysis Notes */}
        <div className="mt-4 pt-3 border-t border-[#1e3a5f] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-[#38bdf8]">
              <span className="w-3 h-1 bg-[#0284c7] inline-block rounded" />
              Solid Line: Composite Placement Score
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[#fbbf24]">
              <span className="w-3 h-1 bg-[#fbbf24] inline-block border-b-2 border-dashed border-[#fbbf24]" />
              Dashed Line: Average Gate Verification (%)
            </span>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Hover any data point to inspect exact percentage.
          </div>
        </div>

        <div className="note-box text-xs mt-3 text-slate-300">
          <Info className="w-4 h-4 text-[#38bdf8] shrink-0 inline-block mr-1.5 align-text-bottom" />
          <b>Longitudinal Integrity Mandate:</b> Data points represent verified case conference assessments. Missing cycle data is reported transparently rather than interpolated with synthetic flatlines.
        </div>
      </div>
    </div>
  );
};
