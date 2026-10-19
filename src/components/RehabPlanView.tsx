import React, { useState } from 'react';
import { PROGRAMMES } from '../data/constants';
import { OffenderCase } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getOffenderPos,
  formatPathwayName,
  getLowestDomains,
  getNextReviewDate,
  canPerform,
} from '../utils/aiLogic';
import { Calendar, Target, HeartHandshake, ShieldCheck } from 'lucide-react';

interface RehabPlanViewProps {
  currentRecord: OffenderCase;
  onAddRemark: (remark: string) => void;
  showAlert: (msg: string, title?: string) => void;
}

export const RehabPlanView: React.FC<RehabPlanViewProps> = ({
  currentRecord,
  onAddRemark,
  showAlert,
}) => {
  const { user } = useAuth();
  const c = currentRecord;
  const p = getOffenderPos(c);
  const [remarkInput, setRemarkInput] = useState('');

  if (p == null) {
    return (
      <div className="card">
        <div className="note-box text-base">
          Verify the placement first. The rehabilitation plan is built from the verified level.
        </div>
      </div>
    );
  }

  const userRole = user?.role || 'Warden';
  const lowest = getLowestDomains(c, userRole);
  const nextDate = getNextReviewDate();
  const remarks = c.rehabilitation_remarks || [];
  const canDecide = canPerform(userRole, 'decide') || userRole === 'Case Manager';

  // Contextual visual banner matching current stage
  const stageVisual =
    p <= 2
      ? {
          img: '/assets/images/psych_assessment_1792261204307.jpg',
          title: 'Level 1: Foundation & Emotional Stabilization',
          desc: 'Targeting behavioural self-awareness, cognitive reframing, emotional stabilization, and basic literacy.',
        }
      : p <= 5
      ? {
          img: '/assets/images/education_classroom_1792261680983.jpg',
          title: 'Level 2: Development & Social Capability',
          desc: 'Targeting adult literacy, numeracy, communication workshops, and collaborative problem-solving groups.',
        }
      : p <= 8
      ? {
          img: '/assets/images/vocational_trade_mastery_1792261681702.jpg',
          title: 'Level 3: Trade & Vocational Capability',
          desc: 'Targeting accredited trade qualifications, digital literacy, and workplace health and safety certifications.',
        }
      : {
          img: '/assets/images/community_reintegration_1792261209316.jpg',
          title: 'Level 4: Community Reintegration & Parole Handover',
          desc: 'Targeting post-release employment readiness, community housing, and encrypted brief handover to probation officers.',
        };

  const handleSaveRemark = () => {
    const trimmed = remarkInput.trim();
    if (!trimmed) {
      showAlert('Type a remark first.', 'Validation');
      return;
    }
    onAddRemark(trimmed);
    setRemarkInput('');
  };

  return (
    <div className="space-y-6">
      {/* Contextual Visual Banner for Active Stage */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl flex flex-col md:flex-row items-stretch">
        <div className="md:w-1/3 h-52 md:h-auto overflow-hidden bg-slate-950 shrink-0">
          <img
            src={stageVisual.img}
            alt={stageVisual.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40 uppercase tracking-wider">
                Stage {p} Active Placement
              </span>
              <span className="text-xs text-slate-400 font-mono">Case {c.id}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
              {stageVisual.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              {stageVisual.desc}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e3a5f] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-[#5cc2bd]">
              <ShieldCheck className="w-4 h-4" />
              Pathway verified: {formatPathwayName(p)}
            </span>
            <span className="font-mono text-slate-400">Next review cycle: {nextDate}</span>
          </div>
        </div>
      </div>

      {/* Structured Milestone Roadmap Banner */}
      <div className="rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
        <img
          src="/assets/images/rehab_stage_planning.svg"
          alt="12-Month individualized rehabilitation trajectory and milestone roadmap"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-cover max-h-[300px]"
        />
      </div>

      <div className="card space-y-4">
        <h2>Rehabilitation Plan: {c.first_name} {c.last_name} ({c.id})</h2>

        <div className="grid-layout">
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-white">
              <Target className="w-4.5 h-4.5 text-[#38bdf8]" />
              Programme Modules &amp; Target Goals
            </h3>
            <ul className="app-list text-base space-y-2 text-slate-200">
              {lowest.slice(0, 3).map((x, i) => (
                <li key={i} className="leading-relaxed">
                  <strong className="text-white">{PROGRAMMES[x[0]] ?? x[0]}</strong>: Lift {x[0].toLowerCase()} from{' '}
                  <span className="text-[#38bdf8] font-semibold">{x[1]}%</span> to{' '}
                  <span className="text-emerald-400 font-semibold">{Math.min(100, x[1] + 15)}%</span> by next cycle review.
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-white">
              <HeartHandshake className="w-4.5 h-4.5 text-[#5cc2bd]" />
              Support Needs &amp; Interventions
            </h3>
            <ul className="app-list text-base space-y-2 text-slate-200">
              <li className="leading-relaxed">
                {lowest[0][1] < 50 ? 'Weekly' : 'Fortnightly'} individual key-worker check-in session
              </li>
              {c.session_attendance < 70 && (
                <li className="leading-relaxed text-amber-300">
                  Attendance barrier review: currently at {c.session_attendance}% (target: 75%+)
                </li>
              )}
              {c.education_level <= 2 && (
                <li className="leading-relaxed">Dedicated literacy &amp; numeracy support assistant</li>
              )}
              {c.support_network <= 2 && (
                <li className="leading-relaxed">Family contact facilitation &amp; social visits support</li>
              )}
            </ul>

            <div className="pt-2">
              <h3 className="flex items-center gap-2 text-white mb-1">
                <Calendar className="w-4 h-4 text-amber-400" />
                Review Timeline
              </h3>
              <p className="text-base text-slate-300">
                Scheduled review evaluation: <b className="text-white">{nextDate}</b>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h3>Professional Remarks &amp; Behavioral Conditions</h3>
        <ul className="app-list text-base mb-4 space-y-1.5 text-slate-200">
          {remarks.length ? (
            remarks.map((r, i) => (
              <li key={i} className="leading-relaxed bg-[#0f2744] p-3 rounded-lg border border-[#1e3a5f]/80">
                {r}
              </li>
            ))
          ) : (
            <li className="mute text-base">No remarks recorded yet for this case profile.</li>
          )}
        </ul>

        {canDecide ? (
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-slate-300">Add Authorized Officer Remark:</label>
            <textarea
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              rows={3}
              placeholder="Record a professional behavioral observation, custodial recommendation, or conditions for advancement..."
              className="w-full text-base rounded-xl border border-[var(--line)] p-3 bg-[var(--panel)] text-white focus:outline-none focus:border-[#0284c7]"
            />
            <button type="button" onClick={handleSaveRemark} className="mt-1">
              Save Case Remark
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Authorized case managers, wardens, and administrators may append remarks to this case file.
          </p>
        )}
      </div>
    </div>
  );
};
