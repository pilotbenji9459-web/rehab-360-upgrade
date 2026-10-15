import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  BrainCircuit,
  Lock,
  Layers,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onExploreDemo }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#071325] text-slate-100 font-sans selection:bg-[#0079d6] selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#005a9e] via-[#0079d6] to-[#0ea5e9] py-2 px-4 text-center text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>REHABPATH360 ENTERPRISE — Coordinated Care &amp; Human-in-the-Loop Rehabilitation Intelligence</span>
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0a1a33]/90 border-b border-slate-800 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0079d6] to-[#5cc2bd] flex items-center justify-center shadow-lg shadow-[#0079d6]/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-serif">REHABPATH<span className="text-[#5cc2bd]">360</span></span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-medium">Rehabilitation Management Platform</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Core Capabilities</a>
            <a href="#framework" className="hover:text-white transition-colors">4-Level Pathway</a>
            <a href="#security" className="hover:text-white transition-colors">RBAC &amp; Least-Privilege</a>
            <a href="#documents" className="hover:text-white transition-colors">AI Document Intake</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExploreDemo}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              Public Overview
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#0079d6] to-[#0284c7] text-white hover:from-[#0066b8] hover:to-[#0369a1] shadow-md shadow-[#0079d6]/30 transition-all cursor-pointer"
            >
              Staff Portal Login
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

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

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white font-serif">9 Domains</span>
              <p className="text-xs text-slate-400 mt-1">Multi-dimensional matrix covering education, behavior, and wellbeing</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-2xl font-bold text-[#5cc2bd] font-serif">70% Gate</span>
              <p className="text-xs text-slate-400 mt-1">Strict evidentiary milestone threshold required prior to advancement</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-2xl font-bold text-[#38bdf8] font-serif">100% Verified</span>
              <p className="text-xs text-slate-400 mt-1">Mandatory human officer verification for all algorithmic suggestions</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <span className="text-2xl font-bold text-amber-400 font-serif">AES-256-GCM</span>
              <p className="text-xs text-slate-400 mt-1">Client-side authenticated encryption for community parole handover briefs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section id="features" className="py-24 px-6 bg-[#0a1a33]/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold">Institutional Grade Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4 font-serif">
              Engineered for Accountability &amp; Clinical Precision
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Every design decision prioritizes data integrity, role-based privacy separation, and transparent rehabilitation progression.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-[#38bdf8] flex items-center justify-center mb-5">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-serif">Explainable AI (XAI) Placement</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Calculates protective index from engagement, education, and support against risk loads. Transparently maps scores into Foundation, Development, Capability, and Reintegration bands.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-[#38bdf8] font-medium">
                No black boxes · Human override required
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-[#5cc2bd] flex items-center justify-center mb-5">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-serif">Multiformat Document Intake</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Ingest Word (.docx), Excel spreadsheets (.xlsx, .csv), and PDFs directly. AI extracts candidate fields, detects record discrepancies, and requires human confirmation before saving.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-[#5cc2bd] font-medium">
                Column mapper &amp; source citations
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-serif">Strict Clinical Least-Privilege</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Psychological evaluations and mental health notes are strictly isolated. Educators and Case Managers only see authorized operational parameters, enforced on the server and database.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-purple-400 font-medium">
                Row-level security &amp; field masking
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-serif">Longitudinal Review Trends</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Multi-cycle SVG progress tracking maps placement score curves alongside average gate completion across successive review cycles against the 70% threshold.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-amber-400 font-medium">
                5-cycle comparative history
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-serif">Tamper-Evident Audit Trail</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Immutable server-side logging of logins, clinical note submissions, gate changes, and document imports. Cryptographic hash-chaining prevents retroactive alterations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-emerald-400 font-medium">
                Full chronological accountability
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-5">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-serif">Parole Handover Encryption</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  When offenders reach Reintegration, generate an authenticated AES-256-GCM encrypted brief package for community probation officers to ensure seamless post-release care.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-rose-400 font-medium">
                WebCrypto browser-grade encryption
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Level Framework */}
      <section id="framework" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold">Structured Rehabilitation</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4 font-serif">The 4-Level Pathway Model</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Every individual progresses through distinct evidence-based stages with Sub-levels A, B, and C ensuring granular milestones.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border-l-4 border-emerald-500 border-y border-r border-slate-800">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Level 1</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2 font-serif">Foundation</h3>
              <p className="text-xs font-semibold text-slate-300 mb-2">Objective: Behavioural and personal foundation</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Focuses on self-awareness, conflict de-escalation, motivation, values, family connections, basic literacy, and clinical stabilization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border-l-4 border-[#0079d6] border-y border-r border-slate-800">
              <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider">Level 2</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2 font-serif">Development</h3>
              <p className="text-xs font-semibold text-slate-300 mb-2">Objective: Strengthen education &amp; social capability</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Advanced behavioral programmes, communication workshops, problem-solving groups, family counseling, and vocational exposure.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border-l-4 border-purple-500 border-y border-r border-slate-800">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Level 3</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2 font-serif">Capability</h3>
              <p className="text-xs font-semibold text-slate-300 mb-2">Objective: Independent-life &amp; trade credentials</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vocational training with accredited certification, digital skills, workplace health &amp; safety, and ongoing psychological resilience.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border-l-4 border-amber-500 border-y border-r border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Level 4</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2 font-serif">Reintegration</h3>
              <p className="text-xs font-semibold text-slate-300 mb-2">Objective: Community transition &amp; employment readiness</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Job interview simulations, CV preparation, community housing referrals, healthcare continuity, and encrypted handover dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Permissions Matrix */}
      <section id="security" className="py-24 px-6 bg-[#0a1a33]/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold">Institutional Governance</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4 font-serif">Staff Role Permissions Matrix</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Permissions are validated server-side. Users can never escalate privileges by modifying client JavaScript variables.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-white font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Pathway Verification</th>
                  <th className="py-3 px-4">Clinical Notes</th>
                  <th className="py-3 px-4">Education / Gate Edits</th>
                  <th className="py-3 px-4">Document Import &amp; AI</th>
                  <th className="py-3 px-4">Audit Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Administrator</td>
                  <td className="py-3.5 px-4 text-emerald-400">Full Access</td>
                  <td className="py-3.5 px-4 text-emerald-400">Governance Read</td>
                  <td className="py-3.5 px-4 text-emerald-400">Full Edit</td>
                  <td className="py-3.5 px-4 text-emerald-400">Upload &amp; Commit</td>
                  <td className="py-3.5 px-4 text-emerald-400">Full Audit Access</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Warden</td>
                  <td className="py-3.5 px-4 text-emerald-400">Approve / Modify / Override</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted (Denied)</td>
                  <td className="py-3.5 px-4 text-emerald-400">Full Edit</td>
                  <td className="py-3.5 px-4 text-emerald-400">Upload &amp; Commit</td>
                  <td className="py-3.5 px-4 text-emerald-400">Full Audit Access</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Psychologist</td>
                  <td className="py-3.5 px-4 text-slate-400">Clinical Review</td>
                  <td className="py-3.5 px-4 text-emerald-400">Full Author &amp; Read</td>
                  <td className="py-3.5 px-4 text-amber-400">Well-being Gate Only</td>
                  <td className="py-3.5 px-4 text-emerald-400">Upload &amp; Commit</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Case Manager</td>
                  <td className="py-3.5 px-4 text-slate-400">Propose Plan</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted (Denied)</td>
                  <td className="py-3.5 px-4 text-amber-400">Case Remarks / Attendance</td>
                  <td className="py-3.5 px-4 text-emerald-400">Upload &amp; Commit</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Educator</td>
                  <td className="py-3.5 px-4 text-slate-400">View Only</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted (Denied)</td>
                  <td className="py-3.5 px-4 text-emerald-400">Edu &amp; Skills Gate Edits</td>
                  <td className="py-3.5 px-4 text-emerald-400">Course Document Intake</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Community Rehab Officer</td>
                  <td className="py-3.5 px-4 text-slate-400">Reintegration Handover</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted (Denied)</td>
                  <td className="py-3.5 px-4 text-slate-400">Post-Release Support</td>
                  <td className="py-3.5 px-4 text-slate-400">Handover Intake</td>
                  <td className="py-3.5 px-4 text-rose-400">Restricted</td>
                </tr>
              </tbody>
            </table>
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

      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>REHABPATH360 Institutional Platform · All synthetic demonstration records · Government-Grade Security Standards</p>
      </footer>
    </div>
  );
};
