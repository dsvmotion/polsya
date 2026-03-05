-- Signal Engine Tables
-- Tables: signal_rules, signals
-- Detects relationship opportunities, engagement triggers, and market movements

-- ============================================================
-- signal_rules
-- ============================================================
create table if not exists public.signal_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  rule_type text not null,
  conditions jsonb not null default '{}',
  actions jsonb not null default '[]',
  is_active boolean default true,
  priority integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_signal_rules_org on public.signal_rules(organization_id);
create index idx_signal_rules_active on public.signal_rules(organization_id) where is_active = true;

alter table public.signal_rules enable row level security;

create policy "signal_rules_select" on public.signal_rules
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signal_rules_insert" on public.signal_rules
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signal_rules_update" on public.signal_rules
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signal_rules_delete" on public.signal_rules
  for delete using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid() and om.role in ('owner','admin')));

create trigger set_signal_rules_updated_at
  before update on public.signal_rules
  for each row execute function public.set_updated_at();

-- ============================================================
-- signals
-- ============================================================
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_id uuid references public.signal_rules(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  signal_type text not null,
  title text not null,
  description text,
  severity text not null default 'info' check (severity in ('info','low','medium','high','critical')),
  status text not null default 'new' check (status in ('new','seen','actioned','dismissed')),
  data jsonb default '{}',
  seen_by uuid references auth.users(id),
  seen_at timestamptz,
  actioned_at timestamptz,
  expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_signals_org on public.signals(organization_id);
create index idx_signals_entity on public.signals(entity_type, entity_id);
create index idx_signals_status on public.signals(organization_id, status);
create index idx_signals_new_severity on public.signals(organization_id, severity) where status = 'new';

alter table public.signals enable row level security;

create policy "signals_select" on public.signals
  for select using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signals_insert" on public.signals
  for insert with check (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));
create policy "signals_update" on public.signals
  for update using (organization_id in (select om.organization_id from public.organization_members om where om.user_id = auth.uid()));

create trigger set_signals_updated_at
  before update on public.signals
  for each row execute function public.set_updated_at();
