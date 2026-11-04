import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, FileSpreadsheet, ShieldCheck, TrendingUp, BookOpen, ClipboardList, X, Play, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { OffenderCase, StaffRole, TabId } from '../types';
import heroImage from '../assets/images/rehab_hero_banner_1792261204190.jpg';
import intakeImage from '../assets/images/education_classroom_1792261680983.jpg';
import pathwayImage from '../assets/images/pathway_milestone_progression.svg';
import reportImage from '../assets/images/parole_handover_secure.svg';
import safetyImage from '../assets/images/clinical_psychometric_telemetry.svg';

interface ExhibitionTourProps {
  cases: OffenderCase[];
  onSelectCase: (id: string) => void;
  onSelectTab: (tab: TabId) => void;
}
type TourStep = {
  title: string;
  description: string;
  kicker: string;
  action: string;
  tab: TabId;
  picture: string;
  pictureAlt: string;
  icon: React.ElementType;
  requiresCase?: boolean;
  allowedRoles?: StaffRole[];
};

const steps: TourStep[] = [
  {
    kicker: '01 / CASE MANAGEMENT',
    title: 'Explore the caseload',
    description: 'Search, compare and filter the cases you are authorized to view. Open any record to explore its rehabilitation pathway.',
    action: 'Open case directory', tab: 'cases', picture: heroImage,
    pictureAlt: 'RehabPath360 case pathway illustration', icon: ClipboardList, requiresCase: true,
  },
  {
    kicker: '02 / DOCUMENT INTAKE',
    title: 'Turn documents into reviewed evidence',
    description: 'See how incoming information is organized and verified by staff before changes are saved to case records.',
    action: 'Explore document intake', tab: 'intake', picture: intakeImage,
    pictureAlt: 'Illustration of a rehabilitation education programme', icon: FileSpreadsheet,
  },
  {
    kicker: '03 / PROGRESSION',
    title: 'See the rehabilitation pathway in motion',
    description: 'Review the domain progress indicators and how a case moves through the four-level progression framework.',
    action: 'View pathway progress', tab: 'prog', picture: pathwayImage,
    pictureAlt: 'Four-level pathway progression illustration', icon: TrendingUp, requiresCase: true,
    allowedRoles: ['Administrator', 'Warden', 'Educator', 'Case Manager', 'Psychologist'],
  },
  {
    kicker: '04 / REPORTING',
    title: 'Bring the case story together',
    description: 'Explore how key case information is summarized for an authorized institutional review.',
    action: 'Open report view', tab: 'rep', picture: reportImage,
    pictureAlt: 'Secure handover and reporting illustration', icon: BookOpen, requiresCase: true,
    allowedRoles: ['Administrator', 'Warden', 'Case Manager', 'Community Rehabilitation Officer'],
  },
  {
    kicker: '05 / SAFEGUARDS',
    title: 'Understand the human safeguards',
    description: 'Learn how role permissions, human approvals and confidential information controls shape the application.',
    action: 'Read system guide', tab: 'guide', picture: safetyImage,
    pictureAlt: 'Protected clinical information visualization', icon: ShieldCheck,
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
  if (!user || !available.length) return null;
  const safeIndex = Math.min(index, available.length - 1);
  const current = available[safeIndex];
  const Icon = current.icon;
  const demo = institution?.is_demo ?? true;
  const goToCurrent = () => {
    if (current.requiresCase) {
      if (!cases.length) return;
      onSelectCase(cases[0].id);
    }
    onSelectTab(current.tab);
  };
  const chooseStep = (next: number) => setIndex(Math.max(0, Math.min(available.length - 1, next)));

  return (
    <section className="tour-shell" aria-label="Guided RehabPath360 feature tour" data-exhibition-tour>
      <div className="tour-header">
        <div className="tour-brand">
          <span className="tour-brand-icon"><Compass size={21} aria-hidden="true" /></span>
          <div>
            <span className="tour-overline">INTERACTIVE WALKTHROUGH</span>
            <h2>{demo ? 'Explore RehabPath360' : 'Explore your workflows'}</h2>
            <p>Discover how the platform works, one feature at a time.</p>
          </div>
        </div>
        <button type="button" className="tour-toggle" aria-expanded={expanded} aria-controls="guided-tour-panel"
          onClick={() => setExpanded(value => !value)}>
          {expanded ? <X size={16} aria-hidden="true"/> : <Play size={16} aria-hidden="true"/>}
          {expanded ? 'Close tour' : 'Start tour'}
        </button>
      </div>

      {expanded && (
        <div className="tour-panel" id="guided-tour-panel">
          <div className="tour-step-nav" role="group" aria-label="Tour chapters">
            {available.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <button type="button" key={step.tab} onClick={() => chooseStep(i)}
                  aria-current={safeIndex === i ? 'step' : undefined}
                  aria-label={`Chapter ${i + 1}: ${step.title}`}
                  className={`tour-chapter ${safeIndex === i ? 'tour-current' : ''}`}>
                  <span className="tour-chapter-icon"><StepIcon size={15} aria-hidden="true"/></span>
                  <span className="tour-chapter-number">{String(i + 1).padStart(2,'0')}</span>
                  {i < safeIndex && <Check className="tour-chapter-check" size={13} aria-hidden="true"/>}
                </button>
              );
            })}
            <div className="tour-progress-rail" aria-hidden="true">
              <span style={{width: `${available.length > 1 ? (safeIndex / (available.length - 1)) * 100 : 100}%`}}/>
            </div>
          </div>

          <div className="tour-feature" key={current.tab} aria-live="polite">
            <div className="tour-feature-copy">
              <div className="tour-feature-icon"><Icon size={19} aria-hidden="true"/></div>
              <span className="tour-kicker">{current.kicker}</span>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
              {current.requiresCase && cases.length === 0 && (
                <div className="tour-warning" role="status">There are no accessible cases yet. You can still explore the guide or intake.</div>
              )}
              <button type="button" className="tour-action" onClick={goToCurrent}
                disabled={Boolean(current.requiresCase && cases.length === 0)}>
                {current.action} <ArrowRight size={17} aria-hidden="true"/>
              </button>
            </div>
            <div className="tour-feature-art" aria-hidden="true">
              <div className="tour-art-glow" />
              <img src={current.picture} alt="" draggable={false} />
              <span className="tour-art-caption">REHABPATH360 <span>· FEATURE {String(safeIndex + 1).padStart(2,'0')}</span></span>
            </div>
          </div>

          <div className="tour-footer">
            <span className="tour-counter"><strong>{String(safeIndex + 1).padStart(2,'0')}</strong> / {String(available.length).padStart(2,'0')} <span>chapters</span></span>
            <div className="tour-controls">
              <button type="button" onClick={() => chooseStep(safeIndex - 1)} disabled={safeIndex === 0} aria-label="Previous chapter">
                <ChevronLeft size={17} aria-hidden="true"/> Previous
              </button>
              <button type="button" onClick={() => chooseStep(safeIndex + 1)} disabled={safeIndex === available.length - 1} aria-label="Next chapter">
                Next <ChevronRight size={17} aria-hidden="true"/>
              </button>
            </div>
            <span className="tour-disclaimer"><ShieldCheck size={14} aria-hidden="true"/> Guided navigation only · Case data unchanged</span>
          </div>
        </div>
      )}
    </section>
  );
};
