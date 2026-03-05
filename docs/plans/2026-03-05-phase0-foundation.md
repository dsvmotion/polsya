# Phase 0: Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build database foundation + UI shell + routing for Creative Intelligence Platform alongside existing CRM.

**Architecture:** Parallel construction — new `/creative/*` routes with their own layout, sidebar, and components. Existing CRM routes remain untouched. Seven new database migrations create the creative domain tables. All tables workspace-scoped via `organizations.id` with RLS policies.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + pgvector), React Router v6, cmdk (already installed), react-resizable-panels (already installed), @tanstack/react-table (to install).

---

## Task 1: Install @tanstack/react-table

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npm install @tanstack/react-table`
Expected: Package added to dependencies in package.json

**Step 2: Verify installation**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && node -e "require('@tanstack/react-table')"`
Expected: No error

---

## Task 2: Database Migration — Creative Domain Core

**Files:**
- Create: `supabase/migrations/20260309100000_creative_domain_core.sql`

Creates five core tables: `creative_clients`, `creative_contacts`, `creative_projects`, `creative_portfolios`, `creative_opportunities`. All with `organization_id` FK, RLS policies, `updated_at` triggers, and indexes.

**Step 1: Write migration file**

```sql
-- Creative Domain Core Tables
-- Tables: creative_clients, creative_contacts, creative_projects, creative_portfolios, creative_opportunities

-- ============================================================
-- creative_clients
-- ============================================================
create table if not exists public.creative_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text,
  website text,
  industry text,
  sub_industry text,
  size_category text check (size_category in ('solo','small','medium','large','enterprise')),
  status text not null default 'prospect' check (status in ('prospect','active','inactive','archived')),
  logo_url text,
  description text,
  tags text[] default '{}',
  social_links jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_creative_clients_org on public.creative_clients(organization_id);
create index idx_creative_clients_status on public.creative_clients(organization_id, status);
create unique index idx_creative_clients_slug on public.creative_clients(organization_id, slug) where slug is not null;

alter table public.creative_clients enable row level security;

create policy "creative_clients_select" on public.creative_clients
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_clients_insert" on public.creative_clients
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_clients_update" on public.creative_clients
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_clients_delete" on public.creative_clients
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

create trigger set_creative_clients_updated_at
  before update on public.creative_clients
  for each row execute function public.set_updated_at();

-- ============================================================
-- creative_contacts
-- ============================================================
create table if not exists public.creative_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.creative_clients(id) on delete set null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  title text,
  role text,
  linkedin_url text,
  avatar_url text,
  is_decision_maker boolean default false,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_creative_contacts_org on public.creative_contacts(organization_id);
create index idx_creative_contacts_client on public.creative_contacts(client_id);
create index idx_creative_contacts_email on public.creative_contacts(organization_id, email) where email is not null;

alter table public.creative_contacts enable row level security;

create policy "creative_contacts_select" on public.creative_contacts
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_contacts_insert" on public.creative_contacts
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_contacts_update" on public.creative_contacts
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_contacts_delete" on public.creative_contacts
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

create trigger set_creative_contacts_updated_at
  before update on public.creative_contacts
  for each row execute function public.set_updated_at();

-- ============================================================
-- creative_projects
-- ============================================================
create table if not exists public.creative_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.creative_clients(id) on delete set null,
  name text not null,
  slug text,
  description text,
  project_type text,
  status text not null default 'draft' check (status in ('draft','active','on_hold','completed','cancelled')),
  budget_cents bigint,
  currency text default 'USD',
  start_date date,
  end_date date,
  deliverables jsonb default '[]',
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_creative_projects_org on public.creative_projects(organization_id);
create index idx_creative_projects_client on public.creative_projects(client_id);
create index idx_creative_projects_status on public.creative_projects(organization_id, status);

alter table public.creative_projects enable row level security;

create policy "creative_projects_select" on public.creative_projects
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_projects_insert" on public.creative_projects
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_projects_update" on public.creative_projects
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_projects_delete" on public.creative_projects
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

create trigger set_creative_projects_updated_at
  before update on public.creative_projects
  for each row execute function public.set_updated_at();

-- ============================================================
-- creative_portfolios
-- ============================================================
create table if not exists public.creative_portfolios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.creative_projects(id) on delete set null,
  client_id uuid references public.creative_clients(id) on delete set null,
  title text not null,
  description text,
  category text,
  media_urls text[] default '{}',
  thumbnail_url text,
  is_public boolean default false,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_creative_portfolios_org on public.creative_portfolios(organization_id);
create index idx_creative_portfolios_project on public.creative_portfolios(project_id);

alter table public.creative_portfolios enable row level security;

create policy "creative_portfolios_select" on public.creative_portfolios
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_portfolios_insert" on public.creative_portfolios
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_portfolios_update" on public.creative_portfolios
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_portfolios_delete" on public.creative_portfolios
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

create trigger set_creative_portfolios_updated_at
  before update on public.creative_portfolios
  for each row execute function public.set_updated_at();

-- ============================================================
-- creative_opportunities
-- ============================================================
create table if not exists public.creative_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.creative_clients(id) on delete set null,
  contact_id uuid references public.creative_contacts(id) on delete set null,
  title text not null,
  description text,
  stage text not null default 'lead' check (stage in ('lead','qualified','proposal','negotiation','won','lost')),
  value_cents bigint,
  currency text default 'USD',
  probability integer default 0 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  source text,
  lost_reason text,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_creative_opportunities_org on public.creative_opportunities(organization_id);
create index idx_creative_opportunities_client on public.creative_opportunities(client_id);
create index idx_creative_opportunities_stage on public.creative_opportunities(organization_id, stage);

alter table public.creative_opportunities enable row level security;

create policy "creative_opportunities_select" on public.creative_opportunities
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_opportunities_insert" on public.creative_opportunities
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_opportunities_update" on public.creative_opportunities
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "creative_opportunities_delete" on public.creative_opportunities
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

create trigger set_creative_opportunities_updated_at
  before update on public.creative_opportunities
  for each row execute function public.set_updated_at();
```

