-- INT-04D hotfix: reconcile integration baseline when migration history is marked as applied
-- but integration tables are missing in the remote database.
--
-- This migration is intentionally idempotent and must run BEFORE 20260303101000.

-- Hard guardrails: these are required by the multi-tenant architecture.
do $$
begin
  if to_regclass('public.organizations') is null then
    raise exception 'Missing required table public.organizations. Run/reconcile ARCH-02A first.';
  end if;

  if to_regprocedure('public.is_org_member(uuid)') is null then
    raise exception 'Missing required function public.is_org_member(uuid). Run/reconcile ARCH-02A first.';
  end if;

  if to_regprocedure('public.current_user_organization_id()') is null then
    raise exception 'Missing required function public.current_user_organization_id(). Run/reconcile ARCH-02A first.';
  end if;
end $$;

-- integration_connections -----------------------------------------------------
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  display_name text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  is_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_connections
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists provider text,
  add column if not exists display_name text,
  add column if not exists status text,
  add column if not exists is_enabled boolean,
  add column if not exists metadata jsonb,
  add column if not exists last_sync_at timestamptz,
  add column if not exists last_error text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.integration_connections
set status = 'disconnected'
where status is null;

update public.integration_connections
set is_enabled = false
where is_enabled is null;

update public.integration_connections
set metadata = '{}'::jsonb
where metadata is null;

update public.integration_connections
set created_at = now()
where created_at is null;

update public.integration_connections
set updated_at = now()
where updated_at is null;

alter table public.integration_connections
  alter column organization_id set not null,
  alter column provider set not null,
  alter column display_name set not null,
  alter column status set not null,
  alter column is_enabled set not null,
  alter column metadata set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column organization_id set default public.current_user_organization_id(),
  alter column status set default 'disconnected',
  alter column is_enabled set default false,
  alter column metadata set default '{}'::jsonb,
  alter column created_at set default now(),
  alter column updated_at set default now();

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
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

create unique index if not exists idx_integration_connections_org_provider_display
  on public.integration_connections (organization_id, provider, display_name);

create index if not exists idx_integration_connections_provider_status
  on public.integration_connections(provider, status);

create index if not exists idx_integration_connections_enabled
  on public.integration_connections(is_enabled, updated_at desc);

drop trigger if exists update_integration_connections_updated_at on public.integration_connections;
create trigger update_integration_connections_updated_at
  before update on public.integration_connections
  for each row
  execute function public.update_updated_at_column();

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    raise exception 'No organizations found to backfill integration_connections.organization_id';
  end if;

  update public.integration_connections
  set organization_id = default_org
  where organization_id is null;
end $$;

alter table public.integration_connections enable row level security;

drop policy if exists "Org members can select integration_connections" on public.integration_connections;
drop policy if exists "Org members can insert integration_connections" on public.integration_connections;
drop policy if exists "Org members can update integration_connections" on public.integration_connections;
drop policy if exists "Org members can delete integration_connections" on public.integration_connections;

create policy "Org members can select integration_connections"
  on public.integration_connections for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_connections"
  on public.integration_connections for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update integration_connections"
  on public.integration_connections for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete integration_connections"
  on public.integration_connections for delete to authenticated
  using (public.is_org_member(organization_id));

