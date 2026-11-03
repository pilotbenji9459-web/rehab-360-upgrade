import React from 'react';
import { LV } from '../data/constants';

export const SystemInsightsView: React.FC = () => {
  const lvCounts = [38, 41, 27, 14];
  const tot = 120;
  const suppress = (n: number) => (n < 3 ? '<3' : n.toString());

  const bottlenecks: [string, number][] = [
    ['Education', 46],
    ['Behaviour', 22],
    ['Well-being', 31],
    ['Skills & certification', 38],
  ];

  const programmes: [string, number, number][] = [
    ['Literacy and numeracy', 64, 81],
    ['Vocational skills', 48, 67],
    ['Well-being groups', 35, 72],
    ['Pre-release transition', 2, 100],
  ];

  return (
    <>
      <div className="card">
        <div className="note-box">
          Aggregated, depersonalised facility data (synthetic). Small counts under 3 are suppressed to
          protect privacy.
        </div>
      </div>

      <div className="grid-layout">
        <div className="card">
          <h2>People by level (n={tot})</h2>
          {LV.map((level, i) => {
            const count = lvCounts[i];
            const pct = (count / tot) * 100 * 2;
            return (
              <div key={level} className="my-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{level}</span>
                  <span className="font-semibold">{suppress(count)}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2>{"Dashboard"} </h2>
          <p className="mute text-xs mb-3">Share of gate checks blocked by each domain</p>
          {bottlenecks.map(([domain, pct]) => (
            <div key={domain} className="my-2 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{domain}</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="bar">
                <i style={{ width: `${pct}%`, background: 'var(--warn)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{"Reports"} </h2>
        <table className="app-table">
          <thead>
            <tr>
              <th>Programme</th>
              <th>Enrolled</th>
              <th>Completion</th>
            </tr>
          </thead>
          <tbody>
            {programmes.map(([progName, enrolled, compRate]) => (
              <tr key={progName}>
                <td className="font-medium">{progName}</td>
                <td>{suppress(enrolled)}</td>
                <td>{enrolled < 3 ? 'Suppressed' : `${compRate}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
