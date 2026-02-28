-- INT-01B: Sync run history per integration connection.
-- Tracks each synchronization attempt with type, status, record counts, and errors.

CREATE TABLE public.integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  run_type text NOT NULL CHECK (run_type IN ('manual', 'scheduled', 'webhook')),
  status text NOT NULL CHECK (status IN ('running', 'success', 'error')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  records_processed int NOT NULL DEFAULT 0,
  records_failed int NOT NULL DEFAULT 0,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_sync_runs_timeline
  ON public.integration_sync_runs(integration_id, started_at DESC);

CREATE INDEX idx_integration_sync_runs_status
  ON public.integration_sync_runs(status, started_at DESC);

ALTER TABLE public.integration_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select sync runs"
  ON public.integration_sync_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert sync runs"
  ON public.integration_sync_runs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update sync runs"
  ON public.integration_sync_runs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete sync runs"
  ON public.integration_sync_runs FOR DELETE
  TO authenticated
  USING (true);
