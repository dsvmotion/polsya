-- GEN-01A: Generalize data model — rename pharmacies → entities, pharmacy_* → entity_*
-- This migration renames tables/columns in place (ALTER TABLE RENAME) to preserve FKs,
-- then creates backward-compatible views for any code not yet migrated.

-- ─── 0. Repair: create entity_types if missing (inconsistent migration state) ─
CREATE TABLE IF NOT EXISTS public.entity_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  key text not null,
  label text not null,
  color text null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_entity_types_key_format check (key ~ '^[a-z0-9_\-]+$')
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_types_org_key ON public.entity_types (organization_id, key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_types_global_key ON public.entity_types (key) WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_entity_types_org_default ON public.entity_types (organization_id, is_default desc, label);
ALTER TABLE public.entity_types ENABLE ROW LEVEL SECURITY;
DO $repair$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $func$ BEGIN new.updated_at = now(); RETURN new; END; $func$;
  END IF;
END
$repair$;
DROP TRIGGER IF EXISTS update_entity_types_updated_at ON public.entity_types;
CREATE TRIGGER update_entity_types_updated_at BEFORE UPDATE ON public.entity_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.entity_types WHERE organization_id IS NULL AND key = 'pharmacy') THEN
    INSERT INTO public.entity_types (organization_id, key, label, color, is_default) VALUES (null, 'pharmacy', 'Pharmacy', '#334155', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.entity_types WHERE organization_id IS NULL AND key = 'herbalist') THEN
    INSERT INTO public.entity_types (organization_id, key, label, color, is_default) VALUES (null, 'herbalist', 'Herbalist', '#0f766e', false);
  END IF;
END $$;

-- ─── 1. Add metadata JSONB column to entity_types for discovery config ──────
ALTER TABLE public.entity_types
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- ─── 2. Rename or bootstrap core tables ───────────────────────────────────
-- Path A: All pharmacy_* exist → rename.
-- Path B: pharmacies exists but pharmacy_contacts missing → rename pharmacies only, create entity_* child tables.
-- Path C: No pharmacies → full bootstrap.
DO $mig$
DECLARE
  has_pharmacies boolean;
  has_contacts boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pharmacies') INTO has_pharmacies;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pharmacy_contacts') INTO has_contacts;

  IF has_pharmacies AND has_contacts THEN
    -- Path A: Full rename
    ALTER TABLE public.pharmacies RENAME TO entities;
    ALTER TABLE public.pharmacy_contacts RENAME TO entity_contacts;
    ALTER TABLE public.pharmacy_activities RENAME TO entity_activities;
    ALTER TABLE public.pharmacy_opportunities RENAME TO entity_opportunities;
    ALTER TABLE public.pharmacy_order_documents RENAME TO entity_order_documents;
    ALTER TABLE public.entity_contacts RENAME COLUMN pharmacy_id TO entity_id;
    ALTER TABLE public.entity_activities RENAME COLUMN pharmacy_id TO entity_id;
    ALTER TABLE public.entity_opportunities RENAME COLUMN pharmacy_id TO entity_id;
    ALTER TABLE public.entity_order_documents RENAME COLUMN pharmacy_id TO entity_id;
  ELSIF has_pharmacies AND NOT has_contacts THEN
    -- Path B: Rename pharmacies only, create child tables (partial migration state)
    ALTER TABLE public.pharmacies RENAME TO entities;
    CREATE TABLE public.entity_contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      name text NOT NULL,
      role text,
      email text,
      phone text,
      is_primary boolean NOT NULL DEFAULT false,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE public.entity_activities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'visit', 'note', 'task')),
      title text NOT NULL,
      description text,
      due_at timestamptz,
      completed_at timestamptz,
      owner text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE public.entity_opportunities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      title text NOT NULL,
      stage text NOT NULL CHECK (stage IN ('qualified', 'proposal', 'negotiation', 'won', 'lost')),
      amount numeric(12,2) NOT NULL DEFAULT 0,
      probability int NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
      expected_close_date date,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE public.entity_order_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      order_id text,
      document_type text NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
      file_path text NOT NULL,
      file_name text NOT NULL,
      uploaded_at timestamptz NOT NULL DEFAULT now(),
      notes text
    );
    CREATE TRIGGER update_entity_contacts_updated_at BEFORE UPDATE ON public.entity_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    CREATE TRIGGER update_entity_activities_updated_at BEFORE UPDATE ON public.entity_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    CREATE TRIGGER update_entity_opportunities_updated_at BEFORE UPDATE ON public.entity_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  ELSE
    -- Path B: Bootstrap entity_* tables (pharmacy_* never existed)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pharmacy_status') THEN
      CREATE TYPE public.pharmacy_status AS ENUM ('not_contacted', 'contacted', 'qualified', 'proposal', 'client', 'retained', 'lost');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
      CREATE TYPE public.client_type AS ENUM ('pharmacy', 'herbalist');
    END IF;

    CREATE TABLE public.entities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_type_id uuid REFERENCES public.entity_types(id) ON DELETE SET NULL,
      google_place_id text,
      name text NOT NULL,
      address text,
      city text,
      province text,
      country text DEFAULT 'Spain',
      postal_code text,
      autonomous_community text,
      sub_locality text,
      phone text,
      secondary_phone text,
      email text,
      website text,
      opening_hours jsonb,
      lat double precision NOT NULL DEFAULT 0,
      lng double precision NOT NULL DEFAULT 0,
      commercial_status public.pharmacy_status NOT NULL DEFAULT 'not_contacted',
      client_type public.client_type NOT NULL DEFAULT 'pharmacy',
      legal_form text,
      activity text,
      subsector text,
      notes text,
      google_data jsonb,
      saved_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE public.entity_contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      name text NOT NULL,
      role text,
      email text,
      phone text,
      is_primary boolean NOT NULL DEFAULT false,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE public.entity_activities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'visit', 'note', 'task')),
      title text NOT NULL,
      description text,
      due_at timestamptz,
      completed_at timestamptz,
      owner text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE public.entity_opportunities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      title text NOT NULL,
      stage text NOT NULL CHECK (stage IN ('qualified', 'proposal', 'negotiation', 'won', 'lost')),
      amount numeric(12,2) NOT NULL DEFAULT 0,
      probability int NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
      expected_close_date date,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE public.entity_order_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
      order_id text,
      document_type text NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
      file_path text NOT NULL,
      file_name text NOT NULL,
      uploaded_at timestamptz NOT NULL DEFAULT now(),
      notes text
    );

    CREATE TRIGGER update_entity_contacts_updated_at BEFORE UPDATE ON public.entity_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    CREATE TRIGGER update_entity_activities_updated_at BEFORE UPDATE ON public.entity_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    CREATE TRIGGER update_entity_opportunities_updated_at BEFORE UPDATE ON public.entity_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $mig$;

