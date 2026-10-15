-- REHABPATH360 PostgreSQL / Supabase Schema & Row-Level Security (RLS) Migration
-- Version: 20261015000000
-- Target: PostgreSQL 15+ / Supabase Auth & Storage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enum
DO $$ BEGIN
    CREATE TYPE staff_role_enum AS ENUM (
        'Administrator',
        'Warden',
        'Psychologist',
        'Case Manager',
        'Educator',
        'Community Rehabilitation Officer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Staff Profiles Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role staff_role_enum NOT NULL,
    badge_number VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. Offender Cases Table
CREATE TABLE IF NOT EXISTS public.offender_cases (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'RP-1041'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    age_band VARCHAR(20) NOT NULL,
    crime_severity INTEGER NOT NULL CHECK (crime_severity BETWEEN 1 AND 5),
    crime_type VARCHAR(255) NOT NULL,
    sentence_length_months INTEGER NOT NULL,
    education_level INTEGER NOT NULL CHECK (education_level BETWEEN 1 AND 5),
    mental_wellbeing INTEGER NOT NULL CHECK (mental_wellbeing BETWEEN 1 AND 5),
    support_network INTEGER NOT NULL CHECK (support_network BETWEEN 1 AND 5),
    programme_engagement INTEGER NOT NULL CHECK (programme_engagement BETWEEN 1 AND 5),
    assessment_completeness INTEGER NOT NULL CHECK (assessment_completeness BETWEEN 0 AND 100),
    session_attendance INTEGER NOT NULL CHECK (session_attendance BETWEEN 0 AND 100),
    mood_history INTEGER[] NOT NULL DEFAULT '{3,3,3,3,3}',
    low_mood_count INTEGER NOT NULL DEFAULT 0,
    gate_scores JSONB NOT NULL DEFAULT '{"edu": 50, "beh": 50, "wb": 50, "skl": 50}',
    score_history INTEGER[] NOT NULL DEFAULT '{}',
    gate_history INTEGER[] NOT NULL DEFAULT '{}',
    certifications TEXT[] NOT NULL DEFAULT '{}',
    decision VARCHAR(20) CHECK (decision IN ('approved', 'modified', 'overridden', NULL)),
    pathway_position INTEGER CHECK (pathway_position BETWEEN 0 AND 11 OR pathway_position IS NULL),
    decision_reason TEXT DEFAULT '',
    rehabilitation_remarks TEXT[] NOT NULL DEFAULT '{}',
    education_history TEXT DEFAULT '',
    employment_history TEXT DEFAULT '',
    rehabilitation_history TEXT DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_id UUID REFERENCES public.staff_users(id),
    updated_by_name VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_offender_cases_severity ON public.offender_cases (crime_severity);
CREATE INDEX IF NOT EXISTS idx_offender_cases_decision ON public.offender_cases (decision);
CREATE INDEX IF NOT EXISTS idx_offender_cases_pathway ON public.offender_cases (pathway_position);

-- 3. Clinical Notes Table (RESTRICTED TO PSYCHOLOGISTS AND ADMINISTRATORS ONLY)
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(50) NOT NULL REFERENCES public.offender_cases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.staff_users(id),
    author_name VARCHAR(255) NOT NULL,
    author_role staff_role_enum NOT NULL,
    note_type VARCHAR(50) NOT NULL,
    confidentiality VARCHAR(30) NOT NULL DEFAULT 'restricted_clinical',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_case ON public.clinical_notes (case_id);

-- 4. Documents & Uploads
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(50) NOT NULL REFERENCES public.offender_cases(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by_id UUID NOT NULL REFERENCES public.staff_users(id),
    uploaded_by_name VARCHAR(255) NOT NULL,
    uploaded_by_role staff_role_enum NOT NULL,
    upload_source VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
    extracted_summary TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(255)
);

-- 5. Field-Level Change History Table
CREATE TABLE IF NOT EXISTS public.case_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(50) NOT NULL REFERENCES public.offender_cases(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    changed_by_id UUID NOT NULL REFERENCES public.staff_users(id),
    changed_by_name VARCHAR(255) NOT NULL,
    changed_by_role staff_role_enum NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_source VARCHAR(50) NOT NULL
);

-- 6. Server-Side Audit Events Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success'
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_events (resource_type, resource_id);

-- 7. Autosave Drafts
CREATE TABLE IF NOT EXISTS public.save_drafts (
    case_id VARCHAR(50) NOT NULL REFERENCES public.offender_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.staff_users(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (case_id, user_id)
);

-- ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offender_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.save_drafts ENABLE ROW LEVEL SECURITY;

-- Helper function to get current staff role from JWT or session
CREATE OR REPLACE FUNCTION public.get_current_staff_role()
RETURNS staff_role_enum AS $$
    SELECT role FROM public.staff_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS: Clinical Notes (Only Psychologist and Administrator can view or insert)
CREATE POLICY clinical_notes_read_policy ON public.clinical_notes
    FOR SELECT
    USING (
        public.get_current_staff_role() IN ('Psychologist', 'Administrator')
    );

CREATE POLICY clinical_notes_insert_policy ON public.clinical_notes
    FOR INSERT
    WITH CHECK (
        public.get_current_staff_role() IN ('Psychologist', 'Administrator')
    );

-- RLS: Audit Events (Read restricted to Administrator and Warden; Insert permitted for all authenticated system events)
CREATE POLICY audit_events_read_policy ON public.audit_events
    FOR SELECT
    USING (
        public.get_current_staff_role() IN ('Administrator', 'Warden')
    );

CREATE POLICY audit_events_insert_policy ON public.audit_events
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS: Offender Cases (All authenticated staff can view; update permitted based on staff permissions)
CREATE POLICY offender_cases_select_policy ON public.offender_cases
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY offender_cases_update_policy ON public.offender_cases
    FOR UPDATE
    USING (
        public.get_current_staff_role() IN ('Administrator', 'Warden', 'Case Manager', 'Educator', 'Psychologist', 'Community Rehabilitation Officer')
    );
