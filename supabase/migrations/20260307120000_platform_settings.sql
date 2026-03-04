-- Platform settings / feature flags. Key-value store for global config.

create table if not exists public.platform_settings (
  key text not null primary key,
  value jsonb not null default 'true'::jsonb,
  description text null,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

-- All authenticated users can read (for feature flags). Only platform owners can write.
create policy "platform_settings_select"
  on public.platform_settings for select to authenticated
  using (true);

create policy "platform_settings_insert"
  on public.platform_settings for insert to authenticated
  with check (public.is_platform_owner());

create policy "platform_settings_update"
  on public.platform_settings for update to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

create trigger update_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.update_updated_at_column();

comment on table public.platform_settings is 'Global platform config and feature flags. Managed from /platform/settings.';
