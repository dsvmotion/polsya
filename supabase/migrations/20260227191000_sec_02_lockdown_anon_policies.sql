-- SEC-02: Remove all anon access to business-critical data.
--
-- This migration:
--   1. Drops every anon policy on public.pharmacies, public.pharmacy_order_documents,
--      and storage.objects (bucket pharmacy-documents).
--   2. Drops the existing storage.objects policies that were created WITHOUT a role
--      qualifier (they default to PUBLIC, which includes anon).
--   3. Re-creates storage.objects policies explicitly scoped to authenticated.
--   4. Leaves authenticated policies on public.pharmacies and
--      public.pharmacy_order_documents untouched (they already target authenticated).
--
-- After this migration, only authenticated users can read/write business data.
-- Geography tables are NOT touched (out of scope).

-- ============================================================================
-- 1. public.pharmacies — drop anon policies
-- ============================================================================
DROP POLICY IF EXISTS "Anon users can view pharmacies"   ON public.pharmacies;
DROP POLICY IF EXISTS "Anon users can insert pharmacies"  ON public.pharmacies;
DROP POLICY IF EXISTS "Anon users can update pharmacies"  ON public.pharmacies;
DROP POLICY IF EXISTS "Anon users can delete pharmacies"  ON public.pharmacies;

-- ============================================================================
-- 2. public.pharmacy_order_documents — drop anon policies
-- ============================================================================
DROP POLICY IF EXISTS "Anon users can view pharmacy documents"   ON public.pharmacy_order_documents;
DROP POLICY IF EXISTS "Anon users can insert pharmacy documents"  ON public.pharmacy_order_documents;
DROP POLICY IF EXISTS "Anon users can delete pharmacy documents"  ON public.pharmacy_order_documents;

-- ============================================================================
-- 3. storage.objects — drop ALL pharmacy-documents policies (anon + unscoped)
--    The original policies were created WITHOUT "TO authenticated", so they
--    default to PUBLIC (= anon + authenticated). We must replace them.
-- ============================================================================
DROP POLICY IF EXISTS "Anon users can upload pharmacy documents"        ON storage.objects;
DROP POLICY IF EXISTS "Anon users can view pharmacy documents"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pharmacy documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view pharmacy documents"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pharmacy documents" ON storage.objects;

-- ============================================================================
-- 4. storage.objects — recreate policies scoped to authenticated only
-- ============================================================================
CREATE POLICY "Authenticated users can upload pharmacy documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pharmacy-documents');

CREATE POLICY "Authenticated users can view pharmacy documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pharmacy-documents');

CREATE POLICY "Authenticated users can delete pharmacy documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pharmacy-documents');
