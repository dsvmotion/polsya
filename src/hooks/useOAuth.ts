import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface StartOAuthInput {
  integrationId: string;
  provider: string;
}

export interface StartOAuthResponse {
  authUrl: string;
  state: string;
  expiresAt: string;
  provider: string;
}

export interface ExchangeOAuthInput {
  code: string;
  state: string;
}

export interface ExchangeOAuthResponse {
  connected: boolean;
  integrationId: string;
  provider: string;
  accountEmail: string | null;
  expiresAt: string | null;
}

export function useStartOAuth() {
  return useMutation({
    mutationFn: async (input: StartOAuthInput): Promise<StartOAuthResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/oauth-start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ integrationId: input.integrationId, provider: input.provider }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to start OAuth for ${input.provider} (${response.status})`);
      }

      return body as StartOAuthResponse;
    },
  });
}

export function useExchangeOAuth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExchangeOAuthInput): Promise<ExchangeOAuthResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/oauth-exchange`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: input.code, state: input.state }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to complete OAuth exchange (${response.status})`);
      }

      return body as ExchangeOAuthResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}
