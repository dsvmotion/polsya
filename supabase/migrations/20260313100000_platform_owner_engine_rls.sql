-- Platform owner RLS: allow platform owners to read engine tables across all orgs.
-- Extends pattern from platform_owner_rls.sql to ingestion, signal, AI, and integration tables.

-- ════════════════════════════════════════════════════════════════════════
-- Ingestion tables
-- ════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ingestion_providers') then
    drop policy if exists "Platform owners can select all ingestion_providers" on public.ingestion_providers;
    create policy "Platform owners can select all ingestion_providers"
      on public.ingestion_providers for select to authenticated using (public.is_platform_owner());
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ingestion_runs') then
    drop policy if exists "Platform owners can select all ingestion_runs" on public.ingestion_runs;
    create policy "Platform owners can select all ingestion_runs"
      on public.ingestion_runs for select to authenticated using (public.is_platform_owner());
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ingestion_jobs') then
    drop policy if exists "Platform owners can select all ingestion_jobs" on public.ingestion_jobs;
    create policy "Platform owners can select all ingestion_jobs"
      on public.ingestion_jobs for select to authenticated using (public.is_platform_owner());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- Signal tables
-- ════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='signal_rules') then
    drop policy if exists "Platform owners can select all signal_rules" on public.signal_rules;
    create policy "Platform owners can select all signal_rules"
      on public.signal_rules for select to authenticated using (public.is_platform_owner());
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='signals') then
    drop policy if exists "Platform owners can select all signals" on public.signals;
    create policy "Platform owners can select all signals"
      on public.signals for select to authenticated using (public.is_platform_owner());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- AI / RAG tables
-- ════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_documents') then
    drop policy if exists "Platform owners can select all ai_documents" on public.ai_documents;
    create policy "Platform owners can select all ai_documents"
      on public.ai_documents for select to authenticated using (public.is_platform_owner());
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_document_chunks') then
    drop policy if exists "Platform owners can select all ai_document_chunks" on public.ai_document_chunks;
    create policy "Platform owners can select all ai_document_chunks"
      on public.ai_document_chunks for select to authenticated using (public.is_platform_owner());
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_usage_monthly') then
    drop policy if exists "Platform owners can select all ai_usage_monthly" on public.ai_usage_monthly;
    create policy "Platform owners can select all ai_usage_monthly"
      on public.ai_usage_monthly for select to authenticated using (public.is_platform_owner());
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_chat_config') then
    drop policy if exists "Platform owners can select all ai_chat_config" on public.ai_chat_config;
    create policy "Platform owners can select all ai_chat_config"
      on public.ai_chat_config for select to authenticated using (public.is_platform_owner());

    drop policy if exists "Platform owners can upsert ai_chat_config" on public.ai_chat_config;
    create policy "Platform owners can upsert ai_chat_config"
      on public.ai_chat_config for insert to authenticated with check (public.is_platform_owner());

    drop policy if exists "Platform owners can update ai_chat_config" on public.ai_chat_config;
    create policy "Platform owners can update ai_chat_config"
      on public.ai_chat_config for update to authenticated using (public.is_platform_owner());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- Organization members (platform owner cross-org read)
-- ════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='organization_members') then
    drop policy if exists "Platform owners can select all organization_members" on public.organization_members;
    create policy "Platform owners can select all organization_members"
      on public.organization_members for select to authenticated using (public.is_platform_owner());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- Integration connections (platform owner cross-org read)
-- ════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='integration_connections') then
    drop policy if exists "Platform owners can select all integration_connections" on public.integration_connections;
    create policy "Platform owners can select all integration_connections"
      on public.integration_connections for select to authenticated using (public.is_platform_owner());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- Enrichment tables
-- ════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='enrichment_runs') then
    drop policy if exists "Platform owners can select all enrichment_runs" on public.enrichment_runs;
    create policy "Platform owners can select all enrichment_runs"
      on public.enrichment_runs for select to authenticated using (public.is_platform_owner());
  end if;
end $$;
