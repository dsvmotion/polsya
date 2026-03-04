import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformOwner } from '@/lib/platform';

export interface TenantWithBilling {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

export function usePlatformTenants() {
  const { user } = useAuth();

  return useQuery<TenantWithBilling[]>({
    queryKey: ['platform-tenants'],
    enabled: isPlatformOwner(user),
    queryFn: async () => {
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, created_at')
        .order('created_at', { ascending: false });

      if (orgError) throw new Error(orgError.message);

      const { data: subs } = await supabase
        .from('billing_subscriptions')
        .select('organization_id, status, current_period_end')
        .in('status', ['trialing', 'active', 'past_due', 'unpaid'])
        .order('updated_at', { ascending: false });

      const subByOrg = new Map<string, { status: string; current_period_end: string | null }>();
      for (const s of subs ?? []) {
        if (!subByOrg.has(s.organization_id)) {
          subByOrg.set(s.organization_id, { status: s.status, current_period_end: s.current_period_end });
        }
      }

      const { data: memberCounts } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('status', 'active');

      const countByOrg = new Map<string, number>();
      for (const m of memberCounts ?? []) {
        countByOrg.set(m.organization_id, (countByOrg.get(m.organization_id) ?? 0) + 1);
      }

      return (orgs ?? []).map((o) => {
        const sub = subByOrg.get(o.id);
        return {
          id: o.id,
          name: o.name,
          slug: o.slug,
          createdAt: o.created_at,
          memberCount: countByOrg.get(o.id) ?? 0,
          subscriptionStatus: sub?.status ?? null,
          currentPeriodEnd: sub?.current_period_end ?? null,
        } as TenantWithBilling;
      });
    },
    staleTime: 30_000,
  });
}
