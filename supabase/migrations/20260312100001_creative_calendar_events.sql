-- Creative Calendar Events Table
-- Table: creative_calendar_events
-- Synced calendar events linked to org + entities with RLS policies

-- ============================================================
-- creative_calendar_events
-- ============================================================
create table if not exists public.creative_calendar_events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  integration_id    uuid not null references public.integration_connections(id) on delete cascade,
  provider          text not null check (provider in ('gmail','outlook')),
  provider_event_id text not null,
  calendar_id       text not null default 'primary',
  title             text not null,
  description       text,
  location          text,
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  all_day           boolean not null default false,
  status            text not null check (status in ('confirmed','tentative','cancelled')),
  organizer_email   text,
  organizer_name    text,
  attendees         jsonb not null default '[]',
  recurrence        text[],
  html_link         text,
  color_id          text,
  entity_type       text check (entity_type in ('client','contact','project')),
  entity_id         uuid,
  matched_by        text check (matched_by in ('auto_email','auto_domain','manual')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, provider, provider_event_id)
);

create index idx_creative_calendar_events_org_range
  on public.creative_calendar_events(organization_id, start_at, end_at);

create index idx_creative_calendar_events_org_entity
  on public.creative_calendar_events(organization_id, entity_type, entity_id)
  where entity_id is not null;

-- ============================================================
-- RLS — creative_calendar_events
-- ============================================================
alter table public.creative_calendar_events enable row level security;

create policy "creative_calendar_events_select" on public.creative_calendar_events
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_calendar_events_insert" on public.creative_calendar_events
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_calendar_events_update" on public.creative_calendar_events
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

create policy "creative_calendar_events_delete" on public.creative_calendar_events
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

-- ============================================================
-- Triggers
-- ============================================================
create trigger set_creative_calendar_events_updated_at
  before update on public.creative_calendar_events
  for each row execute function public.update_updated_at_column();
