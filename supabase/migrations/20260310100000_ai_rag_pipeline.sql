-- AI RAG Pipeline: documents, chunks, vector search, usage tracking, billing columns, storage bucket
-- Requires pgvector extension (already enabled via creative_style_tables migration).

-- ════════════════════════════════════════════════════════════════════════
-- 1. ai_documents — uploaded knowledge-base files
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.ai_documents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  title            text not null,
  source_type      text not null check (source_type in ('pdf', 'text', 'url')),
  source_url       text,
  file_size_bytes  bigint,
  status           text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  error_message    text,
  chunk_count      integer not null default 0,
  metadata         jsonb not null default '{}'::jsonb,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_ai_documents_org on public.ai_documents(organization_id);
create index if not exists idx_ai_documents_org_status on public.ai_documents(organization_id, status);

alter table public.ai_documents enable row level security;

-- Org members can read documents
drop policy if exists "Org members can select ai_documents" on public.ai_documents;
create policy "Org members can select ai_documents"
  on public.ai_documents for select to authenticated
  using (public.is_org_member(organization_id));

-- Org members can upload documents (enforce created_by = caller)
drop policy if exists "Org members can insert ai_documents" on public.ai_documents;
create policy "Org members can insert ai_documents"
  on public.ai_documents for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and (created_by is null or created_by = auth.uid())
  );

-- Org members can update documents
drop policy if exists "Org members can update ai_documents" on public.ai_documents;
create policy "Org members can update ai_documents"
  on public.ai_documents for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- Only admins can delete documents
drop policy if exists "Org admins can delete ai_documents" on public.ai_documents;
create policy "Org admins can delete ai_documents"
  on public.ai_documents for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Updated_at trigger
drop trigger if exists set_ai_documents_updated_at on public.ai_documents;
create trigger set_ai_documents_updated_at
  before update on public.ai_documents
  for each row execute function public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════════════
