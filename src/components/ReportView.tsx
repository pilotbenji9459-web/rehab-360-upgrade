import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { DOM, PROFILES } from '../data/constants';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getOffenderPos,
  formatPathwayName,
  getLowestDomains,
  getDomainMatrix,
  getMissingGates,
  getNextReviewDate,
} from '../utils/aiLogic';
import { Printer, Download } from 'lucide-react';

interface ReportViewProps {
  currentRecord: OffenderCase;
  showAlert: (msg: string, title?: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ currentRecord, showAlert }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const c = currentRecord;
  const userRole = user?.role || 'Warden';
  const p = getOffenderPos(c);
  const l = getLowestDomains(c, userRole);
  const d = getDomainMatrix(c);
  const hi = [...l].reverse().slice(0, 2);
  const g = getMissingGates(c);

  const avgAcrossDomains = Math.round(
    d.reduce((acc, curr) => acc + (curr[1] as number), 0) / 9
  );

  const L = [
    'Individual profile',
    'Initial assessment',
    'Multi-dimensional assessment',
    'Identified needs',
    'Strengths',
    'Current rehabilitation level',
    'Programmes completed',
    'Progress graphs',
    'Areas requiring additional support',
    'AI-generated pathway options',
    'Professional decision',
    'Professional remarks',
    'Next review date',
    'Recommended next stage',
    'Reintegration preparation',
  ];

  const profile = PROFILES[c.id] || [c.age_band || 'Adult'];
  const allRemarks = (c.rehabilitation_remarks || []).concat(c.decision_reason ? [c.decision_reason] : []).join('; ') || 'None recorded';
  const scoreHistory = c.score_history || [50, 50, 50, 50, 50];

  const nextStage =
    p == null
      ? 'Verify placement first'
      : p === 11
      ? 'Prepare handover brief'
      : formatPathwayName(p + 1);

  const X = [
    `${c.first_name} ${c.last_name} (${c.id}) · ${profile[0]}`,
    `Assessment ${c.assessment_completeness}% complete`,
    `Average across 9 domains: ${avgAcrossDomains}%`,
    l.slice(0, 3).map((x) => x[0]).join(', '),
    hi.map((x) => x[0]).join(', '),
    formatPathwayName(p),
    c.certifications.join('; ') || 'None recorded yet',
    `Placement score ${scoreHistory[0]} → ${scoreHistory[4]} over 5 review cycles`,
    g.length ? g.map((k) => DOM[k]).join(', ') : 'None. All gate thresholds met',
    `Priority-first: ${l[0]?.[0] || 'Intervention'}, ${l[1]?.[0] || 'Skills'}`,
    c.decision ? `${c.decision} by authorized officer` : 'Pending verification',
    allRemarks,
    getNextReviewDate(),
    nextStage,
    `${d[8][1]}% readiness benchmark`,
  ];

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      showAlert('Printing is not available in this environment.');
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('rehabpath360_auth_token');
    window.location.href = `/api/reports/export-csv${token ? `?token=${token}` : ''}`;
  };

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2>{t('reports')}  {c.id}</h2>
          <p className="mute text-xs">
            Comprehensive 15-section institutional dossier for case reviews and parole hearings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-[#0079d6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="sec text-xs px-3.5 py-1.5 flex items-center gap-1.5 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Caseload CSV</span>
          </button>
        </div>
      </div>

      <table className="app-table text-xs">
        <tbody>
          {L.map((title, i) => (
            <tr key={i}>
              <td className="w-1/3 font-semibold text-[var(--ink)]">
                {i + 1}. {title}
              </td>
              <td className="w-2/3 leading-relaxed">{X[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
