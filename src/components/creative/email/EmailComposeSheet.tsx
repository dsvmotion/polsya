import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSendEmail } from '@/hooks/useCreativeEmails';
import type { SendEmailInput } from '@/hooks/useCreativeEmails';
import { useIntegrations } from '@/hooks/useIntegrations';
import { MultiEmailInput } from '@/components/creative/shared/MultiEmailInput';
import { PROVIDER_LABELS } from '@/types/integrations';
import type { IntegrationProvider } from '@/types/integrations';
import type { CreativeEmail } from '@/types/creative-emails';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposeFormValues {
  integrationId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
}

interface EmailComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: CreativeEmail;
}

// ---------------------------------------------------------------------------
// Email provider filter
// ---------------------------------------------------------------------------

const EMAIL_INTEGRATION_PROVIDERS: IntegrationProvider[] = ['gmail', 'outlook', 'email_imap'];

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EMPTY_DEFAULTS: ComposeFormValues = {
  integrationId: '',
  to: [],
  cc: [],
  bcc: [],
  subject: '',
  body: '',
};

export function EmailComposeSheet({ open, onOpenChange, replyTo }: EmailComposeSheetProps) {
  const { toast } = useToast();
  const sendMutation = useSendEmail();
  const { data: integrations } = useIntegrations();
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Filter to email integrations only
  const emailIntegrations = useMemo(
    () =>
      (integrations ?? []).filter(
        (i) =>
          EMAIL_INTEGRATION_PROVIDERS.includes(i.provider) &&
          i.status === 'connected' &&
          i.is_enabled,
      ),
    [integrations],
  );

  // Build default values based on mode
  const defaults = useMemo<ComposeFormValues>(() => {
    if (replyTo) {
      return buildReplyDefaults(replyTo);
    }
    return {
      ...EMPTY_DEFAULTS,
      integrationId: emailIntegrations[0]?.id ?? '',
    };
  }, [replyTo, emailIntegrations]);

  const form = useForm<ComposeFormValues>({
    defaultValues: defaults,
  });

  // Reset form when defaults change (open/close, replyTo change)
  useEffect(() => {
    if (open) {
      form.reset(defaults);
      setShowCcBcc(false);
    }
  }, [open, defaults, form]);

  async function onSubmit(values: ComposeFormValues) {
    try {
      const input = toSendEmailInput(values, replyTo?.messageId);
      await sendMutation.mutateAsync(input);
      toast({ title: replyTo ? 'Reply sent' : 'Email sent' });
      form.reset(EMPTY_DEFAULTS);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Failed to send email',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  }

  const isReply = !!replyTo;
  const showIntegrationSelector = emailIntegrations.length > 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isReply ? 'Reply' : 'Compose Email'}</SheetTitle>
          <SheetDescription>
            {isReply
              ? `Replying to ${replyTo.fromName ?? replyTo.fromAddress}`
              : 'Send a new email from a connected account.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Integration selector */}
            {showIntegrationSelector && (
              <FormField
                control={form.control}
                name="integrationId"
                rules={{ required: 'Select an email account' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {emailIntegrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            {integration.display_name} ({PROVIDER_LABELS[integration.provider]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* To */}
            <FormField
              control={form.control}
              name="to"
              rules={{
                validate: (v) => v.length > 0 || 'At least one recipient is required',
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <MultiEmailInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Recipient email addresses"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CC/BCC toggle */}
            {!showCcBcc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowCcBcc(true)}
              >
                + CC / BCC
              </Button>
            )}

            {showCcBcc && (
              <>
                <FormField
                  control={form.control}
                  name="cc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC</FormLabel>
                      <FormControl>
                        <MultiEmailInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="CC recipients"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bcc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BCC</FormLabel>
                      <FormControl>
                        <MultiEmailInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="BCC recipients"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              rules={{ required: 'Subject is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Email subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write your message..." rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
