import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface StartOutlookOAuthInput {
  integrationId: string;
}

interface StartOutlookOAuthResponse {
  authUrl: string;
  state: string;
  expiresAt: string;
  tenant: string;
}

interface ExchangeOutlookOAuthInput {
  code: string;
  state: string;
}

interface ExchangeOutlookOAuthResponse {
  connected: boolean;
  integrationId: string;
  provider: 'outlook';
  accountEmail: string | null;
  expiresAt: string | null;
}

export function useStartOutlookOAuth() {
  return useMutation({
    mutationFn: async (input: StartOutlookOAuthInput): Promise<StartOutlookOAuthResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/outlook-oauth-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ integrationId: input.integrationId }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to start Outlook OAuth (${response.status})`);
      }

      return body as StartOutlookOAuthResponse;
    },
  });
}

export function useExchangeOutlookOAuth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExchangeOutlookOAuthInput): Promise<ExchangeOutlookOAuthResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/outlook-oauth-exchange`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: input.code, state: input.state }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to complete Outlook OAuth (${response.status})`);
      }

      return body as ExchangeOutlookOAuthResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}
