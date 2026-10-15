import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export type StaffRole =
  | 'Administrator'
  | 'Warden'
  | 'Psychologist'
  | 'Case Manager'
  | 'Educator'
  | 'Community Rehabilitation Officer';

export interface InstitutionConfig {
  id: string; // e.g. 'inst-demo' or 'inst-custom'
  name: string; // e.g. "HMP Frankland Correctional Centre"
  code: string; // e.g. "HMP-FRK"
  logo_url?: string;
  theme_primary: string; // e.g. '#0284c7'
  theme_teal: string; // e.g. '#5cc2bd'
  staff_designations: Record<StaffRole, string>;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  institution_id: string; // multi-tenancy isolation
  email: string;
  password_hash: string;
  full_name: string;
  role: StaffRole;
  badge_number: string;
  department: string;
  status: 'active' | 'suspended';
  created_at: string;
  last_login_at: string | null;
}

export interface OffenderCase {
  id: string; // e.g. RP-1041
  institution_id: string; // multi-tenancy isolation
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age_band: string;
  crime_severity: number; // 1-5
  crime_type: string;
  sentence_length_months: number;
  education_level: number; // 1-5
  mental_wellbeing: number; // 1-5
  support_network: number; // 1-5
  programme_engagement: number; // 1-5
  assessment_completeness: number; // 0-100%
  session_attendance: number; // 0-100%
  mood_history: number[]; // 5 review cycles
  low_mood_count: number;
  gate_scores: {
    edu: number;
    beh: number;
    wb: number;
    skl: number;
  };
  score_history: number[]; // 5 cycles of placement scores
  gate_history: number[]; // 5 cycles of avg gate completion
  certifications: string[];
  decision: 'approved' | 'modified' | 'overridden' | null;
  pathway_position: number | null; // 0..11
  decision_reason: string;
  rehabilitation_remarks: string[];
  education_history: string;
  employment_history: string;
  rehabilitation_history: string;
  version: number; // Concurrency lock
  created_at: string;
  updated_at: string;
  updated_by_id: string;
  updated_by_name: string;
}

export interface ClinicalNote {
  id: string;
  institution_id: string; // multi-tenancy isolation
  case_id: string;
  author_id: string;
  author_name: string;
  author_role: StaffRole;
  note_type: 'psychological_evaluation' | 'wellbeing_check' | 'risk_assessment' | 'crisis_intervention';
  confidentiality: 'restricted_clinical' | 'staff_general';
  title: string;
  content: string;
  recommendations: string[];
  created_at: string;
}

export interface AuditEvent {
  id: string;
  institution_id: string; // multi-tenancy isolation
  timestamp: string;
  actor_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: StaffRole | 'System';
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address: string;
  status: 'success' | 'denied';
}

export interface ChangeHistoryEntry {
  id: string;
  institution_id: string; // multi-tenancy isolation
  case_id: string;
  field_name: string;
  previous_value: string;
  new_value: string;
  changed_by_id: string;
  changed_by_name: string;
  changed_by_role: StaffRole;
  timestamp: string;
  change_source: 'manual_edit' | 'ai_verified_import' | 'gate_progression' | 'human_verification';
}

export interface UploadedDocument {
  id: string;
  institution_id: string; // multi-tenancy isolation
  case_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  uploaded_by_role: StaffRole;
  upload_source: 'word' | 'excel' | 'pdf' | 'manual';
  status: 'pending_review' | 'verified_applied' | 'rejected';
  extracted_summary?: string;
  ai_analysis?: any;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
}

export interface SaveDraft {
  case_id: string;
  institution_id: string;
  user_id: string;
  draft_data: Partial<OffenderCase>;
  updated_at: string;
}

export interface DatabaseSchema {
  institution: InstitutionConfig;
  users: UserAccount[];
  cases: OffenderCase[];
  clinical_notes: ClinicalNote[];
  documents: UploadedDocument[];
  audit_events: AuditEvent[];
  change_history: ChangeHistoryEntry[];
  drafts: SaveDraft[];
  bootstrap_completed?: boolean;
}

// Database file paths
export const DEMO_DB_FILE = path.join(DATA_DIR, 'rehabpath360.demo.db.json');
export const DEPLOYMENT_DB_FILE = path.join(DATA_DIR, 'rehabpath360.deployment.db.json');
export const LEGACY_DB_FILE = path.join(DATA_DIR, 'rehabpath360.db.json');

