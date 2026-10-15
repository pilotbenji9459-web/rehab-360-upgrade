-- REHABPATH360 PostgreSQL / Supabase Multi-Tenancy & Institution Isolation Migration
-- Version: 20261015000001
-- Incremental Migration: Adds institutions table and multi-tenant foreign keys & RLS

-- 1. Institutions Table
CREATE TABLE IF NOT EXISTS public.institutions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'inst-demo' or UUID
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    logo_url TEXT,
    theme_primary VARCHAR(50) NOT NULL DEFAULT '#0284c7',
    theme_teal VARCHAR(50) NOT NULL DEFAULT '#5cc2bd',
    staff_designations JSONB NOT NULL DEFAULT '{
        "Administrator": "System Administrator",
        "Warden": "Warden / Superintendent",
        "Psychologist": "Clinical Psychologist",
        "Case Manager": "Rehabilitation Case Manager",
        "Educator": "Education & Vocational Officer",
        "Community Rehabilitation Officer": "Community Rehabilitation Officer"
    }',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Exhibition Institution
INSERT INTO public.institutions (id, name, code, is_demo, created_at, updated_at)
VALUES (
    'inst-demo',
    'Her Majesty''s Prison Frankland (Exhibition Demo)',
    'HMP-FRK',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Add institution_id columns to existing tables
ALTER TABLE public.staff_users
    ADD COLUMN IF NOT EXISTS institution_id VARCHAR(100) NOT NULL DEFAULT 'inst-demo'
    REFERENCES public.institutions(id) ON DELETE RESTRICT;

ALTER TABLE public.offender_cases
    ADD COLUMN IF NOT EXISTS institution_id VARCHAR(100) NOT NULL DEFAULT 'inst-demo'
    REFERENCES public.institutions(id) ON DELETE RESTRICT;

ALTER TABLE public.clinical_notes
    ADD COLUMN IF NOT EXISTS institution_id VARCHAR(100) NOT NULL DEFAULT 'inst-demo'
    REFERENCES public.institutions(id) ON DELETE RESTRICT;

ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS institution_id VARCHAR(100) NOT NULL DEFAULT 'inst-demo'
    REFERENCES public.institutions(id) ON DELETE RESTRICT;

-- Indexing for high-performance multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_staff_users_inst ON public.staff_users (institution_id);
CREATE INDEX IF NOT EXISTS idx_offender_cases_inst ON public.offender_cases (institution_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_inst ON public.clinical_notes (institution_id);
CREATE INDEX IF NOT EXISTS idx_documents_inst ON public.documents (institution_id);

-- 3. Enable Row-Level Security (RLS) on all tenant-scoped tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offender_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. Institution Isolation RLS Policies
-- Users can only view or modify records belonging to their authenticated institution
CREATE POLICY tenant_isolation_offender_cases ON public.offender_cases
    FOR ALL
    USING (
        institution_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id')
    )
    WITH CHECK (
        institution_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id')
    );

CREATE POLICY tenant_isolation_clinical_notes ON public.clinical_notes
    FOR ALL
    USING (
        institution_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id')
    )
    WITH CHECK (
        institution_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id')
    );

CREATE POLICY tenant_isolation_documents ON public.documents
    FOR ALL
    USING (
        institution_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id')
    );

CREATE POLICY tenant_isolation_staff_users ON public.staff_users
    FOR SELECT
    USING (
        institution_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id')
    );