-- integration_sync_runs -------------------------------------------------------
create table if not exists public.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  run_type text not null check (run_type in ('manual', 'scheduled', 'webhook')),
  status text not null check (status in ('running', 'success', 'error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  duration_ms integer not null default 0,
  records_processed int not null default 0,
  records_failed int not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  error_message text null,
  created_at timestamptz not null default now()
);

alter table public.integration_sync_runs
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists duration_ms integer not null default 0,
  add column if not exists metrics jsonb not null default '{}'::jsonb;

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    raise exception 'No organizations found to backfill integration_sync_runs.organization_id';
  end if;

  update public.integration_sync_runs
  set organization_id = default_org
  where organization_id is null;
end $$;

alter table public.integration_sync_runs
  alter column organization_id set not null,
  alter column organization_id set default public.current_user_organization_id();

create index if not exists idx_integration_sync_runs_timeline
  on public.integration_sync_runs(integration_id, started_at desc);

create index if not exists idx_integration_sync_runs_status
  on public.integration_sync_runs(status, started_at desc);

create index if not exists idx_integration_sync_runs_org
  on public.integration_sync_runs(organization_id, integration_id, started_at desc);

alter table public.integration_sync_runs enable row level security;

drop policy if exists "Org members can select integration_sync_runs" on public.integration_sync_runs;
drop policy if exists "Org members can insert integration_sync_runs" on public.integration_sync_runs;
drop policy if exists "Org members can update integration_sync_runs" on public.integration_sync_runs;
drop policy if exists "Org members can delete integration_sync_runs" on public.integration_sync_runs;

create policy "Org members can select integration_sync_runs"
  on public.integration_sync_runs for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_sync_runs"
  on public.integration_sync_runs for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can update integration_sync_runs"
  on public.integration_sync_runs for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can delete integration_sync_runs"
  on public.integration_sync_runs for delete to authenticated
  using (public.is_org_member(organization_id));

-- integration_sync_jobs -------------------------------------------------------
create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  job_type text not null check (job_type in ('manual', 'scheduled', 'webhook')),
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'error', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  requested_by text null,
  idempotency_key text null,
  error_message text null,
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  finished_at timestamptz null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  next_retry_at timestamptz null,
  last_attempt_at timestamptz null,
  dead_lettered_at timestamptz null
);

alter table public.integration_sync_jobs
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_retry_at timestamptz null,
  add column if not exists last_attempt_at timestamptz null,
  add column if not exists dead_lettered_at timestamptz null;

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    raise exception 'No organizations found to backfill integration_sync_jobs.organization_id';
  end if;

  update public.integration_sync_jobs
  set organization_id = default_org
  where organization_id is null;
end $$;

alter table public.integration_sync_jobs
  alter column organization_id set not null,
  alter column organization_id set default public.current_user_organization_id(),
  alter column attempt_count set not null,
  alter column max_attempts set not null;

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
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

create index if not exists idx_integration_sync_jobs_integration_created
  on public.integration_sync_jobs(integration_id, created_at desc);

create index if not exists idx_integration_sync_jobs_status_created
  on public.integration_sync_jobs(status, created_at desc);

create unique index if not exists idx_integration_sync_jobs_idempotency
  on public.integration_sync_jobs(idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_integration_sync_jobs_org
  on public.integration_sync_jobs(organization_id, integration_id, created_at desc);

create index if not exists idx_integration_sync_jobs_queue_ready
  on public.integration_sync_jobs (organization_id, status, next_retry_at, created_at)
  where status = 'queued';

alter table public.integration_sync_jobs enable row level security;

drop policy if exists "Org members can select integration_sync_jobs" on public.integration_sync_jobs;
drop policy if exists "Org members can insert integration_sync_jobs" on public.integration_sync_jobs;
drop policy if exists "Org members can update integration_sync_jobs" on public.integration_sync_jobs;
drop policy if exists "Org members can delete integration_sync_jobs" on public.integration_sync_jobs;

create policy "Org members can select integration_sync_jobs"
  on public.integration_sync_jobs for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_sync_jobs"
  on public.integration_sync_jobs for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can update integration_sync_jobs"
  on public.integration_sync_jobs for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can delete integration_sync_jobs"
  on public.integration_sync_jobs for delete to authenticated
  using (public.is_org_member(organization_id));

-- integration_sync_objects ----------------------------------------------------
create table if not exists public.integration_sync_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null,
  sync_target text not null check (sync_target in ('entities', 'orders', 'products', 'inventory')),
  external_id text not null,
  external_updated_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_id, provider, sync_target, external_id)
);

alter table public.integration_sync_objects
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    raise exception 'No organizations found to backfill integration_sync_objects.organization_id';
  end if;

  update public.integration_sync_objects
  set organization_id = default_org
  where organization_id is null;
end $$;

alter table public.integration_sync_objects
  alter column organization_id set not null,
  alter column organization_id set default public.current_user_organization_id();

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
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

create index if not exists idx_integration_sync_objects_lookup
  on public.integration_sync_objects (integration_id, sync_target, last_seen_at desc);

create index if not exists idx_integration_sync_objects_org_provider
  on public.integration_sync_objects (organization_id, provider, sync_target, updated_at desc);

