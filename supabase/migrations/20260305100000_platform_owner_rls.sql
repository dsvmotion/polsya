-- Platform owner RLS: allow users with app_metadata.role in (platform_owner, owner, developer, platform_admin)
-- to read all organizations and billing data (for tenant management dashboard).

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') in ('platform_owner','owner','developer','platform_admin'),
    false
  );
$$;

-- Platform owners can view all organizations
drop policy if exists "Platform owners can select all organizations" on public.organizations;
create policy "Platform owners can select all organizations"
  on public.organizations for select to authenticated
  using (public.is_platform_owner());

-- Platform owners can view all billing data (when billing tables exist)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='billing_customers') then
    drop policy if exists "Platform owners can select all billing_customers" on public.billing_customers;
    create policy "Platform owners can select all billing_customers"
      on public.billing_customers for select to authenticated using (public.is_platform_owner());
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='billing_subscriptions') then
    drop policy if exists "Platform owners can select all billing_subscriptions" on public.billing_subscriptions;
    create policy "Platform owners can select all billing_subscriptions"
      on public.billing_subscriptions for select to authenticated using (public.is_platform_owner());
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='billing_invoices') then
    drop policy if exists "Platform owners can select all billing_invoices" on public.billing_invoices;
    create policy "Platform owners can select all billing_invoices"
      on public.billing_invoices for select to authenticated using (public.is_platform_owner());
  end if;
end $$;
