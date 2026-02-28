-- INT-02B: Add approval/rejection workflow to agent actions.
-- Tracks who approved/rejected an action, when, and with what note.

ALTER TABLE public.agent_actions_log
  ADD COLUMN approved_by text NULL,
  ADD COLUMN approved_at timestamptz NULL,
  ADD COLUMN approval_note text NULL;

-- Coherence: resolved actions must have an approval timestamp
ALTER TABLE public.agent_actions_log
  ADD CONSTRAINT chk_agent_actions_approval_coherence
  CHECK (
    status = 'queued'
    OR approved_at IS NOT NULL
  );

CREATE INDEX idx_agent_actions_log_status_approved
  ON public.agent_actions_log(status, approved_at DESC);