---

## Task 3: Database Migration — Creative Style Tables (pgvector)

**Files:**
- Create: `supabase/migrations/20260309110000_creative_style_tables.sql`

**Step 1: Write migration**

```sql
-- Creative Style Analysis Tables (requires pgvector extension)
-- Stores style embeddings for visual similarity search

create extension if not exists vector with schema extensions;

create table if not exists public.creative_style_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.creative_clients(id) on delete cascade,
  portfolio_id uuid references public.creative_portfolios(id) on delete cascade,
  source_url text,
  style_embedding vector(512),
  color_palette jsonb default '[]',
  typography_profile jsonb default '{}',
  layout_patterns jsonb default '[]',
  brand_attributes jsonb default '{}',
  confidence_score numeric(5,4) default 0,
  analyzed_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_style_analyses_org on public.creative_style_analyses(organization_id);
create index idx_style_analyses_client on public.creative_style_analyses(client_id);
create index idx_style_analyses_portfolio on public.creative_style_analyses(portfolio_id);
create index idx_style_analyses_embedding on public.creative_style_analyses
  using ivfflat (style_embedding vector_cosine_ops) with (lists = 100);

alter table public.creative_style_analyses enable row level security;

create policy "style_analyses_select" on public.creative_style_analyses
  for select using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "style_analyses_insert" on public.creative_style_analyses
  for insert with check (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "style_analyses_update" on public.creative_style_analyses
  for update using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

create policy "style_analyses_delete" on public.creative_style_analyses
  for delete using (
    organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid()
      and om.role in ('owner','admin')
    )
  );

create trigger set_style_analyses_updated_at
  before update on public.creative_style_analyses
  for each row execute function public.set_updated_at();
```

---

## Task 4: Database Migration — Ingestion Engine Tables

**Files:**
- Create: `supabase/migrations/20260309120000_ingestion_engine_tables.sql`

```sql
-- Ingestion Engine Tables
-- Tables: ingestion_providers, ingestion_runs, ingestion_jobs

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

alter table public.ingestion_providers enable row level security;

create policy "ingestion_providers_select" on public.ingestion_providers
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_providers_insert" on public.ingestion_providers
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_providers_update" on public.ingestion_providers
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "ingestion_providers_delete" on public.ingestion_providers
  for delete using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid() and om.role in ('owner','admin')));

create trigger set_ingestion_providers_updated_at before update on public.ingestion_providers for each row execute function public.set_updated_at();

-- ingestion_runs
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

create trigger set_ingestion_runs_updated_at before update on public.ingestion_runs for each row execute function public.set_updated_at();

-- ingestion_jobs
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

create trigger set_ingestion_jobs_updated_at before update on public.ingestion_jobs for each row execute function public.set_updated_at();
```

---

## Task 5: Database Migration — Entity Resolution Tables

**Files:**
- Create: `supabase/migrations/20260309130000_entity_resolution_tables.sql`

```sql
-- Entity Resolution Tables
-- Tables: entity_resolution_candidates, entity_source_mappings

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

create trigger set_resolution_candidates_updated_at before update on public.entity_resolution_candidates for each row execute function public.set_updated_at();

-- entity_source_mappings
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

create trigger set_source_mappings_updated_at before update on public.entity_source_mappings for each row execute function public.set_updated_at();
```

---

## Task 6: Database Migration — Signal Engine Tables

**Files:**
- Create: `supabase/migrations/20260309140000_signal_engine_tables.sql`