-- ─── 3. (No-op for bootstrap path; renames done above) ───────────────────────

-- ─── 4. Backward-compatible views ──────────────────────────────────────────
-- Drop any leftover pharmacy_* tables/views (partial migration state) before creating views
DO $clean$
DECLARE
  objname text;
  objkind char;
BEGIN
  FOR objname IN SELECT unnest(ARRAY['pharmacies', 'pharmacy_contacts', 'pharmacy_activities', 'pharmacy_opportunities', 'pharmacy_order_documents']) LOOP
    SELECT c.relkind INTO objkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = objname;
    IF objkind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS public.%I', objname);
    ELSIF objkind = 'r' THEN
      EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', objname);
    END IF;
  END LOOP;
END $clean$;

CREATE OR REPLACE VIEW public.pharmacies AS
  SELECT * FROM public.entities;

CREATE OR REPLACE VIEW public.pharmacy_contacts AS
  SELECT id, entity_id AS pharmacy_id, name, role, email, phone, is_primary, notes,
         created_at, updated_at, organization_id
  FROM public.entity_contacts;

CREATE OR REPLACE VIEW public.pharmacy_activities AS
  SELECT id, entity_id AS pharmacy_id, activity_type, title, description, due_at,
         completed_at, owner, created_at, updated_at, organization_id
  FROM public.entity_activities;

CREATE OR REPLACE VIEW public.pharmacy_opportunities AS
  SELECT id, entity_id AS pharmacy_id, title, stage, amount, probability,
         expected_close_date, notes, created_at, updated_at, organization_id
  FROM public.entity_opportunities;

CREATE OR REPLACE VIEW public.pharmacy_order_documents AS
  SELECT id, entity_id AS pharmacy_id, order_id, document_type, file_path, file_name,
         uploaded_at, notes, organization_id
  FROM public.entity_order_documents;

