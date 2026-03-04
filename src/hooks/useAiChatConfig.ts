import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

export interface AiChatConfig {
  id: string;
  organization_id: string;
  provider: 'openai' | 'anthropic';
  model: string;
}

const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
const ANTHROPIC_MODELS = ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];

export { OPENAI_MODELS, ANTHROPIC_MODELS };

export function useAiChatConfig() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;

  return useQuery<AiChatConfig | null>({
    queryKey: ['ai-chat-config', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('ai_chat_config')
        .select('id, organization_id, provider, model')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as AiChatConfig | null;
    },
    staleTime: 60_000,
  });
}

export function useInvalidateAiChatConfig() {
  const qc = useQueryClient();
  const { organization } = useCurrentOrganization();

  return () => {
    if (organization?.id) {
      qc.invalidateQueries({ queryKey: ['ai-chat-config', organization.id] });
    }
  };
}
