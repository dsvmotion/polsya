import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeEmail, EmailProvider, EmailDirection, EmailMatchType } from '@/types/creative-emails';

interface EmailRow {
  id: string;
  organization_id: string;
  integration_id: string;
  provider: string;
  message_id: string;
  thread_id: string | null;
  subject: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: Array<{ email: string; name?: string }>;
  cc_addresses: Array<{ email: string; name?: string }>;
  bcc_addresses: Array<{ email: string; name?: string }>;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  labels: string[];
  is_read: boolean;
  is_starred: boolean;
  is_draft: boolean;
  direction: string;
  sent_at: string;
  has_attachments: boolean;
  entity_type: string | null;
  entity_id: string | null;
  matched_by: string | null;
  created_at: string;
  updated_at: string;
}

function toCreativeEmail(row: EmailRow): CreativeEmail {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationId: row.integration_id,
    provider: row.provider as EmailProvider,
    messageId: row.message_id,
    threadId: row.thread_id,
    subject: row.subject,
    fromAddress: row.from_address,
    fromName: row.from_name,
    toAddresses: row.to_addresses,
    ccAddresses: row.cc_addresses,
    bccAddresses: row.bcc_addresses,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    snippet: row.snippet,
    labels: row.labels,
    isRead: row.is_read,
    isStarred: row.is_starred,
    isDraft: row.is_draft,
    direction: row.direction as EmailDirection,
    sentAt: row.sent_at,
    hasAttachments: row.has_attachments,
    entityType: row.entity_type,
    entityId: row.entity_id,
    matchedBy: row.matched_by as EmailMatchType | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const emailKeys = {
  all: (orgId: string) => ['creative-emails', orgId] as const,
  forEntity: (entityType: string, entityId: string) =>
    ['creative-emails', 'entity', entityType, entityId] as const,
  thread: (orgId: string, threadId: string) =>
    ['creative-emails', 'thread', orgId, threadId] as const,
};

export function useCreativeEmails(filters?: {
  entityType?: string;
  entityId?: string;
  direction?: EmailDirection;
  limit?: number;
}) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeEmail[]>({
    queryKey: filters?.entityType && filters?.entityId
      ? emailKeys.forEntity(filters.entityType, filters.entityId)
      : emailKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('creative_emails')
        .select('*')
        .eq('organization_id', orgId!)
        .order('sent_at', { ascending: false });

      if (filters?.entityType && filters?.entityId) {
        query = query.eq('entity_type', filters.entityType).eq('entity_id', filters.entityId);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      query = query.limit(filters?.limit ?? 50);

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as EmailRow[]).map(toCreativeEmail);
    },
  });
}

export function useCreativeEmailThread(threadId: string | null) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeEmail[]>({
    queryKey: emailKeys.thread(orgId ?? '', threadId ?? ''),
    enabled: !!orgId && !!threadId,
    queryFn: async () => {
      const { data, error } = await fromTable('creative_emails')
        .select('*')
        .eq('organization_id', orgId!)
        .eq('thread_id', threadId!)
        .order('sent_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as EmailRow[]).map(toCreativeEmail);
    },
  });
}

export interface SendEmailInput {
  integrationId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  replyToMessageId?: string;
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: SendEmailInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            integrationId: values.integrationId,
            to: values.to,
            cc: values.cc,
            bcc: values.bcc,
            subject: values.subject,
            bodyHtml: values.bodyHtml,
            replyToMessageId: values.replyToMessageId,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Send failed' }));
        throw new Error((err as { error: string }).error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-emails'] });
    },
  });
}
