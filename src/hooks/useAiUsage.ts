import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { rpcCall } from '@/integrations/supabase/helpers';
import { safeJsonParse } from '@/lib/utils';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { AiBudget } from '@/types/ai-documents';

const AI_BUDGET_DEFAULTS: AiBudget = {
  monthlyCredits: null,
  creditsUsed: 0,
  creditsPurchased: 0,
  aiFeatures: ['chat', 'rag', 'documents'],
  remaining: null,
};

export function useAiUsage() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useQuery<AiBudget>({
    queryKey: ['ai-usage', orgId],
    queryFn: async () => {
      const { data, error } = await rpcCall('get_org_ai_budget', { p_org_id: orgId });
      // Gracefully handle missing RPC, permission, or schema errors — return
      // unlimited-trial defaults so new users never see console errors.
      if (error) {
        const msg = error.message ?? '';
        const isExpected =
          msg.includes('Forbidden') ||
          msg.includes('not a member') ||
          msg.includes('does not exist') ||
          msg.includes('Could not find');
        if (!isExpected) {
          logger.warn('[useAiUsage] Unexpected RPC error, returning defaults:', msg);
        }
        return { ...AI_BUDGET_DEFAULTS };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return { ...AI_BUDGET_DEFAULTS };
      }

      const budget: AiBudget = {
        monthlyCredits: row.monthly_credits,
        creditsUsed: row.credits_used,
        creditsPurchased: row.credits_purchased,
        aiFeatures: Array.isArray(row.ai_features) ? row.ai_features : safeJsonParse<string[]>(row.ai_features || '["chat"]', ['chat']),
        remaining: row.monthly_credits === null
          ? null
          : row.monthly_credits + row.credits_purchased - row.credits_used,
      };
      return budget;
    },
    enabled: !!orgId,
    retry: false,
  });
}