// Check if currently running in deployment mode
export function isDeploymentMode(): boolean {
  return (
    process.env.APP_MODE === 'deployment' ||
    process.env.DEPLOYMENT_MODE === 'true' ||
    process.env.NODE_ENV === 'deployment'
  );
}

// Get appropriate active database file
export function getActiveDbFile(): string {
  if (isDeploymentMode()) {
    return DEPLOYMENT_DB_FILE;
  }
  return DEMO_DB_FILE;
}

// Default Institution Config for Demo Exhibition
export const DEFAULT_DEMO_INSTITUTION: InstitutionConfig = {
  id: 'inst-demo',
  name: "Her Majesty's Prison Frankland (Exhibition Demo)",
  code: 'HMP-FRK',
  logo_url: '',
  theme_primary: '#0284c7',
  theme_teal: '#5cc2bd',
  staff_designations: {
    Administrator: 'Executive Administrator',
    Warden: 'Governing Governor / Warden',
    Psychologist: 'Senior Clinical Psychologist',
    'Case Manager': 'Lead Rehabilitation Case Manager',
    Educator: 'Head of Vocational Training & Education',
    'Community Rehabilitation Officer': 'Probation & Reintegration Officer',
  },
  is_demo: true,
  created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
  updated_at: new Date('2026-01-01T08:00:00Z').toISOString(),
};

