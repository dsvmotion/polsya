-- Creative Domain Core Tables
-- Tables: creative_clients, creative_contacts, creative_projects, creative_portfolios, creative_opportunities
-- All workspace-scoped via organizations.id with RLS policies

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
  for each row execute function public.update_updated_at_column();

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
  for each row execute function public.update_updated_at_column();

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
  for each row execute function public.update_updated_at_column();

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
  for each row execute function public.update_updated_at_column();

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
  for each row execute function public.update_updated_at_column();
