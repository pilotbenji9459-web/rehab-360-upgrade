import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Layers,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

import { SecurityPermissionsPage } from './SecurityPermissionsPage';
import progressRingLogo from '../assets/images/rehabpath360_progress_ring_icon.svg';

import heroBannerImg from '../assets/images/rehab_hero_banner_1792261204190.jpg';
import clinicalTelemetryImg from '../assets/images/clinical_psychometric_telemetry.svg';
import tradeMasteryImg from '../assets/images/vocational_trade_mastery_1792261681702.jpg';
import paroleHandoverImg from '../assets/images/parole_handover_secure.svg';
import pathwayMilestoneImg from '../assets/images/pathway_milestone_progression.svg';
import foundationImg from '../assets/images/psych_assessment_1792261204307.jpg';
import developmentImg from '../assets/images/education_classroom_1792261680983.jpg';
import capabilityImg from '../assets/images/vocational_skills_1792261206507.jpg';
import reintegrationImg from '../assets/images/community_reintegration_1792261209316.jpg';
import caseReviewImg from '../assets/images/milestone_gate_review_1792261681316.jpg';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSecurityPage, setShowSecurityPage] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#security'
  );

  // Hash-based navigation gives the permission matrix its own view and
  // supports browser Back/Forward and direct links without server changes.
  useEffect(() => {
    const syncSecurityView = () => setShowSecurityPage(window.location.hash === '#security');
    window.addEventListener('hashchange', syncSecurityView);
    return () => window.removeEventListener('hashchange', syncSecurityView);
  }, []);

  useEffect(() => {
    if (showSecurityPage || window.location.hash === '#home') {
      window.scrollTo(0, 0);
    }
  }, [showSecurityPage]);

  return (
    <div className="min-h-screen bg-[#071325] text-slate-100 font-sans selection:bg-[#0079d6] selection:text-white">
      {/* Compact branded navigation */}
      <header className="sticky top-0 z-40 border-b border-[#20415b] bg-[#08192d]/95 backdrop-blur-xl">
        <nav aria-label="Main navigation" className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="flex min-h-[78px] items-center justify-between gap-1.5 lg:gap-5">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd]" aria-label="REHABPATH360 homepage">
              <img src={progressRingLogo} alt="" aria-hidden="true" className="h-9 w-9 sm:h-12 sm:w-12 shrink-0" />
              <span className="min-w-0">
                <span className="block whitespace-nowrap font-serif text-base sm:text-xl font-bold tracking-tight text-white leading-tight">REHABPATH<span className="text-[#5cc2bd]">360</span></span>
                <span className="hidden sm:block whitespace-nowrap text-[9px] tracking-[0.08em] uppercase font-medium text-slate-400">Rehabilitation Management Platform</span>
              </span>
            </a>
            <div className="hidden xl:flex items-center justify-center gap-1 rounded-full border border-[#28425b] bg-[#10263e] p-1.5 text-[13px] font-semibold text-slate-200">
              {showSecurityPage ? (
                <a href="#home" className="rounded-full px-5 py-2.5 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors">← Back to Homepage</a>
              ) : (
                <>
                  <a href="#features" className="rounded-full px-4 py-2.5 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors">Our 3 Pillars</a>
                  <a href="#framework" className="rounded-full px-4 py-2.5 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors">4-Level Pathway</a>
                  <a href="#security" className="rounded-full px-4 py-2.5 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors">Roles &amp; Permissions</a>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={onOpenLogin} className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0284c7] px-2.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#0284c7]/20 hover:bg-[#0369a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors cursor-pointer">
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Staff Portal Login</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isMobileMenuOpen} aria-controls="homepage-mobile-menu" onClick={() => setIsMobileMenuOpen((prev) => !prev)} className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#28425b] bg-[#10263e] text-slate-100 hover:bg-[#1c3b54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] cursor-pointer">
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div id="homepage-mobile-menu" className="xl:hidden border-t border-[#28425b] pb-4 pt-3 flex flex-col gap-1 text-sm font-semibold text-slate-200">
              {showSecurityPage ? (
                <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-3 hover:bg-[#17304c]">← Back to Homepage</a>
              ) : (
                <>
                  <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-3 hover:bg-[#17304c]">Our 3 Pillars</a>
                  <a href="#framework" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-3 hover:bg-[#17304c]">4-Level Pathway</a>
                  <a href="#security" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-3 hover:bg-[#17304c]">Roles &amp; Permissions</a>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {showSecurityPage ? (
        <SecurityPermissionsPage />
      ) : (
        <>
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#0079d6]/20 to-[#5cc2bd]/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-[#5cc2bd] font-medium mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span>Government-Grade Secure Relational Architecture &amp; Server-Side RBAC</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 font-serif leading-[1.15]">
            Evidence-Based Rehabilitation Tracking &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#5cc2bd]">
              Coordinated Care
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Empower custodial wardens, clinical psychologists, case managers, and educators with structured
            multi-dimensional progress monitoring, explainable AI placement models, and cryptographic handover verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0079d6] to-[#0284c7] hover:from-[#006bbd] hover:to-[#0274b0] text-white font-semibold text-sm shadow-xl shadow-[#0079d6]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Access Staff Portal
              <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href="#framework"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              Explore 4-Level Framework
            </a>
          </div>

          {/* Hero Showcase Illustration */}
          <div className="mt-12 relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-2xl shadow-[#0284c7]/20 group">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a1a33] border-b border-[#1e3a5f] text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-mono text-xs text-slate-300">RehabPath360 · Multi-Disciplinary Case Pathway Planning</span>
              </div>
              <span className="text-xs text-[#5cc2bd] font-medium hidden sm:inline-block">AI Placement Verification Active</span>
            </div>
            <img
              src={heroBannerImg}
              alt="RehabPath360 Case Management and Pathway Planning Dashboard Workspace"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover max-h-[480px] transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto text-left">
            <div className="p-4.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-3xl font-bold text-white font-serif">9 Domains</span>
              <p className="text-sm text-slate-300 mt-1.5 leading-snug">Multi-dimensional matrix covering education, behavior, and wellbeing</p>
            </div>
            <div className="p-4.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-3xl font-bold text-[#5cc2bd] font-serif">70% Gate</span>
              <p className="text-sm text-slate-300 mt-1.5 leading-snug">Strict evidentiary milestone threshold required prior to advancement</p>
            </div>
            <div className="p-4.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-3xl font-bold text-[#38bdf8] font-serif">100% Verified</span>
              <p className="text-sm text-slate-300 mt-1.5 leading-snug">Mandatory human officer verification for all algorithmic suggestions</p>
            </div>
            <div className="p-4.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <span className="text-3xl font-bold text-amber-400 font-serif">AES-256-GCM</span>
              <p className="text-sm text-slate-300 mt-1.5 leading-snug">Client-side authenticated encryption for community parole handover briefs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Domain Showcase */}
      <section id="features" className="py-20 px-6 bg-[#071325] border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold">Comprehensive Intervention Framework</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4 font-serif">
              Three Pillars of Offender Transformation
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Targeting criminogenic needs through coordinated psychological support, vocational skill mastery, and sustained community reintegration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1: Clinical Psychology */}
            <div className="rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] overflow-hidden flex flex-col shadow-lg hover:border-[#5cc2bd]/50 transition-all">
              <div className="h-52 overflow-hidden bg-[#071325] flex items-center justify-center p-2">
                <img
                  src="/assets/images/clinical_psychometric_telemetry.svg"
                  alt="Clinical psychology psychometric telemetry and multi-axis evaluation"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5cc2bd] block mb-2">Domain 1 · Clinical Health</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mb-2.5">Psychological Assessment</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Licensed psychologists administer cognitive behavioral assessments, track mood indices across review cycles, and author protected evaluations with strict least-privilege isolation.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  Protected Clinical Access
                </div>
              </div>
            </div>

            {/* Pillar 2: Vocational Skills */}
            <div className="rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] overflow-hidden flex flex-col shadow-lg hover:border-[#0284c7]/50 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950">
                <img
                  src="/assets/images/vocational_trade_mastery_1792261681702.jpg"
                  alt="Vocational workshop training and accredited technical education"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] block mb-2">Domain 2 · Vocational &amp; Literacy</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mb-2.5">Vocational &amp; Trade Skills</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Offenders earn verified industry credentials (forklift licences, business administration, health &amp; safety), raising vocational capability gates before stage advancement.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Accredited Certification Tracking
                </div>
              </div>
            </div>

            {/* Pillar 3: Community Reintegration */}
            <div className="rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] overflow-hidden flex flex-col shadow-lg hover:border-emerald-500/50 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950">
                <img
                  src="/assets/images/parole_handover_secure.svg"
                  alt="Cryptographic parole handover and community supervision dispatch"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">Domain 3 · Reintegration</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mb-2.5">Community Reintegration</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Parole officers receive AES-256-GCM encrypted transfer briefs, coordinating community housing, healthcare continuity, and family support networks for lasting desistance.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  AES-256 Encrypted Transfer Brief
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Level Framework */}
      <section id="framework" className="py-24 px-6 bg-[#0a1a33]/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold">Structured Rehabilitation</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4 font-serif">The 4-Level Pathway Model</h2>
            <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
              Every individual progresses through distinct evidence-based stages with Sub-levels A, B, and C ensuring granular milestones.
            </p>
          </div>

          {/* Pathway Progression Visual Banner */}
          <div className="mb-12 rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-xl">
            <img
              src="/assets/images/pathway_milestone_progression.svg"
              alt="4-Level Pathway Model illustration: Foundation, Development, Capability, Reintegration"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover max-h-[380px]"
            />
            <div className="p-4 bg-[#071325] border-t border-[#1e3a5f] flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-white tracking-wide">
                Progression Rule: All 4 gate domains (Education, Behavior, Well-being, Skills) must reach &ge; 70% verified evidence before stage advancement.
              </span>
              <span className="text-[#5cc2bd] font-medium font-mono">12 Sub-levels · Human Verified</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-7">
            {/* Level 1: Foundation */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 border-l-4 border-l-emerald-500 overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950 relative">
                <img
                  src="/assets/images/psych_assessment_1792261204307.jpg"
                  alt="Level 1 Foundation: Psychological clinical evaluation and emotional stabilization"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Level 1 · Sub-levels 1A, 1B, 1C
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2 font-serif">Foundation</h3>
                <p className="text-base font-semibold text-emerald-400 mb-2">
                  Objective: Behavioural and emotional foundation
                </p>
                <p className="text-base text-slate-300 leading-relaxed">
                  Focuses on self-awareness, conflict de-escalation, motivation, values, family connections, basic literacy, and clinical mental stabilization.
                </p>
              </div>
            </div>

            {/* Level 2: Development */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 border-l-4 border-l-[#0079d6] overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950 relative">
                <img
                  src="/assets/images/education_classroom_1792261680983.jpg"
                  alt="Level 2 Development: Adult education classroom learning and pro-social capability"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/50 text-[#38bdf8] text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Level 2 · Sub-levels 2A, 2B, 2C
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2 font-serif">Development</h3>
                <p className="text-base font-semibold text-[#38bdf8] mb-2">
                  Objective: Strengthen education &amp; social capability
                </p>
                <p className="text-base text-slate-300 leading-relaxed">
                  Advanced behavioral programmes, communication workshops, collaborative problem-solving groups, family counseling, and vocational exposure.
                </p>
              </div>
            </div>

            {/* Level 3: Capability */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 border-l-4 border-l-purple-500 overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950 relative">
                <img
                  src="/assets/images/vocational_skills_1792261206507.jpg"
                  alt="Level 3 Capability: Vocational trade workshop and certified technical skills"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Level 3 · Sub-levels 3A, 3B, 3C
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2 font-serif">Capability</h3>
                <p className="text-base font-semibold text-purple-300 mb-2">
                  Objective: Independent-life &amp; trade credentials
                </p>
                <p className="text-base text-slate-300 leading-relaxed">
                  Vocational workshop training with accredited certification, digital skills, workplace health &amp; safety, and ongoing psychological resilience.
                </p>
              </div>
            </div>

            {/* Level 4: Reintegration */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 border-l-4 border-l-amber-500 overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950 relative">
                <img
                  src="/assets/images/community_reintegration_1792261209316.jpg"
                  alt="Level 4 Reintegration: Community transition and probation officer handover support"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Level 4 · Sub-levels 4A, 4B, 4C
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2 font-serif">Reintegration</h3>
                <p className="text-base font-semibold text-amber-400 mb-2">
                  Objective: Community transition &amp; employment readiness
                </p>
                <p className="text-base text-slate-300 leading-relaxed">
                  Job interview simulations, CV preparation, community housing referrals, healthcare continuity, and encrypted handover dispatch to probation officers.
                </p>
              </div>
            </div>
          </div>

          {/* Multidisciplinary Case Review Showcase */}
          <div className="mt-14 rounded-2xl bg-gradient-to-r from-[#0b1a30] via-[#0e2444] to-[#11305c] border border-[#1e3a5f] overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 h-72 lg:h-80 overflow-hidden bg-slate-950 w-full shrink-0">
              <img
                src="/assets/images/milestone_gate_review_1792261681316.jpg"
                alt="Multidisciplinary Case Conference Team evaluating offender evidence"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 lg:p-10 flex-1">
              <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold block mb-2">
                Human-in-the-Loop Governance
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-serif">
                Multidisciplinary Case Conferences
              </h3>
              <p className="text-base text-slate-300 leading-relaxed mb-4">
                Before any offender advances through a pathway gate, clinical psychologists, case managers, education officers, and custodial wardens convene. Placement suggestions from explainable algorithms must be confirmed or adjusted with formal rationale recorded in the immutable audit trail.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-lg bg-[#071325]/80 border border-[#1e3a5f] text-xs font-semibold text-white">
                  100% Verified By Staff
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#071325]/80 border border-[#1e3a5f] text-xs font-semibold text-[#5cc2bd]">
                  ≥70% Multi-Domain Evidence
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#071325]/80 border border-[#1e3a5f] text-xs font-semibold text-[#38bdf8]">
                  Zero Black-Box Progression
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 text-center border-t border-slate-800 bg-[#071325]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 font-serif">
            Ready to Evaluate REHABPATH360?
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Access the authenticated staff portal now with pre-provisioned institutional roles to test full-stack persistence,
            AI document reading, and progression gates.
          </p>
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0079d6] to-[#0284c7] hover:from-[#006bbd] hover:to-[#0274b0] text-white font-semibold text-sm shadow-xl shadow-[#0079d6]/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            Open Staff Portal Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
        </>
      )}

      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>REHABPATH360 Institutional Platform · All synthetic demonstration records · Government-Grade Security Standards</p>
      </footer>
    </div>
  );
};
