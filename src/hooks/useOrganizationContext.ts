import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Organization, OrganizationMember } from '@/types/organization';

export function useCurrentOrganizationMembership() {
  return useQuery<OrganizationMember | null>({
    queryKey: ['organization-membership', 'current'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data ?? null) as OrganizationMember | null;
    },
  });
}

export function useCurrentOrganization() {
  const membership = useCurrentOrganizationMembership();

  const organization = useQuery<Organization | null>({
    queryKey: ['organization', membership.data?.organization_id ?? null],
    enabled: !!membership.data?.organization_id,
    queryFn: async () => {
      const orgId = membership.data?.organization_id;
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data ?? null) as Organization | null;
    },
  });

  return {
    membership: membership.data ?? null,
    organization: organization.data ?? null,
    isLoading: membership.isLoading || organization.isLoading,
    error: membership.error ?? organization.error ?? null,
  };
}

export function useOrganizationMembers(organizationId: string | null) {
  return useQuery<OrganizationMember[]>({
    queryKey: ['organization-members', organizationId ?? ''],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as OrganizationMember[];
    },
  });
}
