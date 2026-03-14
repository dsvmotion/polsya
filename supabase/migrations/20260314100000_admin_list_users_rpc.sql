-- RPC for admin/platform-owner to list all organization members with their email.
-- Uses security definer to join auth.users (which is not accessible via RLS).
-- Only platform owners can call this function.

create or replace function public.admin_list_org_members()
returns table (
  user_id uuid,
  email text,
  full_name text,
  organization_id uuid,
  organization_name text,
  role text,
  status text,
  member_created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    om.user_id,
    coalesce(u.email, om.user_id::text) as email,
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      null
    ) as full_name,
    om.organization_id,
    o.name as organization_name,
    om.role,
    om.status,
    om.created_at as member_created_at,
    u.last_sign_in_at
  from public.organization_members om
  left join auth.users u on u.id = om.user_id
  left join public.organizations o on o.id = om.organization_id
  where public.is_platform_owner()
  order by om.created_at desc
  limit 500;
$$;

-- Grant execute to authenticated users (the function self-guards via is_platform_owner)
grant execute on function public.admin_list_org_members() to authenticated;
