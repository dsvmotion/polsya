-- ARCH-02A: Multi-tenant foundation (organizations + members + org-scoped RLS)

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

-- Reuse global updated_at trigger helper when available.
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

-- Default workspace for legacy records.
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

-- Auto-provision a workspace for each new auth user.
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

-- Add organization_id to core tables.
alter table public.entity_types add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.pharmacies add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.pharmacy_order_documents add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.pharmacy_contacts add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.pharmacy_activities add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.pharmacy_opportunities add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.saved_segments add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.integration_connections add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.integration_sync_runs add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.integration_sync_jobs add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.agent_actions_log add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.agent_action_runs add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.bulk_import_runs add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'entity_types_organization_id_fkey'
      and conrelid = 'public.entity_types'::regclass
  ) then
    alter table public.entity_types
      add constraint entity_types_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete cascade;
  end if;
end $$;

do $$
declare
  default_org uuid;
begin
  select id into default_org
  from public.organizations
  where slug = 'default-workspace'
  limit 1;

  update public.entity_types
  set organization_id = default_org
  where organization_id is null;

  update public.pharmacies
  set organization_id = default_org
  where organization_id is null;

  update public.pharmacy_order_documents d
  set organization_id = p.organization_id
  from public.pharmacies p
  where d.organization_id is null
    and p.id = d.pharmacy_id;
  update public.pharmacy_order_documents
  set organization_id = default_org
  where organization_id is null;

  update public.pharmacy_contacts c
  set organization_id = p.organization_id
  from public.pharmacies p
  where c.organization_id is null
    and p.id = c.pharmacy_id;
  update public.pharmacy_contacts
  set organization_id = default_org
  where organization_id is null;

  update public.pharmacy_activities a
  set organization_id = p.organization_id
  from public.pharmacies p
  where a.organization_id is null
    and p.id = a.pharmacy_id;
  update public.pharmacy_activities
  set organization_id = default_org
  where organization_id is null;

  update public.pharmacy_opportunities o
  set organization_id = p.organization_id
  from public.pharmacies p
  where o.organization_id is null
    and p.id = o.pharmacy_id;
  update public.pharmacy_opportunities
  set organization_id = default_org
  where organization_id is null;

  update public.saved_segments
  set organization_id = default_org
  where organization_id is null;

  update public.integration_connections
  set organization_id = default_org
  where organization_id is null;

  update public.integration_sync_runs r
  set organization_id = c.organization_id
  from public.integration_connections c
  where r.organization_id is null
    and c.id = r.integration_id;
  update public.integration_sync_runs
  set organization_id = default_org
  where organization_id is null;

  update public.integration_sync_jobs j
  set organization_id = c.organization_id
  from public.integration_connections c
  where j.organization_id is null
    and c.id = j.integration_id;
  update public.integration_sync_jobs
  set organization_id = default_org
  where organization_id is null;

  update public.agent_actions_log
  set organization_id = default_org
  where organization_id is null;

  update public.agent_action_runs r
  set organization_id = l.organization_id
  from public.agent_actions_log l
  where r.organization_id is null
    and l.id = r.action_id;
  update public.agent_action_runs
  set organization_id = default_org
  where organization_id is null;

  update public.bulk_import_runs
  set organization_id = default_org
  where organization_id is null;
end $$;

alter table public.entity_types alter column organization_id set not null;
alter table public.pharmacies alter column organization_id set not null;
alter table public.pharmacy_order_documents alter column organization_id set not null;
alter table public.pharmacy_contacts alter column organization_id set not null;
alter table public.pharmacy_activities alter column organization_id set not null;
alter table public.pharmacy_opportunities alter column organization_id set not null;
alter table public.saved_segments alter column organization_id set not null;
alter table public.integration_connections alter column organization_id set not null;
alter table public.integration_sync_runs alter column organization_id set not null;
alter table public.integration_sync_jobs alter column organization_id set not null;
alter table public.agent_actions_log alter column organization_id set not null;
alter table public.agent_action_runs alter column organization_id set not null;
alter table public.bulk_import_runs alter column organization_id set not null;