-- ─── 4b. Ensure required columns on entities (legacy DBs may lack them) ──────
DO $org$
DECLARE
  default_org uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entities' AND column_name = 'organization_id'
  ) THEN
    SELECT id INTO default_org FROM public.organizations WHERE slug = 'default-workspace' LIMIT 1;
    IF default_org IS NULL THEN
      INSERT INTO public.organizations (name, slug) VALUES ('Default Workspace', 'default-workspace')
      RETURNING id INTO default_org;
    END IF;
    ALTER TABLE public.entities ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
    UPDATE public.entities SET organization_id = default_org WHERE organization_id IS NULL;
    ALTER TABLE public.entities ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.entities ALTER COLUMN organization_id SET DEFAULT public.current_user_organization_id();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
    CREATE TYPE public.client_type AS ENUM ('pharmacy', 'herbalist');
  END IF;
  ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS client_type public.client_type NOT NULL DEFAULT 'pharmacy';

  ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS entity_type_id uuid REFERENCES public.entity_types(id) ON DELETE SET NULL;
END $org$;

-- ─── 5. Recreate RLS policies on renamed tables ────────────────────────────
-- entities (was pharmacies — policies were dropped by rename, recreate)
DROP POLICY IF EXISTS "Org members can select pharmacies" ON public.entities;
DROP POLICY IF EXISTS "Org members can insert pharmacies" ON public.entities;
DROP POLICY IF EXISTS "Org members can update pharmacies" ON public.entities;
DROP POLICY IF EXISTS "Org members can delete pharmacies" ON public.entities;

CREATE POLICY "Org members can select entities"
  ON public.entities FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert entities"
  ON public.entities FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update entities"
  ON public.entities FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can delete entities"
  ON public.entities FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id));

-- entity_contacts (was pharmacy_contacts)
DROP POLICY IF EXISTS "Org members can select pharmacy_contacts" ON public.entity_contacts;
DROP POLICY IF EXISTS "Org members can insert pharmacy_contacts" ON public.entity_contacts;
DROP POLICY IF EXISTS "Org members can update pharmacy_contacts" ON public.entity_contacts;
DROP POLICY IF EXISTS "Org members can delete pharmacy_contacts" ON public.entity_contacts;

CREATE POLICY "Org members can select entity_contacts"
  ON public.entity_contacts FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert entity_contacts"
  ON public.entity_contacts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_contacts.organization_id
    )
  );

CREATE POLICY "Org members can update entity_contacts"
  ON public.entity_contacts FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_contacts.organization_id
    )
  );

CREATE POLICY "Org members can delete entity_contacts"
  ON public.entity_contacts FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id));

-- entity_activities (was pharmacy_activities)
DROP POLICY IF EXISTS "Org members can select pharmacy_activities" ON public.entity_activities;
DROP POLICY IF EXISTS "Org members can insert pharmacy_activities" ON public.entity_activities;
DROP POLICY IF EXISTS "Org members can update pharmacy_activities" ON public.entity_activities;
DROP POLICY IF EXISTS "Org members can delete pharmacy_activities" ON public.entity_activities;

CREATE POLICY "Org members can select entity_activities"
  ON public.entity_activities FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert entity_activities"
  ON public.entity_activities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_activities.organization_id
    )
  );

CREATE POLICY "Org members can update entity_activities"
  ON public.entity_activities FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_activities.organization_id
    )
  );

CREATE POLICY "Org members can delete entity_activities"
  ON public.entity_activities FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id));

-- entity_opportunities (was pharmacy_opportunities)
DROP POLICY IF EXISTS "Org members can select pharmacy_opportunities" ON public.entity_opportunities;
DROP POLICY IF EXISTS "Org members can insert pharmacy_opportunities" ON public.entity_opportunities;
DROP POLICY IF EXISTS "Org members can update pharmacy_opportunities" ON public.entity_opportunities;
DROP POLICY IF EXISTS "Org members can delete pharmacy_opportunities" ON public.entity_opportunities;

CREATE POLICY "Org members can select entity_opportunities"
  ON public.entity_opportunities FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert entity_opportunities"
  ON public.entity_opportunities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_opportunities.organization_id
    )
  );

CREATE POLICY "Org members can update entity_opportunities"
  ON public.entity_opportunities FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_opportunities.organization_id
    )
  );

CREATE POLICY "Org members can delete entity_opportunities"
  ON public.entity_opportunities FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id));

-- entity_order_documents (was pharmacy_order_documents)
DROP POLICY IF EXISTS "Org members can select pharmacy_order_documents" ON public.entity_order_documents;
DROP POLICY IF EXISTS "Org members can insert pharmacy_order_documents" ON public.entity_order_documents;
DROP POLICY IF EXISTS "Org members can update pharmacy_order_documents" ON public.entity_order_documents;
DROP POLICY IF EXISTS "Org members can delete pharmacy_order_documents" ON public.entity_order_documents;

