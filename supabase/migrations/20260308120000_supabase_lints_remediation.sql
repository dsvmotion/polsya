-- Supabase Performance & Security Lints Remediation
-- Addresses issues from Supabase Dashboard CSV exports.

-- ─── 1. Function search_path (function_search_path_mutable) ─────────────────
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 2. Security definer views → security_invoker (PostgreSQL 15+) ───────────
alter view public.pharmacies set (security_invoker = on);
alter view public.pharmacy_contacts set (security_invoker = on);
alter view public.pharmacy_activities set (security_invoker = on);
alter view public.pharmacy_opportunities set (security_invoker = on);
alter view public.pharmacy_order_documents set (security_invoker = on);

-- ─── 3. Drop duplicate indexes (keep idx_entities_*, drop idx_pharmacies_*) ─
drop index if exists public.idx_pharmacies_city;
drop index if exists public.idx_pharmacies_status;
drop index if exists public.idx_pharmacies_country;
drop index if exists public.idx_pharmacies_location;

-- ─── 4. Drop legacy permissive RLS policies on entities ─────────────────────
drop policy if exists "Authenticated users can view pharmacies" on public.entities;
drop policy if exists "Authenticated users can insert pharmacies" on public.entities;
drop policy if exists "Authenticated users can update pharmacies" on public.entities;
drop policy if exists "Authenticated users can delete pharmacies" on public.entities;

-- ─── 5. Auth RLS initplan: wrap auth.uid() in (select auth.uid()) ─────────────
drop policy if exists "ai_chat_messages_own" on public.ai_chat_messages;
create policy "ai_chat_messages_own"
  on public.ai_chat_messages for all
  using (
    user_id = (select auth.uid())
    and organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = (select auth.uid()) and om.status = 'active'
    )
  )
  with check (
    user_id = (select auth.uid())
    and organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = (select auth.uid()) and om.status = 'active'
    )
  );

drop policy if exists "platform_owner_emails_select" on public.platform_owner_emails;
create policy "platform_owner_emails_select"
  on public.platform_owner_emails for select to authenticated
  using (public.is_platform_owner());

-- ─── 6. Performance: add recommended indexes from Query Performance CSV ────────
create index if not exists idx_entities_autonomous_community
  on public.entities (autonomous_community);
create index if not exists idx_entities_name
  on public.entities (name);

-- ─── 7. RLS: billing_webhook_events (service_role only, satisfy linter) ───────
create policy "billing_webhook_events_service_only"
  on public.billing_webhook_events for all using (false) with check (false);

-- ─── 8. ai_chat_config: org admins can select/update their org's config ────────
-- (Platform owners already have platform_select/platform_update via 20260307100000)
create policy "ai_chat_config_org_admin_select"
  on public.ai_chat_config for select to authenticated
  using (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = ai_chat_config.organization_id
        and om.user_id = (select auth.uid()) and om.status = 'active'
        and om.role in ('admin', 'manager')
    )
  );

create policy "ai_chat_config_org_admin_update"
  on public.ai_chat_config for update to authenticated
  using (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = ai_chat_config.organization_id
        and om.user_id = (select auth.uid()) and om.status = 'active'
        and om.role in ('admin', 'manager')
    )
  )
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = ai_chat_config.organization_id
        and om.user_id = (select auth.uid()) and om.status = 'active'
        and om.role in ('admin', 'manager')
    )
  );

create policy "ai_chat_config_org_admin_insert"
  on public.ai_chat_config for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = ai_chat_config.organization_id
        and om.user_id = (select auth.uid()) and om.status = 'active'
        and om.role in ('admin', 'manager')
    )
  );