```sql
-- Signal Engine Tables
-- Tables: signals, signal_rules

create table if not exists public.signal_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  rule_type text not null,
  conditions jsonb not null default '{}',
  actions jsonb not null default '[]',
  is_active boolean default true,
  priority integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_signal_rules_org on public.signal_rules(organization_id);
create index idx_signal_rules_active on public.signal_rules(organization_id, is_active);

alter table public.signal_rules enable row level security;

create policy "signal_rules_select" on public.signal_rules
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signal_rules_insert" on public.signal_rules
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signal_rules_update" on public.signal_rules
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signal_rules_delete" on public.signal_rules
  for delete using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid() and om.role in ('owner','admin')));

create trigger set_signal_rules_updated_at before update on public.signal_rules for each row execute function public.set_updated_at();

-- signals
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_id uuid references public.signal_rules(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  signal_type text not null,
  title text not null,
  description text,
  severity text not null default 'info' check (severity in ('info','low','medium','high','critical')),
  status text not null default 'new' check (status in ('new','seen','actioned','dismissed')),
  data jsonb default '{}',
  seen_by uuid references auth.users(id),
  seen_at timestamptz,
  actioned_at timestamptz,
  expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_signals_org on public.signals(organization_id);
create index idx_signals_entity on public.signals(entity_type, entity_id);
create index idx_signals_status on public.signals(organization_id, status);
create index idx_signals_severity on public.signals(organization_id, severity) where status = 'new';

alter table public.signals enable row level security;

create policy "signals_select" on public.signals
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signals_insert" on public.signals
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signals_update" on public.signals
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_signals_updated_at before update on public.signals for each row execute function public.set_updated_at();
```

---

## Task 7: Database Migration — Enrichment Engine Tables

**Files:**
- Create: `supabase/migrations/20260309150000_enrichment_engine_tables.sql`

```sql
-- Enrichment Engine Tables
-- Tables: enrichment_credits, enrichment_runs, enrichment_recipes

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

create trigger set_enrichment_credits_updated_at before update on public.enrichment_credits for each row execute function public.set_updated_at();

-- enrichment_recipes
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

create trigger set_enrichment_recipes_updated_at before update on public.enrichment_recipes for each row execute function public.set_updated_at();

-- enrichment_runs
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

create trigger set_enrichment_runs_updated_at before update on public.enrichment_runs for each row execute function public.set_updated_at();
```

---

## Task 8: Database Migration — Engine Events Table

**Files:**
- Create: `supabase/migrations/20260309160000_engine_events_tables.sql`

```sql
-- Engine Events Table
-- Central event bus for inter-engine communication

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
create index idx_engine_events_status on public.engine_events(organization_id, status) where status = 'pending';
create index idx_engine_events_entity on public.engine_events(entity_type, entity_id);
create index idx_engine_events_created on public.engine_events(created_at);

alter table public.engine_events enable row level security;

create policy "engine_events_select" on public.engine_events
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "engine_events_insert" on public.engine_events
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "engine_events_update" on public.engine_events
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

-- Partition hint: in production, consider partitioning by created_at for high-volume event tables
```

---

## Task 9: Design Tokens

**Files:**
- Create: `src/lib/design-tokens.ts`

Design tokens centralize the creative platform's visual language. These complement the existing CSS variables in `index.css`.

---

## Task 10: Creative Layout Components

**Files:**
- Create: `src/components/creative/layout/CreativeLayout.tsx`
- Create: `src/components/creative/layout/CreativeSidebar.tsx`
- Create: `src/components/creative/layout/CreativeTopBar.tsx`
- Create: `src/components/creative/layout/ContextPanel.tsx`
- Create: `src/components/creative/layout/WorkspaceContainer.tsx`

Modeled after existing `AppLayout.tsx` pattern: LayoutContext provider, sidebar, topbar, outlet. Adds resizable `ContextPanel` (right panel) using `react-resizable-panels`.

---

## Task 11: View Switcher

**Files:**
- Create: `src/components/creative/navigation/ViewSwitcher.tsx`

Toggle between Table/Cards/Graph/Map views. Renders skeleton placeholders for each mode.

---

## Task 12: Routing + Lazy Pages

**Files:**
- Modify: `src/App.tsx` (add `/creative/*` route group)
- Create: `src/pages/creative/CreativeDashboard.tsx`
- Create: `src/pages/creative/CreativeClients.tsx`
- Create: `src/pages/creative/CreativeProjects.tsx`
- Create: `src/pages/creative/CreativeOpportunities.tsx`

New `/creative/*` routes inside `ProtectedRoute` using `CreativeLayout`. Lazy-loaded pages with skeleton content.

---

## Task 13: Command Palette Extension

**Files:**
- Modify: `src/components/layout/CommandPalette.tsx` (add Creative section)

Add "Creative" command group with navigation to creative pages.

---

## Task 14: Commit, Push, Deploy

**Step 1:** Stage and commit all changes
**Step 2:** Push to main (triggers Vercel auto-deploy)
**Step 3:** Apply Supabase migrations via `supabase db push`
**Step 4:** Verify Vercel deployment
**Step 5:** Verify Supabase migrations

---
