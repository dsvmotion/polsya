-- Creative Email Tables
-- Tables: creative_emails, creative_email_attachments
-- Synced email messages linked to org + entities with RLS policies

-- ============================================================
-- creative_emails
-- ============================================================
create table if not exists public.creative_emails (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id  uuid not null references public.integration_connections(id) on delete cascade,
  provider        text not null check (provider in ('gmail','outlook','email_imap')),
  message_id      text not null,
  thread_id       text,
  subject         text,
  from_address    text not null,
  from_name       text,
  to_addresses    jsonb not null default '[]',
  cc_addresses    jsonb not null default '[]',
  bcc_addresses   jsonb not null default '[]',
  body_text       text,
  body_html       text,
  snippet         text,
  labels          text[] not null default '{}',
  is_read         boolean not null default false,
  is_starred      boolean not null default false,
  is_draft        boolean not null default false,
  direction       text not null check (direction in ('inbound','outbound')),
  sent_at         timestamptz not null,
  has_attachments boolean not null default false,
  raw_headers     jsonb,
  entity_type     text check (entity_type in ('client','contact','project')),
  entity_id       uuid,
  matched_by      text check (matched_by in ('auto_email','auto_domain','manual')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, provider, message_id)
);

create index idx_creative_emails_org_entity
  on public.creative_emails(organization_id, entity_type, entity_id)
  where entity_id is not null;

create index idx_creative_emails_org_sent
  on public.creative_emails(organization_id, sent_at desc);

create index idx_creative_emails_thread
  on public.creative_emails(organization_id, thread_id)
  where thread_id is not null;

-- ============================================================
-- creative_email_attachments
-- Write operations (insert/update/delete) are service-role only,
-- performed by the email sync edge function.
-- ============================================================
create table if not exists public.creative_email_attachments (
  id              uuid primary key default gen_random_uuid(),
  email_id        uuid not null references public.creative_emails(id) on delete cascade,
  filename        text not null,
  content_type    text,
  size_bytes      bigint,
  storage_path    text,
  provider_ref    text,
  created_at      timestamptz not null default now()
);

create index idx_creative_email_attachments_email
  on public.creative_email_attachments(email_id);

-- ============================================================
-- RLS — creative_emails
-- ============================================================
alter table public.creative_emails enable row level security;

create policy "creative_emails_select" on public.creative_emails
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_emails_insert" on public.creative_emails
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_emails_update" on public.creative_emails
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  ) with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_emails_delete" on public.creative_emails
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

-- ============================================================
-- RLS — creative_email_attachments (select only; writes are service-role)
-- ============================================================
alter table public.creative_email_attachments enable row level security;

create policy "creative_email_attachments_select" on public.creative_email_attachments
  for select using (
    email_id in (
      select e.id from public.creative_emails e
      where e.organization_id in (
        select om.organization_id from public.organization_members om
        where om.user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Triggers
-- ============================================================
create trigger set_creative_emails_updated_at
  before update on public.creative_emails
  for each row execute function public.update_updated_at_column();
