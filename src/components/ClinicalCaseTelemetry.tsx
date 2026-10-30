import React from 'react';
import { OffenderCase } from '../types';
import { Lock, Activity, ShieldCheck } from 'lucide-react';

interface Props {
  currentRecord: OffenderCase;
  notesCount: number | null;
}

const clamp = (value: unknown, max = 100): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : null;

export const ClinicalCaseTelemetry: React.FC<Props> = ({ currentRecord, notesCount }) => {
  const c = currentRecord;
  // All five axes come from the selected case: no synthetic psychological diagnoses.
  const axes = [
    { label: 'EDUCATION', value: clamp(c.gate_scores?.edu) },
    { label: 'BEHAVIOUR', value: clamp(c.gate_scores?.beh) },
    { label: 'WELLBEING', value: clamp(c.gate_scores?.wb) },
    { label: 'SKILLS', value: clamp(c.gate_scores?.skl) },
    { label: 'ASSESSMENT', value: clamp(c.assessment_completeness) },
  ];
  const centerX = 260;
  const centerY = 205;
  const radius = 130;
  const position = (i: number, fraction: number) => {
    const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
    return [centerX + radius * fraction * Math.cos(angle), centerY + radius * fraction * Math.sin(angle)];
  };
  const polygon = (level: number) => axes.map((_, i) => position(i, level).join(',')).join(' ');
  const available = axes.every((a) => a.value !== null);
  const shape = available ? axes.map((a, i) => position(i, (a.value ?? 0) / 100).join(',')).join(' ') : '';

  const mood = Array.isArray(c.mood_history) ? c.mood_history.filter((n) => typeof n === 'number' && Number.isFinite(n) && n >= 1 && n <= 5) : [];
  const moodX = (i: number) => 22 + (i * 305) / Math.max(1, mood.length - 1);
  const moodY = (v: number) => 100 - ((v - 1) / 4) * 70;
  const attendance = clamp(c.session_attendance);
  const assessment = clamp(c.assessment_completeness);
  const engagement = clamp(c.programme_engagement, 5);

  const Metric = ({ title, value, detail }: { title: string; value: string; detail: string }) => (
    <div className="rounded-xl border border-[#214469] bg-[#07172d] p-3 sm:p-4">
      <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#9ab5d1]">{title}</h4>
      <p className="text-xl sm:text-2xl font-bold text-[#67d5cd] mt-2">{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{detail}</p>
    </div>
  );

  return (
    <section className="rounded-2xl border border-[#1e3a5f] bg-[#071325] overflow-hidden shadow-xl" aria-label={`Clinical case ${c.id} telemetry`}>
      <div className="bg-[#0a1a33] px-4 sm:px-5 py-3 border-b border-[#1e3a5f] flex flex-wrap gap-2 items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold font-mono tracking-wide text-purple-300">
          <Lock className="h-4 w-4" aria-hidden="true"/> PROTECTED CLINICAL TELEMETRY · CASE {c.id}
        </span>
        <span className="text-xs text-[#5cc2bd] font-mono">{c.first_name} {c.last_name} · Case-specific values</span>
      </div>
      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-4 sm:gap-5 p-3 sm:p-5">
        <div className="rounded-xl border border-[#183758] bg-[#061324] p-2 sm:p-3">
          <h3 className="text-sm font-bold text-white text-center mt-2">Five-Axis Case Progress Profile</h3>
          <p className="text-xs text-[#38bdf8] text-center">Actual institutional case indicators · 0–100%</p>
          <svg viewBox="0 0 520 410" className="w-full h-auto" role="img" aria-label={`Five-axis case progress radar for ${c.id}`}>
            {[0.25, 0.5, 0.75, 1].map((level) => (
              <polygon key={level} points={polygon(level)} fill={level === 1 ? '#0a2541' : 'none'} fillOpacity="0.65" stroke="#20446a" strokeWidth="1.5" />
            ))}
            {axes.map((axis, i) => {
              const [x, y] = position(i, 1);
              const [lx, ly] = position(i, 1.34);
              return (
                <g key={axis.label}>
                  <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#24446c" strokeWidth="1"/>
                  <text x={lx} y={ly - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#f8fafc">{axis.label}</text>
                  <text x={lx} y={ly + 11} textAnchor="middle" fontSize="11" fill="#38bdf8">{axis.value === null ? 'No data' : `${axis.value}%`}</text>
                </g>
              );
            })}
            {available ? (
              <>
                <polygon points={shape} fill="#0284c7" fillOpacity=".37" stroke="#38bdf8" strokeWidth="3"/>
                {axes.map((axis, i) => {
                  const [x, y] = position(i, (axis.value ?? 0) / 100);
                  return <circle key={axis.label} cx={x} cy={y} r="5" fill="#38bdf8" stroke="#fff" strokeWidth="1.5"/>;
                })}
              </>
            ) : (
              <text x="260" y="209" textAnchor="middle" fontSize="15" fill="#cbd5e1">Incomplete case indicators</text>
            )}
          </svg>
          <p className="text-center text-xs text-slate-400 -mt-2 mb-2">
            Educational, behavioural, wellbeing, skills and assessment indicators; not a clinical diagnosis.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-[#214469] bg-[#07172d] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#a7c7df] uppercase">
              <Activity className="h-4 w-4 text-[#5cc2bd]"/> Recorded Mood History
            </div>
            {mood.length > 0 ? (
              <svg viewBox="0 0 350 126" className="w-full h-auto mt-2" role="img" aria-label={`Mood values for ${c.id}: ${mood.join(', ')}`}>
                {[1, 3, 5].map((v) => <line key={v} x1="22" x2="330" y1={moodY(v)} y2={moodY(v)} stroke="#214469" strokeDasharray="4 4"/>)}
                <polyline fill="none" stroke="#5cc2bd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  points={mood.map((v, i) => `${moodX(i)},${moodY(v)}`).join(' ')}/>
                {mood.map((v, i) => <circle key={i} cx={moodX(i)} cy={moodY(v)} r="4" fill="#5cc2bd" stroke="white" strokeWidth="1"><title>{`Review ${i + 1}: ${v}/5`}</title></circle>)}
                <text x="175" y="121" textAnchor="middle" fontSize="11" fill="#94a3b8">Review cycles · mood scale 1–5</text>
              </svg>
            ) : <p className="text-sm text-slate-400 py-6">No mood history recorded for this case.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric title="Session Attendance" value={attendance === null ? 'No data' : `${attendance}%`} detail="Recorded attendance"/>
            <Metric title="Assessment Complete" value={assessment === null ? 'No data' : `${assessment}%`} detail="Recorded completeness"/>
            <Metric title="Programme Engagement" value={engagement === null ? 'No data' : `${engagement}/5`} detail="Case indicator"/>
            <Metric title="Clinical Notes" value={notesCount === null ? 'Loading…' : String(notesCount)} detail="Restricted case notes"/>
          </div>
          <div className="rounded-xl border border-purple-700 bg-[#130e28] p-3 text-xs text-purple-300 flex gap-2 items-start">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true"/>
            Authorized access only. Risk scores, clinician certifications and diagnoses are not inferred from these indicators.
          </div>
        </div>
      </div>
    </section>
  );
};
