-- INT-04C: Email marketing connector V1 (Brevo) with org-scoped API key vault.

-- 1) Expand provider checks to include brevo.
alter table public.integration_connections
  drop constraint if exists integration_connections_provider_check;

alter table public.integration_connections
  drop constraint if exists chk_integration_connections_provider;

alter table public.integration_connections
  add constraint chk_integration_connections_provider
  check (provider in (
    'woocommerce',
    'shopify',
    'gmail',
    'outlook',
    'email_imap',
    'brevo',
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

alter table public.integration_sync_jobs
  drop constraint if exists chk_integration_sync_jobs_provider;

alter table public.integration_sync_jobs
  add constraint chk_integration_sync_jobs_provider
  check (provider in (
    'woocommerce',
    'shopify',
    'gmail',
    'outlook',
    'email_imap',
    'brevo',
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

alter table public.integration_sync_objects
  drop constraint if exists chk_integration_sync_objects_provider;

alter table public.integration_sync_objects
  add constraint chk_integration_sync_objects_provider
  check (provider in (
    'woocommerce',
    'shopify',
    'gmail',
    'outlook',
    'email_imap',
    'brevo',
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

-- 2) API key vault for providers that need org-scoped secrets.
create table if not exists public.integration_api_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null check (provider in ('brevo')),
  api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_id, provider)
);

create index if not exists idx_integration_api_credentials_lookup
  on public.integration_api_credentials (organization_id, integration_id, provider);

drop trigger if exists update_integration_api_credentials_updated_at on public.integration_api_credentials;
create trigger update_integration_api_credentials_updated_at
  before update on public.integration_api_credentials
  for each row
  execute function public.update_updated_at_column();

alter table public.integration_api_credentials enable row level security;
-- No RLS policies by design (service-role only access).