-- 2. ai_document_chunks — split text with 1536-dim embeddings
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.ai_document_chunks (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references public.ai_documents(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  chunk_index      integer not null,
  content          text not null,
  token_count      integer not null default 0,
  embedding        extensions.vector(1536),
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_ai_document_chunks_doc_index unique (document_id, chunk_index)
);

create index if not exists idx_ai_document_chunks_doc on public.ai_document_chunks(document_id);
create index if not exists idx_ai_document_chunks_org on public.ai_document_chunks(organization_id);

-- HNSW index for fast approximate nearest-neighbor search on embeddings
create index if not exists idx_ai_document_chunks_embedding on public.ai_document_chunks
  using hnsw (embedding extensions.vector_cosine_ops) with (m = 16, ef_construction = 64);

alter table public.ai_document_chunks enable row level security;

-- Org members can read chunks (inserts done via service role from edge functions)
drop policy if exists "Org members can select ai_document_chunks" on public.ai_document_chunks;
create policy "Org members can select ai_document_chunks"
  on public.ai_document_chunks for select to authenticated
  using (public.is_org_member(organization_id));

-- Updated_at trigger
drop trigger if exists set_ai_document_chunks_updated_at on public.ai_document_chunks;
create trigger set_ai_document_chunks_updated_at
  before update on public.ai_document_chunks
  for each row execute function public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════════════
-- 3. match_document_chunks — cosine-similarity search function
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.match_document_chunks(
  query_embedding   extensions.vector(1536),
  match_org_id      uuid,
  match_threshold   float default 0.7,
  match_count       int default 5
)
returns table (
  id          uuid,
  content     text,
  document_id uuid,
  title       text,
  similarity  float
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Enforce caller membership (security definer bypasses RLS)
  if not public.is_org_member(match_org_id) then
    raise exception 'Forbidden: caller is not a member of organization %', match_org_id;
  end if;

  return query
    select
      c.id,
      c.content,
      c.document_id,
      d.title,
      1 - (c.embedding <=> query_embedding)::float as similarity
    from public.ai_document_chunks c
    join public.ai_documents d on d.id = c.document_id
    where c.organization_id = match_org_id
      and d.status = 'ready'
      and (c.embedding <=> query_embedding) < (1.0 - match_threshold)
    order by c.embedding <=> query_embedding asc
    limit match_count;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 4. ai_usage_monthly — per-org credit consumption tracking
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.ai_usage_monthly (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  period                date not null,
  credits_used          integer not null default 0,
  credits_purchased     integer not null default 0,
  operation_breakdown   jsonb not null default '{}'::jsonb,
  constraint uq_ai_usage_monthly_org_period unique (organization_id, period)
);

create index if not exists idx_ai_usage_monthly_org on public.ai_usage_monthly(organization_id);

alter table public.ai_usage_monthly enable row level security;

-- Org members can view usage (writes via service role only)
drop policy if exists "Org members can select ai_usage_monthly" on public.ai_usage_monthly;
create policy "Org members can select ai_usage_monthly"
  on public.ai_usage_monthly for select to authenticated
  using (public.is_org_member(organization_id));

-- ════════════════════════════════════════════════════════════════════════
-- 5. billing_plans — add AI credit columns
-- ════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_plans') THEN
    RAISE NOTICE 'Skipping AI billing columns: billing_plans table not found.';
    RETURN;
  END IF;

  ALTER TABLE public.billing_plans
    ADD COLUMN IF NOT EXISTS monthly_ai_credits integer NULL,
    ADD COLUMN IF NOT EXISTS ai_features jsonb NOT NULL DEFAULT '["chat"]'::jsonb;

  -- Seed AI limits for existing plans
  UPDATE public.billing_plans SET monthly_ai_credits = 500,  ai_features = '["chat"]'::jsonb           WHERE LOWER(code) = 'starter';
  UPDATE public.billing_plans SET monthly_ai_credits = 2000, ai_features = '["chat","rag","documents"]'::jsonb WHERE LOWER(code) = 'pro';
END
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 6. get_org_ai_budget — returns credit limits + usage for current period
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.get_org_ai_budget(p_org_id uuid)
returns table (
  monthly_credits    integer,
  credits_used       integer,
  credits_purchased  integer,
  ai_features        jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_monthly_credits   integer;
  v_credits_used      integer := 0;
  v_credits_purchased integer := 0;
  v_ai_features       jsonb;
  v_current_period    date;
begin
  -- Enforce caller membership (security definer bypasses RLS)
  if not public.is_org_member(p_org_id) then
    raise exception 'Forbidden: caller is not a member of organization %', p_org_id;
  end if;

  v_current_period := date_trunc('month', now())::date;

  -- Fetch plan limits from the active/trialing subscription
  select bp.monthly_ai_credits, bp.ai_features
  into v_monthly_credits, v_ai_features
  from public.billing_subscriptions bs
  join public.billing_plans bp on bp.stripe_price_id = bs.stripe_price_id
  where bs.organization_id = p_org_id
    and bs.status in ('active', 'trialing')
  order by bs.updated_at desc
  limit 1;

  -- No subscription = unlimited trial with all features
  if not found then
    v_monthly_credits := null;
    v_ai_features := '["chat","rag","documents"]'::jsonb;
  end if;

  -- Fetch current period usage
  select u.credits_used, u.credits_purchased
  into v_credits_used, v_credits_purchased
  from public.ai_usage_monthly u
  where u.organization_id = p_org_id
    and u.period = v_current_period;

  if not found then
    v_credits_used := 0;
    v_credits_purchased := 0;
  end if;

  monthly_credits   := v_monthly_credits;
  credits_used      := v_credits_used;
  credits_purchased := v_credits_purchased;
  ai_features       := v_ai_features;
  return next;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 7. Storage bucket — ai-documents (private)
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('ai-documents', 'ai-documents', false)
on conflict (id) do nothing;

-- Upload: org members can upload files scoped to their org
drop policy if exists "Org members can upload ai documents" on storage.objects;
create policy "Org members can upload ai documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ai-documents'
    and public.is_org_member(
      (split_part(name, '/', 1))::uuid
    )
  );

-- Read: org members can view files scoped to their org
drop policy if exists "Org members can view ai documents" on storage.objects;
create policy "Org members can view ai documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ai-documents'
    and public.is_org_member(
      (split_part(name, '/', 1))::uuid
    )
  );

-- Delete: only admins can delete files (consistent with ai_documents table policy)
drop policy if exists "Org admins can delete ai documents" on storage.objects;
create policy "Org admins can delete ai documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ai-documents'
    and public.is_org_admin(
      (split_part(name, '/', 1))::uuid
    )
  );
