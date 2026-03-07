import type { SendEmailInput } from '@/hooks/useCreativeEmails';
import type { CreativeEmail } from '@/types/creative-emails';

export interface ComposeFormValues {
  integrationId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
}

export function toSendEmailInput(
  values: ComposeFormValues,
  replyToMessageId?: string,
): SendEmailInput {
  const input: SendEmailInput = {
    integrationId: values.integrationId,
    to: values.to,
    subject: values.subject,
  };

  if (values.cc.length > 0) {
    input.cc = values.cc;
  }

  if (values.bcc.length > 0) {
    input.bcc = values.bcc;
  }

  if (values.body) {
    const paragraphs = values.body.split('\n').map((line) => `<p>${line}</p>`);
    input.bodyHtml = paragraphs.join('');
  }

  if (replyToMessageId) {
    input.replyToMessageId = replyToMessageId;
  }

  return input;
}

export function buildReplyDefaults(email: CreativeEmail): ComposeFormValues {
  const originalSubject = email.subject ?? '';
  const subject = /^re:\s/i.test(originalSubject)
    ? originalSubject
    : `Re: ${originalSubject}`;

  return {
    integrationId: email.integrationId,
    to: [email.fromAddress],
    cc: [],
    bcc: [],
    subject,
    body: '',
  };
}
