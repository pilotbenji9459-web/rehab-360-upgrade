# REHABPATH360 — Enterprise Rehabilitation Management & Decision-Support Platform

REHABPATH360 is an enterprise, full-stack, evidence-based rehabilitation management and decision-support web application. It combines explainable AI (XAI) placement models, human-in-the-loop professional verification, multi-format document intake (Word, Excel, PDF), persistent relational storage with optimistic concurrency, role-based access control (RBAC) with clinical least-privilege isolation, longitudinal review trend analytics, and in-browser AES-256-GCM encrypted parole handover packages.

---

## 1. System Architecture

- **Frontend**: React 19 + TypeScript, Tailwind CSS, IBM Plex Sans & Serif typography, PWA offline manifest & service worker caching.
- **Backend**: Node.js + Express 5 running on port 3000 (`server.ts`), integrated with Vite middleware for dev and static serving in production.
- **Persistence & Database**:
  - Embedded persistent relational schema stored in `data/rehabpath360.db.json` with synchronous atomic file replacement (ACID-safe).
  - Production Supabase/PostgreSQL migration provided in `supabase/migrations/20261015000000_init_rehabpath360.sql` complete with Row-Level Security (RLS) policies.
- **Authentication & Security**:
  - JWT Bearer token sessions (`server/auth.ts`) with bcrypt password hashing.
  - Role-Based Access Control (RBAC) enforced on the server for all reads, mutations, uploads, and exports.
  - Strict clinical least-privilege: Psychological evaluations and mental health records are restricted exclusively to Psychologists and Administrators.
- **Document & AI Intake Engine**:
  - Ingestion of Word (`.docx` via `mammoth`), Excel spreadsheets & CSVs (`.xlsx`, `.csv` via `xlsx`), and PDFs (`.pdf` via `pdf-parse`).
  - Server-side Gemini 3.8 Flash (`@google/genai`) with prompt injection defenses (`<untrusted_document_data>` wrapping) and strict schema validation.
  - Discrepancy, conflict, and missing field detection citing exact text or spreadsheet locations.
  - Human-in-the-loop verification screen: Staff review, accept, correct, or reject proposed fields before saving.

---

## 2. Staff Roles & Credentials

The platform includes pre-provisioned demo accounts across all 6 institutional roles:

| Role | Institutional Email | Name | Department | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@rehabpath.gov` | Arthur Pendelton | Executive Administration | Manage staff accounts, view system audits, full case access |
| **Warden** | `warden@rehabpath.gov` | Marcus Vance | Custodial & Operations | Verify/modify/override pathways, advance stages, operational edits |
| **Psychologist** | `psychologist@rehabpath.gov` | Dr. Fiona Gallagher | Clinical Psychology | Protected psychological notes, mental well-being & gate edits |
| **Case Manager** | `casemanager@rehabpath.gov` | David Reynolds | Individual Rehabilitation | Case remarks, rehabilitation plans, attendance reviews |
| **Educator** | `educator@rehabpath.gov` | Elena Rostova | Vocational & Literacy | Education & skills gates, course roster imports, certificates |
| **Community Rehab Officer** | `probation@rehabpath.gov` | Hannah Brooks | Community Reintegration | Reintegration tracking, parole handovers, post-release support |

*Default Password for all demonstration accounts:* `RehabPath360!`

---

## 3. Implemented Capabilities

1. **Modern Homepage & Landing Page**: Navy-blue (`#0a192f`) and teal branding, institutional badges, platform metrics, 4-level pathway explainer, and role permissions matrix.
2. **Real Authentication & Role Dashboards**: Genuine JWT token sessions, password recovery flow, and tailored dashboards for every role.
3. **Caseload Management with Autosave**:
   - Debounced draft saving (~2s inactivity) to `/api/cases/:id/draft`.
   - Explicit save with optimistic locking (`version` check).
   - "Saved", "Saving...", "Unsaved changes", and "Save failed" status indicators with timestamp.
   - Field-level change audit history recording previous and new values.
4. **Unified Document Intake & AI Verification**:
   - Upload `.docx`, `.xlsx`, `.csv`, `.pdf`.
   - Spreadsheet worksheet selector and row preview.
   - Discrepancy detection comparing extracted candidate data against authorized records.
   - Fact vs. AI interpretation badges and textual citations.
   - Human-in-the-loop staff decision toggles (Accept / Correct / Reject) with server-side permission checks.
5. **Protected Clinical Psychology Records**: Strict least-privilege barrier locking psychological evaluations from unauthorized roles.
6. **Immutable Server-Side Audit Trail**: Full event logging for logins, permission denials, case updates, document imports, and exports.
7. **Reports & Exports**: 15-section printable rehabilitation report and role-masked CSV caseload export.
8. **Client-Side AES-256-GCM Handover Packaging**: In-browser authenticated encryption for community parole handover briefs.

---

## 4. Environment Variables (`.env.example`)

```ini
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
JWT_SECRET=rehabpath360_super_secure_jwt_secret_key_change_in_production
SESSION_TIMEOUT_MINUTES=60
DATABASE_PATH=./data/rehabpath360.db.json
GEMINI_API_KEY=
```

---

## 5. Running & Deploying

### Development
```bash
npm run dev
```
Starts the full-stack Express server at `http://0.0.0.0:3000` with Vite middleware mounted.

### Automated Test Suite
```bash
npx tsx scripts/test_scenarios.ts
```
Verifies all 10 security, persistence, optimistic locking, and RBAC scenarios.

### Production Build
```bash
npm run build
npm start
```
Compiles TypeScript, bundles frontend assets with Vite to `dist/`, and serves via Express.

### Deploying to Supabase PostgreSQL
1. Open your Supabase project dashboard.
2. Navigate to **SQL Editor**.
3. Run the migration file: `supabase/migrations/20261015000000_init_rehabpath360.sql`.
4. RLS policies and table constraints will be initialized immediately.
