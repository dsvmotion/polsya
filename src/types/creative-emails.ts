export const EMAIL_PROVIDERS = ['gmail', 'outlook', 'email_imap'] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export const EMAIL_DIRECTIONS = ['inbound', 'outbound'] as const;
export type EmailDirection = (typeof EMAIL_DIRECTIONS)[number];

export const EMAIL_MATCH_TYPES = ['auto_email', 'auto_domain', 'manual'] as const;
export type EmailMatchType = (typeof EMAIL_MATCH_TYPES)[number];

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface CreativeEmail {
  id: string;
  organizationId: string;
  integrationId: string;
  provider: EmailProvider;
  messageId: string;
  threadId: string | null;
  subject: string | null;
  fromAddress: string;
  fromName: string | null;
  toAddresses: EmailAddress[];
  ccAddresses: EmailAddress[];
  bccAddresses: EmailAddress[];
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string | null;
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  direction: EmailDirection;
  sentAt: string;
  hasAttachments: boolean;
  entityType: string | null;
  entityId: string | null;
  matchedBy: EmailMatchType | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeEmailAttachment {
  id: string;
  emailId: string;
  filename: string;
  contentType: string | null;
  sizeBytes: number | null;
  storagePath: string | null;
  providerRef: string | null;
  createdAt: string;
}

export const EMAIL_PROVIDER_LABELS: Record<EmailProvider, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  email_imap: 'IMAP/SMTP',
};

export const EMAIL_PROVIDER_COLORS: Record<EmailProvider, { bg: string; text: string }> = {
  gmail: { bg: 'bg-red-100', text: 'text-red-800' },
  outlook: { bg: 'bg-blue-100', text: 'text-blue-800' },
  email_imap: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export const EMAIL_DIRECTION_LABELS: Record<EmailDirection, string> = {
  inbound: 'Received',
  outbound: 'Sent',
};

export const EMAIL_DIRECTION_COLORS: Record<EmailDirection, { bg: string; text: string }> = {
  inbound: { bg: 'bg-green-100', text: 'text-green-800' },
  outbound: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
};
