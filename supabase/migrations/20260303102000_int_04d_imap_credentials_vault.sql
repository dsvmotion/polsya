-- INT-04D-C (foundation): secure vault for org-level IMAP/SMTP credentials.

create table if not exists public.integration_email_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null check (provider in ('email_imap')),
  account_email text not null,
  username text not null,
  password text not null,
  imap_host text not null,
  imap_port integer not null default 993 check (imap_port > 0 and imap_port <= 65535),
  imap_secure boolean not null default true,
  smtp_host text not null,
  smtp_port integer not null default 465 check (smtp_port > 0 and smtp_port <= 65535),
  smtp_secure boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_id, provider)
);

create index if not exists idx_integration_email_credentials_lookup
  on public.integration_email_credentials (organization_id, integration_id, provider);

create trigger update_integration_email_credentials_updated_at
  before update on public.integration_email_credentials
  for each row
  execute function public.update_updated_at_column();

alter table public.integration_email_credentials enable row level security;
-- No policies by design (service-role only access).
