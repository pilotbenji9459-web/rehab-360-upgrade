import React from 'react';
import { TH } from '../data/constants';
import { OffenderCase } from '../types';

interface ProgressTrendViewProps {
  currentRecord: OffenderCase;
}

export const ProgressTrendView: React.FC<ProgressTrendViewProps> = ({ currentRecord }) => {
  const c = currentRecord;
  const W = 620;
  const H = 250;
  const leftPad = 48;
  const rightPad = 40;
  const topPad = 25;
  const bottomPad = 35;

  const scoreHistory = c.score_history || [50, 50, 50, 50, 50];
  const gateHistory = c.gate_history || [50, 50, 50, 50, 50];

  const x = (i: number) => leftPad + (i * (W - leftPad - rightPad)) / 4;
  const y = (v: number) => H - bottomPad - (v * (H - topPad - bottomPad)) / 100;

  const delta = (scoreHistory[4] ?? 50) - (scoreHistory[0] ?? 50);
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

  const renderLine = (data: number[], color: string, isDashed = false) => {
    const pointsStr = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    return (
      <g>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={isDashed ? '6 4' : undefined}
          points={pointsStr}
        />
        {data.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={4.5}
            fill={color}
            stroke="#ffffff"
            strokeWidth="1"
            className="cursor-pointer transition-all hover:r-6"
          >
            <title>{`Cycle ${i + 1}: ${v}`}</title>
          </circle>
        ))}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Longitudinal Progress Telemetry Visual Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
          <img
            src="/assets/images/wellbeing_trend_analytics.svg"
            alt="Longitudinal placement and gate completion trend telemetry"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-transparent to-transparent" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/50 text-xs font-mono text-[#38bdf8] backdrop-blur-sm">
            CYCLE TELEMETRY · 5 REVIEW INTERVALS
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{c.id}: Progress Across Review Cycles</h2>
        <div className="overflow-x-auto rounded-xl border border-[#1e3a5f] p-4 bg-[#071325]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto min-w-[500px]"
            role="img"
            aria-label="Progress trend lines"
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
                />
                <text x={leftPad - 10} y={y(v) + 4} textAnchor="end" fill="var(--mute)" fontSize="12" fontWeight="600">
                  {v}
                </text>
              </React.Fragment>
            ))}

            {/* Gate 70% threshold line */}
            <line
              x1={leftPad}
              x2={W - rightPad}
              y1={y(TH)}
              y2={y(TH)}
              stroke="var(--warn)"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text x={W - rightPad - 4} y={y(TH) - 6} fill="var(--warn)" textAnchor="end" fontSize="11" fontWeight="700">
              Gate {TH}%
            </text>

            {/* Cycle labels */}
            {[0, 1, 2, 3, 4].map((i) => (
              <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fill="var(--mute)" fontSize="12" fontWeight="600">
                Cycle {i + 1}
              </text>
            ))}

            {/* Data Lines */}
            {renderLine(scoreHistory, 'var(--acc)')}
            {renderLine(gateHistory, 'var(--warn)', true)}
          </svg>
        </div>

      <div className="row mt-3 mb-2">
        <span className="tag">Solid: Placement Score</span>
        <span className="tag w">Dashed: Average Gate Completion</span>
      </div>

      <p className="mute text-xs">
        Latest placement score {scoreHistory[4]} ({deltaStr} since review cycle 1). Hover points for cycle values.
      </p>
    </div>
  </div>
);
};
