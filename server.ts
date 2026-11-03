import 'dotenv/config';
import { registerUiTranslationRoutes } from './server/uiTranslate';
import express, { Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

import {
  DB,
  OffenderCase,
  StaffRole,
  InstitutionConfig,
  isDeploymentMode,
  setApplicationMode,
  DEPLOYMENT_DB_FILE,
  loadDatabase,
} from './server/db';
import {
  authenticateToken,
  requireRoles,
  generateToken,
  validateCaseFieldPermissions,
  AuthenticatedRequest,
} from './server/auth';
import {
  extractTextFromBuffer,
  verifyDocumentWithAI,
} from './server/documentAi';


const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
registerUiTranslationRoutes(app);

// Multer upload setup
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.csv', '.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: Word, Excel, CSV, PDF.`));
    }
  },
});

// Helper to mask sensitive fields based on staff role
function maskCaseForRole(c: OffenderCase, role?: StaffRole): Partial<OffenderCase> {
  const cloned = { ...c };
  // Educators and Case Managers must NOT see raw psychological/clinical well-being score
  if (role === 'Educator' || role === 'Case Manager') {
    (cloned as any).mental_wellbeing = undefined;
    (cloned as any).mental_wellbeing_restricted = true;
  }
  return cloned;
}

// -------------------------------------------------------------
// SYSTEM & INSTITUTION CONFIGURATION ROUTES
// -------------------------------------------------------------

// GET /api/system/status - Informs client of current deployment mode & setup status
app.get('/api/system/status', (_req, res) => {
  const users = DB.getUsers();
  const inst = DB.getInstitution();
  res.json({
    mode: isDeploymentMode() ? 'deployment' : 'demo',
    database_file: path.basename(DB.getActiveDbFile()),
    has_users: users.length > 0,
    bootstrap_completed: inst.is_demo ? true : loadDatabase().bootstrap_completed || false,
    institution: inst,
  });
});

app.post('/api/system/mode', authenticateToken, requireRoles(['Administrator']), (req: AuthenticatedRequest, res: Response): void => {
  const mode = req.body?.mode;
  if (mode !== 'demo' && mode !== 'deployment') { res.status(400).json({ error: 'Mode must be demo or deployment.' }); return; }
  if ((mode === 'deployment') === isDeploymentMode()) { res.json({ success: true, mode, database_file: path.basename(DB.getActiveDbFile()) }); return; }
  // Switching to a new clean database must never strand administrators
  // without the secret required to initialize its first account.
  if (mode === 'deployment') {
    let targetHasUsers = false;
    try {
      if (fs.existsSync(DEPLOYMENT_DB_FILE)) {
        const target = JSON.parse(fs.readFileSync(DEPLOYMENT_DB_FILE, 'utf8'));
        targetHasUsers = Array.isArray(target.users) && target.users.length > 0;
      }
    } catch {
      res.status(409).json({ error: 'Cannot verify the clean deployment database. Mode switch was cancelled.' });
      return;
    }
    if (!targetHasUsers) {
      const required = process.env.SETUP_TOKEN;
      if (!required || required.length < 32) {
        res.status(409).json({ error: 'Cannot enter clean mode without a configured SETUP_TOKEN (32+ characters). Mode switch was cancelled.' });
        return;
      }
      if (req.body?.setup_token !== required) {
        res.status(403).json({ error: 'Enter the correct first-administrator SETUP_TOKEN before switching into an empty clean database.' });
        return;
      }
    }
  }
  const user = req.user!;
  DB.logAuditEvent({ institution_id: user.institution_id, actor_id: user.id, actor_email: user.email, actor_name: user.full_name, actor_role: user.role, action: 'APPLICATION_MODE_SWITCH', resource_type: 'system', resource_id: mode, details: 'Administrator switched application mode to ' + mode + '; data remains in its separate database.', ip_address: req.ip || '127.0.0.1', status: 'success' });
  setApplicationMode(mode);
  res.json({ success: true, mode, database_file: path.basename(DB.getActiveDbFile()) });
});

// POST /api/setup/bootstrap-admin - Secure one-time setup for clean deployment
app.post('/api/setup/bootstrap-admin', (req, res): void => {
  try {
    const {
      institution_name,
      institution_code,
      admin_email,
      admin_password,
      admin_name,
      admin_badge,
      setup_token,
    } = req.body;

    if (!institution_name || !institution_code || !admin_email || !admin_password || !admin_name) {
      res.status(400).json({ error: 'All institution and administrator fields are required.' });
      return;
    }

    if (admin_password.length < 8) {
      res.status(400).json({ error: 'Administrator password must be at least 8 characters long.' });
      return;
    }

    const { user, institution } = DB.bootstrapFirstAdmin({
      institution_name,
      institution_code,
      admin_email,
      admin_password,
      admin_name,
      admin_badge: admin_badge || 'ADM-01',
      setup_token,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Institution initialized and first administrator provisioned successfully.',
      token,
      user: {
        id: user.id,
        institution_id: user.institution_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        badge_number: user.badge_number,
        department: user.department,
      },
      institution,
    });
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Bootstrap initialization failed.' });
  }
});

// GET /api/institution - Current active institution configuration
app.get('/api/institution', (req, res) => {
  const institution = DB.getInstitution();
  res.json({ institution });
});

// PATCH /api/institution - Update institution branding & staff designations (Admin only)
app.patch(
  '/api/institution',
  authenticateToken,
  requireRoles(['Administrator']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { name, code, logo_url, theme_primary, theme_teal, staff_designations } = req.body;
    const user = req.user!;

    const updated = DB.updateInstitution({
      ...(name ? { name } : {}),
      ...(code ? { code } : {}),
      ...(logo_url !== undefined ? { logo_url } : {}),
      ...(theme_primary ? { theme_primary } : {}),
      ...(theme_teal ? { theme_teal } : {}),
      ...(staff_designations ? { staff_designations } : {}),
    });

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'INSTITUTION_SETTINGS_UPDATE',
      resource_type: 'institution',
      resource_id: updated.id,
      details: `Updated facility configuration for ${updated.name}.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.json({ success: true, institution: updated });
  }
);

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = DB.findUserByEmail(email);
  if (!user) {
    DB.logAuditEvent({
      institution_id: DB.getInstitution().id,
      actor_id: 'unknown',
      actor_email: email,
      actor_name: 'Unrecognized user',
      actor_role: 'System',
      action: 'LOGIN_FAILED',
      resource_type: 'auth',
      resource_id: email,
      details: 'Failed login attempt: email address not registered.',
      ip_address: req.ip || '127.0.0.1',
      status: 'denied',
    });
    res.status(401).json({ error: 'Invalid credentials. Check email and password.' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ error: 'Account has been deactivated. Contact an administrator.' });
    return;
  }

  const isValidPassword = bcrypt.compareSync(password, user.password_hash);
  if (!isValidPassword) {
    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'LOGIN_FAILED',
      resource_type: 'auth',
      resource_id: user.id,
      details: 'Failed login attempt: incorrect password.',
      ip_address: req.ip || '127.0.0.1',
      status: 'denied',
    });
    res.status(401).json({ error: 'Invalid credentials. Check email and password.' });
    return;
  }

  DB.updateUserLogin(user.id);
  const token = generateToken(user);

  DB.logAuditEvent({
    institution_id: user.institution_id,
    actor_id: user.id,
    actor_email: user.email,
    actor_name: user.full_name,
    actor_role: user.role,
    action: 'LOGIN_SUCCESS',
    resource_type: 'auth',
    resource_id: user.id,
    details: `Authenticated as ${user.role} (${user.department}) for institution ${user.institution_id}.`,
    ip_address: req.ip || '127.0.0.1',
    status: 'success',
  });

  res.json({
    token,
    user: {
      id: user.id,
      institution_id: user.institution_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      badge_number: user.badge_number,
      department: user.department,
    },
    institution: DB.getInstitution(user.institution_id),
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user,
    institution: DB.getInstitution(req.user?.institution_id),
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    DB.logAuditEvent({
      institution_id: req.user.institution_id,
      actor_id: req.user.id,
      actor_email: req.user.email,
      actor_name: req.user.full_name,
      actor_role: req.user.role,
      action: 'LOGOUT',
      resource_type: 'auth',
      resource_id: req.user.id,
      details: 'Staff member logged out gracefully.',
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/auth/provision-user (Administrator only - scoped to current institution)
app.post(
  '/api/auth/provision-user',
  authenticateToken,
  requireRoles(['Administrator']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { email, full_name, role, badge_number, department, temporary_password } = req.body;
    const user = req.user!;

    if (!email || !full_name || !role || !badge_number) {
      res.status(400).json({ error: 'Missing required staff account fields.' });
      return;
    }

    if (DB.findUserByEmail(email, user.institution_id)) {
      res.status(409).json({ error: 'A staff member with this email already exists in this institution.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(temporary_password || 'RehabPath360!', salt);

    const newUser = DB.addUser({
      id: `usr-${Date.now()}`,
      institution_id: user.institution_id,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name,
      role,
      badge_number,
      department: department || 'Operations',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: null,
    });

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'USER_PROVISION',
      resource_type: 'staff_user',
      resource_id: newUser.id,
      details: `Provisioned account for ${full_name} with role ${role} in institution ${user.institution_id}.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        institution_id: newUser.institution_id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        badge_number: newUser.badge_number,
      },
    });
  }
);

// GET /api/auth/staff (Admin and Warden - scoped to current institution)
app.get(
  '/api/auth/staff',
  authenticateToken,
  requireRoles(['Administrator', 'Warden']),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const users = DB.getUsers(user.institution_id).map((u) => ({
      id: u.id,
      institution_id: u.institution_id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      badge_number: u.badge_number,
      department: u.department,
      status: u.status,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
    }));
    res.json({ staff: users });
  }
);

// -------------------------------------------------------------
// CASES & REHABILITATION MANAGEMENT ROUTES (INSTITUTION-SCOPED)
// -------------------------------------------------------------

// GET /api/cases - List with search, filtering, and role masking (TENANT ISOLATED)
app.get('/api/cases', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { search, severity, decision } = req.query;

  // Strict tenant isolation: only retrieve cases belonging to current institution
  let cases = DB.getCases(user.institution_id);

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    cases = cases.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.crime_type.toLowerCase().includes(q)
    );
  }

  if (severity) {
    cases = cases.filter((c) => c.crime_severity === parseInt(severity as string, 10));
  }

  if (decision && typeof decision === 'string') {
    cases = cases.filter((c) => (decision === 'pending' ? !c.decision : c.decision === decision));
  }

  // Mask sensitive fields based on role
  const maskedCases = cases.map((c) => maskCaseForRole(c, user.role));
  res.json({ cases: maskedCases });
});

// POST /api/cases - Create a new case in the institution
app.post(
  '/api/cases',
  authenticateToken,
  requireRoles(['Administrator', 'Warden', 'Case Manager']),
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const {
      first_name,
      last_name,
      date_of_birth,
      age_band,
      crime_severity,
      crime_type,
      sentence_length_months,
      education_level,
      support_network,
      programme_engagement,
      education_history,
      employment_history,
      rehabilitation_history,
    } = req.body;

    if (!first_name || !last_name || !crime_type || !crime_severity) {
      res.status(400).json({ error: 'First name, last name, crime type and severity are required.' });
      return;
    }

    const nextNum = 1000 + DB.getCases(user.institution_id).length + 1;
    const caseId = `RP-${nextNum}`;

    const newCase: OffenderCase = {
      id: caseId,
      institution_id: user.institution_id,
      first_name,
      last_name,
      date_of_birth: date_of_birth || '1990-01-01',
      age_band: age_band || '25–34',
      crime_severity: Number(crime_severity) || 3,
      crime_type,
      sentence_length_months: Number(sentence_length_months) || 24,
      education_level: Number(education_level) || 3,
      mental_wellbeing: 3,
      support_network: Number(support_network) || 3,
      programme_engagement: Number(programme_engagement) || 3,
      assessment_completeness: 85,
      session_attendance: 85,
      mood_history: [3, 3, 3, 3, 3],
      low_mood_count: 0,
      gate_scores: { edu: 50, beh: 50, wb: 50, skl: 50 },
      score_history: [45],
      gate_history: [50],
      certifications: [],
      decision: null,
      pathway_position: null,
      decision_reason: '',
      rehabilitation_remarks: ['Initial assessment profile opened.'],
      education_history: education_history || 'Secondary education recorded.',
      employment_history: employment_history || 'Prior employment recorded.',
      rehabilitation_history: rehabilitation_history || 'No prior custodial rehabilitation.',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by_id: user.id,
      updated_by_name: user.full_name,
    };

    DB.saveCase(newCase, user.institution_id);

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'CASE_CREATE',
      resource_type: 'case',
      resource_id: caseId,
      details: `Created new case profile for ${first_name} ${last_name}.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.status(201).json({
      success: true,
      case: maskCaseForRole(newCase, user.role),
      message: 'New case record registered successfully.',
    });
  }
);

// GET /api/cases/:id - Single case detail with change history (CROSS-TENANT ACCESS CHECK)
app.get('/api/cases/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const caseId = req.params.id;
  const user = req.user!;

  const c = DB.findCaseById(caseId);
  if (!c) {
    res.status(404).json({ error: `Case ${caseId} not found.` });
    return;
  }

  // Cross-institution access restriction
  if (c.institution_id !== user.institution_id) {
    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'CROSS_INSTITUTION_ACCESS_DENIED',
      resource_type: 'case',
      resource_id: caseId,
      details: `Unauthorized attempt to access case belonging to institution ${c.institution_id}.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'denied',
    });

    res.status(403).json({
      error: 'Access Denied: Cross-institution access is prohibited. This case belongs to another institution.',
    });
    return;
  }

  const masked = maskCaseForRole(c, user.role);
  const history = DB.getChangeHistory(caseId, user.institution_id);
  res.json({ case: masked, change_history: history });
});

// PATCH /api/cases/:id - Update case fields with optimistic locking & field-level RBAC
app.patch('/api/cases/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const caseId = req.params.id;
  const user = req.user!;
  const currentCase = DB.findCaseById(caseId);

  if (!currentCase) {
    res.status(404).json({ error: `Case ${caseId} not found.` });
    return;
  }

  // Multi-tenancy check
  if (currentCase.institution_id !== user.institution_id) {
    res.status(403).json({
      error: 'Permission Denied: Cross-institution data modification is strictly prohibited.',
    });
    return;
  }

  const updates = req.body;
 if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    res.status(400).json({
      error: 'Request body must be a JSON object.',
    });
    return;
  }

  const editableFields = new Set([
    'first_name',
    'last_name',
    'crime_severity',
    'education_level',
    'mental_wellbeing',
    'support_network',
    'programme_engagement',
    'session_attendance',
    'education_history',
    'employment_history',
    'rehabilitation_history',
    'gate_scores',
    'version',
  ]);

  const unexpectedFields = Object.keys(updates).filter(
    (field) => !editableFields.has(field)
  );

  if (unexpectedFields.length > 0) {
    res.status(400).json({
      error: `Unsupported or protected field(s): ${unexpectedFields.join(', ')}`,
    });
    return;
  }

  // Validate progression gate scores before saving them.
  if (updates.gate_scores !== undefined) {
    const gates = updates.gate_scores;

    if (!gates || typeof gates !== 'object' || Array.isArray(gates)) {
      res.status(400).json({ error: 'Gate scores must be an object.' });
      return;
    }

    const allowedGateKeys = new Set(['edu', 'beh', 'wb', 'skl']);
    const invalidKeys = Object.keys(gates).filter(
      (key) => !allowedGateKeys.has(key)
    );

    if (invalidKeys.length > 0) {
      res.status(400).json({ error: 'Unsupported gate score field.' });
      return;
    }

    const invalidValues = Object.values(gates).some(
      (value) =>
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
    );

    if (invalidValues) {
      res.status(400).json({
        error: 'Gate scores must be whole-number percentages from 0 to 100.',
      });
      return;
    }
  }

  // Optimistic concurrency check
  if (updates.version !== undefined && updates.version !== currentCase.version) {
    res.status(409).json({
      error: `Edit Conflict: This record was modified by another staff member (current version: ${currentCase.version}, your version: ${updates.version}). Please refresh to load the latest data.`,
    });
    return;
  }

  // Server-side field-level permission check
  const permissionUpdates = { ...updates };

if (
  updates.gate_scores &&
  typeof updates.gate_scores === 'object' &&
  !Array.isArray(updates.gate_scores)
) {
  const changedGates = Object.fromEntries(
    Object.entries(updates.gate_scores).filter(
      ([key, value]) =>
        (currentCase.gate_scores as any)[key] !== value
    )
  );

  permissionUpdates.gate_scores = changedGates;
}

const permCheck = validateCaseFieldPermissions(
  user.role,
  permissionUpdates
);
  if (!permCheck.allowed) {
    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'PERMISSION_CHECK_FAIL',
      resource_type: 'case_field',
      resource_id: `${caseId}.${permCheck.disallowedField}`,
      details: `Attempted unauthorized update of field '${permCheck.disallowedField}'.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'denied',
    });

    res.status(403).json({
      error: `Permission Denied: Your role (${user.role}) is not authorized to edit field '${permCheck.disallowedField}'.`,
    });
    return;
  }

  // Track field changes in history
  const allowedFieldKeys: (keyof OffenderCase)[] = [
    'first_name',
    'last_name',
    'crime_severity',
    'education_level',
    'mental_wellbeing',
    'support_network',
    'programme_engagement',
    'session_attendance',
    'education_history',
    'employment_history',
    'rehabilitation_history',
    'decision_reason',
  ];

  for (const key of allowedFieldKeys) {
    if (updates[key] !== undefined && updates[key] !== (currentCase as any)[key]) {
      DB.logChangeHistory({
        institution_id: user.institution_id,
        case_id: caseId,
        field_name: key,
        previous_value: String((currentCase as any)[key] ?? ''),
        new_value: String(updates[key] ?? ''),
        changed_by_id: user.id,
        changed_by_name: user.full_name,
        changed_by_role: user.role,
        change_source: 'manual_edit',
      });
    }
  }

  // Handle gate scores changes
  if (updates.gate_scores) {
    const oldGates = currentCase.gate_scores;
    const newGates = { ...oldGates, ...updates.gate_scores };
    for (const [gKey, gVal] of Object.entries(updates.gate_scores)) {
      if ((oldGates as any)[gKey] !== gVal) {
        DB.logChangeHistory({
          institution_id: user.institution_id,
          case_id: caseId,
          field_name: `gate_scores.${gKey}`,
          previous_value: `${(oldGates as any)[gKey]}%`,
          new_value: `${gVal}%`,
          changed_by_id: user.id,
          changed_by_name: user.full_name,
          changed_by_role: user.role,
          change_source: 'manual_edit',
        });
      }
    }
    updates.gate_scores = newGates;
  }

  // Apply updates (preserve institution_id)
  const updatedCase: OffenderCase = {
    ...currentCase,
    ...updates,
    institution_id: user.institution_id,
    version: currentCase.version + 1,
    updated_at: new Date().toISOString(),
    updated_by_id: user.id,
    updated_by_name: user.full_name,
  };

  DB.saveCase(updatedCase, user.institution_id);
  DB.clearDraft(caseId, user.id);

  DB.logAuditEvent({
    institution_id: user.institution_id,
    actor_id: user.id,
    actor_email: user.email,
    actor_name: user.full_name,
    actor_role: user.role,
    action: 'CASE_UPDATE',
    resource_type: 'case',
    resource_id: caseId,
    details: `Updated fields: ${Object.keys(updates).filter((k) => k !== 'version' && k !== 'institution_id').join(', ')}.`,
    ip_address: req.ip || '127.0.0.1',
    status: 'success',
  });

  res.json({
    success: true,
    case: maskCaseForRole(updatedCase, user.role),
    message: 'Record saved successfully.',
  });
});

// POST /api/cases/:id/decide - Human verification of AI Pathway (Warden/Admin)
app.post(
  '/api/cases/:id/decide',
  authenticateToken,
  requireRoles(['Warden', 'Administrator']),
  (req: AuthenticatedRequest, res: Response): void => {
    const caseId = req.params.id;
    const user = req.user!;
    const { decision, pathway_position, reason } = req.body;

    const currentCase = DB.findCaseById(caseId, user.institution_id);
    if (!currentCase) {
      res.status(404).json({ error: `Case ${caseId} not found in this institution.` });
      return;
    }

    if (!['approved', 'modified', 'overridden'].includes(decision)) {
      res.status(400).json({ error: 'Invalid decision type.' });
      return;
    }

    if (decision !== 'approved' && !reason?.trim()) {
      res.status(400).json({ error: 'A documented reason is required to modify or override an AI recommendation.' });
      return;
    }

    const prevDecision = currentCase.decision;
    const prevPos = currentCase.pathway_position;

    currentCase.decision = decision;
    currentCase.pathway_position = pathway_position;
    currentCase.decision_reason = reason || '';
    currentCase.version += 1;
    currentCase.updated_at = new Date().toISOString();
    currentCase.updated_by_id = user.id;
    currentCase.updated_by_name = user.full_name;

    DB.saveCase(currentCase, user.institution_id);

    DB.logChangeHistory({
      institution_id: user.institution_id,
      case_id: caseId,
      field_name: 'decision',
      previous_value: `${prevDecision || 'pending'} (pos: ${prevPos})`,
      new_value: `${decision} (pos: ${pathway_position}). Reason: ${reason || 'N/A'}`,
      changed_by_id: user.id,
      changed_by_name: user.full_name,
      changed_by_role: user.role,
      change_source: 'human_verification',
    });

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: `DECISION_${decision.toUpperCase()}`,
      resource_type: 'case',
      resource_id: caseId,
      details: `Decision verified: ${decision}. Target pathway stage: ${pathway_position}. ${reason ? 'Reason: ' + reason : ''}`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.json({ success: true, case: maskCaseForRole(currentCase, user.role) });
  }
);

// POST /api/cases/:id/advance - Advance stage (Warden/Admin)
app.post(
  '/api/cases/:id/advance',
  authenticateToken,
  requireRoles(['Warden', 'Administrator']),
  (req: AuthenticatedRequest, res: Response): void => {
    const caseId = req.params.id;
    const user = req.user!;
    const currentCase = DB.findCaseById(caseId, user.institution_id);

    if (!currentCase) {
      res.status(404).json({ error: `Case ${caseId} not found in this institution.` });
      return;
    }

    if (currentCase.pathway_position == null) {
      res.status(400).json({ error: 'Cannot advance unverified placement. Approve or set pathway first.' });
      return;
    }

    if (currentCase.pathway_position >= 11) {
      res.status(400).json({ error: 'Case has reached final stage (Reintegration C). Prepare handover brief.' });
      return;
    }

    // Verify all 4 gates meet 70% threshold
    const gates = currentCase.gate_scores;
    if (gates.edu < 70 || gates.beh < 70 || gates.wb < 70 || gates.skl < 70) {
      res.status(400).json({
        error: 'Gate requirement not met. All 4 domains must reach at least 70% verified evidence before advancing.',
      });
      return;
    }

    const prevPos = currentCase.pathway_position;
    const newPos = prevPos + 1;

    currentCase.pathway_position = newPos;
    currentCase.decision = currentCase.decision || 'approved';
    currentCase.gate_scores = {
      edu: Math.max(0, currentCase.gate_scores.edu - 10),
      beh: Math.max(0, currentCase.gate_scores.beh - 12),
      wb: Math.max(0, currentCase.gate_scores.wb - 8),
      skl: Math.max(0, currentCase.gate_scores.skl - 10),
    };
    currentCase.version += 1;
    currentCase.updated_at = new Date().toISOString();
    currentCase.updated_by_id = user.id;
    currentCase.updated_by_name = user.full_name;

    DB.saveCase(currentCase, user.institution_id);

    DB.logChangeHistory({
      institution_id: user.institution_id,
      case_id: caseId,
      field_name: 'pathway_position',
      previous_value: `Stage ${prevPos}`,
      new_value: `Stage ${newPos} (Gates reset for new stage)`,
      changed_by_id: user.id,
      changed_by_name: user.full_name,
      changed_by_role: user.role,
      change_source: 'gate_progression',
    });

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'CASE_ADVANCE',
      resource_type: 'case',
      resource_id: caseId,
      details: `Advanced from stage ${prevPos} to ${newPos}. Gate benchmarks reset for new sub-level.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.json({ success: true, case: maskCaseForRole(currentCase, user.role) });
  }
);

// -------------------------------------------------------------
// CLINICAL NOTES ROUTES (LEAST PRIVILEGE: PSYCHOLOGISTS & ADMIN ONLY)
// -------------------------------------------------------------

// GET /api/cases/:id/clinical-notes
app.get(
  '/api/cases/:id/clinical-notes',
  authenticateToken,
  requireRoles(['Psychologist', 'Administrator']),
  (req: AuthenticatedRequest, res: Response): void => {
    const caseId = req.params.id;
    const user = req.user!;

    const currentCase = DB.findCaseById(caseId);
    if (!currentCase || currentCase.institution_id !== user.institution_id) {
      res.status(404).json({ error: `Case ${caseId} not found in this institution.` });
      return;
    }

    const notes = DB.getClinicalNotes(caseId, user.institution_id);
    res.json({ notes });
  }
);

// POST /api/cases/:id/clinical-notes
app.post(
  '/api/cases/:id/clinical-notes',
  authenticateToken,
  requireRoles(['Psychologist', 'Administrator']),
  (req: AuthenticatedRequest, res: Response): void => {
    const caseId = req.params.id;
    const user = req.user!;
    const { title, content, note_type, recommendations, confidentiality } = req.body;

    const currentCase = DB.findCaseById(caseId);
    if (!currentCase || currentCase.institution_id !== user.institution_id) {
      res.status(404).json({ error: `Case ${caseId} not found in this institution.` });
      return;
    }

    if (!title || !content || !note_type) {
      res.status(400).json({ error: 'Title, content, and note type are required.' });
      return;
    }

    const note = DB.addClinicalNote({
      id: `cn-${Date.now()}`,
      institution_id: user.institution_id,
      case_id: caseId,
      author_id: user.id,
      author_name: user.full_name,
      author_role: user.role,
      note_type,
      confidentiality: confidentiality || 'restricted_clinical',
      title,
      content,
      recommendations: recommendations || [],
      created_at: new Date().toISOString(),
    });

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'CLINICAL_NOTE_ADD',
      resource_type: 'clinical_note',
      resource_id: note.id,
      details: `Added ${note_type} note for case ${caseId} (${confidentiality || 'restricted_clinical'}).`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.status(201).json({ success: true, note });
  }
);

// -------------------------------------------------------------
// AUTOSAVE DRAFT ROUTES
// -------------------------------------------------------------

// POST /api/cases/:id/draft - Store debounced unsaved draft on server
app.post('/api/cases/:id/draft', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id;
  const user = req.user!;
if (!DB.findCaseById(caseId, user.institution_id)) {
  res.status(404).json({
    error: 'Case not found in this institution.',
  });
  return;
}
  const draftData = req.body.draft;

  const draft = DB.saveDraft(caseId, user.id, draftData, user.institution_id);
  res.json({ success: true, saved_at: draft.updated_at });
});

// GET /api/cases/:id/draft - Retrieve existing draft
app.get('/api/cases/:id/draft', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id;
  const user = req.user!;
if (!DB.findCaseById(caseId, user.institution_id)) {
  res.status(404).json({
    error: 'Case not found in this institution.',
  });
  return;
}
  const draft = DB.getDraft(caseId, user.id, user.institution_id);
  res.json({ draft: draft?.draft_data || null, updated_at: draft?.updated_at || null });
});

// DELETE /api/cases/:id/draft - Clear draft on explicit save
app.delete('/api/cases/:id/draft', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id;
  const user = req.user!;
if (!DB.findCaseById(caseId, user.institution_id)) {
  res.status(404).json({
    error: 'Case not found in this institution.',
  });
  return;
}
  DB.clearDraft(caseId, user.id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// DOCUMENT INTAKE & AI VERIFICATION ROUTES
// -------------------------------------------------------------

// POST /api/documents/upload - Upload Word, Excel, CSV, or PDF
app.post(
  '/api/documents/upload',
  authenticateToken,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const file = req.file;
      const caseId = req.body.case_id;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded.' });
        return;
      }
      if (!caseId) {
        res.status(400).json({ error: 'Target case_id is required.' });
        return;
      }

      const currentCase = DB.findCaseById(caseId, user.institution_id);
      if (!currentCase) {
        res.status(404).json({ error: `Case ${caseId} does not exist in this institution.` });
        return;
      }

      // Save file to disk
      const uniqueFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = path.resolve(process.cwd(), 'uploads', uniqueFilename);
      fs.writeFileSync(storagePath, file.buffer);

      // Extract text and preview structure
      const parsedData = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);

      // Run AI verification against the target case record
      const aiVerification = await verifyDocumentWithAI(
        parsedData.text,
        currentCase,
        file.originalname
      );

      // Record document in database scoped to institution
      const doc = DB.addDocument({
        id: `doc-${Date.now()}`,
        institution_id: user.institution_id,
        case_id: caseId,
        filename: uniqueFilename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size,
        storage_path: storagePath,
        uploaded_by_id: user.id,
        uploaded_by_name: user.full_name,
        uploaded_by_role: user.role,
        upload_source: file.originalname.endsWith('.docx')
          ? 'word'
          : file.originalname.endsWith('.pdf')
          ? 'pdf'
          : 'excel',
        status: 'pending_review',
        extracted_summary: aiVerification.summary,
        ai_analysis: aiVerification,
        created_at: new Date().toISOString(),
      });

      DB.logAuditEvent({
        institution_id: user.institution_id,
        actor_id: user.id,
        actor_email: user.email,
        actor_name: user.full_name,
        actor_role: user.role,
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'document',
        resource_id: doc.id,
        details: `Uploaded ${file.originalname} (${file.size} bytes). AI extraction identified ${aiVerification.fields.length} candidate fields.`,
        ip_address: req.ip || '127.0.0.1',
        status: 'success',
      });

      res.status(201).json({
        success: true,
        document: doc,
        verification: aiVerification,
        sheets: parsedData.sheets,
        tablePreview: parsedData.tablePreview,
      });
    } catch (err: any) {
      console.error('Document upload error:', err);
      res.status(500).json({ error: `Document parsing error: ${err.message}` });
    }
  }
);

// POST /api/documents/:id/commit - Human-in-the-loop: apply verified fields
app.post(
  '/api/documents/:id/commit',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    const docId = req.params.id;
    const user = req.user!;
    const { accepted_fields } = req.body; // array of { fieldName, finalValue }

    const doc = DB.findDocumentById(docId, user.institution_id);
    if (!doc) {
      res.status(404).json({ error: `Document ${docId} not found in this institution.` });
      return;
    }

    const currentCase = DB.findCaseById(doc.case_id, user.institution_id);
    if (!currentCase) {
      res.status(404).json({ error: `Case ${doc.case_id} not found.` });
      return;
    }

    if (!Array.isArray(accepted_fields) || accepted_fields.length === 0) {
      res.status(400).json({ error: 'No verified fields specified to commit.' });
      return;
    }

    
    // Only explicitly approved fields may be imported from documents.
    const allowedDocumentFields = new Set<string>([
      'session_attendance',
      'education_level',
      'mental_wellbeing',
      'certifications',
      'gate_scores.skl',
    ]);

    if (
      accepted_fields.some(
        (item: any) =>
          !item ||
          typeof item.fieldName !== 'string' ||
          !allowedDocumentFields.has(item.fieldName)
      )
    ) {
      res.status(400).json({
        error: 'Document import contains an unsupported or protected field.',
      });
      return;
    }

    const updates: Record<string, any> = {};

    for (const item of accepted_fields as {
      fieldName: string;
      finalValue: any;
    }[]) {
      if (item.fieldName === 'certifications') {
        const raw = item.finalValue;
        const values = Array.isArray(raw)
          ? raw
          : typeof raw === 'string'
            ? raw.split(',')
            : null;

        if (
          !values ||
          values.some((value: any) => typeof value !== 'string')
        ) {
          res.status(400).json({
            error: 'Invalid certifications value.',
          });
          return;
        }

        updates.certifications = values
          .map((value: string) => value.trim())
          .filter(Boolean)
          .slice(0, 50);

        continue;
      }

      const value = Number(item.finalValue);
      const isRating = [
        'education_level',
        'mental_wellbeing',
      ].includes(item.fieldName);

      const min = isRating ? 1 : 0;
      const max = isRating ? 5 : 100;

      if (
        !Number.isInteger(value) ||
        value < min ||
        value > max
      ) {
        res.status(400).json({
          error: `Invalid value for ${item.fieldName}.`,
        });
        return;
      }

      if (item.fieldName === 'gate_scores.skl') {
        updates.gate_scores = {
          ...currentCase.gate_scores,
          skl: value,
        };
      } else {
        updates[item.fieldName] = value;
      }
    }

    // Run RBAC permission validation on accepted fields
    const permCheck = validateCaseFieldPermissions(user.role, updates);
    if (!permCheck.allowed) {
      res.status(403).json({
        error: `Permission Denied: Your role (${user.role}) cannot commit changes to '${permCheck.disallowedField}'. Ask an authorized officer to review.`,
      });
      return;
    }

    // Apply updates and log change history
    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'gate_scores') {
        DB.logChangeHistory({
          institution_id: user.institution_id,
          case_id: currentCase.id,
          field_name: key,
          previous_value: String((currentCase as any)[key] ?? ''),
          new_value: String(val ?? ''),
          changed_by_id: user.id,
          changed_by_name: user.full_name,
          changed_by_role: user.role,
          change_source: 'ai_verified_import',
        });
      }
    }

    const updatedCase = {
      ...currentCase,
      ...updates,
      institution_id: user.institution_id,
      version: currentCase.version + 1,
      updated_at: new Date().toISOString(),
      updated_by_id: user.id,
      updated_by_name: user.full_name,
    };

    DB.saveCase(updatedCase, user.institution_id);

    doc.status = 'verified_applied';
    doc.verified_at = new Date().toISOString();
    doc.verified_by = `${user.full_name} (${user.role})`;
    DB.updateDocument(doc, user.institution_id);

    DB.logAuditEvent({
      institution_id: user.institution_id,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'AI_VERIFICATION_ACCEPT',
      resource_type: 'document',
      resource_id: doc.id,
      details: `Committed ${accepted_fields.length} verified fields to case ${currentCase.id} from document ${doc.original_name}.`,
      ip_address: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.json({
      success: true,
      case: maskCaseForRole(updatedCase, user.role),
      message: 'Verified fields have been successfully committed to the case record.',
    });
  }
);

// -------------------------------------------------------------
// REPORTS, AUDIT, AND SYSTEM EXPORTS (TENANT ISOLATED)
// -------------------------------------------------------------

// GET /api/audit-events (Admin and Warden only - scoped to institution)
app.get(
  '/api/audit-events',
  authenticateToken,
  requireRoles(['Administrator', 'Warden']),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const events = DB.getAuditEvents(user.institution_id, 250);
    res.json({ events });
  }
);

// GET /api/reports/export-csv - Role-based export with masked fields (TENANT ISOLATED)
app.get('/api/reports/export-csv', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  // Strict tenant isolation: only export current institution's cases
  const cases = DB.getCases(user.institution_id).map((c) => maskCaseForRole(c, user.role));

  const headers = [
    'Case ID',
    'Institution ID',
    'Full Name',
    'Age Band',
    'Crime Severity',
    'Education Level',
    ...(user.role !== 'Educator' && user.role !== 'Case Manager' ? ['Mental Well-being'] : []),
    'Support Network',
    'Programme Engagement',
    'Attendance %',
    'Decision',
    'Pathway Stage',
    'Last Updated',
  ];

  const rows = cases.map((c) => [
    c.id,
    c.institution_id,
    `"${c.first_name} ${c.last_name}"`,
    c.age_band,
    c.crime_severity,
    c.education_level,
    ...(user.role !== 'Educator' && user.role !== 'Case Manager' ? [c.mental_wellbeing ?? 'N/A'] : []),
    c.support_network,
    c.programme_engagement,
    `${c.session_attendance}%`,
    c.decision || 'Pending',
    c.pathway_position != null ? `Stage ${c.pathway_position}` : 'Awaiting verification',
    c.updated_at,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  DB.logAuditEvent({
    institution_id: user.institution_id,
    actor_id: user.id,
    actor_email: user.email,
    actor_name: user.full_name,
    actor_role: user.role,
    action: 'REPORT_EXPORT',
    resource_type: 'export_csv',
    resource_id: 'all_cases',
    details: `Exported ${cases.length} records for institution ${user.institution_id} to CSV with role permissions applied.`,
    ip_address: req.ip || '127.0.0.1',
    status: 'success',
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rehabpath360_caseload_export.csv"');
  res.send(csvContent);
});

// -------------------------------------------------------------
// VITE SPA MIDDLEWARE & PRODUCTION SERVING
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    
const vite = await createViteServer({
  server: {
    middlewareMode: true,
    host: HOST,
    port: PORT,
    watch: {
      ignored: ['**/data/**', '**/uploads/**'],
    },
  },
  appType: 'spa',
});
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(
      `RehabPath360 Server running at http://${HOST}:${PORT} [Mode: ${
        isDeploymentMode() ? 'CLEAN DEPLOYMENT' : 'EXHIBITION DEMO'
      }]`
    );
  });
}

startServer();
