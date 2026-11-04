import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Play, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { OffenderCase, StaffRole, TabId } from '../types';

interface ExhibitionTourProps {
  cases: OffenderCase[];
  onSelectCase: (id: string) => void;
  onSelectTab: (tab: TabId) => void;
}

type TourStep = {
  title: string;
  description: string;
  action: string;
  tab: TabId;
  requiresCase?: boolean;
  allowedRoles?: StaffRole[];
};

const steps: TourStep[] = [
  {
    title: 'Explore the caseload',
    description: 'Try searching, filtering and sorting real-time entries. Choose any case to explore its rehabilitation pathway.',
    action: 'Explore case directory',
    tab: 'cases',
    requiresCase: true,
  },
  {
    title: 'See evidence intake',
    description: 'Explore how Word, spreadsheet and PDF submissions are reviewed before staff accept changes into a record.',
    action: 'Visit document intake',
    tab: 'intake',
  },
  {
    title: 'Track programme milestones',
    description: 'Open the role-authorized progression view to examine the four evaluated domains and stage checkpoints.',
    action: 'View progression',
    tab: 'prog',
    requiresCase: true,
    allowedRoles: ['Administrator', 'Warden', 'Educator', 'Case Manager', 'Psychologist'],
  },
  {
    title: 'View a rehabilitation report',
    description: 'See how case information is organized for an institutional review. Demo navigation does not export data.',
    action: 'Open report view',
    tab: 'rep',
    requiresCase: true,
    allowedRoles: ['Administrator', 'Warden', 'Case Manager', 'Community Rehabilitation Officer'],
  },
  {
    title: 'Learn the safeguards',
    description: 'Show the human-review workflow, role permissions and the four-level pathway explained in the guide.',
    action: 'Open system guide',
    tab: 'guide',
  },
];

export const ExhibitionTour: React.FC<ExhibitionTourProps> = ({ cases, onSelectCase, onSelectTab }) => {
  const { user, institution } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [index, setIndex] = useState(0);

  const available = useMemo(
    () => steps.filter(step => !step.allowedRoles || Boolean(user && step.allowedRoles.includes(user.role))),
    [user?.role]
  );
  const current = available[Math.min(index, available.length - 1)] || available[0];
  if (!user || !current) return null;

  const isDemo = institution?.is_demo ?? true;
  const goToCurrent = () => {
    if (current.requiresCase) {
      const target = cases[0];
      if (!target) return;
      onSelectCase(target.id);
    }
    onSelectTab(current.tab);
  };

  return (
    <section aria-label="Guided workflow tour" className="rounded-2xl border border-[#31516e] bg-gradient-to-r from-[#0c2841] to-[#0b1a30] overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl border border-[#2b6681] bg-[#16425b] p-2.5 shrink-0">
            <Compass className="w-5 h-5 text-[#5cc2bd]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-white">
              {isDemo ? 'Explore RehabPath360 — guided exhibition tour' : 'Explore RehabPath360 workflows'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">Choose a feature and explore it at your own pace. Your case data stays unchanged.</p>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="workflow-tour-steps"
          className="rounded-xl bg-[#0369a1] hover:bg-[#0284c7] border border-[#38bdf8]/30 px-4 py-2.5 text-sm font-semibold text-white flex items-center gap-2 transition-colors">
          {expanded ? <X className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
          {expanded ? 'Close tour' : 'Start interactive tour'}
        </button>
      </div>

      {expanded && (
        <div id="workflow-tour-steps" className="border-t border-[#31516e] px-4 py-5 sm:px-6 space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose tour step">
            {available.map((step, i) => (
              <button key={step.tab} type="button" onClick={() => setIndex(i)} aria-current={index === i ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${step.title}`}
                className={`min-w-9 rounded-full px-3 py-2 text-xs font-bold border transition-colors ${index === i ? 'bg-[#0369a1] border-[#7dd3fc] text-white' : 'bg-[#10263e] border-[#31516e] text-slate-200 hover:bg-[#173653]'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="rounded-xl bg-[#08192d] border border-[#28425b] p-4">
            <p className="text-xs text-[#7dd3fc] font-semibold uppercase tracking-wider">Step {index + 1} of {available.length}</p>
            <h3 className="text-white font-semibold text-base sm:text-lg mt-1">{current.title}</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{current.description}</p>
            {current.requiresCase && cases.length === 0 && (
              <p className="text-amber-300 text-xs mt-2" role="status">No cases are available yet. You can still visit the guide or intake centre.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIndex(i => Math.max(0,i - 1))} disabled={index === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#31516e] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button type="button" onClick={() => setIndex(i => Math.min(available.length - 1,i + 1))} disabled={index === available.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#31516e] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ChevronRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={goToCurrent} disabled={Boolean(current.requiresCase && cases.length === 0)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#0369a1] hover:bg-[#0284c7] px-4 py-2 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed">
              {current.action} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Guided navigation only — no automatic writes or approvals.</p>
        </div>
      )}
    </section>
  );
};
