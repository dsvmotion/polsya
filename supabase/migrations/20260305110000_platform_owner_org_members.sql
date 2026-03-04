-- Platform owners can view organization_members and usage data of any org (tenant management dashboard).

create policy "Platform owners can select all organization members"
  on public.organization_members for select to authenticated
  using (public.is_platform_owner());

create policy "Platform owners can select all integration_connections"
  on public.integration_connections for select to authenticated
  using (public.is_platform_owner());

-- Entity count: entities (post gen_01a) or pharmacies table (pre gen_01a)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='entities') then
    execute 'create policy "Platform owners can select all entities" on public.entities for select to authenticated using (public.is_platform_owner())';
  elsif exists (select 1 from information_schema.tables where table_schema='public' and table_name='pharmacies') then
    execute 'create policy "Platform owners can select all pharmacies" on public.pharmacies for select to authenticated using (public.is_platform_owner())';
  end if;
end $$;
