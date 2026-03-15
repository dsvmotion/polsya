import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ApiKeyCredentialsInput {
  integrationId: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
}

/** @deprecated Use ApiKeyCredentialsInput instead */
export type EmailMarketingCredentialsInput = ApiKeyCredentialsInput;

interface ApiKeyCredentialsResponse {
  saved: boolean;
  integrationId: string;
  provider: string;
  keyMasked: string;
}

export function useUpsertApiKeyCredentials() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApiKeyCredentialsInput): Promise<ApiKeyCredentialsResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-marketing-key-upsert`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to save API credentials (${response.status})`);
      }

      return body as ApiKeyCredentialsResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}

/** @deprecated Use useUpsertApiKeyCredentials instead */
export const useUpsertEmailMarketingCredentials = useUpsertApiKeyCredentials;