CREATE POLICY "Org members can select entity_order_documents"
  ON public.entity_order_documents FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert entity_order_documents"
  ON public.entity_order_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_order_documents.organization_id
    )
  );

CREATE POLICY "Org members can update entity_order_documents"
  ON public.entity_order_documents FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (
    public.is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.organization_id = entity_order_documents.organization_id
    )
  );

CREATE POLICY "Org members can delete entity_order_documents"
  ON public.entity_order_documents FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id));

-- ─── 6. Recreate indexes on renamed tables with new names ──────────────────
-- entities
CREATE INDEX IF NOT EXISTS idx_entities_org ON public.entities (organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_entities_entity_type_id ON public.entities (entity_type_id);
CREATE INDEX IF NOT EXISTS idx_entities_status ON public.entities (commercial_status);
CREATE INDEX IF NOT EXISTS idx_entities_city ON public.entities (city);
CREATE INDEX IF NOT EXISTS idx_entities_country ON public.entities (country);
CREATE INDEX IF NOT EXISTS idx_entities_location ON public.entities (lat, lng);

-- entity_contacts
CREATE INDEX IF NOT EXISTS idx_entity_contacts_entity_id ON public.entity_contacts (entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_contacts_org ON public.entity_contacts (organization_id, entity_id, is_primary DESC, created_at DESC);

-- entity_activities
CREATE INDEX IF NOT EXISTS idx_entity_activities_timeline ON public.entity_activities (entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entity_activities_org ON public.entity_activities (organization_id, entity_id, created_at DESC);

-- entity_opportunities
CREATE INDEX IF NOT EXISTS idx_entity_opportunities_stage ON public.entity_opportunities (entity_id, stage, expected_close_date);
CREATE INDEX IF NOT EXISTS idx_entity_opportunities_org ON public.entity_opportunities (organization_id, entity_id, created_at DESC);

-- entity_order_documents
CREATE INDEX IF NOT EXISTS idx_entity_order_documents_entity ON public.entity_order_documents (entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_order_documents_org ON public.entity_order_documents (organization_id, entity_id, uploaded_at DESC);

-- ─── 7. Update storage policies to reference entities table ────────────────
DROP POLICY IF EXISTS "Org members can upload pharmacy documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view pharmacy documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete pharmacy documents" ON storage.objects;

CREATE POLICY "Org members can upload entity documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pharmacy-documents'
    AND EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id::text = split_part(name, '/', 1)
        AND public.is_org_member(e.organization_id)
    )
  );

CREATE POLICY "Org members can view entity documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'pharmacy-documents'
    AND EXISTS (
      SELECT 1 FROM public.entity_order_documents d
      WHERE d.file_path = name
        AND public.is_org_member(d.organization_id)
    )
  );

CREATE POLICY "Org members can delete entity documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pharmacy-documents'
    AND EXISTS (
      SELECT 1 FROM public.entity_order_documents d
      WHERE d.file_path = name
        AND public.is_org_member(d.organization_id)
    )
  );

-- ─── 8. Update the updated_at trigger on renamed table ─────────────────────
DROP TRIGGER IF EXISTS update_pharmacies_updated_at ON public.entities;
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 9. Defaults for org_id on new tables ──────────────────────────────────
ALTER TABLE public.entity_contacts ALTER COLUMN organization_id SET DEFAULT public.current_user_organization_id();
ALTER TABLE public.entity_activities ALTER COLUMN organization_id SET DEFAULT public.current_user_organization_id();
ALTER TABLE public.entity_opportunities ALTER COLUMN organization_id SET DEFAULT public.current_user_organization_id();
ALTER TABLE public.entity_order_documents ALTER COLUMN organization_id SET DEFAULT public.current_user_organization_id();

-- ─── 10. Backfill entity_type_id where NULL (safety net) ───────────────────
UPDATE public.entities e
SET entity_type_id = et.id
FROM public.entity_types et
WHERE e.entity_type_id IS NULL
  AND et.organization_id = e.organization_id
  AND et.key = e.client_type::text;

-- Make entity_type_id NOT NULL now that all rows are backfilled
-- (only if there are no remaining NULLs)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.entities WHERE entity_type_id IS NULL) THEN
    ALTER TABLE public.entities ALTER COLUMN entity_type_id SET NOT NULL;
  END IF;
END $$;