alter table public.entity_types alter column organization_id set default public.current_user_organization_id();
alter table public.pharmacies alter column organization_id set default public.current_user_organization_id();
alter table public.pharmacy_order_documents alter column organization_id set default public.current_user_organization_id();
alter table public.pharmacy_contacts alter column organization_id set default public.current_user_organization_id();
alter table public.pharmacy_activities alter column organization_id set default public.current_user_organization_id();
alter table public.pharmacy_opportunities alter column organization_id set default public.current_user_organization_id();
alter table public.saved_segments alter column organization_id set default public.current_user_organization_id();
alter table public.integration_connections alter column organization_id set default public.current_user_organization_id();
alter table public.integration_sync_runs alter column organization_id set default public.current_user_organization_id();
alter table public.integration_sync_jobs alter column organization_id set default public.current_user_organization_id();
alter table public.agent_actions_log alter column organization_id set default public.current_user_organization_id();
alter table public.agent_action_runs alter column organization_id set default public.current_user_organization_id();
alter table public.bulk_import_runs alter column organization_id set default public.current_user_organization_id();

create index if not exists idx_entity_types_org on public.entity_types (organization_id, is_default desc, label);
create index if not exists idx_pharmacies_org on public.pharmacies (organization_id, updated_at desc);
create index if not exists idx_pharmacy_order_documents_org on public.pharmacy_order_documents (organization_id, pharmacy_id, uploaded_at desc);
create index if not exists idx_pharmacy_contacts_org on public.pharmacy_contacts (organization_id, pharmacy_id, is_primary desc, created_at desc);
create index if not exists idx_pharmacy_activities_org on public.pharmacy_activities (organization_id, pharmacy_id, created_at desc);
create index if not exists idx_pharmacy_opportunities_org on public.pharmacy_opportunities (organization_id, pharmacy_id, created_at desc);
create index if not exists idx_saved_segments_org on public.saved_segments (organization_id, scope, is_favorite desc, updated_at desc);
create index if not exists idx_integration_connections_org on public.integration_connections (organization_id, provider, status);
create index if not exists idx_integration_sync_runs_org on public.integration_sync_runs (organization_id, integration_id, started_at desc);
create index if not exists idx_integration_sync_jobs_org on public.integration_sync_jobs (organization_id, integration_id, created_at desc);
create index if not exists idx_agent_actions_log_org on public.agent_actions_log (organization_id, created_at desc);
create index if not exists idx_agent_action_runs_org on public.agent_action_runs (organization_id, started_at desc);
create index if not exists idx_bulk_import_runs_org on public.bulk_import_runs (organization_id, created_at desc);

-- Enforce type uniqueness per organization.
drop index if exists public.idx_entity_types_global_key;
drop index if exists public.idx_entity_types_org_key;
create unique index if not exists idx_entity_types_org_key
  on public.entity_types (organization_id, key);

-- Replace broad authenticated policies with organization-scoped ones.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'entity_types',
    'pharmacies',
    'pharmacy_order_documents',
    'pharmacy_contacts',
    'pharmacy_activities',
    'pharmacy_opportunities',
    'saved_segments',
    'integration_connections',
    'integration_sync_runs',
    'integration_sync_jobs',
    'agent_actions_log',
    'agent_action_runs',
    'bulk_import_runs',
    'organizations',
    'organization_members'
  ] loop
    for p in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
  end loop;
end $$;

create policy "Org members can view organizations"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

create policy "Org admins can update organizations"
  on public.organizations for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy "Org members can view organization members"
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org admins can insert organization members"
  on public.organization_members for insert to authenticated
  with check (public.is_org_admin(organization_id));

create policy "Org admins can update organization members"
  on public.organization_members for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "Org admins can delete organization members"
  on public.organization_members for delete to authenticated
  using (public.is_org_admin(organization_id));

