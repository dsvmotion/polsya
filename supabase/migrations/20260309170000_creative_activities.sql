-- Creative Activities table for tracking interactions on entities
create table if not exists public.creative_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('client', 'contact', 'project', 'opportunity')),
  entity_id uuid not null,
  activity_type text not null check (activity_type in ('call', 'email', 'meeting', 'note', 'task')),
  title text not null,
  description text,
  occurred_at timestamptz not null default now(),
  duration_minutes integer,
  outcome text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_creative_activities_org on public.creative_activities(organization_id);
create index idx_creative_activities_entity on public.creative_activities(entity_type, entity_id);
create index idx_creative_activities_occurred on public.creative_activities(occurred_at desc);

-- RLS
alter table public.creative_activities enable row level security;

create policy "Users can view activities in their organization"
  on public.creative_activities for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can insert activities in their organization"
  on public.creative_activities for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can update activities in their organization"
  on public.creative_activities for update
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can delete activities in their organization"
  on public.creative_activities for delete
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
