import {
  LV,
  SUB,
  BAND,
  DOM,
  TH,
} from '../data/constants';
import {
  OffenderCase,
  StaffRole,
  GateKey,
} from '../types';

export interface AIRecommendation {
  s: number;
  P: number;
  Rk: number;
  pos: number;
  conf: number;
  f: [string, string?][];
  p: string[];
}

export function hashString(s: string): string {
  let x = 2166136261;
  for (const ch of s) {
    x ^= ch.charCodeAt(0);
    x = Math.imul(x, 16777619);
  }
  return (x >>> 0).toString(16).padStart(8, '0');
}

export function formatPathwayName(p: number | null | undefined): string {
  if (p == null) return 'Awaiting verification';
  return `${LV[Math.floor(p / 3)]} ${SUB[p % 3]}`;
}

export function calculateAIRecommendation(c: OffenderCase | any): AIRecommendation {
  const edu = c.education_level ?? c.edu ?? 3;
  const wb = c.mental_wellbeing ?? c.wb ?? 3;
  const sup = c.support_network ?? c.sup ?? 3;
  const eng = c.programme_engagement ?? c.eng ?? 3;
  const sev = c.crime_severity ?? c.sev ?? 3;
  const cmp = c.assessment_completeness ?? c.cmp ?? 80;

  const P = edu * 6 + wb * 6 + sup * 4 + eng * 4;
  const Rk = sev * 20;
  const s = Math.round(P * 0.6 + (100 - Rk) * 0.4);

  let b = BAND.findIndex((v, i) => s >= v && s < BAND[i + 1]);
  if (b === -1) b = 3;

  const a = BAND[b];
  const z = BAND[b + 1] ?? 100;
  const sb = Math.min(2, Math.floor(((s - a) / (z - a)) * 3));

  const d = Math.min(s - a, z - s);
  const conf = Math.min(96, Math.round(55 + d * 2.2 + cmp * 0.15));

  const f: [string, string?][] = [];
  const p: string[] = [];

  if (sev >= 4) f.push([`Crime severity ${sev}/5 (high)`]);
  if (edu <= 2) f.push([`Education level ${edu}/5 (low)`]);
  if (wb <= 2) f.push([`Well-being ${wb}/5 (low)`, 'psy']);
  if (sup <= 2) f.push([`Limited support network`]);

  if (sup >= 4) p.push('Strong support network');
  if (eng >= 4) p.push('High programme engagement');
  if (edu >= 4) p.push('Strong education base');
  if (wb >= 4) p.push('Stable well-being');

  return { s, P, Rk, pos: b * 3 + sb, conf, f, p };
}

export function getOffenderPos(c: OffenderCase | any): number | null {
  const dec = c.decision ?? c.dec;
  const pos = c.pathway_position ?? c.pos;
  if (!dec) return null;
  return pos != null ? pos : calculateAIRecommendation(c).pos;
}

export function getMissingGates(c: OffenderCase | any): GateKey[] {
  const gates = c.gate_scores ?? c.g ?? { edu: 0, beh: 0, wb: 0, skl: 0 };
  const keys = Object.keys(DOM) as GateKey[];
  return keys.filter((k) => (gates[k] ?? 0) < TH);
}

export function canPerform(role: StaffRole | string, action: 'decide' | 'advance' | 'psy' | 'gedu'): boolean {
  const permissions: Record<'decide' | 'advance' | 'psy' | 'gedu', string[]> = {
    decide: ['Warden', 'Administrator', 'officer'],
    advance: ['Warden', 'Administrator', 'officer'],
    psy: ['Psychologist', 'Administrator', 'officer', 'psych'],
    gedu: ['Warden', 'Administrator', 'officer'],
  };
  return (permissions[action] || []).includes(role);
}

