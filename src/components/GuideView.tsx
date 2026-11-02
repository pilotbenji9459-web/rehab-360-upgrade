import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { GLOSSARY, PROCESS_STEPS, LEVEL_FRAMEWORK } from '../data/constants';
import { ShieldCheck, Layers, BookOpen, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

import blueprintImg from '../assets/images/guide_operational_blueprint.svg';
import pathwayProgressionImg from '../assets/images/pathway_progression_1792261207526.jpg';
import heroBannerImg from '../assets/images/rehab_hero_banner_1792261204190.jpg';
import psychAssessmentImg from '../assets/images/psych_assessment_1792261204307.jpg';
import educationImg from '../assets/images/education_classroom_1792261680983.jpg';
import vocationalImg from '../assets/images/vocational_skills_1792261206507.jpg';
import communityImg from '../assets/images/community_reintegration_1792261209316.jpg';
import caseReviewImg from '../assets/images/milestone_gate_review_1792261681316.jpg';

export const GuideView: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGlossary = GLOSSARY.filter(([term, def]) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return term.toLowerCase().includes(q) || def.toLowerCase().includes(q);
  });

  const levelFrameworkCards = [
    {
      levelNumber: 1,
      name: 'Level 1: Foundation',
      color: '#2e9b5a',
      domain: 'Clinical & Behavioural Stabilization',
      objective: 'Behavioural and emotional foundation',
      description: 'Focuses on self-awareness, conflict de-escalation, motivation, values, family connections, basic literacy, and clinical mental stabilization.',
      image: psychAssessmentImg,
      alt: 'Level 1 Foundation: Psychological clinical evaluation and emotional stabilization',
    },
    {
      levelNumber: 2,
      name: 'Level 2: Development',
      color: '#0079d6',
      domain: 'Education & Pro-Social Skills',
      objective: 'Strengthen education & social capability',
      description: 'Advanced behavioral programmes, communication workshops, collaborative problem-solving groups, family counseling, and vocational exposure.',
      image: educationImg,
      alt: 'Level 2 Development: Adult education classroom learning and pro-social capability',
    },
    {
      levelNumber: 3,
      name: 'Level 3: Capability',
      color: '#8a4fff',
      domain: 'Vocational & Trade Certification',
      objective: 'Independent-life & trade credentials',
      description: 'Vocational workshop training with accredited certification, digital skills, workplace health & safety, and ongoing psychological resilience.',
      image: vocationalImg,
      alt: 'Level 3 Capability: Vocational workshop, trade skills, and practical training',
    },
    {
      levelNumber: 4,
      name: 'Level 4: Reintegration',
      color: '#ff7a3d',
      domain: 'Community Re-entry & Parole Transition',
      objective: 'Community transition & employment readiness',
      description: 'Job interview simulations, CV preparation, community housing referrals, healthcare continuity, and encrypted handover dispatch to probation officers.',
      image: communityImg,
      alt: 'Level 4 Reintegration: Community support, employment readiness, and parole handover',
    },
  ];

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Overview Card with Visual Banner */}
      <div className="card overflow-hidden p-0">
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-slate-950">
          <img
            src={blueprintImg}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = heroBannerImg;
            }}
            alt="RehabPath360 Educational and Operational Blueprint"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-[#0b1a30]/60 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#5cc2bd] block mb-1">
              Educational &amp; Operational Blueprint
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white m-0 tracking-tight">
              How RehabPath360 Works
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#0f2744] border border-[#1e3a5f] text-sm sm:text-base font-semibold text-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[#38bdf8]">Assess</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-[#38bdf8]">Analyse</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-[#5cc2bd]">Recommend</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-emerald-400 font-bold">Human Verify</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-slate-200">Implement</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-slate-200">Measure</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-amber-400">Reassess &amp; Adapt</span>
          </div>

          <p className="text-base text-slate-300 leading-relaxed">
            RehabPath360 operationalizes a closed-loop rehabilitation framework. Algorithms assist officers by synthesizing
            intake documents, attendance patterns, and psychometrics into placement suggestions. Crucially, algorithms never
            make custodial or progression decisions unilaterally—every progression requires human sign-off from authorized
            wardens and clinicians.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="tag">AES-256-GCM Handover</span>
            <span className="tag o">100% Human-in-the-Loop</span>
            <span className="tag">Row-Level Tenancy</span>
            <span className="tag w">70% Evidence Threshold</span>
            <span className="tag">Protected Clinical Separation</span>
          </div>
        </div>
      </div>

      {/* The 4-Level Framework with Progression Graphic */}
      <div className="card space-y-5">
        <div>
          <h2>The Four Progressive Pathway Levels</h2>
          <p className="text-base text-slate-300 leading-relaxed">
            Offenders transition sequentially across 4 distinct developmental tiers, spanning 12 granular sub-levels (A, B, C)
            to eliminate arbitrary advancement and ensure verifiable readiness for life outside custody.
          </p>
        </div>

        {/* Milestone Pathway Graphic */}
        <div className="rounded-xl overflow-hidden border border-[#1e3a5f] bg-[#071325]">
          <img
            src={pathwayProgressionImg}
            alt="Rehabilitation 4-level pathway milestone roadmap"
            className="w-full h-auto object-cover max-h-[320px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {levelFrameworkCards.map((card) => {
            return (
              <div
                key={card.name}
                className="rounded-xl bg-[#0f2744] border border-[#1e3a5f] overflow-hidden flex flex-col justify-between"
                style={{ borderLeft: `5px solid ${card.color}` }}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Level {card.levelNumber}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[#5cc2bd] font-medium">
                      {card.domain}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-white">{card.name}</h3>

                  <div className="rounded-lg overflow-hidden h-44 bg-slate-950 border border-[#1e3a5f]/60">
                    <img
                      src={card.image}
                      alt={card.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-base text-slate-200">
                    <strong className="text-white">Objective:</strong> {card.objective}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The 15-Step Process */}
      <div className="card space-y-5">
        <div>
          <h2>The 15-Step Clinical &amp; Custodial Process</h2>
          <p className="text-base text-slate-300 leading-relaxed">
            Step-by-step workflow detailing how data enters the system, is audited, reviewed, verified, and safely handed over across multidisciplinary teams.
          </p>
        </div>

        {/* Case Conference Review Visual Banner */}
        <div className="rounded-xl overflow-hidden border border-[#1e3a5f] bg-[#071325] flex flex-col md:flex-row items-stretch">
          <div className="md:w-5/12 h-48 md:h-auto overflow-hidden bg-slate-950 shrink-0">
            <img
              src={caseReviewImg}
              alt="Multidisciplinary case conference evaluating offender milestone progress"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 md:p-6 flex-1 flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5cc2bd] block mb-1">
              Step 8 Highlight · Multidisciplinary Case Conference
            </span>
            <h3 className="text-xl font-bold font-serif text-white mb-2">
              Human-in-the-Loop Verifications
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every 28-day review cycle convenes facility wardens, clinical psychologists, case managers, and educators. Algorithmic outputs are scrutinized against qualitative behaviour logs, psychological evaluations, and attendance records before any progression gate is certified.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#38bdf8]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified under Section 7 Institutional Safeguards</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]">
          <table className="app-table">
            <thead>
              <tr>
                <th className="w-20 text-center">Step</th>
                <th>Rehabilitation Milestone &amp; Workflow Action</th>
                <th className="w-1/3">Corresponding System Module</th>
              </tr>
            </thead>
            <tbody>
              {PROCESS_STEPS.map(([whatHappens, location], idx) => (
                <tr key={idx} className="hover:bg-[#143258]/50 transition-colors">
                  <td className="font-bold text-center text-sm text-[#5cc2bd]">#{idx + 1}</td>
                  <td className="text-base font-medium text-slate-100">{whatHappens}</td>
                  <td className="text-sm text-[#38bdf8] font-medium">{location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glossary */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2>Rehabilitation Glossary &amp; Standards</h2>
            <p className="text-base text-slate-300">
              Clear definitions of correctional terminology, algorithmic criteria, and compliance protocols.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search terms (e.g. RBAC)..."
              aria-label="Search glossary"
              className="w-full text-base rounded-lg border border-[var(--line)] py-2 pl-9 pr-3 bg-[var(--panel)] text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]">
          <table className="app-table">
            <thead>
              <tr>
                <th className="w-1/3">Term / Standard</th>
                <th>Definition &amp; Operational Significance</th>
              </tr>
            </thead>
            <tbody>
              {filteredGlossary.map(([term, def]) => (
                <tr key={term} className="hover:bg-[#143258]/50 transition-colors">
                  <td className="font-bold text-base text-[#5cc2bd]">{term}</td>
                  <td className="text-base text-slate-200 leading-relaxed">{def}</td>
                </tr>
              ))}
              {filteredGlossary.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-base text-slate-400">
                    No matching terms found for "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
