-- INT-03A: Queue-backed integration sync jobs.

create table public.integration_sync_jobs (
  id               uuid        primary key default gen_random_uuid(),
  integration_id   uuid        not null references public.integration_connections(id) on delete cascade,
  provider         text        not null,
  job_type         text        not null check (job_type in ('manual', 'scheduled', 'webhook')),
  status           text        not null default 'queued'
                               check (status in ('queued', 'running', 'success', 'error', 'cancelled')),
  payload          jsonb       not null default '{}'::jsonb,
  requested_by     text        null,
  idempotency_key  text        null,
  error_message    text        null,
  created_at       timestamptz not null default now(),
  started_at       timestamptz null,
  finished_at      timestamptz null
);

create index idx_integration_sync_jobs_integration_created
  on public.integration_sync_jobs (integration_id, created_at desc);

create index idx_integration_sync_jobs_status_created
  on public.integration_sync_jobs (status, created_at desc);

create unique index idx_integration_sync_jobs_idempotency
  on public.integration_sync_jobs (idempotency_key)
  where idempotency_key is not null;

alter table public.integration_sync_jobs enable row level security;

create policy "Authenticated can select integration_sync_jobs"
  on public.integration_sync_jobs for select to authenticated
  using (true);

create policy "Authenticated can insert integration_sync_jobs"
  on public.integration_sync_jobs for insert to authenticated
  with check (true);

create policy "Authenticated can update integration_sync_jobs"
  on public.integration_sync_jobs for update to authenticated
  using (true) with check (true);

create policy "Authenticated can delete integration_sync_jobs"
  on public.integration_sync_jobs for delete to authenticated
  using (true);
