-- Enrichment Engine Tables
-- Tables: enrichment_credits, enrichment_recipes, enrichment_runs
-- Clay-inspired waterfall enrichment with sequential provider queries

-- ============================================================
-- enrichment_credits
-- ============================================================
create table if not exists public.enrichment_credits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  total_credits integer not null default 0,
  used_credits integer not null default 0,
  reset_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_enrichment_credits_provider on public.enrichment_credits(organization_id, provider);

alter table public.enrichment_credits enable row level security;

create policy "enrichment_credits_select" on public.enrichment_credits
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_credits_insert" on public.enrichment_credits
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_credits_update" on public.enrichment_credits
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_enrichment_credits_updated_at
  before update on public.enrichment_credits
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- enrichment_recipes
-- ============================================================
create table if not exists public.enrichment_recipes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  steps jsonb not null default '[]',
  target_entity_type text not null,
  is_active boolean default true,
  run_count integer default 0,
  last_run_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_enrichment_recipes_org on public.enrichment_recipes(organization_id);

alter table public.enrichment_recipes enable row level security;

create policy "enrichment_recipes_select" on public.enrichment_recipes
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_recipes_insert" on public.enrichment_recipes
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_recipes_update" on public.enrichment_recipes
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_recipes_delete" on public.enrichment_recipes
  for delete using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid() and om.role in ('owner','admin')));

create trigger set_enrichment_recipes_updated_at
  before update on public.enrichment_recipes
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- enrichment_runs
-- ============================================================
create table if not exists public.enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipe_id uuid references public.enrichment_recipes(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  entity_type text not null,
  entity_ids uuid[] default '{}',
  results jsonb default '[]',
  credits_used integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_log jsonb default '[]',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_enrichment_runs_org on public.enrichment_runs(organization_id);
create index idx_enrichment_runs_recipe on public.enrichment_runs(recipe_id);
create index idx_enrichment_runs_status on public.enrichment_runs(organization_id, status);

alter table public.enrichment_runs enable row level security;

create policy "enrichment_runs_select" on public.enrichment_runs
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_runs_insert" on public.enrichment_runs
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "enrichment_runs_update" on public.enrichment_runs
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_enrichment_runs_updated_at
  before update on public.enrichment_runs
  for each row execute function public.update_updated_at_column();
