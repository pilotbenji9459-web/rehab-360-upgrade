import React from 'react';
import { TH, DOM } from '../data/constants';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getDomainMatrix,
  getLowestDomains,
  isRoleRestricted,
} from '../utils/aiLogic';
import { ShieldAlert, CheckCircle2, Clock, Info, Lock } from 'lucide-react';

interface DomainMatrixViewProps {
  currentRecord: OffenderCase;
}

export const DomainMatrixView: React.FC<DomainMatrixViewProps> = ({ currentRecord }) => {
  const { user } = useAuth();
  const c = currentRecord;
  const userRole = user?.role || 'Warden';
  const isRestricted = isRoleRestricted(userRole);

  // Validate assessment completeness and data sufficiency
  const completeness = c.assessment_completeness ?? 0;
  const hasGates = c.gate_scores && typeof c.gate_scores === 'object';
  const isSufficient = completeness >= 50 && hasGates;

  const matrixData = getDomainMatrix(c);
  const lowest = getLowestDomains(c, userRole);
  const priorities = lowest.slice(0, 3).map((x) => x[0]);

  // Missing data diagnosis
  const missingInputs: string[] = [];
  if (!c.education_history) missingInputs.push('Verified Education History');
  if (!c.employment_history) missingInputs.push('Employment History & Skills Record');
  if (c.mental_wellbeing == null) missingInputs.push('Clinical Psychological Intake Assessment');
  if (c.session_attendance == null) missingInputs.push('Session Attendance Telemetry');

  return (
    <div className="space-y-6">
      {/* Domain Matrix Assessment Header */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0b1a30] via-[#0d223d] to-[#0b1a30] border border-[#1e3a5f] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5cc2bd] inline-block" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#5cc2bd]">
                Multi-Dimensional Domain Assessment Matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white m-0">
              {c.first_name} {c.last_name} ({c.id})
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Objective, multi-domain risk-needs-responsivity (RNR) synthesis across operational, vocational, behavioural, and psychological indicators.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-[#071325]/90 border border-[#1e3a5f] text-sm font-semibold text-slate-200">
              Assessment Completeness:{' '}
              <span className={`font-bold font-mono ${completeness >= 70 ? 'text-[#34d399]' : 'text-[#fbbf24]'}`}>
                {completeness}%
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Last Verified: {new Date(c.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {!isSufficient && (
        <div className="card border-amber-500/40 bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-amber-200 text-sm font-bold m-0">
                Assessment Incomplete — Preliminary Domain Synthesis
              </h3>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                The domain matrix requires comprehensive multi-disciplinary intake evidence. Currently at {completeness}% completeness.
                Full predictive weighting will be unlocked when the following data items are recorded:
              </p>
              <ul className="text-xs text-amber-200/90 list-disc list-inside mt-2 space-y-0.5">
                {missingInputs.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Evaluated Domains Matrix */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white m-0">Evaluated Rehabilitation Domains</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified operational scores benchmarked against the 70% progression mandate ({TH}%).
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40 font-mono">
            {matrixData.length} Domains Evaluated
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]">
          <table className="app-table w-full text-left">
            <thead>
              <tr className="bg-[#0f2744] text-slate-300 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Rehabilitation Domain</th>
                <th className="py-3 px-4 font-semibold">Evidence Indicator</th>
                <th className="py-3 px-4 font-semibold text-center w-24">Verified Value</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a5f] text-sm">
              {matrixData.map(([domainName, val, isClinical], i) => {
                const restricted = isClinical && isRestricted;
                const isMet = val >= TH;

                return (
                  <tr key={i} className="hover:bg-[#0f2744]/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      {domainName}
                      {isClinical ? (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
                          Clinical
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-4" style={{ width: '45%' }}>
                      {restricted ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                          <Lock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Restricted (Authorised Clinical Psychologists &amp; Administrator Only)</span>
                        </div>
                      ) : (
                        <div className="bar h-2.5 rounded-full bg-slate-800">
                          <i
                            className="rounded-full"
                            style={{
                              width: `${val}%`,
                              background:
                                val >= TH
                                  ? 'var(--ok)'
                                  : val >= 50
                                  ? 'var(--acc)'
                                  : 'var(--bad)',
                            }}
                          />
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-semibold font-mono text-white">
                      {restricted ? '—' : `${val}%`}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {restricted ? (
                        <span className="tag text-xs font-semibold">Protected</span>
                      ) : isMet ? (
                        <span className="tag o text-xs font-semibold">Standard Met</span>
                      ) : val >= 50 ? (
                        <span className="tag w text-xs font-semibold">In Progress</span>
                      ) : (
                        <span className="tag b text-xs font-semibold">Priority Need</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Priority Focus for Next Review Cycle */}
        <div className="mt-5 p-4 rounded-xl bg-[#0f2744] border border-[#1e3a5f] flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] block mb-1">
              Priority Focus for Next Review Cycle:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {priorities.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-[#071325] border border-[#1e3a5f] text-xs font-semibold text-white shadow-sm"
                >
                  {idx + 1}. {item}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span>Next Case Conference: </span>
            <strong className="text-slate-200">28-Day Periodic Cycle</strong>
          </div>
        </div>

        <p className="mute text-xs mt-3 leading-relaxed">
          Operational Note: Percentages reflect verified evidence milestones registered by authorised officers and verified through human approval.
        </p>
      </div>
    </div>
  );
};
