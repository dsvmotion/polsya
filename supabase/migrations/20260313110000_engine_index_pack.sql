-- Engine index pack: indexes for admin dashboard query patterns and
-- org-scoped lookups on ingestion, signal, and AI tables.
-- All indexes are idempotent (IF NOT EXISTS) and safe to re-run.

-- ════════════════════════════════════════════════════════════════════════
-- Ingestion tables
-- ════════════════════════════════════════════════════════════════════════

-- Admin dashboard: ORDER BY created_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_created
  ON public.ingestion_runs (created_at DESC);

-- Admin dashboard: filter by status (running/failed/completed)
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status_created
  ON public.ingestion_runs (status, created_at DESC);

-- Org-scoped lookups (RLS filter pattern)
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_org_created
  ON public.ingestion_runs (org_id, created_at DESC);

-- Providers: org-scoped + active filter
CREATE INDEX IF NOT EXISTS idx_ingestion_providers_org_active
  ON public.ingestion_providers (org_id, is_active);

-- Jobs: lookup by run
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_run_id
  ON public.ingestion_jobs (run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_org_created
  ON public.ingestion_jobs (org_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════════
-- Signal tables
-- ════════════════════════════════════════════════════════════════════════

-- Admin dashboard: ORDER BY created_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_signals_created
  ON public.signals (created_at DESC);

-- Admin dashboard: severity/status filtering
CREATE INDEX IF NOT EXISTS idx_signals_severity_created
  ON public.signals (severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_status_created
  ON public.signals (status, created_at DESC);

-- Org-scoped lookups
CREATE INDEX IF NOT EXISTS idx_signals_org_created
  ON public.signals (org_id, created_at DESC);

-- Rules: org-scoped + active filter
CREATE INDEX IF NOT EXISTS idx_signal_rules_org_active
  ON public.signal_rules (org_id, is_active);

-- ════════════════════════════════════════════════════════════════════════
-- AI / RAG tables
-- ════════════════════════════════════════════════════════════════════════

-- Admin dashboard: ORDER BY created_at DESC, status filtering
CREATE INDEX IF NOT EXISTS idx_ai_documents_created
  ON public.ai_documents (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_documents_status_created
  ON public.ai_documents (status, created_at DESC);

-- Org-scoped lookups
CREATE INDEX IF NOT EXISTS idx_ai_documents_org_created
  ON public.ai_documents (org_id, created_at DESC);

-- Chunks: lookup by document (for RAG pipeline)
CREATE INDEX IF NOT EXISTS idx_ai_document_chunks_doc_index
  ON public.ai_document_chunks (document_id, chunk_index);

-- Usage: period lookups, org-scoped
CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_period
  ON public.ai_usage_monthly (period DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_org_period
  ON public.ai_usage_monthly (org_id, period DESC);

-- ════════════════════════════════════════════════════════════════════════
-- Enrichment tables
-- ════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_enrichment_runs_org_created
  ON public.enrichment_runs (org_id, created_at DESC);
