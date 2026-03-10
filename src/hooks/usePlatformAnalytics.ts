import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

export interface PlatformAnalytics {
  mrrCents: number;
  activeSubs: number;
  trialingSubs: number;
  totalOrgs: number;
  newOrgsLast7Days: number;
  newOrgsLast30Days: number;
  churnedLast30Days: number;
}

export function usePlatformAnalytics() {
  const { isOwner } = usePlatformOwnerStatus();

  return useQuery<PlatformAnalytics>({
    queryKey: ['platform-analytics'],
    enabled: isOwner,
    queryFn: async () => {
      const now = new Date().toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [orgsRes, subsRes, plansRes, newOrgs7Res, newOrgs30Res, churnedRes] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase
          .from('billing_subscriptions')
          .select('id, organization_id, status, stripe_price_id')
          .in('status', ['trialing', 'active', 'past_due', 'canceled', 'unpaid']),
        supabase.from('billing_plans').select('stripe_price_id, amount_cents'),
        supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo),
        supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('billing_subscriptions')
          .select('id', { count: 'exact', head: true })
          .in('status', ['canceled', 'unpaid'])
          .gte('updated_at', thirtyDaysAgo),
      ]);

      if (orgsRes.error) throw new Error(orgsRes.error.message);
      if (subsRes.error) throw new Error(subsRes.error.message);
      if (plansRes.error) throw new Error(plansRes.error.message);
      if (newOrgs7Res.error) throw new Error(newOrgs7Res.error.message);
      if (newOrgs30Res.error) throw new Error(newOrgs30Res.error.message);
      if (churnedRes.error) throw new Error(churnedRes.error.message);

      const plansByPrice = new Map(
        (plansRes.data ?? []).map((p) => [p.stripe_price_id, p.amount_cents])
      );

      const subs = subsRes.data ?? [];
      const activeTrialing = subs.filter((s) => ['active', 'trialing'].includes(s.status));
      const mrrCents = activeTrialing.reduce((sum, s) => sum + (plansByPrice.get(s.stripe_price_id) ?? 0), 0);

      return {
        mrrCents,
        activeSubs: subs.filter((s) => s.status === 'active').length,
        trialingSubs: subs.filter((s) => s.status === 'trialing').length,
        totalOrgs: orgsRes.count ?? 0,
        newOrgsLast7Days: newOrgs7Res.count ?? 0,
        newOrgsLast30Days: newOrgs30Res.count ?? 0,
        churnedLast30Days: churnedRes.count ?? 0,
      };
    },
    staleTime: 60_000,
  });
}
