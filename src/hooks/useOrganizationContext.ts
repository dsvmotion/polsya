import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Organization, OrganizationMember } from '@/types/organization';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

export function useCurrentOrganizationMembership() {
  const { impersonateOrgId } = useImpersonation();
  const { isOwner } = usePlatformOwnerStatus();

  const normalMembership = useQuery<OrganizationMember | null>({
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

  const impersonating = !!impersonateOrgId && isOwner;
  const effectiveOrgId = impersonating ? impersonateOrgId : normalMembership.data?.organization_id ?? null;

  const membership: OrganizationMember | null = impersonating && effectiveOrgId
    ? ({
        id: 'impersonation',
        organization_id: effectiveOrgId,
        user_id: '',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as OrganizationMember)
    : normalMembership.data ?? null;

  return {
    data: membership,
    isLoading: impersonating ? false : normalMembership.isLoading,
    error: normalMembership.error,
  };
}

export function useCurrentOrganization() {
  const { impersonateOrgId } = useImpersonation();
  const { isOwner } = usePlatformOwnerStatus();
  const membershipResult = useCurrentOrganizationMembership();

  const effectiveOrgId = !!impersonateOrgId && isOwner
    ? impersonateOrgId
    : membershipResult.data?.organization_id ?? null;

  const organization = useQuery<Organization | null>({
    queryKey: ['organization', effectiveOrgId ?? null],
    enabled: !!effectiveOrgId,
    queryFn: async () => {
      if (!effectiveOrgId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', effectiveOrgId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data ?? null) as Organization | null;
    },
  });

  return {
    membership: membershipResult.data ?? null,
    organization: organization.data ?? null,
    isLoading: membershipResult.isLoading || organization.isLoading,
    error: membershipResult.error ?? organization.error ?? null,
    isImpersonating: !!impersonateOrgId && isOwner,
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
