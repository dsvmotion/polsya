import { describe, it, expect } from 'vitest';
import {
  toSendEmailInput,
  buildReplyDefaults,
} from '@/components/creative/email/EmailComposeSheet.helpers';
import type { ComposeFormValues } from '@/components/creative/email/EmailComposeSheet.helpers';
import type { CreativeEmail } from '@/types/creative-emails';

// ---------------------------------------------------------------------------
// Helper: build a mock CreativeEmail with all required fields
// ---------------------------------------------------------------------------

function mockEmail(overrides: Partial<CreativeEmail> = {}): CreativeEmail {
  return {
    id: 'email-1',
    organizationId: 'org-1',
    integrationId: 'int-gmail-1',
    provider: 'gmail',
    messageId: 'msg-abc-123',
    threadId: 'thread-xyz',
    subject: 'Project update',
    fromAddress: 'alice@example.com',
    fromName: 'Alice Smith',
    toAddresses: [{ email: 'bob@example.com', name: 'Bob' }],
    ccAddresses: [],
    bccAddresses: [],
    bodyText: 'Hello world',
    bodyHtml: '<p>Hello world</p>',
    snippet: 'Hello world',
    labels: ['INBOX'],
    isRead: true,
    isStarred: false,
    isDraft: false,
    direction: 'inbound',
    sentAt: '2025-01-15T10:00:00Z',
    hasAttachments: false,
    entityType: null,
    entityId: null,
    matchedBy: null,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. toSendEmailInput
// ---------------------------------------------------------------------------

describe('toSendEmailInput', () => {
  const baseValues: ComposeFormValues = {
    integrationId: 'int-1',
    to: ['alice@example.com'],
    cc: [],
    bcc: [],
    subject: 'Hello',
    body: 'Line one\nLine two',
  };

  it('converts form values to SendEmailInput', () => {
    const result = toSendEmailInput(baseValues);

    expect(result.integrationId).toBe('int-1');
    expect(result.to).toEqual(['alice@example.com']);
    expect(result.subject).toBe('Hello');
  });

  it('wraps body text in <p> tags, splitting on newlines', () => {
    const result = toSendEmailInput(baseValues);
    expect(result.bodyHtml).toBe('<p>Line one</p><p>Line two</p>');
  });

  it('omits bodyHtml when body is empty', () => {
    const result = toSendEmailInput({ ...baseValues, body: '' });
    expect(result.bodyHtml).toBeUndefined();
  });

  it('omits cc when array is empty', () => {
    const result = toSendEmailInput(baseValues);
    expect(result.cc).toBeUndefined();
  });

  it('omits bcc when array is empty', () => {
    const result = toSendEmailInput(baseValues);
    expect(result.bcc).toBeUndefined();
  });

  it('includes cc when non-empty', () => {
    const result = toSendEmailInput({
      ...baseValues,
      cc: ['cc@example.com'],
    });
    expect(result.cc).toEqual(['cc@example.com']);
  });

  it('includes bcc when non-empty', () => {
    const result = toSendEmailInput({
      ...baseValues,
      bcc: ['bcc@example.com'],
    });
    expect(result.bcc).toEqual(['bcc@example.com']);
  });

  it('includes replyToMessageId when provided', () => {
    const result = toSendEmailInput(baseValues, 'msg-reply-123');
    expect(result.replyToMessageId).toBe('msg-reply-123');
  });

  it('omits replyToMessageId when not provided', () => {
    const result = toSendEmailInput(baseValues);
    expect(result.replyToMessageId).toBeUndefined();
  });

  it('handles single-line body', () => {
    const result = toSendEmailInput({ ...baseValues, body: 'Just one line' });
    expect(result.bodyHtml).toBe('<p>Just one line</p>');
  });

  it('handles multi-line body with empty lines', () => {
    const result = toSendEmailInput({ ...baseValues, body: 'A\n\nB' });
    expect(result.bodyHtml).toBe('<p>A</p><p></p><p>B</p>');
  });
});

// ---------------------------------------------------------------------------
// 2. buildReplyDefaults
// ---------------------------------------------------------------------------

describe('buildReplyDefaults', () => {
  it('sets to as the original sender address', () => {
    const email = mockEmail({ fromAddress: 'sender@test.com' });
    const result = buildReplyDefaults(email);
    expect(result.to).toEqual(['sender@test.com']);
  });

  it('prefixes subject with Re:', () => {
    const email = mockEmail({ subject: 'Project update' });
    const result = buildReplyDefaults(email);
    expect(result.subject).toBe('Re: Project update');
  });

  it('does not double Re: prefix when already present', () => {
    const email = mockEmail({ subject: 'Re: Project update' });
    const result = buildReplyDefaults(email);
    expect(result.subject).toBe('Re: Project update');
  });

  it('does not double Re: prefix (case-insensitive)', () => {
    const email = mockEmail({ subject: 'RE: Urgent matter' });
    const result = buildReplyDefaults(email);
    expect(result.subject).toBe('RE: Urgent matter');
  });

  it('handles null subject', () => {
    const email = mockEmail({ subject: null });
    const result = buildReplyDefaults(email);
    expect(result.subject).toBe('Re: ');
  });

  it('preserves the integrationId', () => {
    const email = mockEmail({ integrationId: 'int-outlook-42' });
    const result = buildReplyDefaults(email);
    expect(result.integrationId).toBe('int-outlook-42');
  });

  it('returns empty cc and bcc', () => {
    const email = mockEmail();
    const result = buildReplyDefaults(email);
    expect(result.cc).toEqual([]);
    expect(result.bcc).toEqual([]);
  });

  it('returns empty body', () => {
    const email = mockEmail();
    const result = buildReplyDefaults(email);
    expect(result.body).toBe('');
  });
});
