-- PROD-01B: Multi-contact model for pharmacies/herbalists.
-- Each pharmacy can have multiple contacts (owner, buyer, finance, etc.).

CREATE TABLE public.pharmacy_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NULL,
  email text NULL,
  phone text NULL,
  is_primary boolean NOT NULL DEFAULT false,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pharmacy_contacts_pharmacy_id
  ON public.pharmacy_contacts(pharmacy_id);

CREATE INDEX idx_pharmacy_contacts_pharmacy_primary
  ON public.pharmacy_contacts(pharmacy_id, is_primary DESC, created_at DESC);

ALTER TABLE public.pharmacy_contacts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access contacts
CREATE POLICY "Authenticated can select contacts"
  ON public.pharmacy_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert contacts"
  ON public.pharmacy_contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update contacts"
  ON public.pharmacy_contacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete contacts"
  ON public.pharmacy_contacts FOR DELETE
  TO authenticated
  USING (true);
