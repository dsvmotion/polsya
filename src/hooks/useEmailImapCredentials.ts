import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface EmailImapCredentialsInput {
  integrationId: string;
  accountEmail: string;
  username: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
}

interface EmailImapCredentialsResponse {
  saved: boolean;
  integrationId: string;
  provider: 'email_imap';
  accountEmail: string;
}

export function useUpsertEmailImapCredentials() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: EmailImapCredentialsInput): Promise<EmailImapCredentialsResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-imap-upsert`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to save IMAP credentials (${response.status})`);
      }

      return body as EmailImapCredentialsResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}
