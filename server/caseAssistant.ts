import type { OffenderCase, StaffRole, UploadedDocument } from './db';

// Data returned here is deliberately limited to non-clinical fields already
// accessible through the authenticated case API. No model provider is called.
export function answerCaseQuestion(
  role: StaffRole,
  record: OffenderCase,
  documents: UploadedDocument[],
  question: string,
): string {
  const q = question.toLowerCase();
  const displayName = [record.first_name, record.last_name].filter(Boolean).join(' ');
  const caseLabel = `${record.id}${displayName ? ` (${displayName})` : ''}`;
  const gates = record.gate_scores;
  const threshold = 70;
  const gateEntries = [
    ['Education', gates.edu],
    ['Behaviour', gates.beh],
    ['Well-being gate', gates.wb],
    ['Skills', gates.skl],
  ] as const;
  // Gate-level percentages are visible on the existing progression screen.
  // Detailed clinical notes, ratings, and extracted document text are excluded.
  const missing = gateEntries.filter(([, score]) => score < threshold);
  const gateStatus = gateEntries.map(([name, score]) => `${name}: ${score}%`).join('; ');
  const progression = missing.length === 0
    ? 'All four gates currently meet the 70% threshold. Advancement still requires the authorized Warden/Administrator and other checks.'
    : `Not ready for advancement: ${missing.map(([name, score]) => `${name} (${score}%)`).join(', ')} below 70%.`;
  const placement = record.decision
    ? `${record.decision} (pathway stage ${record.pathway_position == null ? 'not set' : record.pathway_position + 1} of 12)`
    : 'pending verification';
  const certifications = record.certifications?.length
    ? record.certifications.slice(0, 15).join(', ')
    : 'none recorded';
  const documentNames = documents.slice(0, 15).map(d => `• ${d.original_name || d.filename} — ${d.status}`).join('\n');
  const docSummary = `${documents.length} linked document(s) for ${caseLabel}.${documents.length ? `\n${documentNames}${documents.length > 15 ? '\nAdditional documents are available in the case evidence view.' : ''}` : ''}`;

  if (/permission|clearance|what can i (edit|access)|my role/.test(q)) {
    return `Your verified role is ${role}. You can view case ${caseLabel} within your institution. Editing, clinical access and progression decisions are controlled separately by server-side permissions; this assistant cannot change them.`;
  }
  if (/document|upload|file|attachment|pdf|evidence|report/.test(q)) return docSummary;
  if (/clinical|psycholog|diagnos|mental health|therapy|confidential note/.test(q)) {
    return 'Clinical notes and psychological assessments are not included in this assistant. Use the protected Clinical notes area if your role is authorized; ask the Psychologist or Administrator for clinical review.';
  }
  if (/educat|certificate|qualification|literacy|training|skills/.test(q)) {
    return `For ${caseLabel}: education level ${record.education_level}/5; education gate ${gates.edu}%; skills gate ${gates.skl}%; certifications: ${certifications}. Review the case file for source evidence before making decisions.`;
  }
  if (/attend|engage|participat|programme|program/.test(q)) {
    return `For ${caseLabel}: session attendance ${record.session_attendance}%; programme engagement ${record.programme_engagement}/5; assessment completeness ${record.assessment_completeness}%. These are recorded figures, not an independent clinical judgment.`;
  }
  if (/gate|progress|advance|ready|threshold|stage/.test(q)) {
    return `For ${caseLabel}: ${gateStatus}. ${progression} Current placement: ${placement}.`;
  }
  if (/placement|pathway|decision|approval/.test(q)) {
    return `For ${caseLabel}: placement is ${placement}. ${progression} Review the Case file and Progression gates sections; approval remains a human decision.`;
  }
  if (/sentence|offen|crime|severity|profile|about|summary|overview|details|patient|prisoner|person|case|record/.test(q)) {
    return `Case ${caseLabel}\nPlacement: ${placement}\nOffence category: ${record.crime_type}; severity: ${record.crime_severity}/5; sentence: ${record.sentence_length_months} months.\nAttendance: ${record.session_attendance}%; programme engagement: ${record.programme_engagement}/5.\nGates: ${gateStatus}.\n${progression}\nLinked documents: ${documents.length}.\nThis summary comes from the saved case record. It excludes protected clinical notes.`;
  }
  return `I have access to the permitted non-clinical fields of selected case ${caseLabel}. Ask me to summarize the case, check gate progress, review attendance, show education evidence, explain placement, or list linked files. I cannot edit records or make release decisions.`;
}
