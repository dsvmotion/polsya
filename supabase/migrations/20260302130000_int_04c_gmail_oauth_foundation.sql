-- INT-04C (part 1): Gmail OAuth foundation + multi-tenant uniqueness fix for integrations.

-- Integration names must be unique per organization, not globally.
alter table public.integration_connections
  drop constraint if exists integration_connections_provider_display_name_key;

create unique index if not exists idx_integration_connections_org_provider_display
  on public.integration_connections (organization_id, provider, display_name);

-- OAuth state tokens (short-lived, single-use). Service-role only table (no RLS policies).
create table if not exists public.integration_oauth_states (
  state text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null check (provider in ('gmail')),
  created_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz null
);

create index if not exists idx_integration_oauth_states_lookup
  on public.integration_oauth_states (organization_id, integration_id, provider, expires_at desc);

alter table public.integration_oauth_states enable row level security;

-- OAuth tokens (sensitive): service-role only (no RLS policies).
create table if not exists public.integration_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null check (provider in ('gmail')),
  provider_account_email text null,
  access_token text not null,
  refresh_token text null,
  token_type text null,
  scope text null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_id, provider)
);

create index if not exists idx_integration_oauth_tokens_lookup
  on public.integration_oauth_tokens (organization_id, integration_id, provider);

create trigger update_integration_oauth_tokens_updated_at
  before update on public.integration_oauth_tokens
  for each row
  execute function public.update_updated_at_column();

alter table public.integration_oauth_tokens enable row level security;
