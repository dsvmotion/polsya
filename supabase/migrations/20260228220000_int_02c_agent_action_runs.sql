-- INT-02C: Agent action execution runs.
-- Detailed run log per action for trazability, rollback tracking, and error auditing.

CREATE TABLE public.agent_action_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.agent_actions_log(id) ON DELETE CASCADE,
  run_status text NOT NULL CHECK (run_status IN ('started', 'success', 'error', 'rolled_back')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  operation_summary text NULL,
  error_message text NULL,
  rollback_summary text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_action_runs_action_started
  ON public.agent_action_runs(action_id, started_at DESC);

CREATE INDEX idx_agent_action_runs_status_started
  ON public.agent_action_runs(run_status, started_at DESC);

ALTER TABLE public.agent_action_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select agent action runs"
  ON public.agent_action_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert agent action runs"
  ON public.agent_action_runs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update agent action runs"
  ON public.agent_action_runs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete agent action runs"
  ON public.agent_action_runs FOR DELETE
  TO authenticated
  USING (true);
