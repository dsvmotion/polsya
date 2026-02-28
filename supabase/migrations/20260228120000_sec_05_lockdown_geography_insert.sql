-- SEC-05A: Remove open INSERT policies on geography tables and restrict to authenticated users only.
-- SELECT policies ("Anyone can read ...") are intentionally kept — geography is public reference data.
-- The populate-geography edge function uses service_role_key which bypasses RLS,
-- so these policies only guard direct client-side access.

-- 1. Drop anon INSERT policies
DROP POLICY IF EXISTS "Anon can insert countries" ON public.geography_countries;
DROP POLICY IF EXISTS "Anon can insert provinces" ON public.geography_provinces;
DROP POLICY IF EXISTS "Anon can insert cities" ON public.geography_cities;

-- 2. Drop existing INSERT policies that lack explicit TO clause
DROP POLICY IF EXISTS "Authenticated can insert countries" ON public.geography_countries;
DROP POLICY IF EXISTS "Authenticated can insert provinces" ON public.geography_provinces;
DROP POLICY IF EXISTS "Authenticated can insert cities" ON public.geography_cities;

-- 3. Re-create INSERT policies with explicit TO authenticated
CREATE POLICY "Authenticated can insert countries"
  ON public.geography_countries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert provinces"
  ON public.geography_provinces FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert cities"
  ON public.geography_cities FOR INSERT TO authenticated WITH CHECK (true);