create policy "Org members can select entity_types"
  on public.entity_types for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert entity_types"
  on public.entity_types for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update entity_types"
  on public.entity_types for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete entity_types"
  on public.entity_types for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select pharmacies"
  on public.pharmacies for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert pharmacies"
  on public.pharmacies for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update pharmacies"
  on public.pharmacies for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete pharmacies"
  on public.pharmacies for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select pharmacy_order_documents"
  on public.pharmacy_order_documents for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert pharmacy_order_documents"
  on public.pharmacy_order_documents for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can update pharmacy_order_documents"
  on public.pharmacy_order_documents for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can delete pharmacy_order_documents"
  on public.pharmacy_order_documents for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select pharmacy_contacts"
  on public.pharmacy_contacts for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert pharmacy_contacts"
  on public.pharmacy_contacts for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can update pharmacy_contacts"
  on public.pharmacy_contacts for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can delete pharmacy_contacts"
  on public.pharmacy_contacts for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select pharmacy_activities"
  on public.pharmacy_activities for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert pharmacy_activities"
  on public.pharmacy_activities for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can update pharmacy_activities"
  on public.pharmacy_activities for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can delete pharmacy_activities"
  on public.pharmacy_activities for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select pharmacy_opportunities"
  on public.pharmacy_opportunities for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert pharmacy_opportunities"
  on public.pharmacy_opportunities for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can update pharmacy_opportunities"
  on public.pharmacy_opportunities for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id
        and p.organization_id = organization_id
    )
  );

create policy "Org members can delete pharmacy_opportunities"
  on public.pharmacy_opportunities for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select saved_segments"
  on public.saved_segments for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert saved_segments"
  on public.saved_segments for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update saved_segments"
  on public.saved_segments for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete saved_segments"
  on public.saved_segments for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select integration_connections"
  on public.integration_connections for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_connections"
  on public.integration_connections for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update integration_connections"
  on public.integration_connections for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete integration_connections"
  on public.integration_connections for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select integration_sync_runs"
  on public.integration_sync_runs for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_sync_runs"
  on public.integration_sync_runs for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can update integration_sync_runs"
  on public.integration_sync_runs for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can delete integration_sync_runs"
  on public.integration_sync_runs for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select integration_sync_jobs"
  on public.integration_sync_jobs for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_sync_jobs"
  on public.integration_sync_jobs for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can update integration_sync_jobs"
  on public.integration_sync_jobs for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can delete integration_sync_jobs"
  on public.integration_sync_jobs for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select agent_actions_log"
  on public.agent_actions_log for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert agent_actions_log"
  on public.agent_actions_log for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update agent_actions_log"
  on public.agent_actions_log for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete agent_actions_log"
  on public.agent_actions_log for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select agent_action_runs"
  on public.agent_action_runs for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert agent_action_runs"
  on public.agent_action_runs for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.agent_actions_log l
      where l.id = action_id
        and l.organization_id = organization_id
    )
  );

create policy "Org members can update agent_action_runs"
  on public.agent_action_runs for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.agent_actions_log l
      where l.id = action_id
        and l.organization_id = organization_id
    )
  );

create policy "Org members can delete agent_action_runs"
  on public.agent_action_runs for delete to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can select bulk_import_runs"
  on public.bulk_import_runs for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert bulk_import_runs"
  on public.bulk_import_runs for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "Org members can update bulk_import_runs"
  on public.bulk_import_runs for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Org members can delete bulk_import_runs"
  on public.bulk_import_runs for delete to authenticated
  using (public.is_org_member(organization_id));

-- Harden storage.objects for tenant isolation through pharmacy ownership/docs mapping.
drop policy if exists "Authenticated users can upload pharmacy documents" on storage.objects;
drop policy if exists "Authenticated users can view pharmacy documents" on storage.objects;
drop policy if exists "Authenticated users can delete pharmacy documents" on storage.objects;
drop policy if exists "Org members can upload pharmacy documents" on storage.objects;
drop policy if exists "Org members can view pharmacy documents" on storage.objects;
drop policy if exists "Org members can delete pharmacy documents" on storage.objects;

create policy "Org members can upload pharmacy documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pharmacy-documents'
    and exists (
      select 1
      from public.pharmacies p
      where p.id::text = split_part(name, '/', 1)
        and public.is_org_member(p.organization_id)
    )
  );

create policy "Org members can view pharmacy documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pharmacy-documents'
    and exists (
      select 1
      from public.pharmacy_order_documents d
      where d.file_path = name
        and public.is_org_member(d.organization_id)
    )
  );

create policy "Org members can delete pharmacy documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pharmacy-documents'
    and exists (
      select 1
      from public.pharmacy_order_documents d
      where d.file_path = name
        and public.is_org_member(d.organization_id)
    )
  );
