-- PROD-05A: Workspace settings (branding, locale, currency, timezone, business terminology).

alter table public.organizations
  add column if not exists logo_url text null,
  add column if not exists primary_color text not null default '#2563eb',
  add column if not exists locale text not null default 'es-ES',
  add column if not exists timezone text not null default 'Europe/Madrid',
  add column if not exists currency text not null default 'EUR',
  add column if not exists entity_label_singular text not null default 'Client',
  add column if not exists entity_label_plural text not null default 'Clients';

update public.organizations
set
  primary_color = coalesce(nullif(trim(primary_color), ''), '#2563eb'),
  locale = coalesce(nullif(trim(locale), ''), 'es-ES'),
  timezone = coalesce(nullif(trim(timezone), ''), 'Europe/Madrid'),
  currency = upper(coalesce(nullif(trim(currency), ''), 'EUR')),
  entity_label_singular = coalesce(nullif(trim(entity_label_singular), ''), 'Client'),
  entity_label_plural = coalesce(nullif(trim(entity_label_plural), ''), 'Clients');

alter table public.organizations
  drop constraint if exists chk_organizations_primary_color_hex;

alter table public.organizations
  add constraint chk_organizations_primary_color_hex
  check (primary_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.organizations
  drop constraint if exists chk_organizations_currency_code;

alter table public.organizations
  add constraint chk_organizations_currency_code
  check (currency ~ '^[A-Z]{3}$');

alter table public.organizations
  drop constraint if exists chk_organizations_locale_format;

alter table public.organizations
  add constraint chk_organizations_locale_format
  check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$');

alter table public.organizations
  drop constraint if exists chk_organizations_timezone_nonempty;

alter table public.organizations
  add constraint chk_organizations_timezone_nonempty
  check (length(trim(timezone)) > 0);

alter table public.organizations
  drop constraint if exists chk_organizations_entity_labels_nonempty;

alter table public.organizations
  add constraint chk_organizations_entity_labels_nonempty
  check (
    length(trim(entity_label_singular)) > 0
    and length(trim(entity_label_plural)) > 0
  );

create or replace function public.is_org_manager_or_admin(target_org uuid)
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
      and om.role in ('admin', 'manager')
  );
$$;

drop policy if exists "Org admins can update organizations" on public.organizations;
drop policy if exists "Org admins/managers can update organizations" on public.organizations;

create policy "Org admins/managers can update organizations"
  on public.organizations for update to authenticated
  using (public.is_org_manager_or_admin(id))
  with check (public.is_org_manager_or_admin(id));
