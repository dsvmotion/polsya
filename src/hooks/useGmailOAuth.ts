import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface StartGmailOAuthInput {
  integrationId: string;
}

interface StartGmailOAuthResponse {
  authUrl: string;
  state: string;
  expiresAt: string;
}

interface ExchangeGmailOAuthInput {
  code: string;
  state: string;
}

interface ExchangeGmailOAuthResponse {
  connected: boolean;
  integrationId: string;
  provider: 'gmail';
  accountEmail: string | null;
  expiresAt: string | null;
}

export function useStartGmailOAuth() {
  return useMutation({
    mutationFn: async (input: StartGmailOAuthInput): Promise<StartGmailOAuthResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gmail-oauth-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ integrationId: input.integrationId }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to start Gmail OAuth (${response.status})`);
      }

      return body as StartGmailOAuthResponse;
    },
  });
}

export function useExchangeGmailOAuth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExchangeGmailOAuthInput): Promise<ExchangeGmailOAuthResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gmail-oauth-exchange`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: input.code, state: input.state }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to complete Gmail OAuth (${response.status})`);
      }

      return body as ExchangeGmailOAuthResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}
