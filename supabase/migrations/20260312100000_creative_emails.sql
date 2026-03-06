-- creative_emails: synced email messages linked to org + entities
CREATE TABLE creative_emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'email_imap')),
  message_id      text NOT NULL,
  thread_id       text,
  subject         text,
  from_address    text NOT NULL,
  from_name       text,
  to_addresses    jsonb NOT NULL DEFAULT '[]',
  cc_addresses    jsonb NOT NULL DEFAULT '[]',
  bcc_addresses   jsonb NOT NULL DEFAULT '[]',
  body_text       text,
  body_html       text,
  snippet         text,
  labels          text[] NOT NULL DEFAULT '{}',
  is_read         boolean NOT NULL DEFAULT false,
  is_starred      boolean NOT NULL DEFAULT false,
  is_draft        boolean NOT NULL DEFAULT false,
  direction       text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sent_at         timestamptz NOT NULL,
  has_attachments boolean NOT NULL DEFAULT false,
  raw_headers     jsonb,
  entity_type     text,
  entity_id       uuid,
  matched_by      text CHECK (matched_by IN ('auto_email', 'auto_domain', 'manual')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, message_id)
);

CREATE INDEX idx_creative_emails_org_entity
  ON creative_emails(organization_id, entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE INDEX idx_creative_emails_org_sent
  ON creative_emails(organization_id, sent_at DESC);

CREATE INDEX idx_creative_emails_thread
  ON creative_emails(organization_id, thread_id)
  WHERE thread_id IS NOT NULL;

-- creative_email_attachments: metadata for email attachments
CREATE TABLE creative_email_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id        uuid NOT NULL REFERENCES creative_emails(id) ON DELETE CASCADE,
  filename        text NOT NULL,
  content_type    text,
  size_bytes      integer,
  storage_path    text,
  provider_ref    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_email_attachments_email
  ON creative_email_attachments(email_id);

-- RLS
ALTER TABLE creative_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their emails"
  ON creative_emails FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert emails"
  ON creative_emails FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update emails"
  ON creative_emails FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can delete emails"
  ON creative_emails FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org members can view email attachments"
  ON creative_email_attachments FOR SELECT
  USING (
    email_id IN (
      SELECT e.id FROM creative_emails e
      WHERE e.organization_id IN (
        SELECT om.organization_id FROM organization_members om
        WHERE om.user_id = auth.uid()
      )
    )
  );

-- Updated-at trigger (reuse existing function)
CREATE TRIGGER update_creative_emails_updated_at
  BEFORE UPDATE ON creative_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
