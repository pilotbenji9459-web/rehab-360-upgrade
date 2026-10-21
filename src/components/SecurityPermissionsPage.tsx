import React from 'react';
import { ArrowLeft } from 'lucide-react';

/** Separate public information page; does not change actual staff permissions. */
export const SecurityPermissionsPage: React.FC = () => (
    <main id="security" className="min-h-[75vh] py-12 sm:py-24 px-4 sm:px-6 bg-[#0a1a33]/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <a href="#home" className="inline-flex items-center gap-2 mb-8 text-sm text-[#38bdf8] font-semibold hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </a>
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-[#5cc2bd] font-semibold">Institutional Governance</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4 font-serif">Staff Role Permissions Matrix</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Permissions are validated server-side. Users can never escalate privileges by modifying client JavaScript variables.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="min-w-[880px] w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-800/80 text-white font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4.5 font-semibold text-xs tracking-wider uppercase text-slate-300">Role</th>
                  <th className="py-3.5 px-4.5 font-semibold text-xs tracking-wider uppercase text-slate-300">Pathway Verification</th>
                  <th className="py-3.5 px-4.5 font-semibold text-xs tracking-wider uppercase text-slate-300">Clinical Notes</th>
                  <th className="py-3.5 px-4.5 font-semibold text-xs tracking-wider uppercase text-slate-300">Education / Gate Edits</th>
                  <th className="py-3.5 px-4.5 font-semibold text-xs tracking-wider uppercase text-slate-300">Document Import &amp; AI</th>
                  <th className="py-3.5 px-4.5 font-semibold text-xs tracking-wider uppercase text-slate-300">Audit Logs</th>
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
    </main>
);
