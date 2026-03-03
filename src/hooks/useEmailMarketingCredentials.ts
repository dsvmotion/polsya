import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface EmailMarketingCredentialsInput {
  integrationId: string;
  apiKey: string;
}

interface EmailMarketingCredentialsResponse {
  saved: boolean;
  integrationId: string;
  provider: 'brevo';
  keyMasked: string;
}

export function useUpsertEmailMarketingCredentials() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: EmailMarketingCredentialsInput): Promise<EmailMarketingCredentialsResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-marketing-key-upsert`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to save email marketing credentials (${response.status})`);
      }

      return body as EmailMarketingCredentialsResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}
