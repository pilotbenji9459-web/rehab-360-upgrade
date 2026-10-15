import React, { useState } from 'react';
import { GLOSSARY, PROCESS_STEPS, LEVEL_FRAMEWORK } from '../data/constants';

export const GuideView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGlossary = GLOSSARY.filter(([term, def]) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return term.toLowerCase().includes(q) || def.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="card">
        <h2>How RehabPath360 works</h2>
        <p className="text-sm font-medium mb-3">
          Assess → Analyse → Recommend → Human verify → Implement → Measure → Reassess → Adapt
        </p>
        <div className="row">
          <span className="tag">Secure</span>
          <span className="tag">Transparent</span>
          <span className="tag">Evidence-based</span>
          <span className="tag">Human-centred</span>
        </div>
      </div>

      <div className="card">
        <h2>The four levels</h2>
        <div className="grid-layout">
          {LEVEL_FRAMEWORK.map(([name, color, objective, description]) => (
            <div
              key={name}
              className="p-2.5 rounded bg-[var(--bg)]"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <h3>{name}</h3>
              <p className="text-sm mb-1">
                <b>Objective:</b> {objective}
              </p>
              <p className="mute text-xs">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>The 15-step process</h2>
        <table className="app-table">
          <thead>
            <tr>
              <th className="w-16">Step</th>
              <th>What happens</th>
              <th>Where in this app</th>
            </tr>
          </thead>
          <tbody>
            {PROCESS_STEPS.map(([whatHappens, location], idx) => (
              <tr key={idx}>
                <td className="font-semibold text-xs">{idx + 1}</td>
                <td className="text-sm">{whatHappens}</td>
                <td className="mute text-xs">{location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Glossary</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search terms, for example RBAC"
          aria-label="Search glossary"
          className="w-full text-sm rounded border border-[var(--line)] py-1.5 px-3 mb-3"
        />

        <table className="app-table">
          <tbody>
            {filteredGlossary.map(([term, def]) => (
              <tr key={term} className="gl">
                <td className="w-1/3 font-semibold text-sm">{term}</td>
                <td className="w-2/3 text-sm">{def}</td>
              </tr>
            ))}
            {filteredGlossary.length === 0 && (
              <tr>
                <td colSpan={2} className="mute text-center py-3 text-sm">
                  No matching terms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
