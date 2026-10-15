import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DB, StaffRole, UserAccount } from './db';


function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.APP_MODE === 'deployment' ||
  process.env.DEPLOYMENT_MODE === 'true' ||
  process.env.NODE_ENV === 'deployment';

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (isProduction) {
    throw new Error(
      'Production requires a unique JWT_SECRET of at least 32 characters.'
    );
  }

  return 'rehabpath360-local-demo-only-secret-not-for-production';
}
const SESSION_EXPIRY = '2h';

export interface AuthUserPayload {
  id: string;
  institution_id: string; // Tenant identification
  email: string;
  full_name: string;
  role: StaffRole;
  badge_number: string;
  department: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(user: UserAccount): string {
  const payload: AuthUserPayload = {
    id: user.id,
    institution_id: user.institution_id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    badge_number: user.badge_number,
    department: user.department,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_EXPIRY });
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No session token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUserPayload;
    // Check if user still exists in DB and is active
    const userInDb = DB.findUserById(decoded.id, decoded.institution_id);
    if (!userInDb || userInDb.status !== 'active') {
      res.status(403).json({ error: 'User account is inactive or revoked.' });
      return;
    }
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function requireRoles(allowedRoles: StaffRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      DB.logAuditEvent({
        institution_id: req.user.institution_id,
        actor_id: req.user.id,
        actor_email: req.user.email,
        actor_name: req.user.full_name,
        actor_role: req.user.role,
        action: 'PERMISSION_CHECK_FAIL',
        resource_type: 'api_endpoint',
        resource_id: req.originalUrl,
        details: `Access denied. Role ${req.user.role} lacks required role (${allowedRoles.join(', ')}).`,
        ip_address: req.ip || '127.0.0.1',
        status: 'denied',
      });

      res.status(403).json({
        error: `Permission denied. Your role (${req.user.role}) is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}

/**
 * Validates which fields in a case update request are authorized for the user's role.
 * Prevents privilege escalation by submitting manual JSON keys.
 */
export function validateCaseFieldPermissions(
  role: StaffRole,
  fieldsToUpdate: Record<string, any>
): { allowed: boolean; disallowedField?: string } {
  // Administrator can edit all operational data
  if (role === 'Administrator') return { allowed: true };

  const restrictedFields: Record<string, StaffRole[]> = {
    // Mental health assessment
    mental_wellbeing: ['Psychologist'],
    // Pathway placement decisions
    decision: ['Warden'],
    pathway_position: ['Warden'],
    decision_reason: ['Warden'],
    // Education & skills
    education_level: ['Educator', 'Case Manager'],
    certifications: ['Educator', 'Case Manager'],
    // Attendance & basic engagement
    session_attendance: ['Case Manager', 'Educator', 'Warden'],
    programme_engagement: ['Case Manager', 'Psychologist', 'Warden'],
    // Reintegration & community transition
    employment_history: ['Case Manager', 'Community Rehabilitation Officer'],
    rehabilitation_remarks: ['Case Manager', 'Community Rehabilitation Officer', 'Warden'],
  };

  for (const field of Object.keys(fieldsToUpdate)) {
    if (field === 'id' || field === 'version' || field === 'institution_id') continue;

    if (restrictedFields[field]) {
      if (!restrictedFields[field].includes(role)) {
        return { allowed: false, disallowedField: field };
      }
    }
  }

  // Check gate scores updates
  if (fieldsToUpdate.gate_scores) {
    const gates = fieldsToUpdate.gate_scores;
    if (gates.wb !== undefined && role !== 'Psychologist') {
      return { allowed: false, disallowedField: 'gate_scores.wb (Clinical Well-being Gate)' };
    }
     if ((gates.edu !== undefined || gates.skl !== undefined) && role !== 'Warden') {
      return { allowed: false, disallowedField: 'gate_scores (Education/Skills Gate)' };
    }
  }

  return { allowed: true };
}
