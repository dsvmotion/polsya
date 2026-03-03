-- GEN-01A: Generalize data model — rename pharmacies → entities, pharmacy_* → entity_*
-- This migration renames tables/columns in place (ALTER TABLE RENAME) to preserve FKs,
-- then creates backward-compatible views for any code not yet migrated.

-- ─── 1. Add metadata JSONB column to entity_types for discovery config ──────
ALTER TABLE public.entity_types
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- ─── 2. Rename core tables ─────────────────────────────────────────────────
ALTER TABLE public.pharmacies RENAME TO entities;
ALTER TABLE public.pharmacy_contacts RENAME TO entity_contacts;
ALTER TABLE public.pharmacy_activities RENAME TO entity_activities;
ALTER TABLE public.pharmacy_opportunities RENAME TO entity_opportunities;
ALTER TABLE public.pharmacy_order_documents RENAME TO entity_order_documents;

-- ─── 3. Rename FK columns (pharmacy_id → entity_id) ────────────────────────
ALTER TABLE public.entity_contacts RENAME COLUMN pharmacy_id TO entity_id;
ALTER TABLE public.entity_activities RENAME COLUMN pharmacy_id TO entity_id;
ALTER TABLE public.entity_opportunities RENAME COLUMN pharmacy_id TO entity_id;
ALTER TABLE public.entity_order_documents RENAME COLUMN pharmacy_id TO entity_id;

-- ─── 4. Backward-compatible views ──────────────────────────────────────────
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
