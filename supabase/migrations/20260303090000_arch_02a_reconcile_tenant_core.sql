-- ARCH-02A hotfix: reconcile tenant core primitives when migration history is marked
-- as applied but organizations/membership objects are missing in remote DB.

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'manager', 'rep', 'ops')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_organization_members_user_active
  on public.organization_members (user_id, status, organization_id);

create index if not exists idx_organization_members_org_role
  on public.organization_members (organization_id, role, status);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop trigger if exists update_organizations_updated_at on public.organizations;
create trigger update_organizations_updated_at
before update on public.organizations
for each row execute function public.update_updated_at_column();

drop trigger if exists update_organization_members_updated_at on public.organization_members;
create trigger update_organization_members_updated_at
before update on public.organization_members
for each row execute function public.update_updated_at_column();

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.status = 'active'
      order by om.created_at asc
      limit 1
    ),
    (
      select o.id
      from public.organizations o
      where o.slug = 'default-workspace'
      limit 1
    )
  );
$$;

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role = 'admin'
  );
$$;

-- Ensure default workspace exists and every existing auth user is member/admin.
do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  where slug = 'default-workspace'
  limit 1;

  if default_org is null then
    insert into public.organizations (name, slug)
    values ('Default Workspace', 'default-workspace')
    returning id into default_org;
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  select default_org, u.id, 'admin', 'active'
  from auth.users u
  where not exists (
    select 1
    from public.organization_members om
    where om.organization_id = default_org
      and om.user_id = u.id
  );
end $$;

create or replace function public.handle_new_auth_user_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_slug text;
  v_name text;
begin
  v_slug := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'workspace'), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'workspace'; end if;
  v_slug := v_slug || '-' || substr(new.id::text, 1, 8);

  v_name := coalesce(new.raw_user_meta_data ->> 'workspace_name', split_part(new.email, '@', 1) || ' Workspace');

  insert into public.organizations (name, slug)
  values (v_name, v_slug)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org_id, new.id, 'admin', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_org on auth.users;
create trigger on_auth_user_created_create_org
  after insert on auth.users
  for each row execute function public.handle_new_auth_user_org();

drop policy if exists "Org members can view organizations" on public.organizations;
create policy "Org members can view organizations"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

drop policy if exists "Org members can view organization members" on public.organization_members;
create policy "Org members can view organization members"
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));
