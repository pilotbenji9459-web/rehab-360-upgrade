import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Target,
  CheckCircle2,
  Sparkles,
  Zap,
  Brain,
  GraduationCap,
  Wrench,
  Home,
  Gauge,
  Activity,
  BarChart3,
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
  onEnterPortal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onEnterPortal }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSecurityPage, setShowSecurityPage] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#security'
  );

  // Roles is a separate view, not a scroll target on the homepage.
  // React must respond when a hash link is clicked (including browser Back).
  useEffect(() => {
    const syncPageWithHash = () => {
      const isRolesPage = window.location.hash === '#security';
      setShowSecurityPage(isRolesPage);
      if (isRolesPage || window.location.hash === '#home') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('hashchange', syncPageWithHash);
    syncPageWithHash();
    return () => window.removeEventListener('hashchange', syncPageWithHash);
  }, []);

  // Trading card state & animation hooks
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const frameworkSectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer for scroll-triggered entrance
  useEffect(() => {
    const el = frameworkSectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCardsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setCardsRevealed(true);
          observer.disconnect(); // Avoid replaying on minor scrolls
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Subtle interactive 3D perspective tilt on desktop hover
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    // Only perform 3D tilt on devices that support hover (not mobile touch screens)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    const wrapper = cardRefs.current[idx];
    if (!wrapper) return;

    const card = wrapper.querySelector('.trading-card') as HTMLElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleCardMouseLeave = useCallback((idx: number) => {
    const wrapper = cardRefs.current[idx];
    if (!wrapper) return;
    const card = wrapper.querySelector('.trading-card') as HTMLElement;
    if (!card) return;
    card.style.transform = '';
  }, []);

  return (
    <div id="home" data-motion-scope="landing" className="min-h-screen min-w-0 max-w-full overflow-x-clip bg-[#071325] text-slate-100 font-sans selection:bg-[#0079d6] selection:text-white">
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
            <div className="hidden xl:flex flex-1 max-w-[650px] items-center justify-between gap-1 rounded-full border border-[#28425b] bg-[#10263e] p-2 text-sm font-semibold text-slate-200">
              {showSecurityPage ? (
                <a href="#home" className="flex-1 text-center whitespace-nowrap rounded-full px-5 py-3 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors">← Back to Homepage</a>
              ) : (
                <>
                  <a href="#features" className="flex-1 text-center whitespace-nowrap rounded-full px-3 py-3 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors" >Pillars</a>
                  <a href="#framework" className="flex-1 text-center whitespace-nowrap rounded-full px-3 py-3 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors" >Pathway</a>
                  <a href="#security" className="flex-1 text-center whitespace-nowrap rounded-full px-3 py-3 hover:bg-[#1c3b54] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors" >Roles</a>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={onOpenLogin} className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0284c7] px-2.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#0284c7]/20 hover:bg-[#0369a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5cc2bd] transition-colors cursor-pointer">
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline" >Staff Login</span>
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
          <div className="reveal-feature mt-12 relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-2xl shadow-[#0284c7]/20 group">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a1a33] border-b border-[#1e3a5f] text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-mono text-xs text-slate-300">RehabPath360 · Multi-Disciplinary Case Pathway Planning</span>
              </div>
              <span className="text-xs text-[#5cc2bd] font-medium hidden sm:inline-block">AI Placement Verification Active</span>
            </div>
            <img fetchPriority="high" decoding="async"
              src={heroBannerImg}
              alt="RehabPath360 Case Management and Pathway Planning Dashboard Workspace"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover max-h-[480px] transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto text-left">
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
            <div className="reveal-feature rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] overflow-hidden flex flex-col shadow-lg hover:border-[#5cc2bd]/50 transition-all">
              <div className="h-52 overflow-hidden bg-[#071325] flex items-center justify-center p-2">
                <img loading="lazy" decoding="async"
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
            <div className="reveal-feature rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] overflow-hidden flex flex-col shadow-lg hover:border-[#0284c7]/50 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950">
                <img loading="lazy" decoding="async"
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
            <div className="reveal-feature rounded-2xl bg-[#0b1a30] border border-[#1e3a5f] overflow-hidden flex flex-col shadow-lg hover:border-emerald-500/50 transition-all">
              <div className="h-52 overflow-hidden bg-slate-950">
                <img loading="lazy" decoding="async"
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

      {/* 4-Level Framework — Animated Specification Trading Cards */}
      <section
        id="framework"
        ref={frameworkSectionRef}
        className="py-24 px-4 sm:px-6 bg-gradient-to-b from-[#071325] via-[#091b34] to-[#071325] border-t border-slate-800 relative overflow-hidden"
      >
        {/* Ambient atmospheric backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-gradient-to-tr from-[#0284c7]/15 via-[#5cc2bd]/10 to-[#818cf8]/15 blur-[160px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-[#5cc2bd] font-medium mb-3 backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-[#5cc2bd] animate-pulse" />
              <span className="tracking-wider uppercase font-semibold">4-Level Progression System</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-1 mb-4 font-serif tracking-tight">
              Rehabilitation Pathway Specification
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-light">
              Four verified milestone tiers engineered for measurable cognitive transformation, technical trade mastery, and sustainable community desistance.
            </p>
          </div>

          {/* Pathway Progression Visual Banner */}
          <div className="mb-14 rounded-2xl overflow-hidden border border-[#1e3a5f] bg-[#0b1a30] shadow-2xl transition-all duration-300 hover:border-[#5cc2bd]/50">
            <img loading="lazy" decoding="async"
              src={pathwayMilestoneImg}
              alt="4-Level Pathway Model illustration: Foundation, Development, Capability, Reintegration"
              referrerPolicy="no-referrer"
              className="block w-full h-auto object-contain max-h-[420px] bg-[#071325]"
            />
            <div className="p-4 sm:p-5 bg-[#071325] border-t border-[#1e3a5f] flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-white tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5cc2bd]" />
                Progression Mandate: All 4 gate domains (Education, Behavior, Well-being, Skills) must reach &ge; 70% verified evidence before stage elevation.
              </span>
              <span className="px-3 py-1 rounded-full bg-[#10263e] border border-[#28425b] text-[#5cc2bd] font-medium font-mono text-[11px]">
                12 Sub-levels · Multidisciplinary Sign-off
              </span>
            </div>
          </div>

          {/* Collectible Trading Cards Grid */}
          <div
            className={`trading-cards-stage grid sm:grid-cols-2 gap-8 lg:gap-10 ${
              cardsRevealed ? 'trading-cards-revealed' : ''
            }`}
          >
            {/* LEVEL CARD 01: FOUNDATION */}
            <div
              className="trading-card-wrapper trading-card-entry"
              data-index="0"
              onMouseMove={(e) => handleCardMouseMove(e, 0)}
              onMouseLeave={() => handleCardMouseLeave(0)}
              ref={(el) => { cardRefs.current[0] = el; }}
            >
              <div className="trading-card spec-card-level-1 trading-card-carbon border border-emerald-500/30 flex flex-col h-full group">
                <div className="trading-card-glare" />

                {/* Card Top Foil / Spec Header */}
                <div className="p-4 sm:p-5 pb-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400 font-bold">
                      PATHWAY SPEC // LVL-01
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold tracking-widest">
                      1A · 1B · 1C
                    </span>
                  </div>
                </div>

                {/* Card Visual Spec Window */}
                <div className="h-56 overflow-hidden bg-slate-950 relative border-b border-emerald-500/20">
                  <img loading="lazy" decoding="async"
                    src="/assets/images/psych_assessment_1792261204307.jpg"
                    alt="Level 1 Foundation: Psychological clinical evaluation and emotional stabilization"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081424] via-transparent to-transparent opacity-90" />

                  {/* Dramatic Level Number Stamp */}
                  <div className="absolute top-3 right-4 select-none pointer-events-none">
                    <span className="text-7xl font-extrabold font-serif text-white/10 tracking-tighter group-hover:text-emerald-400/20 transition-colors">
                      01
                    </span>
                  </div>

                  {/* Objective Ribbon */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-lg flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-emerald-400" />
                      Behavioural &amp; Clinical Foundation
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700">
                      GATE ≥ 70%
                    </span>
                  </div>
                </div>

                {/* Card Content & Spec Telemetry */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-3xl font-extrabold text-white font-serif tracking-tight group-hover:text-emerald-300 transition-colors">
                        Foundation
                      </h3>
                      <span className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                        TIER // INTRODUCTORY
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                      Focuses on self-awareness, conflict de-escalation, motivation, values, family connections, basic literacy, and clinical mental stabilization.
                    </p>
                  </div>

                  {/* Technical Specification Grid */}
                  <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2.5 pt-4 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Primary Gate</span>
                      <span className="font-bold text-white mt-0.5 text-sm flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        Clinical &amp; Mood Index
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sub-Tier Bands</span>
                      <span className="font-bold text-emerald-300 mt-0.5 text-sm">
                        Stage 1A, 1B, 1C
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Key Benchmark</span>
                      <span className="font-semibold text-slate-200 mt-0.5">De-escalation &amp; Literacy</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Verification Authority</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Clinical Psych &amp; Case Mgr</span>
                    </div>
                  </div>

                  {/* Bottom Spec Footer Pill */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Standard Entry Milestone
                    </span>
                    <span className="text-emerald-400 font-semibold tracking-wide">CONFIDENCE VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL CARD 02: DEVELOPMENT */}
            <div
              className="trading-card-wrapper trading-card-entry"
              data-index="1"
              onMouseMove={(e) => handleCardMouseMove(e, 1)}
              onMouseLeave={() => handleCardMouseLeave(1)}
              ref={(el) => { cardRefs.current[1] = el; }}
            >
              <div className="trading-card spec-card-level-2 trading-card-carbon border border-sky-500/30 flex flex-col h-full group">
                <div className="trading-card-glare" />

                {/* Card Top Foil / Spec Header */}
                <div className="p-4 sm:p-5 pb-3 border-b border-sky-500/20 bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#38bdf8] font-bold">
                      PATHWAY SPEC // LVL-02
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-950/90 border border-sky-500/40 text-[#38bdf8] font-mono text-xs font-bold tracking-widest">
                      2A · 2B · 2C
                    </span>
                  </div>
                </div>

                {/* Card Visual Spec Window */}
                <div className="h-56 overflow-hidden bg-slate-950 relative border-b border-sky-500/20">
                  <img loading="lazy" decoding="async"
                    src="/assets/images/education_classroom_1792261680983.jpg"
                    alt="Level 2 Development: Adult education classroom learning and pro-social capability"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081424] via-transparent to-transparent opacity-90" />

                  {/* Dramatic Level Number Stamp */}
                  <div className="absolute top-3 right-4 select-none pointer-events-none">
                    <span className="text-7xl font-extrabold font-serif text-white/10 tracking-tighter group-hover:text-sky-400/20 transition-colors">
                      02
                    </span>
                  </div>

                  {/* Objective Ribbon */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-sky-500/40 text-[#38bdf8] text-xs font-bold tracking-wide backdrop-blur-md shadow-lg flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                      Education &amp; Pro-Social Capability
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700">
                      GATE ≥ 70%
                    </span>
                  </div>
                </div>

                {/* Card Content & Spec Telemetry */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-3xl font-extrabold text-white font-serif tracking-tight group-hover:text-sky-300 transition-colors">
                        Development
                      </h3>
                      <span className="text-xs font-mono uppercase text-sky-400 font-semibold tracking-wider">
                        TIER // INTERMEDIATE
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                      Advanced behavioral programmes, communication workshops, collaborative problem-solving groups, family counseling, and vocational exposure.
                    </p>
                  </div>

                  {/* Technical Specification Grid */}
                  <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2.5 pt-4 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Primary Gate</span>
                      <span className="font-bold text-white mt-0.5 text-sm flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                        Education &amp; Attendance
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sub-Tier Bands</span>
                      <span className="font-bold text-sky-300 mt-0.5 text-sm">
                        Stage 2A, 2B, 2C
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Key Benchmark</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Pro-Social Engagement</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Verification Authority</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Education Officer &amp; Warden</span>
                    </div>
                  </div>

                  {/* Bottom Spec Footer Pill */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      Collaborative Problem Solving
                    </span>
                    <span className="text-sky-400 font-semibold tracking-wide">STRUCTURED ADVANCE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL CARD 03: CAPABILITY */}
            <div
              className="trading-card-wrapper trading-card-entry"
              data-index="2"
              onMouseMove={(e) => handleCardMouseMove(e, 2)}
              onMouseLeave={() => handleCardMouseLeave(2)}
              ref={(el) => { cardRefs.current[2] = el; }}
            >
              <div className="trading-card spec-card-level-3 trading-card-carbon border border-purple-500/30 flex flex-col h-full group">
                <div className="trading-card-glare" />

                {/* Card Top Foil / Spec Header */}
                <div className="p-4 sm:p-5 pb-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-ping" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-purple-400 font-bold">
                      PATHWAY SPEC // LVL-03
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-950/90 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold tracking-widest">
                      3A · 3B · 3C
                    </span>
                  </div>
                </div>

                {/* Card Visual Spec Window */}
                <div className="h-56 overflow-hidden bg-slate-950 relative border-b border-purple-500/20">
                  <img loading="lazy" decoding="async"
                    src="/assets/images/vocational_skills_1792261206507.jpg"
                    alt="Level 3 Capability: Vocational trade workshop and certified technical skills"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081424] via-transparent to-transparent opacity-90" />

                  {/* Dramatic Level Number Stamp */}
                  <div className="absolute top-3 right-4 select-none pointer-events-none">
                    <span className="text-7xl font-extrabold font-serif text-white/10 tracking-tighter group-hover:text-purple-400/20 transition-colors">
                      03
                    </span>
                  </div>

                  {/* Objective Ribbon */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-purple-500/40 text-purple-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-lg flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-purple-400" />
                      Independent Life &amp; Trade Credentials
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700">
                      GATE ≥ 70%
                    </span>
                  </div>
                </div>

                {/* Card Content & Spec Telemetry */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-3xl font-extrabold text-white font-serif tracking-tight group-hover:text-purple-300 transition-colors">
                        Capability
                      </h3>
                      <span className="text-xs font-mono uppercase text-purple-400 font-semibold tracking-wider">
                        TIER // ADVANCED TRADE
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                      Vocational workshop training with accredited certification, digital skills, workplace health &amp; safety, and ongoing psychological resilience.
                    </p>
                  </div>

                  {/* Technical Specification Grid */}
                  <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2.5 pt-4 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Primary Gate</span>
                      <span className="font-bold text-white mt-0.5 text-sm flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-purple-400" />
                        Accredited Trade Gate
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sub-Tier Bands</span>
                      <span className="font-bold text-purple-300 mt-0.5 text-sm">
                        Stage 3A, 3B, 3C
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Key Benchmark</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Safety &amp; Industry Licences</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Verification Authority</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Vocational Lead &amp; Examiner</span>
                    </div>
                  </div>

                  {/* Bottom Spec Footer Pill */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      Certified Workshop Hours
                    </span>
                    <span className="text-purple-400 font-semibold tracking-wide">TECHNICAL MASTERY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL CARD 04: REINTEGRATION */}
            <div
              className="trading-card-wrapper trading-card-entry"
              data-index="3"
              onMouseMove={(e) => handleCardMouseMove(e, 3)}
              onMouseLeave={() => handleCardMouseLeave(3)}
              ref={(el) => { cardRefs.current[3] = el; }}
            >
              <div className="trading-card spec-card-level-4 trading-card-carbon border border-amber-500/30 flex flex-col h-full group">
                <div className="trading-card-glare" />

                {/* Card Top Foil / Spec Header */}
                <div className="p-4 sm:p-5 pb-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold">
                      PATHWAY SPEC // LVL-04
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold tracking-widest">
                      4A · 4B · 4C
                    </span>
                  </div>
                </div>

                {/* Card Visual Spec Window */}
                <div className="h-56 overflow-hidden bg-slate-950 relative border-b border-amber-500/20">
                  <img loading="lazy" decoding="async"
                    src="/assets/images/community_reintegration_1792261209316.jpg"
                    alt="Level 4 Reintegration: Community transition and probation officer handover support"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081424] via-transparent to-transparent opacity-90" />

                  {/* Dramatic Level Number Stamp */}
                  <div className="absolute top-3 right-4 select-none pointer-events-none">
                    <span className="text-7xl font-extrabold font-serif text-white/10 tracking-tighter group-hover:text-amber-400/20 transition-colors">
                      04
                    </span>
                  </div>

                  {/* Objective Ribbon */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-lg flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-amber-400" />
                      Community Transition &amp; Employment
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700">
                      GATE ≥ 70%
                    </span>
                  </div>
                </div>

                {/* Card Content & Spec Telemetry */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-3xl font-extrabold text-white font-serif tracking-tight group-hover:text-amber-300 transition-colors">
                        Reintegration
                      </h3>
                      <span className="text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
                        TIER // PAROLE HANDOVER
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                      Job interview simulations, CV preparation, community housing referrals, healthcare continuity, and encrypted handover dispatch to probation officers.
                    </p>
                  </div>

                  {/* Technical Specification Grid */}
                  <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2.5 pt-4 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Primary Gate</span>
                      <span className="font-bold text-white mt-0.5 text-sm flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Community Handover Gate
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sub-Tier Bands</span>
                      <span className="font-bold text-amber-300 mt-0.5 text-sm">
                        Stage 4A, 4B, 4C
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Key Benchmark</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Encrypted AES-256 Dispatch</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Verification Authority</span>
                      <span className="font-semibold text-slate-200 mt-0.5">Parole Board &amp; Governing Warden</span>
                    </div>
                  </div>

                  {/* Bottom Spec Footer Pill */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      Community Supervision Handover
                    </span>
                    <span className="text-amber-400 font-semibold tracking-wide">FINAL GATE CLEAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multidisciplinary Case Review Showcase */}
          <div className="reveal-feature mt-14 rounded-2xl bg-gradient-to-r from-[#0b1a30] via-[#0e2444] to-[#11305c] border border-[#1e3a5f] overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 h-72 lg:h-80 overflow-hidden bg-slate-950 w-full shrink-0">
              <img loading="lazy" decoding="async"
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
