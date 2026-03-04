-- Allow platform owners to read and manage ai_chat_config from /platform UI.
-- Non-platform-owners have no allowing policy, so they remain denied.

drop policy if exists "ai_chat_config_deny_all" on public.ai_chat_config;

create policy "ai_chat_config_platform_select"
  on public.ai_chat_config for select to authenticated
  using (public.is_platform_owner());

create policy "ai_chat_config_platform_insert"
  on public.ai_chat_config for insert to authenticated
  with check (public.is_platform_owner());

create policy "ai_chat_config_platform_update"
  on public.ai_chat_config for update to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());
