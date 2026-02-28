-- INT-02A: Agent actions log.
-- Auditable registry of AI-agent actions (OpenClaw, etc.) against CRM entities.
-- Supports idempotency keys to prevent duplicate processing.

CREATE TABLE public.agent_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('create_task', 'update_status', 'create_contact', 'create_opportunity', 'log_note')),
  target_type text NOT NULL CHECK (target_type IN ('pharmacy', 'contact', 'opportunity', 'activity', 'integration')),
  target_id uuid NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'success', 'error', 'rejected')),
  error_message text NULL,
  requested_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  idempotency_key text NULL
);

-- Partial unique index: only enforce uniqueness when idempotency_key is not null
CREATE UNIQUE INDEX idx_agent_actions_log_idempotency
  ON public.agent_actions_log(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_agent_actions_log_status_created
  ON public.agent_actions_log(status, created_at DESC);

CREATE INDEX idx_agent_actions_log_agent_created
  ON public.agent_actions_log(agent_name, created_at DESC);

CREATE INDEX idx_agent_actions_log_target
  ON public.agent_actions_log(target_type, target_id);

ALTER TABLE public.agent_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select agent actions"
  ON public.agent_actions_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert agent actions"
  ON public.agent_actions_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update agent actions"
  ON public.agent_actions_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete agent actions"
  ON public.agent_actions_log FOR DELETE
  TO authenticated
  USING (true);
