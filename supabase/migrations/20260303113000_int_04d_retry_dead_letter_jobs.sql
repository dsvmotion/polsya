-- INT-04D-2: Add retry policy + dead-letter support for integration sync jobs.

alter table public.integration_sync_jobs
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_retry_at timestamptz null,
  add column if not exists last_attempt_at timestamptz null,
  add column if not exists dead_lettered_at timestamptz null;

alter table public.integration_sync_jobs
  drop constraint if exists chk_integration_sync_jobs_attempt_count;

alter table public.integration_sync_jobs
  add constraint chk_integration_sync_jobs_attempt_count
  check (attempt_count >= 0);

alter table public.integration_sync_jobs
  drop constraint if exists chk_integration_sync_jobs_max_attempts;

alter table public.integration_sync_jobs
  add constraint chk_integration_sync_jobs_max_attempts
  check (max_attempts >= 1 and max_attempts <= 10);

create index if not exists idx_integration_sync_jobs_queue_ready
  on public.integration_sync_jobs (organization_id, status, next_retry_at, created_at)
  where status = 'queued';

update public.integration_sync_jobs
set attempt_count = 1
where attempt_count = 0
  and started_at is not null;

create table if not exists public.integration_sync_job_dead_letters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.integration_sync_jobs(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null,
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null,
  max_attempts integer not null,
  error_message text not null,
  first_created_at timestamptz not null,
  failed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (job_id)
);

create index if not exists idx_integration_sync_job_dead_letters_org_failed
  on public.integration_sync_job_dead_letters (organization_id, failed_at desc);

alter table public.integration_sync_job_dead_letters enable row level security;

drop policy if exists "Org members can select integration_sync_job_dead_letters"
  on public.integration_sync_job_dead_letters;

create policy "Org members can select integration_sync_job_dead_letters"
  on public.integration_sync_job_dead_letters
  for select
  to authenticated
  using (organization_id = public.current_user_organization_id());
