import React from 'react';
import { TH } from '../data/constants';
import { OffenderCase } from '../types';

interface ProgressTrendViewProps {
  currentRecord: OffenderCase;
}

export const ProgressTrendView: React.FC<ProgressTrendViewProps> = ({ currentRecord }) => {
  const c = currentRecord;
  const W = 560;
  const H = 230;

  const scoreHistory = c.score_history || [50, 50, 50, 50, 50];
  const gateHistory = c.gate_history || [50, 50, 50, 50, 50];

  const x = (i: number) => 50 + (i * (W - 80)) / 4;
  const y = (v: number) => H - 30 - (v * (H - 60)) / 100;

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
            r={4}
            fill={color}
            className="cursor-pointer transition-all hover:r-6"
          >
            <title>{`Cycle ${i + 1}: ${v}`}</title>
          </circle>
        ))}
      </g>
    );
  };

  return (
    <div className="card">
      <h2>{c.id}: Progress Across Review Cycles</h2>
      <div className="scroll-container">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-full overflow-visible"
          role="img"
          aria-label="Progress trend lines"
        >
          {/* Horizontal gridlines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <React.Fragment key={v}>
              <line
                x1="40"
                x2={W - 20}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--line)"
                strokeWidth="1"
              />
              <text x="8" y={y(v) + 4}>
                {v}
              </text>
            </React.Fragment>
          ))}

          {/* Gate 70% threshold line */}
          <line
            x1="40"
            x2={W - 20}
            y1={y(TH)}
            y2={y(TH)}
            stroke="var(--warn)"
            strokeDasharray="2 4"
            strokeWidth="1.5"
          />
          <text x={W - 90} y={y(TH) - 5} fill="var(--warn)" fontWeight="600">
            Gate {TH}%
          </text>

          {/* Cycle labels */}
          {[0, 1, 2, 3, 4].map((i) => (
            <text key={i} x={x(i) - 18} y={H - 8}>
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
  );
};