// Default Institution Config for Clean Deployment
export const DEFAULT_CLEAN_INSTITUTION: InstitutionConfig = {
  id: 'inst-prod-01',
  name: 'National Correctional Institution',
  code: 'NCI-MAIN',
  logo_url: '',
  theme_primary: '#0284c7',
  theme_teal: '#5cc2bd',
  staff_designations: {
    Administrator: 'System Administrator',
    Warden: 'Warden / Superintendent',
    Psychologist: 'Clinical Psychologist',
    'Case Manager': 'Rehabilitation Case Manager',
    Educator: 'Education & Vocational Officer',
    'Community Rehabilitation Officer': 'Community Rehabilitation Officer',
  },
  is_demo: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// In-memory cache
let dbCache: DatabaseSchema | null = null;
let activeDbPathLoaded: string | null = null;

export function getInitialDemoDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const commonPassword = bcrypt.hashSync('RehabPath360!', salt);

  const defaultUsers: UserAccount[] = [
    {
      id: 'usr-admin',
      institution_id: 'inst-demo',
      email: 'admin@rehabpath.gov',
      password_hash: commonPassword,
      full_name: 'Arthur Pendelton',
      role: 'Administrator',
      badge_number: 'ADM-01',
      department: 'Executive Administration',
      status: 'active',
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      last_login_at: null,
    },
    {
      id: 'usr-warden',
      institution_id: 'inst-demo',
      email: 'warden@rehabpath.gov',
      password_hash: commonPassword,
      full_name: 'Marcus Vance',
      role: 'Warden',
      badge_number: 'WRD-04',
      department: 'Custodial & Operations',
      status: 'active',
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      last_login_at: null,
    },
    {
      id: 'usr-psych',
      institution_id: 'inst-demo',
      email: 'psychologist@rehabpath.gov',
      password_hash: commonPassword,
      full_name: 'Dr. Fiona Gallagher',
      role: 'Psychologist',
      badge_number: 'PSY-12',
      department: 'Clinical Psychology & Mental Health',
      status: 'active',
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      last_login_at: null,
    },
    {
      id: 'usr-cm',
      institution_id: 'inst-demo',
      email: 'casemanager@rehabpath.gov',
      password_hash: commonPassword,
      full_name: 'David Reynolds',
      role: 'Case Manager',
      badge_number: 'CSM-07',
      department: 'Individual Rehabilitation & Care',
      status: 'active',
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      last_login_at: null,
    },
    {
      id: 'usr-edu',
      institution_id: 'inst-demo',
      email: 'educator@rehabpath.gov',
      password_hash: commonPassword,
      full_name: 'Elena Rostova',
      role: 'Educator',
      badge_number: 'EDU-03',
      department: 'Vocational Training & Literacy',
      status: 'active',
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      last_login_at: null,
    },
    {
      id: 'usr-cro',
      institution_id: 'inst-demo',
      email: 'probation@rehabpath.gov',
      password_hash: commonPassword,
      full_name: 'Hannah Brooks',
      role: 'Community Rehabilitation Officer',
      badge_number: 'CRO-19',
      department: 'Community Reintegration & Parole',
      status: 'active',
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      last_login_at: null,
    },
  ];

  const defaultCases: OffenderCase[] = [
    {
      id: 'RP-1041',
      institution_id: 'inst-demo',
      first_name: 'Julian',
      last_name: 'Crest',
      date_of_birth: '1987-04-12',
      age_band: '35–44',
      crime_severity: 2,
      crime_type: 'Non-violent property offences',
      sentence_length_months: 36,
      education_level: 4,
      mental_wellbeing: 4,
      support_network: 4,
      programme_engagement: 5,
      assessment_completeness: 96,
      session_attendance: 94,
      mood_history: [4, 4, 4, 4, 4],
      low_mood_count: 0,
      gate_scores: { edu: 88, beh: 82, wb: 80, skl: 85 },
      score_history: [58, 63, 68, 72, 74],
      gate_history: [55, 64, 72, 80, 84],
      certifications: ['Level 2 Business Admin', 'Forklift licence'],
      decision: 'approved',
      pathway_position: 9, // Reintegration A
      decision_reason: 'High engagement across all four domains; meets prerequisites for Reintegration A.',
      rehabilitation_remarks: [
        'Candidate actively mentoring peer learners in computer literacy.',
        'Completed workplace safety refresher with distinction.',
      ],
      education_history: 'Secondary school; Level 2 vocational study',
      employment_history: 'Warehouse operative, 6 years continuous service',
      rehabilitation_history: 'One earlier programme completed satisfactorily',
      version: 1,
      created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-15T10:00:00Z').toISOString(),
      updated_by_id: 'usr-warden',
      updated_by_name: 'Marcus Vance',
    },
    {
      id: 'RP-1042',
      institution_id: 'inst-demo',
      first_name: 'Tyler',
      last_name: 'Vance',
      date_of_birth: '2004-09-21',
      age_band: '18–24',
      crime_severity: 4,
      crime_type: 'Aggravated robbery with weapon',
      sentence_length_months: 60,
      education_level: 2,
      mental_wellbeing: 2,
      support_network: 2,
      programme_engagement: 3,
      assessment_completeness: 78,
      session_attendance: 58,
      mood_history: [3, 3, 3, 2, 2],
      low_mood_count: 4,
      gate_scores: { edu: 40, beh: 55, wb: 35, skl: 50 },
      score_history: [30, 31, 32, 33, 34],
      gate_history: [28, 32, 35, 38, 43],
      certifications: [],
      decision: null,
      pathway_position: null,
      decision_reason: '',
      rehabilitation_remarks: [
        'Exhibits signs of withdrawal in group sessions; attendance barriers identified.',
      ],
      education_history: 'Left school at 15; no formal qualifications',
      employment_history: 'Casual labour, under 1 year irregular work',
      rehabilitation_history: 'None prior to current custodial period',
      version: 1,
      created_at: new Date('2026-01-12T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-18T14:30:00Z').toISOString(),
      updated_by_id: 'usr-cm',
      updated_by_name: 'David Reynolds',
    },
    {
      id: 'RP-1043',
      institution_id: 'inst-demo',
      first_name: 'Aaron',
      last_name: 'Bishop',
      date_of_birth: '1995-11-03',
      age_band: '25–34',
      crime_severity: 3,
      crime_type: 'Affray and public order offence',
      sentence_length_months: 24,
      education_level: 3,
      mental_wellbeing: 3,
      support_network: 3,
      programme_engagement: 3,
      assessment_completeness: 88,
      session_attendance: 81,
      mood_history: [3, 3, 3, 3, 3],
      low_mood_count: 1,
      gate_scores: { edu: 66, beh: 72, wb: 60, skl: 70 },
      score_history: [44, 46, 49, 50, 52],
      gate_history: [45, 52, 58, 62, 66],
      certifications: ['Functional Literacy L1'],
      decision: null,
      pathway_position: null,
      decision_reason: '',
      rehabilitation_remarks: [
        'Making steady progress in workshop environment; anger-management techniques being applied.',
      ],
      education_history: 'Secondary school; partial trade course in catering',
      employment_history: 'Kitchen assistant, 3 years',
      rehabilitation_history: 'Short anger-management course completed in 2024',
      version: 1,
      created_at: new Date('2026-01-15T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-19T09:15:00Z').toISOString(),
      updated_by_id: 'usr-cm',
      updated_by_name: 'David Reynolds',
    },
    {
      id: 'RP-1044',
      institution_id: 'inst-demo',
      first_name: 'Connor',
      last_name: 'Drake',
      date_of_birth: '1993-02-17',
      age_band: '25–34',
      crime_severity: 5,
      crime_type: 'Serious repeat violent offences',
      sentence_length_months: 84,
      education_level: 3,
      mental_wellbeing: 2,
      support_network: 3,
      programme_engagement: 4,
      assessment_completeness: 90,
      session_attendance: 67,
      mood_history: [3, 3, 2, 2, 2],
      low_mood_count: 3,
      gate_scores: { edu: 60, beh: 52, wb: 48, skl: 55 },
      score_history: [38, 36, 33, 35, 35],
      gate_history: [40, 42, 44, 47, 54],
      certifications: [],
      decision: 'modified',
      pathway_position: 1, // Foundation B
      decision_reason: 'Officer held at sub-level B pending behaviour and custodial disciplinary review.',
      rehabilitation_remarks: [
        'Assigned to intensive emotional regulation track prior to vocational workshop access.',
      ],
      education_history: 'Basic literacy only; disengaged early',
      employment_history: 'Irregular contract work in construction',
      rehabilitation_history: 'One earlier programme commenced but not completed',
      version: 2,
      created_at: new Date('2026-01-16T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-20T11:45:00Z').toISOString(),
      updated_by_id: 'usr-admin',
      updated_by_name: 'Arthur Pendelton',
    },
    {
      id: 'RP-1045',
      institution_id: 'inst-demo',
      first_name: 'Geoffrey',
      last_name: 'Thorpe',
      date_of_birth: '1975-06-30',
      age_band: '45–54',
      crime_severity: 1,
      crime_type: 'Minor economic regulatory infraction',
      sentence_length_months: 18,
      education_level: 5,
      mental_wellbeing: 4,
      support_network: 5,
      programme_engagement: 5,
      assessment_completeness: 98,
      session_attendance: 98,
      mood_history: [4, 4, 4, 4, 4],
      low_mood_count: 0,
      gate_scores: { edu: 95, beh: 92, wb: 90, skl: 96 },
      score_history: [70, 76, 81, 85, 88],
      gate_history: [72, 80, 86, 90, 93],
      certifications: ['Diploma in Horticulture', 'First Aid', 'Level 3 Literacy'],
      decision: 'approved',
      pathway_position: 10, // Reintegration B
      decision_reason: 'Exemplary conduct; preparing transitional community garden programme.',
      rehabilitation_remarks: [
        'Supervising grounds maintenance team with positive staff commendation.',
      ],
      education_history: 'University diploma in education & environmental sciences',
      employment_history: 'Teaching assistant, 12 years continuous service',
      rehabilitation_history: 'Two earlier voluntary restorative justice programmes completed',
      version: 1,
      created_at: new Date('2026-01-18T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-21T16:00:00Z').toISOString(),
      updated_by_id: 'usr-warden',
      updated_by_name: 'Marcus Vance',
    },
    {
      id: 'RP-1046',
      institution_id: 'inst-demo',
      first_name: 'Callum',
      last_name: 'Rowe',
      date_of_birth: '1984-12-14',
      age_band: '35–44',
      crime_severity: 3,
      crime_type: 'Dangerous driving and obstruction',
      sentence_length_months: 30,
      education_level: 4,
      mental_wellbeing: 4,
      support_network: 3,
      programme_engagement: 4,
      assessment_completeness: 92,
      session_attendance: 89,
      mood_history: [4, 4, 4, 4, 4],
      low_mood_count: 0,
      gate_scores: { edu: 78, beh: 66, wb: 81, skl: 74 },
      score_history: [50, 54, 57, 60, 62],
      gate_history: [50, 56, 61, 66, 72],
      certifications: ['Level 2 Numeracy'],
      decision: 'approved',
      pathway_position: 5, // Development C
      decision_reason: 'Progressing on target in developmental band.',
      rehabilitation_remarks: [
        'Active participant in peer discussion circles regarding consequential thinking.',
      ],
      education_history: 'Secondary school; numeracy certificate attained',
      employment_history: 'Commercial delivery driver, 5 years',
      rehabilitation_history: 'One earlier driver awareness programme completed',
      version: 1,
      created_at: new Date('2026-01-20T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-22T08:30:00Z').toISOString(),
      updated_by_id: 'usr-cm',
      updated_by_name: 'David Reynolds',
    },
  ];

  const defaultClinicalNotes: ClinicalNote[] = [
    {
      id: 'cn-001',
      institution_id: 'inst-demo',
      case_id: 'RP-1042',
      author_id: 'usr-psych',
      author_name: 'Dr. Fiona Gallagher',
      author_role: 'Psychologist',
      note_type: 'psychological_evaluation',
      confidentiality: 'restricted_clinical',
      title: 'Initial Intake Psychometric & Mood Depressive Index',
      content:
        'Client presents symptoms consistent with moderate adjustment reaction and social withdrawal. Elevated scores on subscale for perceived helplessness. Self-rated mood dropped across recent cycles. Recommended individualized weekly supportive sessions before re-engaging in high-stimulus group workshops.',
      recommendations: [
        'Weekly 1-on-1 cognitive reframing sessions',
        'Monitor attendance barriers collaboratively',
        'Review antidepressant medication compliance with medical wing',
      ],
      created_at: new Date('2026-02-10T11:00:00Z').toISOString(),
    },
    {
      id: 'cn-002',
      institution_id: 'inst-demo',
      case_id: 'RP-1044',
      author_id: 'usr-psych',
      author_name: 'Dr. Fiona Gallagher',
      author_role: 'Psychologist',
      note_type: 'risk_assessment',
      confidentiality: 'restricted_clinical',
      title: 'De-escalation and Impulsivity Assessment',
      content:
        'Trigger mapping indicates reactivity to perceived challenges from authority figures. Defensive posture noted when discussing previous non-completion. However, cognitive restructuring exercises show receptive engagement when framed around long-term independence.',
      recommendations: [
        'Maintain at Foundation B until 4 consecutive weeks of non-conflict behaviour',
        'Targeted emotional regulation modules',
      ],
      created_at: new Date('2026-02-12T15:30:00Z').toISOString(),
    },
  ];

  const defaultAuditEvents: AuditEvent[] = [
    {
      id: 'aud-001',
      institution_id: 'inst-demo',
      timestamp: new Date('2026-02-01T08:00:00Z').toISOString(),
      actor_id: 'usr-admin',
      actor_email: 'admin@rehabpath.gov',
      actor_name: 'Arthur Pendelton',
      actor_role: 'Administrator',
      action: 'SYSTEM_INITIALIZATION',
      resource_type: 'database',
      resource_id: 'rehabpath360-core',
      details: 'Secure persistent relational schema initialized with synthetic caseload.',
      ip_address: '127.0.0.1',
      status: 'success',
    },
    {
      id: 'aud-002',
      institution_id: 'inst-demo',
      timestamp: new Date('2026-02-15T10:00:00Z').toISOString(),
      actor_id: 'usr-warden',
      actor_email: 'warden@rehabpath.gov',
      actor_name: 'Marcus Vance',
      actor_role: 'Warden',
      action: 'DECISION_APPROVE',
      resource_type: 'case',
      resource_id: 'RP-1041',
      details: 'Approved AI recommendation for Reintegration A (88% confidence).',
      ip_address: '10.0.4.15',
      status: 'success',
    },
    {
      id: 'aud-003',
      institution_id: 'inst-demo',
      timestamp: new Date('2026-02-20T11:45:00Z').toISOString(),
      actor_id: 'usr-admin',
      actor_email: 'admin@rehabpath.gov',
      actor_name: 'Arthur Pendelton',
      actor_role: 'Administrator',
      action: 'DECISION_MODIFY',
      resource_type: 'case',
      resource_id: 'RP-1044',
      details: 'Modified pathway to Foundation B. Reason: Held pending behaviour review.',
      ip_address: '10.0.1.2',
      status: 'success',
    },
  ];

  return {
    institution: DEFAULT_DEMO_INSTITUTION,
    users: defaultUsers,
    cases: defaultCases,
    clinical_notes: defaultClinicalNotes,
    documents: [],
    audit_events: defaultAuditEvents,
    change_history: [],
    drafts: [],
    bootstrap_completed: true,
  };
}

