import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { canManageWorkspace } from '@/lib/rbac';

interface AiChatConfigStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
  hasKey: boolean;
}

async function fetchConfig(organizationId: string, accessToken: string): Promise<AiChatConfigStatus> {
  const res = await supabase.functions.invoke('ai-chat-config', {
    method: 'GET',
    headers: {
      'X-Organization-Id': organizationId,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (res.error) throw new Error(res.error.message ?? 'Failed to fetch AI config');
  return res.data as AiChatConfigStatus;
}

export function useAiChatConfig() {
  const { organization, membership } = useCurrentOrganization();
  const orgId = organization?.id ?? null;
  const canManage = canManageWorkspace(membership?.role ?? null);

  const query = useQuery({
    queryKey: ['ai-chat-config', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !orgId) throw new Error('No session');
      return fetchConfig(orgId, session.access_token);
    },
    staleTime: 60_000,
  });

  return { ...query, canManage };
}

export function useSaveAiChatConfig() {
  const qc = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;

  return useMutation({
    mutationFn: async ({ apiKey, model }: { apiKey: string; model: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !orgId) throw new Error('No session');

      const res = await supabase.functions.invoke('ai-chat-config', {
        method: 'POST',
        headers: {
          'X-Organization-Id': orgId,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: { apiKey, model },
      });

      if (res.error) throw new Error(res.error.message ?? 'Failed to save config');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-chat-config', orgId] });
    },
  });
}

export function useDeleteAiChatConfig() {
  const qc = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !orgId) throw new Error('No session');

      const res = await supabase.functions.invoke('ai-chat-config', {
        method: 'DELETE',
        headers: {
          'X-Organization-Id': orgId,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (res.error) throw new Error(res.error.message ?? 'Failed to delete config');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-chat-config', orgId] });
      qc.invalidateQueries({ queryKey: ['ai-chat-messages'] });
    },
  });
}
