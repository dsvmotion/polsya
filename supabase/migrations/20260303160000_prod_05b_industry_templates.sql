-- PROD-05B: industry template selector per workspace.

alter table public.organizations
  add column if not exists industry_template_key text not null default 'general_b2b';

update public.organizations
set industry_template_key = 'general_b2b'
where coalesce(trim(industry_template_key), '') = '';

alter table public.organizations
  drop constraint if exists chk_organizations_industry_template_key;

alter table public.organizations
  add constraint chk_organizations_industry_template_key
  check (
    industry_template_key in (
      'general_b2b',
      'pharmacy_retail',
      'wellness_herbal',
      'dental_clinic',
      'veterinary_clinic',
      'beauty_wellness'
    )
  );
