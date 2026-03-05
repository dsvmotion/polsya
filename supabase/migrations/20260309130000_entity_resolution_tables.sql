-- Entity Resolution Tables
-- Tables: entity_resolution_candidates, entity_source_mappings
-- Deduplication and cross-source identity matching

-- ============================================================
-- entity_resolution_candidates
-- ============================================================
create table if not exists public.entity_resolution_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_a_type text not null,
  entity_a_id uuid not null,
  entity_b_type text not null,
  entity_b_id uuid not null,
  confidence_score numeric(5,4) not null default 0,
  match_reasons jsonb default '[]',
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','auto_merged')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resolution_candidates_org on public.entity_resolution_candidates(organization_id);
create index idx_resolution_candidates_status on public.entity_resolution_candidates(organization_id, status);
create index idx_resolution_candidates_a on public.entity_resolution_candidates(entity_a_type, entity_a_id);
create index idx_resolution_candidates_b on public.entity_resolution_candidates(entity_b_type, entity_b_id);

alter table public.entity_resolution_candidates enable row level security;

create policy "resolution_candidates_select" on public.entity_resolution_candidates
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "resolution_candidates_insert" on public.entity_resolution_candidates
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "resolution_candidates_update" on public.entity_resolution_candidates
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_resolution_candidates_updated_at
  before update on public.entity_resolution_candidates
  for each row execute function public.set_updated_at();

-- ============================================================
-- entity_source_mappings
-- ============================================================
create table if not exists public.entity_source_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  source_provider text not null,
  source_id text not null,
  source_data jsonb default '{}',
  is_primary boolean default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_source_mappings_org on public.entity_source_mappings(organization_id);
create index idx_source_mappings_entity on public.entity_source_mappings(entity_type, entity_id);
create unique index idx_source_mappings_source on public.entity_source_mappings(organization_id, source_provider, source_id);

alter table public.entity_source_mappings enable row level security;

create policy "source_mappings_select" on public.entity_source_mappings
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "source_mappings_insert" on public.entity_source_mappings
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "source_mappings_update" on public.entity_source_mappings
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_source_mappings_updated_at
  before update on public.entity_source_mappings
  for each row execute function public.set_updated_at();
