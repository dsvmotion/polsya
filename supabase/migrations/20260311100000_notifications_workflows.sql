-- ============================================================
-- Phase 4: Notifications, Activity Task Fields, Workflow Rules
-- ============================================================

-- 1. creative_notifications
create table if not exists public.creative_notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('reminder', 'workflow', 'mention', 'system', 'ai_insight')),
  title           text not null,
  body            text,
  entity_type     text,
  entity_id       uuid,
  is_read         boolean not null default false,
  action_url      text,
  created_at      timestamptz not null default now()
);

create index idx_notifications_user_unread
  on public.creative_notifications(user_id, is_read)
  where is_read = false;
create index idx_notifications_org
  on public.creative_notifications(organization_id);

alter table public.creative_notifications enable row level security;

create policy "Users can view their own notifications"
  on public.creative_notifications for select
  using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on public.creative_notifications for update
  using (user_id = auth.uid());

create policy "Service role can insert notifications"
  on public.creative_notifications for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- 2. Extend creative_activities with task fields
alter table public.creative_activities
  add column if not exists due_date      timestamptz,
  add column if not exists is_completed  boolean not null default false,
  add column if not exists reminder_at   timestamptz,
  add column if not exists assigned_to   uuid references auth.users(id),
  add column if not exists reminder_sent boolean not null default false;

create index if not exists idx_activities_reminders
  on public.creative_activities(reminder_at, is_completed, reminder_sent)
  where reminder_at is not null and is_completed = false and reminder_sent = false;

create index if not exists idx_activities_due
  on public.creative_activities(due_date)
  where due_date is not null and is_completed = false;

-- 3. creative_workflow_rules
create table if not exists public.creative_workflow_rules (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  trigger_entity    text not null check (trigger_entity in ('client', 'project', 'opportunity', 'contact')),
  trigger_event     text not null check (trigger_event in ('stage_change', 'status_change', 'created')),
  trigger_condition jsonb not null default '{}',
  actions           jsonb not null default '[]',
  is_active         boolean not null default true,
  created_by        uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_workflow_rules_org on public.creative_workflow_rules(organization_id);
create index idx_workflow_rules_trigger
  on public.creative_workflow_rules(trigger_entity, trigger_event)
  where is_active = true;

alter table public.creative_workflow_rules enable row level security;

create policy "Users can view workflow rules in their organization"
  on public.creative_workflow_rules for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can insert workflow rules in their organization"
  on public.creative_workflow_rules for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can update workflow rules in their organization"
  on public.creative_workflow_rules for update
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can delete workflow rules in their organization"
  on public.creative_workflow_rules for delete
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
