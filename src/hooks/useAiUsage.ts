import { useQuery } from '@tanstack/react-query';
import { rpcCall } from '@/integrations/supabase/helpers';
import { safeJsonParse } from '@/lib/utils';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { AiBudget } from '@/types/ai-documents';

export function useAiUsage() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useQuery<AiBudget>({
    queryKey: ['ai-usage', orgId],
    queryFn: async () => {
      const { data, error } = await rpcCall('get_org_ai_budget', { p_org_id: orgId });
      // Gracefully handle missing RPC or permission errors — return defaults
      if (error) {
        const msg = error.message ?? '';
        if (msg.includes('Forbidden') || msg.includes('not a member') || msg.includes('does not exist')) {
          return {
            monthlyCredits: null,
            creditsUsed: 0,
            creditsPurchased: 0,
            aiFeatures: ['chat', 'rag', 'documents'],
            remaining: null,
          } as AiBudget;
        }
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return {
          monthlyCredits: null,
          creditsUsed: 0,
          creditsPurchased: 0,
          aiFeatures: ['chat', 'rag', 'documents'],
          remaining: null,
        } as AiBudget;
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
  });
}