// Clean deployment database: zero staff, zero cases, zero clinical notes!
export function getCleanDeploymentDatabase(): DatabaseSchema {
  return {
    institution: DEFAULT_CLEAN_INSTITUTION,
    users: [], // Zero seeded staff accounts
    cases: [], // Zero seeded prisoner/case records
    clinical_notes: [], // Zero clinical notes
    documents: [],
    audit_events: [],
    change_history: [],
    drafts: [],
    bootstrap_completed: false, // Must be unlocked via first-admin bootstrap
  };
}

// Load DB from active disk file or initialize
export function loadDatabase(targetFile?: string): DatabaseSchema {
  const filePath = targetFile || getActiveDbFile();

  if (dbCache && activeDbPathLoaded === filePath) {
    return dbCache;
  }

  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      dbCache = JSON.parse(raw);
      // Migrate backwards if old schema lacked institution
      if (!dbCache!.institution) {
        dbCache!.institution = isDeploymentMode() ? DEFAULT_CLEAN_INSTITUTION : DEFAULT_DEMO_INSTITUTION;
      }
      // Ensure institution_id on existing entities if missing
      const instId = dbCache!.institution.id;
      dbCache!.users = (dbCache!.users || []).map((u) => ({ ...u, institution_id: u.institution_id || instId }));
      dbCache!.cases = (dbCache!.cases || []).map((c) => ({ ...c, institution_id: c.institution_id || instId }));
      dbCache!.clinical_notes = (dbCache!.clinical_notes || []).map((cn) => ({ ...cn, institution_id: cn.institution_id || instId }));
      dbCache!.documents = (dbCache!.documents || []).map((d) => ({ ...d, institution_id: d.institution_id || instId }));
      dbCache!.audit_events = (dbCache!.audit_events || []).map((a) => ({ ...a, institution_id: a.institution_id || instId }));
      dbCache!.change_history = (dbCache!.change_history || []).map((ch) => ({ ...ch, institution_id: ch.institution_id || instId }));
      dbCache!.drafts = (dbCache!.drafts || []).map((dr) => ({ ...dr, institution_id: dr.institution_id || instId }));
    } else {
      if (isDeploymentMode()) {
        dbCache = getCleanDeploymentDatabase();
      } else {
        // If legacy db file exists, convert it, else initial demo
        if (fs.existsSync(LEGACY_DB_FILE)) {
          try {
            const raw = fs.readFileSync(LEGACY_DB_FILE, 'utf-8');
            dbCache = JSON.parse(raw);
            dbCache!.institution = DEFAULT_DEMO_INSTITUTION;
          } catch {
            dbCache = getInitialDemoDatabase();
          }
        } else {
          dbCache = getInitialDemoDatabase();
        }
      }
      saveDatabase(dbCache, filePath);
    }
  } catch (err) {
    console.error(`Error loading database at ${filePath}:`, err);
    dbCache = isDeploymentMode() ? getCleanDeploymentDatabase() : getInitialDemoDatabase();
    saveDatabase(dbCache, filePath);
  }

  activeDbPathLoaded = filePath;
  return dbCache;
}

