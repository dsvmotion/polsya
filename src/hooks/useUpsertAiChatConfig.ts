import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UpsertAiChatConfigInput {
  organizationId: string;
  provider: 'openai' | 'anthropic';
  model: string;
}

export function useUpsertAiChatConfig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertAiChatConfigInput) => {
      const { data, error } = await supabase
        .from('ai_chat_config')
        .upsert(
          {
            organization_id: input.organizationId,
            provider: input.provider,
            model: input.model.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' }
        )
        .select('id, organization_id, provider, model')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['platform-org-detail', vars.organizationId] });
      qc.invalidateQueries({ queryKey: ['ai-chat-config', vars.organizationId] });
    },
  });
}
