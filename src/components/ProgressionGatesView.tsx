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
      {/* Visual Level & Sub-level Matrix */}
      <div className="card">
        <h2>
          {c.id}: {formatPathwayName(p)}
        </h2>
        <div className="scroll-container">
          <div className="matrix-grid">
            <div className="h" />
            {SUB.map((s) => (
              <div key={s} className="h text-center font-semibold">
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
        <h2>Gate check for {isLastStage ? 'handover' : 'advancement'}</h2>
        <p className="mute text-xs mb-3">
          Every domain must reach {TH}% with verified evidence before advancing.
        </p>

        <table className="app-table mb-4">
          <thead>
            <tr>
              <th>Domain</th>
              <th style={{ width: '40%' }}>Progress</th>
              <th>Score (%)</th>
              <th>Status</th>
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
                  <td className="font-medium">{DOM[k]}</td>
                  <td style={{ width: '40%' }}>
                    <div className="bar">
                      <i
                        style={{
                          width: `${val}%`,
                          background: isMet ? 'var(--ok)' : 'var(--bad)',
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => onUpdateGate(k, Number(e.target.value))}
                        className="w-16 py-0.5 px-1 border border-[var(--line)] rounded text-sm text-center bg-[var(--panel)]"
                      />
                    ) : (
                      <span className="font-medium">{val}</span>
                    )}
                  </td>
                  <td>
                    {isMet ? (
                      <span className="tag o">Met</span>
                    ) : (
                      <span className="tag b">Not met</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mb-4">
          {missing.length > 0 ? (
            <p className="text-sm">
              <span className="tag b mr-2">Not ready</span>
              Blocked by: {missing.map((k) => DOM[k]).join(', ')}.
            </p>
          ) : (
            <p className="text-sm">
              <span className="tag o mr-2">Ready</span>
              All domains verified.
            </p>
          )}
        </div>

        {/* Not-ready action buttons for authorized officers */}
        {missing.length > 0 && canAdvanceRole && (
          <div className="row mb-3">
            <span className="mute text-sm">If not ready:</span>
            {NOT_READY_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className="sec text-xs"
                onClick={() => onNotReadyAction(action)}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <div className="row items-center gap-3">
          <button
            type="button"
            disabled={missing.length > 0 || isLastStage || !canAdvanceRole}
            onClick={onAdvance}
            className="px-4 py-2 bg-[#0079d6] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
          >
            Advance to {isLastStage ? '—' : formatPathwayName(p + 1)}
          </button>
          {!canAdvanceRole && (
            <span className="mute text-xs">Only the Facility Warden or Administrator can advance a case.</span>
          )}
          {isLastStage && (
            <span className="mute text-xs">Final stage reached: prepare a parole handover brief.</span>
          )}
        </div>
      </div>
    </div>
  );
};
