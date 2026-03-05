-- Engine Events Table
-- Central event bus for inter-engine communication
-- Events flow: data.ingested → entity.resolved → style.analyzed → signal.detected → entity.enriched

create table if not exists public.engine_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  source_engine text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  processed_by text[] default '{}',
  error_message text,
  retry_count integer default 0,
  max_retries integer default 3,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index idx_engine_events_org on public.engine_events(organization_id);
create index idx_engine_events_type on public.engine_events(event_type);
create index idx_engine_events_pending on public.engine_events(organization_id, status) where status = 'pending';
create index idx_engine_events_entity on public.engine_events(entity_type, entity_id);
create index idx_engine_events_created on public.engine_events(created_at);

alter table public.engine_events enable row level security;

create policy "engine_events_select" on public.engine_events
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "engine_events_insert" on public.engine_events
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "engine_events_update" on public.engine_events
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
