import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { LV, SUB, DOM, TH, NOT_READY_ACTIONS } from '../data/constants';
import { OffenderCase, StaffRole, GateKey } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getOffenderPos,
  formatPathwayName,
  getMissingGates,
  canPerform,
} from '../utils/aiLogic';

interface ProgressionGatesViewProps {
  currentRecord: OffenderCase;
  onUpdateGate: (key: GateKey, val: number) => void;
  onAdvance: () => void;
  onNotReadyAction: (action: string) => void;
}

export const ProgressionGatesView: React.FC<ProgressionGatesViewProps> = ({
  currentRecord,
  onUpdateGate,
  onAdvance,
  onNotReadyAction,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const c = currentRecord;
  const p = getOffenderPos(c);

  if (p == null) {
    return (
      <div className="card">
        <h2>{c.id}</h2>
        <div className="note-box">
          Placement not yet verified. The Facility Warden or Administrator must approve, modify, or override the AI recommendation first.
        </div>
      </div>
    );
  }

  const missing = getMissingGates(c);
  const isLastStage = p === 11;
  const userRole = user?.role || 'Warden';
  const canAdvanceRole = canPerform(userRole, 'advance');

  const gateKeys = Object.keys(DOM) as GateKey[];

  return (
    <div className="space-y-6">
      {/* Visual Pathway Milestone Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-950">
          <img
            src="/assets/images/pathway_progression_1792261207526.jpg"
            alt="Multi-level rehabilitation pathway progression gates architecture"
            referrerPolicy="no-referrer"
            className="block w-full h-full object-cover object-center rounded-[inherit]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-transparent to-transparent" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 border border-[#1e3a5f] text-xs font-mono text-[#5cc2bd] backdrop-blur-sm">
            STAGE {p + 1} OF 12 · 70% GATE MANDATE
          </div>
        </div>
      </div>

      {/* Executive Pathway Progress Header */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0b1a30] via-[#0d223d] to-[#0b1a30] border border-[#1e3a5f] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5cc2bd] inline-block animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#5cc2bd]">
                Multi-Level Progression Gate Verification
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white m-0">
              {c.id} · {formatPathwayName(p)}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Evaluating verified evidentiary milestones across Education, Behaviour, Well-being, and Skills. Advancement to the next tier requires all four domains to reach &ge; 70%.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-[#071325]/90 border border-[#1e3a5f] text-sm font-semibold text-slate-200">
              Pathway Stage: <span className="text-[#38bdf8] font-bold font-mono">{p + 1} of 12</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>{Math.round(((p + 1) / 12) * 100)}% Overall Pathway Progress</span>
            </div>
          </div>
        </div>

        {/* 12-Segment Stage Indicator Bar */}
        <div className="mt-5 grid grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < p
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : i === p
                  ? 'bg-[#38bdf8] shadow-sm shadow-sky-500/50 ring-2 ring-[#38bdf8]/40'
                  : 'bg-slate-800'
              }`}
              title={`Stage ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Visual Level & Sub-level Matrix */}
      <div className="card">
        <h2>{t('progression')}</h2>
        <p className="text-sm text-slate-300 mb-4">
          Granular 12-stage milestone roadmap. Progression requires unanimous fulfillment across all 4 evaluated domains.
        </p>
        <div className="scroll-container">
          <div className="matrix-grid">
            <div className="h" />
            {SUB.map((s) => (
              <div key={s} className="h text-center font-bold text-sm">
                Sub-level {s}
              </div>
            ))}
            {LV.map((l, i) => (
              <React.Fragment key={l}>
                <div className="h font-semibold">{l}</div>
                {SUB.map((s, j) => {
                  const stageIndex = i * 3 + j;
                  const isCurrent = stageIndex === p;
                  const isDone = stageIndex < p;
                  const cellClass = isCurrent
                    ? 'cur'
                    : isDone
                    ? 'done'
                    : '';
                  return (
                    <div key={s} className={cellClass}>
                      {isCurrent ? 'Current' : isDone ? 'Complete' : ''}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Progression Gate Checklist */}
      <div className="card">
        <h2>Gate Check for {isLastStage ? 'Parole Handover' : 'Stage Advancement'}</h2>
        <p className="text-sm text-slate-300 mb-4">
          Every domain must reach {TH}% with verified evidence before advancing to the subsequent sub-level.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#1e3a5f] mb-5">
          <table className="app-table">
            <thead>
              <tr>
                <th className="py-3 px-4 text-xs font-semibold uppercase text-slate-400">Domain</th>
                <th style={{ width: '40%' }} className="py-3 px-4 text-xs font-semibold uppercase text-slate-400">Progress</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase text-slate-400">Score (%)</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {gateKeys.map((k) => {
                const val = c.gate_scores?.[k] ?? 0;
                const isEditable =
                  k === 'wb'
                    ? canPerform(userRole, 'psy')
                    : k === 'edu' || k === 'skl'
                    ? canPerform(userRole, 'gedu')
                    : canPerform(userRole, 'advance');
                const isMet = val >= TH;

                return (
                  <tr key={k}>
                    <td className="font-semibold text-base text-white py-3.5 px-4">{DOM[k]}</td>
                    <td style={{ width: '40%' }} className="py-3.5 px-4">
                      <div className="bar h-3 rounded-full bg-slate-800">
                        <i
                          className="rounded-full"
                          style={{
                            width: `${val}%`,
                            background: isMet ? 'var(--ok)' : 'var(--bad)',
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isEditable ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) => onUpdateGate(k, Number(e.target.value))}
                          className="w-20 py-1 px-2 border border-[var(--line)] rounded-lg text-base font-semibold text-center bg-[var(--panel)] text-white focus:outline-none focus:border-[#0284c7]"
                        />
                      ) : (
                        <span className="font-semibold text-base text-white">{val}%</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isMet ? (
                        <span className="tag o text-xs font-bold">Met (&ge;{TH}%)</span>
                      ) : (
                        <span className="tag b text-xs font-bold">Pending (&lt;{TH}%)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mb-5 p-3.5 rounded-xl bg-[#0f2744] border border-[#1e3a5f]">
          {missing.length > 0 ? (
            <p className="text-base text-slate-200 flex items-center gap-2">
              <span className="tag b font-bold">Advancement Blocked</span>
              <span>Incomplete gates: <strong className="text-rose-300">{missing.map((k) => DOM[k]).join(', ')}</strong>. Threshold of {TH}% not reached.</span>
            </p>
          ) : (
            <p className="text-base text-slate-200 flex items-center gap-2">
              <span className="tag o font-bold">Ready to Advance</span>
              <span>All 4 rehabilitation domains have verified evidence meeting or exceeding {TH}%.</span>
            </p>
          )}
        </div>

        {/* Not-ready action buttons for authorized officers */}
        {missing.length > 0 && canAdvanceRole && (
          <div className="mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-sm font-medium text-slate-300 block">Recommended Intervention Actions:</span>
            <div className="row">
              {NOT_READY_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="sec text-sm py-1.5 px-3 rounded-lg"
                  onClick={() => onNotReadyAction(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={missing.length > 0 || isLastStage || !canAdvanceRole}
            onClick={onAdvance}
            className="px-6 py-3 bg-[#0079d6] hover:bg-[#0284c7] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#0079d6]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Advance to {isLastStage ? '—' : formatPathwayName(p + 1)}
          </button>
          {!canAdvanceRole && (
            <span className="text-sm text-slate-400">Only the Governing Warden or Executive Administrator can advance a case.</span>
          )}
          {isLastStage && (
            <span className="text-sm text-[#5cc2bd] font-medium">Final stage reached: Prepare and dispatch authenticated parole handover brief.</span>
          )}
        </div>
      </div>
    </div>
  );
};
