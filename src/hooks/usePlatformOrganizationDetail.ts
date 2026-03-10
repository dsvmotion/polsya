import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

export interface OrgMemberRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
}

export interface AiChatConfigRow {
  id: string;
  organization_id: string;
  provider: 'openai' | 'anthropic';
  model: string;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  locale: string;
  timezone: string;
  currency: string;
  members: OrgMemberRow[];
  memberCount: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  entityCount: number;
  integrationCount: number;
  aiChatConfig: AiChatConfigRow | null;
}

export function usePlatformOrganizationDetail(orgId: string | undefined) {
  const { isOwner } = usePlatformOwnerStatus();

  return useQuery<OrganizationDetail | null>({
    queryKey: ['platform-org-detail', orgId ?? ''],
    enabled: !!orgId && isOwner,
    queryFn: async () => {
      if (!orgId) return null;

      const [orgRes, membersRes, subRes, entityRes, integrationsRes, aiConfigRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, created_at, locale, timezone, currency')
          .eq('id', orgId)
          .single(),
        supabase
          .from('organization_members')
          .select('id, user_id, role, status, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false }),
        supabase
          .from('billing_subscriptions')
          .select('status, current_period_end, stripe_subscription_id')
          .eq('organization_id', orgId)
          .in('status', ['trialing', 'active', 'past_due', 'unpaid'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('pharmacies')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('integration_connections')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('ai_chat_config')
          .select('id, organization_id, provider, model')
          .eq('organization_id', orgId)
          .maybeSingle(),
      ]);

      if (orgRes.error) throw new Error(orgRes.error.message);
      if (membersRes.error) throw new Error(membersRes.error.message);
      if (subRes.error) throw new Error(subRes.error.message);
      if (entityRes.error) throw new Error(entityRes.error.message);
      if (integrationsRes.error) throw new Error(integrationsRes.error.message);
      if (aiConfigRes.error) throw new Error(aiConfigRes.error.message);
      if (!orgRes.data) return null;

      const org = orgRes.data;
      const members = (membersRes.data ?? []) as OrgMemberRow[];
      const sub = subRes.data;
      const entityCount = entityRes.count ?? 0;
      const integrationCount = integrationsRes.count ?? 0;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        created_at: org.created_at,
        locale: org.locale ?? 'es-ES',
        timezone: org.timezone ?? 'Europe/Madrid',
        currency: org.currency ?? 'EUR',
        members,
        memberCount: members.length,
        subscriptionStatus: sub?.status ?? null,
        currentPeriodEnd: sub?.current_period_end ?? null,
        stripeSubscriptionId: sub?.stripe_subscription_id ?? null,
        entityCount,
        integrationCount,
        aiChatConfig: aiConfigRes.data
          ? { ...aiConfigRes.data, provider: aiConfigRes.data.provider as 'openai' | 'anthropic' }
          : null,
      };
    },
    staleTime: 30_000,
  });
}
