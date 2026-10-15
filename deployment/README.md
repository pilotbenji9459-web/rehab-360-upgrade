# REHABPATH360 — Clean Deployment Package & Institutional Multi-Tenancy

This directory contains the production-ready, clean deployment configuration for **REHABPATH360**.

Unlike the Exhibition Demo version (which contains fictional synthetic caseloads and pre-seeded demonstration staff accounts), this deployment package starts with:
- **Zero staff accounts**
- **Zero prisoner/case records**
- **Zero clinical notes**
- **Zero uploaded documents**
- **Independent database storage** (`data/rehabpath360.deployment.db.json`)
- **Institution-level data isolation** enforced across all API endpoints and database queries

---

## 1. How to Create a Separate Standalone Repository Manually

To deploy this clean application as its own independent GitHub repository:

```bash
# 1. Create a fresh directory outside the demo repo
mkdir rehabpath360-deployment
cd rehabpath360-deployment

# 2. Copy the application source code
cp -r /path/to/RehabPath360/* .
cp deployment/.env.example .env

# 3. Ensure the deployment environment mode is enabled
echo "APP_MODE=deployment" >> .env

# 4. Initialize git and push to your new GitHub repository
git init
git add .
git commit -m "feat: initial clean deployment of RehabPath360 enterprise platform"
git branch -M main
git remote add origin https://github.com/<your-org>/rehabpath360-production.git
git push -u origin main
```

---

## 2. Environment Configuration

Copy `deployment/.env.example` to `.env` in the root:

```ini
PORT=3000
NODE_ENV=production
APP_MODE=deployment
JWT_SECRET=generate_a_cryptographically_secure_random_string_2026
SETUP_TOKEN=your_secure_institutional_bootstrap_token
GEMINI_API_KEY=your_gemini_api_key_for_document_ai
```

---

## 3. First-Administrator Bootstrap

When the application boots with zero staff accounts in `deployment` mode, it securely locks access until the **First Administrator** is provisioned.

### Option A: Via Web Interface
1. Launch the application (`npm run dev:deployment` or `npm run start:deployment`).
2. The user interface automatically presents the **Initial Deployment Setup** screen.
3. Configure the facility name, facility code, and first administrator account (email, name, password, badge).
4. If `SETUP_TOKEN` was defined in `.env`, provide it in the token field.
5. Submit the form. The first administrator account is created and the bootstrap endpoint is **permanently locked**.

### Option B: Via DevOps / CLI Script
Run the automated bootstrap script:
```bash
bash deployment/bootstrap_admin.sh
```

---

## 4. Multi-Tenancy & Data Isolation Guarantees

Every entity in the schema contains an `institution_id` field.
The backend server validates the caller's JWT token and verifies that:
1. `GET /api/cases`: returns only cases where `c.institution_id === req.user.institution_id`.
2. `GET /api/cases/:id`: rejects cross-institution lookups with `403 Forbidden`.
3. `PATCH /api/cases/:id`: prevents cross-tenant modification with `403 Forbidden`.
4. `GET /api/cases/:id/clinical-notes`: strictly validates institutional ownership and Psychologist/Administrator role.
5. `GET /api/reports/export-csv`: exports only records belonging to the caller's facility.
6. `POST /api/documents/upload` & commit: enforces tenant matching between uploader and case.

---

## 5. PostgreSQL / Supabase Migration

For production PostgreSQL / Supabase deployments:
1. Execute `supabase/migrations/20261015000000_init_rehabpath360.sql`
2. Execute `supabase/migrations/20261015000001_institution_multitenancy.sql`

Row-Level Security (RLS) policies are active, binding database rows to `auth.jwt() ->> 'institution_id'`.
