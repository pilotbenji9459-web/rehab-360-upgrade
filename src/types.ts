export type StaffRole =
  | 'Administrator'
  | 'Warden'
  | 'Psychologist'
  | 'Case Manager'
  | 'Educator'
  | 'Community Rehabilitation Officer';

export type UserRole = StaffRole | string;
export type OffenderRecord = any;
export type AuditEntry = any;

export interface InstitutionConfig {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  theme_primary: string;
  theme_teal: string;
  staff_designations: Record<StaffRole, string>;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  institution_id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  badge_number: string;
  department: string;
}

export type GateKey = 'edu' | 'beh' | 'wb' | 'skl';

export interface OffenderCase {
  id: string;
  institution_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age_band: string;
  crime_severity: number; // 1-5
  crime_type: string;
  sentence_length_months: number;
  education_level: number; // 1-5
  mental_wellbeing?: number; // 1-5 (masked if restricted)
  mental_wellbeing_restricted?: boolean;
  support_network: number; // 1-5
  programme_engagement: number; // 1-5
  assessment_completeness: number; // 0-100%
  session_attendance: number; // 0-100%
  mood_history: number[]; // 5 review cycles
  low_mood_count: number;
  gate_scores: Record<GateKey, number>;
  score_history: number[]; // 5 cycles
  gate_history: number[]; // 5 cycles
  certifications: string[];
  decision: 'approved' | 'modified' | 'overridden' | 'rejected' | null;
  pathway_position: number | null; // 0..11
  decision_reason: string;
  rehabilitation_remarks: string[];
  education_history: string;
  employment_history: string;
  rehabilitation_history: string;
  version: number; // Concurrency version
  created_at?: string;
  updated_at: string;
  updated_by_id: string;
  updated_by_name: string;
}

export interface ClinicalNote {
  id: string;
  institution_id: string;
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

export interface ChangeHistoryEntry {
  id: string;
  institution_id: string;
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

export interface ExtractedField {
  fieldName: string;
  fieldLabel: string;
  extractedValue: any;
  currentValue: any;
  isConflict: boolean;
  conflictDescription?: string;
  sourceCitation: string;
  isFactOrInterpretation: 'Extracted Fact' | 'AI Interpretation';
  confidenceScore: number;
  humanStatus: 'pending' | 'accepted' | 'rejected' | 'corrected';
  correctedValue?: any;
}

export interface VerificationResult {
  summary: string;
  missingRequiredFields: string[];
  fields: ExtractedField[];
  warnings: string[];
  rawTextPreview: string;
  analysisSource?: 'gemini' | 'local';
}

export interface UploadedDocument {
  id: string;
  institution_id: string;
  case_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_id: string;
  uploaded_by_name: string;
  uploaded_by_role: StaffRole;
  upload_source: 'word' | 'excel' | 'pdf' | 'manual';
  status: 'pending_review' | 'verified_applied' | 'rejected';
  extracted_summary?: string;
  ai_analysis?: VerificationResult;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
}

export interface AuditEvent {
  id: string;
  institution_id: string;
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

export type WorkspaceMode = 'facility' | 'person';

export type TabId =
  | 'dashboard'
  | 'cases'
  | 'intake'
  | 'person_intake'
  | 'plan'
  | 'prog'
  | 'clinical'
  | 'flags'
  | 'trend'
  | 'mx'
  | 'hand'
  | 'rep'
  | 'staff'
  | 'audit'
  | 'settings'
  | 'guide';

export type AutosaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface SystemStatus {
  mode: 'deployment' | 'demo';
  database_file: string;
  has_users: boolean;
  bootstrap_completed: boolean;
  institution: InstitutionConfig;
}
