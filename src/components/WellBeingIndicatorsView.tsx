import React from 'react';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import { canPerform, getFlagsOf } from '../utils/aiLogic';

interface WellBeingIndicatorsViewProps {
  cases: OffenderCase[];
  onLogReview: (caseId: string) => void;
}

export const WellBeingIndicatorsView: React.FC<WellBeingIndicatorsViewProps> = ({
  cases,
  onLogReview,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'Warden';

  if (!canPerform(userRole, 'psy')) {
    return (
      <div className="card">
        <div className="note-box text-xs">
          Clinical Indicator Access Restricted: In accordance with clinical privacy protocols, mental health indicators are restricted to licensed Psychologists and Executive Administrators.
        </div>
      </div>
    );
  }

  const casesWithFlags = cases
    .map((record) => ({ record, flags: getFlagsOf(record) }))
    .filter((item) => item.flags.length > 0);

  return (
    <div className="space-y-6">
      {/* Longitudinal Well-Being Telemetry Visual Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-950">
          <img
            src="/assets/images/wellbeing_trend_analytics.svg"
            alt="Longitudinal psychometric trajectory and emotional stabilization analytics"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-transparent to-transparent" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/50 text-xs font-mono text-[#5cc2bd] backdrop-blur-sm">
            PSYCHOMETRIC TRACKING · 5 REVIEW CYCLES
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{"Well-being"}</h2>
      <div className="note-box mb-4 text-xs">
        These are automated, rule-based screening flags generated from self-reports, psychometrics, and attendance patterns. They suggest individuals who may benefit from a psychologist's attention. They are not clinical diagnoses.
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]">
        <table className="app-table">
          <thead>
            <tr>
              <th className="w-24">Record</th>
              <th>Individual &amp; Severity</th>
              <th>Screening Indicators</th>
              <th className="w-32 text-right">Clinical Action</th>
            </tr>
          </thead>
          <tbody>
            {casesWithFlags.map(({ record, flags }) => (
              <tr key={record.id}>
                <td className="font-semibold text-xs text-[#0079d6]">{record.id}</td>
                <td className="text-xs">
                  {record.first_name} {record.last_name}
                  <span className="block text-[10px] text-[var(--mute)]">
                    Severity {record.crime_severity}/5 · {record.age_band}
                  </span>
                </td>
                <td>
                  <ul className="app-list text-xs space-y-1">
                    {flags.map((flag, idx) => (
                      <li key={idx} className="text-amber-800 dark:text-amber-300 font-medium">
                        {flag}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="text-right">
                  {userRole === 'Psychologist' ? (
                    <button
                      type="button"
                      className="sec text-xs px-2.5 py-1"
                      onClick={() => onLogReview(record.id)}
                    >
                      Log Review
                    </button>
                  ) : (
                    <span className="mute text-xs">Psychologist reviews</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
};