drop trigger if exists update_integration_sync_objects_updated_at on public.integration_sync_objects;
create trigger update_integration_sync_objects_updated_at
  before update on public.integration_sync_objects
  for each row
  execute function public.update_updated_at_column();

alter table public.integration_sync_objects enable row level security;

drop policy if exists "Org members can select integration_sync_objects" on public.integration_sync_objects;
drop policy if exists "Org members can insert integration_sync_objects" on public.integration_sync_objects;
drop policy if exists "Org members can update integration_sync_objects" on public.integration_sync_objects;
drop policy if exists "Org members can delete integration_sync_objects" on public.integration_sync_objects;

create policy "Org members can select integration_sync_objects"
  on public.integration_sync_objects for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_sync_objects"
  on public.integration_sync_objects for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can update integration_sync_objects"
  on public.integration_sync_objects for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can delete integration_sync_objects"
  on public.integration_sync_objects for delete to authenticated
  using (public.is_org_member(organization_id));

-- OAuth tables ----------------------------------------------------------------
create table if not exists public.integration_oauth_states (
  state text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz null
);

alter table public.integration_oauth_states
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists integration_id uuid references public.integration_connections(id) on delete cascade,
  add column if not exists provider text,
  add column if not exists created_by text,
  add column if not exists created_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists consumed_at timestamptz;

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    raise exception 'No organizations found to backfill integration_oauth_states.organization_id';
  end if;

  update public.integration_oauth_states
  set organization_id = default_org
  where organization_id is null;
end $$;

update public.integration_oauth_states
set created_at = now()
where created_at is null;

alter table public.integration_oauth_states
  alter column organization_id set not null,
  alter column integration_id set not null,
  alter column provider set not null,
  alter column created_by set not null,
  alter column created_at set not null,
  alter column expires_at set not null,
  alter column created_at set default now();

alter table public.integration_oauth_states
  drop constraint if exists integration_oauth_states_provider_check;
alter table public.integration_oauth_states
  drop constraint if exists chk_integration_oauth_states_provider;

alter table public.integration_oauth_states
  add constraint chk_integration_oauth_states_provider
  check (provider in ('gmail', 'outlook'));

create index if not exists idx_integration_oauth_states_lookup
  on public.integration_oauth_states (organization_id, integration_id, provider, expires_at desc);

alter table public.integration_oauth_states enable row level security;
-- service-role only by design: no authenticated policies.

create table if not exists public.integration_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null,
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

alter table public.integration_oauth_tokens
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists integration_id uuid references public.integration_connections(id) on delete cascade,
  add column if not exists provider text,
  add column if not exists provider_account_email text,
  add column if not exists access_token text,
  add column if not exists refresh_token text,
  add column if not exists token_type text,
  add column if not exists scope text,
  add column if not exists expires_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    raise exception 'No organizations found to backfill integration_oauth_tokens.organization_id';
  end if;

  update public.integration_oauth_tokens
  set organization_id = default_org
  where organization_id is null;
end $$;

update public.integration_oauth_tokens
set created_at = now()
where created_at is null;

update public.integration_oauth_tokens
set updated_at = now()
where updated_at is null;

alter table public.integration_oauth_tokens
  alter column organization_id set not null,
  alter column integration_id set not null,
  alter column provider set not null,
  alter column access_token set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.integration_oauth_tokens
  drop constraint if exists integration_oauth_tokens_provider_check;
alter table public.integration_oauth_tokens
  drop constraint if exists chk_integration_oauth_tokens_provider;

alter table public.integration_oauth_tokens
  add constraint chk_integration_oauth_tokens_provider
  check (provider in ('gmail', 'outlook'));

create index if not exists idx_integration_oauth_tokens_lookup
  on public.integration_oauth_tokens (organization_id, integration_id, provider);

drop trigger if exists update_integration_oauth_tokens_updated_at on public.integration_oauth_tokens;
create trigger update_integration_oauth_tokens_updated_at
  before update on public.integration_oauth_tokens
  for each row
  execute function public.update_updated_at_column();

alter table public.integration_oauth_tokens enable row level security;
-- service-role only by design: no authenticated policies.
