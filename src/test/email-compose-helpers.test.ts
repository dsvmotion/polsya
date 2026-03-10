import { describe, it, expect } from 'vitest';
import {
  toSendEmailInput,
  buildReplyDefaults,
  type ComposeFormValues,
} from '@/components/creative/email/EmailComposeSheet.helpers';
import type { CreativeEmail } from '@/types/creative-emails';

const makeValues = (o: Partial<ComposeFormValues> = {}): ComposeFormValues => ({
  integrationId: 'int-1',
  to: ['alice@example.com'],
  cc: [],
  bcc: [],
  subject: 'Hello',
  body: '',
  ...o,
});

describe('EmailComposeSheet.helpers', () => {
  describe('toSendEmailInput', () => {
    it('maps required fields', () => {
      const result = toSendEmailInput(makeValues());
      expect(result.integrationId).toBe('int-1');
      expect(result.to).toEqual(['alice@example.com']);
      expect(result.subject).toBe('Hello');
    });

    it('omits cc/bcc when empty', () => {
      const result = toSendEmailInput(makeValues());
      expect(result.cc).toBeUndefined();
      expect(result.bcc).toBeUndefined();
    });

    it('includes cc when non-empty', () => {
      const result = toSendEmailInput(makeValues({ cc: ['bob@example.com'] }));
      expect(result.cc).toEqual(['bob@example.com']);
    });

    it('includes bcc when non-empty', () => {
      const result = toSendEmailInput(makeValues({ bcc: ['secret@example.com'] }));
      expect(result.bcc).toEqual(['secret@example.com']);
    });

    it('converts body newlines to HTML paragraphs', () => {
      const result = toSendEmailInput(makeValues({ body: 'Line 1\nLine 2' }));
      expect(result.bodyHtml).toBe('<p>Line 1</p><p>Line 2</p>');
    });

    it('omits bodyHtml when body is empty', () => {
      const result = toSendEmailInput(makeValues({ body: '' }));
      expect(result.bodyHtml).toBeUndefined();
    });

    it('includes replyToMessageId when provided', () => {
      const result = toSendEmailInput(makeValues(), 'msg-123');
      expect(result.replyToMessageId).toBe('msg-123');
    });

    it('omits replyToMessageId when undefined', () => {
      const result = toSendEmailInput(makeValues());
      expect(result.replyToMessageId).toBeUndefined();
    });
  });

  describe('buildReplyDefaults', () => {
    const makeEmail = (o: Partial<CreativeEmail> = {}): CreativeEmail => ({
      id: 'em-1',
      organizationId: 'org-1',
      integrationId: 'int-1',
      provider: 'gmail',
      messageId: 'msg-ext-1',
      threadId: 'th-1',
      fromAddress: 'sender@example.com',
      fromName: 'Sender',
      toAddresses: [{ email: 'me@example.com' }],
      ccAddresses: [],
      bccAddresses: [],
      subject: 'Original Subject',
      bodyText: 'Hello',
      bodyHtml: '<p>Hello</p>',
      snippet: 'Hello...',
      isRead: true,
      isStarred: false,
      isDraft: false,
      direction: 'inbound',
      labels: [],
      sentAt: '2025-06-01T00:00:00Z',
      hasAttachments: false,
      entityType: null,
      entityId: null,
      matchedBy: null,
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
      ...o,
    });

    it('builds reply with Re: prefix', () => {
      const result = buildReplyDefaults(makeEmail());
      expect(result.subject).toBe('Re: Original Subject');
      expect(result.to).toEqual(['sender@example.com']);
      expect(result.integrationId).toBe('int-1');
      expect(result.cc).toEqual([]);
      expect(result.bcc).toEqual([]);
      expect(result.body).toBe('');
    });

    it('does not double-prefix Re:', () => {
      const result = buildReplyDefaults(makeEmail({ subject: 'Re: Already replied' }));
      expect(result.subject).toBe('Re: Already replied');
    });

    it('handles null subject', () => {
      const result = buildReplyDefaults(makeEmail({ subject: null }));
      expect(result.subject).toBe('Re: ');
    });
  });
});
