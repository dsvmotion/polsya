-- Ingestion Engine Tables
-- Tables: ingestion_providers, ingestion_runs, ingestion_jobs
-- Manages data import from external sources (LinkedIn, Behance, Dribbble, etc.)

-- ============================================================
-- ingestion_providers
-- ============================================================
create table if not exists public.ingestion_providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_type text not null,
  name text not null,
  config jsonb default '{}',
  credentials_encrypted text,
  is_active boolean default true,
  last_sync_at timestamptz,
  sync_frequency_minutes integer default 60,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ingestion_providers_org on public.ingestion_providers(organization_id);
create index idx_ingestion_providers_active on public.ingestion_providers(organization_id) where is_active = true;

alter table public.ingestion_providers enable row level security;

create policy "ingestion_providers_select" on public.ingestion_providers
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_providers_insert" on public.ingestion_providers
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_providers_update" on public.ingestion_providers
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_providers_delete" on public.ingestion_providers
  for delete using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid() and om.role in ('owner','admin')));

create trigger set_ingestion_providers_updated_at
  before update on public.ingestion_providers
  for each row execute function public.set_updated_at();

-- ============================================================
-- ingestion_runs
-- ============================================================
create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_id uuid not null references public.ingestion_providers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  records_processed integer default 0,
  records_created integer default 0,
  records_updated integer default 0,
  records_failed integer default 0,
  error_log jsonb default '[]',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ingestion_runs_org on public.ingestion_runs(organization_id);
create index idx_ingestion_runs_provider on public.ingestion_runs(provider_id);
create index idx_ingestion_runs_status on public.ingestion_runs(organization_id, status);

alter table public.ingestion_runs enable row level security;

create policy "ingestion_runs_select" on public.ingestion_runs
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_runs_insert" on public.ingestion_runs
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_runs_update" on public.ingestion_runs
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_ingestion_runs_updated_at
  before update on public.ingestion_runs
  for each row execute function public.set_updated_at();

-- ============================================================
-- ingestion_jobs
-- ============================================================
create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ingestion_runs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_type text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','skipped')),
  input_data jsonb default '{}',
  output_data jsonb default '{}',
  error_message text,
  attempts integer default 0,
  max_attempts integer default 3,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ingestion_jobs_run on public.ingestion_jobs(run_id);
create index idx_ingestion_jobs_org on public.ingestion_jobs(organization_id);
create index idx_ingestion_jobs_status on public.ingestion_jobs(run_id, status);

alter table public.ingestion_jobs enable row level security;

create policy "ingestion_jobs_select" on public.ingestion_jobs
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_jobs_insert" on public.ingestion_jobs
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_jobs_update" on public.ingestion_jobs
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_ingestion_jobs_updated_at
  before update on public.ingestion_jobs
  for each row execute function public.set_updated_at();