// Atomic synchronous write using temporary file replacement to prevent corruption
export function saveDatabase(data: DatabaseSchema, targetFile?: string): void {
  const filePath = targetFile || getActiveDbFile();
  const tmpFile = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, filePath);
  dbCache = data;
  activeDbPathLoaded = filePath;
}

// Clear memory cache (useful for tests and mode switches)
export function resetDbCache(): void {
  dbCache = null;
  activeDbPathLoaded = null;
}

// Multi-tenant database operations
export const DB = {
  isDeploymentMode,
  getActiveDbFile,
  resetCache: resetDbCache,

  // Institution Configuration
  getInstitution: (institutionId?: string): InstitutionConfig => {
    const current = loadDatabase();
    if (institutionId && current.institution.id !== institutionId) {
      // In isolated environments each DB holds its institution config
    }
    return current.institution;
  },

  updateInstitution: (updates: Partial<InstitutionConfig>): InstitutionConfig => {
    const current = loadDatabase();
    current.institution = {
      ...current.institution,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(current);
    return current.institution;
  },

  // First-Administrator Bootstrap (Clean Deployment initialization)
  bootstrapFirstAdmin: (params: {
    institution_name: string;
    institution_code: string;
    admin_email: string;
    admin_password: string;
    admin_name: string;
    admin_badge: string;
    setup_token?: string;
  }): { user: UserAccount; institution: InstitutionConfig } => {
    const current = loadDatabase();

    // Guard: only allow bootstrap if zero users exist or bootstrap not completed
    if (current.users.length > 0 || current.bootstrap_completed) {
      throw new Error(
        'Bootstrap Locked: An administrator has already been registered for this institution. Additional accounts must be provisioned by the Administrator.'
      );
    }
    // Deployment setup must be explicitly authorized with a unique token.
    const requiredSetupToken = process.env.SETUP_TOKEN;

    if (
      isDeploymentMode() &&
      (!requiredSetupToken || requiredSetupToken.length < 32)
    ) {
      throw new Error(
        'Bootstrap disabled: Configure SETUP_TOKEN with a unique value of at least 32 characters before deployment.'
      );
    }

    if (requiredSetupToken && params.setup_token !== requiredSetupToken) {
      throw new Error(
        'Bootstrap Authorization Failed: Invalid setup token provided.'
      );
    }

    
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(params.admin_password, salt);

    const institutionId = `inst-${Date.now()}`;
    current.institution = {
      ...DEFAULT_CLEAN_INSTITUTION,
      id: institutionId,
      name: params.institution_name,
      code: params.institution_code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const firstAdmin: UserAccount = {
      id: `usr-admin-${Date.now()}`,
      institution_id: institutionId,
      email: params.admin_email.toLowerCase(),
      password_hash: passwordHash,
      full_name: params.admin_name,
      role: 'Administrator',
      badge_number: params.admin_badge,
      department: 'Executive Administration',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: null,
    };

    current.users.push(firstAdmin);
    current.bootstrap_completed = true;

    // Log security audit event
    current.audit_events.unshift({
      id: `aud-bootstrap-${Date.now()}`,
      institution_id: institutionId,
      timestamp: new Date().toISOString(),
      actor_id: firstAdmin.id,
      actor_email: firstAdmin.email,
      actor_name: firstAdmin.full_name,
      actor_role: 'Administrator',
      action: 'BOOTSTRAP_ADMIN_INITIALIZED',
      resource_type: 'institution',
      resource_id: institutionId,
      details: `First administrator provisioned for institution "${params.institution_name}" (${params.institution_code}). Bootstrap permanently locked.`,
      ip_address: '127.0.0.1',
      status: 'success',
    });

    saveDatabase(current);
    return { user: firstAdmin, institution: current.institution };
  },

  // Users & Staff
  getUsers: (institutionId?: string): UserAccount[] => {
    const users = loadDatabase().users;
    return institutionId ? users.filter((u) => u.institution_id === institutionId) : users;
  },

  findUserByEmail: (email: string, institutionId?: string): UserAccount | undefined => {
    const users = loadDatabase().users;
    return users.find((u) => {
      const matchEmail = u.email.toLowerCase() === email.toLowerCase();
      if (!matchEmail) return false;
      return institutionId ? u.institution_id === institutionId : true;
    });
  },

  findUserById: (id: string, institutionId?: string): UserAccount | undefined => {
    const users = loadDatabase().users;
    return users.find((u) => {
      if (u.id !== id) return false;
      return institutionId ? u.institution_id === institutionId : true;
    });
  },

  addUser: (user: UserAccount): UserAccount => {
    const current = loadDatabase();
    current.users.push(user);
    saveDatabase(current);
    return user;
  },

  updateUserLogin: (userId: string): void => {
    const current = loadDatabase();
    const u = current.users.find((x) => x.id === userId);
    if (u) {
      u.last_login_at = new Date().toISOString();
      saveDatabase(current);
    }
  },

  // Cases - Strictly isolated by institution_id
  getCases: (institutionId?: string): OffenderCase[] => {
    const cases = loadDatabase().cases;
    return institutionId ? cases.filter((c) => c.institution_id === institutionId) : cases;
  },

  findCaseById: (id: string, institutionId?: string): OffenderCase | undefined => {
    const cases = loadDatabase().cases;
    return cases.find((c) => {
      if (c.id !== id) return false;
      return institutionId ? c.institution_id === institutionId : true;
    });
  },

  saveCase: (updatedCase: OffenderCase, institutionId?: string): OffenderCase => {
    const current = loadDatabase();
    // Validate institution match if provided
    if (institutionId && updatedCase.institution_id !== institutionId) {
      throw new Error('Cross-institution data modification violation.');
    }

    const idx = current.cases.findIndex(
      (c) => c.id === updatedCase.id && (!institutionId || c.institution_id === institutionId)
    );

    if (idx >= 0) {
      current.cases[idx] = updatedCase;
    } else {
      current.cases.push(updatedCase);
    }
    saveDatabase(current);
    return updatedCase;
  },

  // Clinical Notes - Protected & institution-isolated
  getClinicalNotes: (caseId: string, institutionId?: string): ClinicalNote[] => {
    const notes = loadDatabase().clinical_notes;
    return notes.filter((cn) => {
      if (cn.case_id !== caseId) return false;
      return institutionId ? cn.institution_id === institutionId : true;
    });
  },

  addClinicalNote: (note: ClinicalNote): ClinicalNote => {
    const current = loadDatabase();
    current.clinical_notes.unshift(note);
    saveDatabase(current);
    return note;
  },

  // Documents
  getDocuments: (caseId?: string, institutionId?: string): UploadedDocument[] => {
    let docs = loadDatabase().documents;
    if (institutionId) {
      docs = docs.filter((d) => d.institution_id === institutionId);
    }
    return caseId ? docs.filter((d) => d.case_id === caseId) : docs;
  },

  findDocumentById: (id: string, institutionId?: string): UploadedDocument | undefined => {
    const docs = loadDatabase().documents;
    return docs.find((d) => {
      if (d.id !== id) return false;
      return institutionId ? d.institution_id === institutionId : true;
    });
  },

  addDocument: (doc: UploadedDocument): UploadedDocument => {
    const current = loadDatabase();
    current.documents.unshift(doc);
    saveDatabase(current);
    return doc;
  },

  updateDocument: (doc: UploadedDocument, institutionId?: string): void => {
    const current = loadDatabase();
    if (institutionId && doc.institution_id !== institutionId) {
      throw new Error('Cross-institution document update violation.');
    }
    const idx = current.documents.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      current.documents[idx] = doc;
      saveDatabase(current);
    }
  },

  // Audit Events
  getAuditEvents: (institutionId?: string, limit = 200): AuditEvent[] => {
    let events = loadDatabase().audit_events;
    if (institutionId) {
      events = events.filter((e) => e.institution_id === institutionId);
    }
    return events.slice(0, limit);
  },

  logAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent => {
    const current = loadDatabase();
    const newEvent: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    current.audit_events.unshift(newEvent);
    saveDatabase(current);
    return newEvent;
  },

  // Change History
  getChangeHistory: (caseId: string, institutionId?: string): ChangeHistoryEntry[] => {
    const history = loadDatabase().change_history;
    return history.filter((ch) => {
      if (ch.case_id !== caseId) return false;
      return institutionId ? ch.institution_id === institutionId : true;
    });
  },

  logChangeHistory: (entry: Omit<ChangeHistoryEntry, 'id' | 'timestamp'>): ChangeHistoryEntry => {
    const current = loadDatabase();
    const newEntry: ChangeHistoryEntry = {
      ...entry,
      id: `chg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    current.change_history.unshift(newEntry);
    saveDatabase(current);
    return newEntry;
  },

  // Drafts
  getDraft: (caseId: string, userId: string, institutionId?: string): SaveDraft | undefined => {
    return loadDatabase().drafts.find(
      (d) =>
        d.case_id === caseId &&
        d.user_id === userId &&
        (!institutionId || d.institution_id === institutionId)
    );
  },

  saveDraft: (
    caseId: string,
    userId: string,
    draftData: Partial<OffenderCase>,
    institutionId: string
  ): SaveDraft => {
    const current = loadDatabase();
    const existing = current.drafts.findIndex(
      (d) => d.case_id === caseId && d.user_id === userId
    );
    const draft: SaveDraft = {
      case_id: caseId,
      institution_id: institutionId,
      user_id: userId,
      draft_data: draftData,
      updated_at: new Date().toISOString(),
    };
    if (existing >= 0) {
      current.drafts[existing] = draft;
    } else {
      current.drafts.push(draft);
    }
    saveDatabase(current);
    return draft;
  },

  clearDraft: (caseId: string, userId: string): void => {
    const current = loadDatabase();
    current.drafts = current.drafts.filter(
      (d) => !(d.case_id === caseId && d.user_id === userId)
    );
    saveDatabase(current);
  },
};
