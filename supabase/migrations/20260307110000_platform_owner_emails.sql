-- Platform owner emails: manage admins from /platform UI.
-- is_platform_owner() checks app_metadata.role OR email in this table.

create table if not exists public.platform_owner_emails (
  email text not null primary key,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

alter table public.platform_owner_emails enable row level security;

-- Platform owners see all; any user can check if their email is in the list.
create policy "platform_owner_emails_select"
  on public.platform_owner_emails for select to authenticated
  using (
    public.is_platform_owner()
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

create policy "platform_owner_emails_insert"
  on public.platform_owner_emails for insert to authenticated
  with check (public.is_platform_owner());

create policy "platform_owner_emails_delete"
  on public.platform_owner_emails for delete to authenticated
  using (public.is_platform_owner());

-- Update is_platform_owner() to include platform_owner_emails (must be before policies that use it for insert/delete).
create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') in ('platform_owner','owner','developer','platform_admin')
    or exists (
      select 1 from public.platform_owner_emails
      where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    ),
    false
  );
$$;

comment on table public.platform_owner_emails is 'Emails that have platform admin access. Managed from /platform/settings. Complements app_metadata.role.';