export function getGateAverage(c: OffenderCase | any): number {
  const gates = c.gate_scores ?? c.g ?? { edu: 50, beh: 50, wb: 50, skl: 50 };
  const vals = Object.values(gates) as number[];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function getFlagsOf(c: OffenderCase | any): string[] {
  const o: string[] = [];
  const att = c.session_attendance ?? c.att ?? 100;
  const mood = c.mood_history ?? c.mood ?? [3, 3, 3, 3, 3];
  const low = c.low_mood_count ?? c.low ?? 0;
  const wb = c.mental_wellbeing ?? c.wb ?? 3;

  if (att < 70) o.push(`Session attendance ${att}% (below 70%)`);
  if (mood[0] - mood[4] >= 2 || (mood[3] - mood[4] >= 1 && mood[4] <= 2)) {
    o.push('Self-rated mood trending down across review cycles');
  }
  if (low >= 3) o.push(`${low} low-mood self-reports in the last cycle`);
  if (wb <= 2) o.push(`Well-being assessment score in lower range (${wb}/5)`);
  return o;
}

export const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export const isRoleRestricted = (role: StaffRole | string) =>
  role === 'Educator' || role === 'Case Manager' || role === 'edu' || role === 'cm';

export function getDomainMatrix(c: OffenderCase | any): [string, number, number?][] {
  const gates = c.gate_scores ?? c.g ?? { edu: 50, beh: 50, wb: 50, skl: 50 };
  const eng = c.programme_engagement ?? c.eng ?? 3;
  const sup = c.support_network ?? c.sup ?? 3;
  const scoreHistory = c.score_history ?? c.h ?? [50, 50, 50, 50, 50];

  return [
    ['Behaviour', gates.beh ?? 50],
    ['Motivation', eng * 20 - 2],
    ['Social skills', (sup * 20 + (gates.beh ?? 50)) / 2],
    ['Education', gates.edu ?? 50],
    ['Vocational', gates.skl ?? 50],
    ['Well-being support', gates.wb ?? 50, 1],
    ['Family / social support', sup * 20 - 5],
    ['Creative development', ((gates.edu ?? 50) + (gates.skl ?? 50)) / 2 - 4],
    ['Reintegration readiness', (scoreHistory[4] ?? 50) * 0.8],
  ].map((d) => [d[0] as string, clamp(d[1] as number), d[2] as number | undefined]);
}

export function getLowestDomains(c: OffenderCase | any, role: StaffRole | string): [string, number, number?][] {
  const isRestricted = isRoleRestricted(role);
  return getDomainMatrix(c)
    .filter((d) => !(d[2] && isRestricted))
    .sort((a, b) => a[1] - b[1]);
}

export function getNextReviewDate(): string {
  return new Date(Date.now() + 28 * 864e5).toISOString().slice(0, 10);
}

export function generateHandoverBrief(c: OffenderCase | any): string {
  const p = getOffenderPos(c);
  const scoreHistory = c.score_history ?? c.h ?? [50, 50, 50, 50, 50];
  const certs = c.certifications ?? c.certs ?? [];
  const wb = c.mental_wellbeing ?? c.wb ?? 3;
  const low = c.low_mood_count ?? c.low ?? 0;
  const edu = c.education_level ?? c.edu ?? 3;
  const dec = c.decision ?? c.dec;

  return `HANDOVER BRIEF: ${c.id}
Individual: ${c.first_name ? c.first_name + ' ' + c.last_name : c.id}
Final pathway stage: ${formatPathwayName(p)}
Placement score: ${scoreHistory[4] ?? 50} (cycle 5)
Certifications: ${certs.join('; ') || 'None recorded'}
Gate completion (avg): ${getGateAverage(c)}%
Ongoing support needs: ${
    wb <= 3 || low
      ? 'Continued well-being check-ins; community mental health referral'
      : 'Routine probation contact'
  }${edu <= 3 ? '; further education support' : ''}
Human verification: ${dec || 'pending'}`;
}

export async function encryptHandoverBrief(
  c: OffenderCase | any
): Promise<{ id: string; ct: string; byteLength: number }> {
  const text = generateHandoverBrief(c);
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ctBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const ct = new Uint8Array(ctBuffer);

  const hx = (a: Uint8Array) =>
    Array.from(a)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  return {
    id: c.id,
    ct: hx(iv) + hx(ct),
    byteLength: ct.length,
  };
}
