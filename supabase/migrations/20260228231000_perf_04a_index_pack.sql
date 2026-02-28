-- PERF-04A: Index pack for Operations, Risk, and Pipeline query patterns.
-- All indexes are idempotent (IF NOT EXISTS) and safe to re-run.

-- 1) Pharmacies — saved ops filters/sorts
CREATE INDEX IF NOT EXISTS idx_pharmacies_saved_filters
  ON public.pharmacies (client_type, commercial_status, updated_at DESC)
  WHERE saved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pharmacies_saved_at
  ON public.pharmacies (saved_at DESC)
  WHERE saved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pharmacies_geo
  ON public.pharmacies (country, province, city);

-- 2) Documents — operations doc summary queries
CREATE INDEX IF NOT EXISTS idx_pharmacy_order_documents_pharmacy_uploaded
  ON public.pharmacy_order_documents (pharmacy_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_pharmacy_order_documents_pharmacy_order
  ON public.pharmacy_order_documents (pharmacy_id, order_id);

-- 3) Opportunities — pipeline cards / stage views
CREATE INDEX IF NOT EXISTS idx_pharmacy_opportunities_stage_created
  ON public.pharmacy_opportunities (stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pharmacy_opportunities_pharmacy_created
  ON public.pharmacy_opportunities (pharmacy_id, created_at DESC);

-- 4) Activities — follow-up / risk workflows
CREATE INDEX IF NOT EXISTS idx_pharmacy_activities_pharmacy_due
  ON public.pharmacy_activities (pharmacy_id, completed_at, due_at);
