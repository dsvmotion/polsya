-- Creative Style Analysis Tables (requires pgvector extension)
-- Stores style embeddings for visual similarity search (512-dim vectors)

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

-- IVFFlat index for similarity search — requires at least ~100 rows to be effective.
-- For initial deployment with few rows, consider switching to HNSW index later.
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
  for each row execute function public.update_updated_at_column();
