# Phase 5B: Communication UX Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add compose, reply, thread view, and calendar event creation UI to the existing read-only Creative Inbox and Calendar pages.

**Architecture:** Pure frontend. All backend hooks (`useSendEmail`, `useCreateCalendarEvent`, `useCreativeEmailThread`) and edge functions (`email-send`, `calendar-event-create`) are already implemented. We build 4 new UI components + modify 2 existing pages.

**Tech Stack:** React 18, TypeScript, react-hook-form, shadcn/ui (Sheet, Form, Input, Select, Textarea, Badge, Button), Tailwind CSS, Vitest.

---

### Task 1: MultiEmailInput shared component

**Files:**
- Create: `src/components/creative/shared/MultiEmailInput.tsx`
- Create: `src/test/multi-email-input.test.ts`

**Step 1: Write the test file**

```typescript
// src/test/multi-email-input.test.ts
import { describe, it, expect } from 'vitest';

// Unit tests for email validation logic (pure function, no React rendering needed)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function parseEmailInput(raw: string): { valid: string[]; invalid: string[] } {
  const parts = raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of parts) {
    if (isValidEmail(part)) valid.push(part.toLowerCase());
    else invalid.push(part);
  }
  return { valid, invalid };
}

describe('MultiEmailInput validation', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@missing.com')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('parses comma-separated emails', () => {
    const result = parseEmailInput('a@b.com, c@d.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com']);
    expect(result.invalid).toEqual([]);
  });

  it('lowercases emails', () => {
    const result = parseEmailInput('User@Example.COM');
    expect(result.valid).toEqual(['user@example.com']);
  });

  it('separates valid from invalid', () => {
    const result = parseEmailInput('a@b.com, bad, c@d.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com']);
    expect(result.invalid).toEqual(['bad']);
  });

  it('handles semicolons and spaces as separators', () => {
    const result = parseEmailInput('a@b.com; c@d.com e@f.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com', 'e@f.com']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/multi-email-input.test.ts`
Expected: PASS (these are standalone pure function tests defined inline)

**Step 3: Write the MultiEmailInput component**

```tsx
// src/components/creative/shared/MultiEmailInput.tsx
import { useState, useCallback, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function parseEmailInput(raw: string): { valid: string[]; invalid: string[] } {
  const parts = raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of parts) {
    if (isValidEmail(part)) valid.push(part.toLowerCase());
    else invalid.push(part);
  }
  return { valid, invalid };
}

interface MultiEmailInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiEmailInput({ value, onChange, placeholder, disabled }: MultiEmailInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addEmails = useCallback(
    (raw: string) => {
      const { valid, invalid } = parseEmailInput(raw);
      if (invalid.length > 0) {
        setError(`Invalid: ${invalid.join(', ')}`);
      } else {
        setError(null);
      }
      if (valid.length > 0) {
        const unique = [...new Set([...value, ...valid])];
        onChange(unique);
      }
      setInputValue('');
    },
    [value, onChange],
  );

  const removeEmail = useCallback(
    (email: string) => {
      onChange(value.filter((e) => e !== email));
    },
    [value, onChange],
  );

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', 'Tab', ','].includes(e.key) && inputValue.trim()) {
      e.preventDefault();
      addEmails(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  }

  function handleBlur() {
    if (inputValue.trim()) {
      addEmails(inputValue);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-[2.5rem]">
        {value.map((email) => (
          <Badge key={email} variant="secondary" className="gap-1 text-xs">
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-0.5 hover:text-destructive"
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? (placeholder ?? 'Type email and press Enter') : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

**Step 4: Update test imports to use the exported functions**

Update `src/test/multi-email-input.test.ts` to import from the component:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidEmail, parseEmailInput } from '@/components/creative/shared/MultiEmailInput';

describe('MultiEmailInput validation', () => {
  // ... same tests as Step 1 but now importing from the real module
});
```

**Step 5: Run tests**

Run: `npx vitest run src/test/multi-email-input.test.ts`
Expected: PASS (6 tests)

**Step 6: Commit**

```bash
git add src/components/creative/shared/MultiEmailInput.tsx src/test/multi-email-input.test.ts
git commit -m "feat(phase5b): add MultiEmailInput shared component with validation"
```

---

### Task 2: EmailComposeSheet component

**Files:**
- Create: `src/components/creative/email/EmailComposeSheet.tsx`
- Create: `src/test/email-compose-sheet.test.ts`

**Step 1: Write the test file**

```typescript
// src/test/email-compose-sheet.test.ts
import { describe, it, expect } from 'vitest';

// Test the compose form value preparation logic (pure function)
interface ComposeFormValues {
  integrationId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  replyToMessageId?: string;
}

function toSendEmailInput(values: ComposeFormValues) {
  return {
    integrationId: values.integrationId,
    to: values.to,
    cc: values.cc.length > 0 ? values.cc : undefined,
    bcc: values.bcc.length > 0 ? values.bcc : undefined,
    subject: values.subject,
    bodyHtml: values.body ? `<p>${values.body.replace(/\n/g, '</p><p>')}</p>` : undefined,
    replyToMessageId: values.replyToMessageId,
  };
}

function buildReplyDefaults(email: {
  fromAddress: string;
  subject: string | null;
  integrationId: string;
  messageId: string;
}) {
  return {
    integrationId: email.integrationId,
    to: [email.fromAddress],
    cc: [] as string[],
    bcc: [] as string[],
    subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject ?? ''}`,
    body: '',
    replyToMessageId: email.messageId,
  };
}

describe('EmailComposeSheet logic', () => {
  it('converts form values to SendEmailInput', () => {
    const result = toSendEmailInput({
      integrationId: 'int-1',
      to: ['a@b.com'],
      cc: [],
      bcc: [],
      subject: 'Hello',
      body: 'Hi there',
    });
    expect(result.integrationId).toBe('int-1');
    expect(result.to).toEqual(['a@b.com']);
    expect(result.cc).toBeUndefined();
    expect(result.bcc).toBeUndefined();
    expect(result.subject).toBe('Hello');
    expect(result.bodyHtml).toBe('<p>Hi there</p>');
  });

  it('includes cc/bcc when non-empty', () => {
    const result = toSendEmailInput({
      integrationId: 'int-1',
      to: ['a@b.com'],
      cc: ['c@d.com'],
      bcc: ['e@f.com'],
      subject: 'Test',
      body: '',
    });
    expect(result.cc).toEqual(['c@d.com']);
    expect(result.bcc).toEqual(['e@f.com']);
  });

  it('builds reply defaults from original email', () => {
    const defaults = buildReplyDefaults({
      fromAddress: 'sender@test.com',
      subject: 'Original subject',
      integrationId: 'int-1',
      messageId: 'msg-123',
    });
    expect(defaults.to).toEqual(['sender@test.com']);
    expect(defaults.subject).toBe('Re: Original subject');
    expect(defaults.replyToMessageId).toBe('msg-123');
    expect(defaults.integrationId).toBe('int-1');
  });

  it('does not double-prefix Re:', () => {
    const defaults = buildReplyDefaults({
      fromAddress: 'x@y.com',
      subject: 'Re: Already replied',
      integrationId: 'int-1',
      messageId: 'msg-456',
    });
    expect(defaults.subject).toBe('Re: Already replied');
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/test/email-compose-sheet.test.ts`
Expected: PASS (these are pure function tests)

**Step 3: Write the EmailComposeSheet component**

```tsx
// src/components/creative/email/EmailComposeSheet.tsx
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { MultiEmailInput } from '@/components/creative/shared/MultiEmailInput';
import { useSendEmail } from '@/hooks/useCreativeEmails';
import { useIntegrations } from '@/hooks/useIntegrations';
import type { CreativeEmail } from '@/types/creative-emails';

const EMAIL_PROVIDERS = new Set(['gmail', 'outlook', 'email_imap']);

interface EmailComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: CreativeEmail;
}

interface ComposeFormValues {
  integrationId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
}

export function toSendEmailInput(values: ComposeFormValues, replyToMessageId?: string) {
  return {
    integrationId: values.integrationId,
    to: values.to,
    cc: values.cc.length > 0 ? values.cc : undefined,
    bcc: values.bcc.length > 0 ? values.bcc : undefined,
    subject: values.subject,
    bodyHtml: values.body ? `<p>${values.body.replace(/\n/g, '</p><p>')}</p>` : undefined,
    replyToMessageId,
  };
}

export function buildReplyDefaults(email: CreativeEmail): ComposeFormValues {
  return {
    integrationId: email.integrationId,
    to: [email.fromAddress],
    cc: [],
    bcc: [],
    subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject ?? ''}`,
    body: '',
  };
}

export function EmailComposeSheet({ open, onOpenChange, replyTo }: EmailComposeSheetProps) {
  const { toast } = useToast();
  const sendMutation = useSendEmail();
  const { data: integrations = [] } = useIntegrations();
  const [showCcBcc, setShowCcBcc] = useState(false);

  const emailIntegrations = integrations.filter(
    (i) => EMAIL_PROVIDERS.has(i.provider) && i.status === 'connected' && i.is_enabled,
  );

  const defaultValues: ComposeFormValues = replyTo
    ? buildReplyDefaults(replyTo)
    : { integrationId: emailIntegrations[0]?.id ?? '', to: [], cc: [], bcc: [], subject: '', body: '' };

  const form = useForm<ComposeFormValues>({ defaultValues });

  async function onSubmit(values: ComposeFormValues) {
    if (values.to.length === 0) {
      toast({ title: 'Error', description: 'At least one recipient is required', variant: 'destructive' });
      return;
    }
    try {
      const input = toSendEmailInput(values, replyTo?.messageId);
      await sendMutation.mutateAsync(input);
      toast({ title: replyTo ? 'Reply sent' : 'Email sent' });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Send failed', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{replyTo ? 'Reply' : 'New Email'}</SheetTitle>
          <SheetDescription>
            {replyTo ? `Replying to ${replyTo.fromName || replyTo.fromAddress}` : 'Compose a new email'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {emailIntegrations.length > 1 && (
              <FormField
                control={form.control}
                name="integrationId"
                rules={{ required: 'Select an account' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {emailIntegrations.map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Controller
              control={form.control}
              name="to"
              rules={{ validate: (v) => v.length > 0 || 'At least one recipient required' }}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">To</label>
                  <MultiEmailInput value={field.value} onChange={field.onChange} placeholder="recipient@example.com" />
                  {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <button
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              CC / BCC {showCcBcc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showCcBcc && (
              <>
                <Controller
                  control={form.control}
                  name="cc"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">CC</label>
                      <MultiEmailInput value={field.value} onChange={field.onChange} />
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="bcc"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">BCC</label>
                      <MultiEmailInput value={field.value} onChange={field.onChange} />
                    </div>
                  )}
                />
              </>
            )}

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

            <Button type="submit" className="w-full gap-2" disabled={sendMutation.isPending}>
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? 'Sending...' : replyTo ? 'Send Reply' : 'Send Email'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 4: Update test to import from the real module**

Replace the inline function definitions in `src/test/email-compose-sheet.test.ts` with imports:

```typescript
import { toSendEmailInput, buildReplyDefaults } from '@/components/creative/email/EmailComposeSheet';
import type { CreativeEmail } from '@/types/creative-emails';
```

And update `buildReplyDefaults` tests to pass a full `CreativeEmail` mock object.

**Step 5: Run all tests**

Run: `npx vitest run src/test/email-compose-sheet.test.ts src/test/multi-email-input.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/creative/email/EmailComposeSheet.tsx src/test/email-compose-sheet.test.ts
git commit -m "feat(phase5b): add EmailComposeSheet with compose and reply modes"
```

---

### Task 3: EmailThreadView component

**Files:**
- Create: `src/components/creative/email/EmailThreadView.tsx`
- Create: `src/test/email-thread-view.test.ts`

**Step 1: Write the test file**

```typescript
// src/test/email-thread-view.test.ts
import { describe, it, expect } from 'vitest';
import type { CreativeEmail } from '@/types/creative-emails';

// Test thread grouping and display logic
function formatThreadSubject(emails: Array<{ subject: string | null }>): string {
  const first = emails.find((e) => e.subject)?.subject;
  return first ?? '(No subject)';
}

function getParticipants(emails: Array<{ fromAddress: string; fromName: string | null }>): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const e of emails) {
    if (!seen.has(e.fromAddress)) {
      seen.add(e.fromAddress);
      names.push(e.fromName || e.fromAddress);
    }
  }
  return names;
}

describe('EmailThreadView logic', () => {
  it('extracts thread subject from first email with subject', () => {
    expect(formatThreadSubject([
      { subject: null },
      { subject: 'Hello World' },
      { subject: 'Re: Hello World' },
    ])).toBe('Hello World');
  });

  it('returns (No subject) when all subjects are null', () => {
    expect(formatThreadSubject([{ subject: null }])).toBe('(No subject)');
  });

  it('extracts unique participants', () => {
    const participants = getParticipants([
      { fromAddress: 'a@b.com', fromName: 'Alice' },
      { fromAddress: 'c@d.com', fromName: 'Bob' },
      { fromAddress: 'a@b.com', fromName: 'Alice' },
    ]);
    expect(participants).toEqual(['Alice', 'Bob']);
  });

  it('uses address when name is null', () => {
    const participants = getParticipants([
      { fromAddress: 'x@y.com', fromName: null },
    ]);
    expect(participants).toEqual(['x@y.com']);
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/test/email-thread-view.test.ts`
Expected: PASS

**Step 3: Write the EmailThreadView component**

```tsx
// src/components/creative/email/EmailThreadView.tsx
import { useState } from 'react';
import { ArrowLeft, Reply, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreativeEmailThread } from '@/hooks/useCreativeEmails';
import { EMAIL_DIRECTION_LABELS, EMAIL_DIRECTION_COLORS } from '@/types/creative-emails';
import type { CreativeEmail } from '@/types/creative-emails';
import { format } from 'date-fns';

export function formatThreadSubject(emails: Array<{ subject: string | null }>): string {
  const first = emails.find((e) => e.subject)?.subject;
  return first ?? '(No subject)';
}

export function getParticipants(emails: Array<{ fromAddress: string; fromName: string | null }>): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const e of emails) {
    if (!seen.has(e.fromAddress)) {
      seen.add(e.fromAddress);
      names.push(e.fromName || e.fromAddress);
    }
  }
  return names;
}

interface EmailThreadViewProps {
  email: CreativeEmail;
  onBack: () => void;
  onReply: (email: CreativeEmail) => void;
}

export function EmailThreadView({ email, onBack, onReply }: EmailThreadViewProps) {
  const threadId = email.threadId;
  const { data: threadEmails = [], isLoading } = useCreativeEmailThread(threadId);

  // If no thread, show single email
  const messages = threadEmails.length > 0 ? threadEmails : [email];
  const subject = formatThreadSubject(messages);
  const lastEmail = messages[messages.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="border-b pb-3">
        <h2 className="text-lg font-semibold">{subject}</h2>
        <p className="text-sm text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? 's' : ''} ·{' '}
          {getParticipants(messages).join(', ')}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading thread...</div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <EmailMessage
              key={msg.id}
              email={msg}
              defaultExpanded={idx === messages.length - 1}
            />
          ))}
        </div>
      )}

      <div className="pt-4 border-t">
        <Button variant="outline" className="gap-2" onClick={() => onReply(lastEmail)}>
          <Reply className="h-4 w-4" /> Reply
        </Button>
      </div>
    </div>
  );
}

function EmailMessage({ email, defaultExpanded }: { email: CreativeEmail; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const dirColors = EMAIL_DIRECTION_COLORS[email.direction];

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {email.fromName || email.fromAddress}
            </span>
            <Badge variant="outline" className={`text-xs ${dirColors.bg} ${dirColors.text}`}>
              {EMAIL_DIRECTION_LABELS[email.direction]}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground truncate mt-1">{email.snippet}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 mt-1" /> : <ChevronDown className="h-4 w-4 mt-1" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t">
          <div className="text-xs text-muted-foreground py-2">
            To: {email.toAddresses.map((a) => a.name || a.email).join(', ')}
            {email.ccAddresses.length > 0 && (
              <span> · CC: {email.ccAddresses.map((a) => a.name || a.email).join(', ')}</span>
            )}
          </div>
          <div className="text-sm whitespace-pre-wrap">
            {email.bodyText || email.snippet || '(No content)'}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Update test imports**

Update `src/test/email-thread-view.test.ts` to import `formatThreadSubject` and `getParticipants` from the real component.

**Step 5: Run tests**

Run: `npx vitest run src/test/email-thread-view.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/creative/email/EmailThreadView.tsx src/test/email-thread-view.test.ts
git commit -m "feat(phase5b): add EmailThreadView with collapsible messages and reply"
```

---

### Task 4: CalendarEventFormSheet component

**Files:**
- Create: `src/components/creative/calendar/CalendarEventFormSheet.tsx`
- Create: `src/test/calendar-event-form.test.ts`

**Step 1: Write the test file**

```typescript
// src/test/calendar-event-form.test.ts
import { describe, it, expect } from 'vitest';

interface EventFormValues {
  integrationId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
  attendees: string[];
}

function toCreateEventInput(values: EventFormValues) {
  const startAt = values.allDay
    ? `${values.date}T00:00:00`
    : `${values.date}T${values.startTime}:00`;
  const endAt = values.allDay
    ? `${values.date}T23:59:59`
    : `${values.date}T${values.endTime}:00`;
  return {
    integrationId: values.integrationId,
    title: values.title,
    startAt,
    endAt,
    allDay: values.allDay,
    location: values.location || undefined,
    description: values.description || undefined,
    attendees: values.attendees.length > 0
      ? values.attendees.map((email) => ({ email }))
      : undefined,
  };
}

describe('CalendarEventFormSheet logic', () => {
  it('converts timed event form values to CreateCalendarEventInput', () => {
    const result = toCreateEventInput({
      integrationId: 'int-1',
      title: 'Team Standup',
      date: '2026-03-10',
      startTime: '09:00',
      endTime: '09:30',
      allDay: false,
      location: 'Office',
      description: 'Daily standup',
      attendees: ['a@b.com'],
    });
    expect(result.startAt).toBe('2026-03-10T09:00:00');
    expect(result.endAt).toBe('2026-03-10T09:30:00');
    expect(result.allDay).toBe(false);
    expect(result.location).toBe('Office');
    expect(result.attendees).toEqual([{ email: 'a@b.com' }]);
  });

  it('converts all-day event form values', () => {
    const result = toCreateEventInput({
      integrationId: 'int-1',
      title: 'Company Holiday',
      date: '2026-03-20',
      startTime: '',
      endTime: '',
      allDay: true,
      location: '',
      description: '',
      attendees: [],
    });
    expect(result.startAt).toBe('2026-03-20T00:00:00');
    expect(result.endAt).toBe('2026-03-20T23:59:59');
    expect(result.allDay).toBe(true);
    expect(result.location).toBeUndefined();
    expect(result.attendees).toBeUndefined();
  });

  it('omits optional fields when empty', () => {
    const result = toCreateEventInput({
      integrationId: 'int-1',
      title: 'Quick sync',
      date: '2026-03-10',
      startTime: '14:00',
      endTime: '14:30',
      allDay: false,
      location: '',
      description: '',
      attendees: [],
    });
    expect(result.location).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.attendees).toBeUndefined();
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/test/calendar-event-form.test.ts`
Expected: PASS

**Step 3: Write the CalendarEventFormSheet component**

```tsx
// src/components/creative/calendar/CalendarEventFormSheet.tsx
import { useForm, Controller } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CalendarPlus } from 'lucide-react';
import { MultiEmailInput } from '@/components/creative/shared/MultiEmailInput';
import { useCreateCalendarEvent } from '@/hooks/useCreativeCalendarEvents';
import { useIntegrations } from '@/hooks/useIntegrations';
import { format } from 'date-fns';

const CALENDAR_PROVIDERS = new Set(['gmail', 'outlook']);

interface CalendarEventFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EventFormValues {
  integrationId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
  attendees: string[];
}

export function toCreateEventInput(values: EventFormValues) {
  const startAt = values.allDay
    ? `${values.date}T00:00:00`
    : `${values.date}T${values.startTime}:00`;
  const endAt = values.allDay
    ? `${values.date}T23:59:59`
    : `${values.date}T${values.endTime}:00`;
  return {
    integrationId: values.integrationId,
    title: values.title,
    startAt,
    endAt,
    allDay: values.allDay,
    location: values.location || undefined,
    description: values.description || undefined,
    attendees: values.attendees.length > 0
      ? values.attendees.map((email) => ({ email }))
      : undefined,
  };
}

export function CalendarEventFormSheet({ open, onOpenChange }: CalendarEventFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateCalendarEvent();
  const { data: integrations = [] } = useIntegrations();

  const calendarIntegrations = integrations.filter(
    (i) => CALENDAR_PROVIDERS.has(i.provider) && i.status === 'connected' && i.is_enabled,
  );

  const today = format(new Date(), 'yyyy-MM-dd');

  const form = useForm<EventFormValues>({
    defaultValues: {
      integrationId: calendarIntegrations[0]?.id ?? '',
      title: '',
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      allDay: false,
      location: '',
      description: '',
      attendees: [],
    },
  });

  const isAllDay = form.watch('allDay');

  async function onSubmit(values: EventFormValues) {
    try {
      const input = toCreateEventInput(values);
      await createMutation.mutateAsync(input);
      toast({ title: 'Event created' });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New Event</SheetTitle>
          <SheetDescription>Create a calendar event via a connected account.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {calendarIntegrations.length > 1 && (
              <FormField
                control={form.control}
                name="integrationId"
                rules={{ required: 'Select a calendar account' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {calendarIntegrations.map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">All day event</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startTime"
                  rules={{ required: !isAllDay ? 'Start time required' : false }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  rules={{ required: !isAllDay ? 'End time required' : false }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Office, Zoom link, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Event details..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Attendees</label>
                  <MultiEmailInput value={field.value} onChange={field.onChange} placeholder="Add attendee emails" />
                </div>
              )}
            />

            <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
              <CalendarPlus className="h-4 w-4" />
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 4: Update test imports**

Update `src/test/calendar-event-form.test.ts` to import `toCreateEventInput` from the real component.

**Step 5: Run tests**

Run: `npx vitest run src/test/calendar-event-form.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/creative/calendar/CalendarEventFormSheet.tsx src/test/calendar-event-form.test.ts
git commit -m "feat(phase5b): add CalendarEventFormSheet with time/allDay/attendees"
```

---

### Task 5: Update CreativeInbox page

**Files:**
- Modify: `src/pages/creative/CreativeInbox.tsx`

**Step 1: No new test needed — this is wiring existing tested components**

**Step 2: Update CreativeInbox.tsx**

Replace the entire file with:

```tsx
// src/pages/creative/CreativeInbox.tsx
import { useState } from 'react';
import { Mail, Plus } from 'lucide-react';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreativeEmails } from '@/hooks/useCreativeEmails';
import { EMAIL_DIRECTION_LABELS, EMAIL_DIRECTION_COLORS } from '@/types/creative-emails';
import type { CreativeEmail, EmailDirection } from '@/types/creative-emails';
import { formatDistanceToNow } from 'date-fns';
import { Star, Paperclip } from 'lucide-react';
import { EmailComposeSheet } from '@/components/creative/email/EmailComposeSheet';
import { EmailThreadView } from '@/components/creative/email/EmailThreadView';

export default function CreativeInbox() {
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [selectedEmail, setSelectedEmail] = useState<CreativeEmail | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<CreativeEmail | undefined>(undefined);

  const directionFilter: EmailDirection | undefined =
    activeTab === 'all' ? undefined : activeTab;

  const { data: emails = [], isLoading } = useCreativeEmails({
    direction: directionFilter,
    limit: 100,
  });

  function handleReply(email: CreativeEmail) {
    setReplyTo(email);
    setComposeOpen(true);
  }

  function handleCompose() {
    setReplyTo(undefined);
    setComposeOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Email"
      subtitle={`${emails.length} messages`}
      icon={Mail}
    >
      {selectedEmail ? (
        <EmailThreadView
          email={selectedEmail}
          onBack={() => setSelectedEmail(null)}
          onReply={handleReply}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="inbound">Received</TabsTrigger>
                <TabsTrigger value="outbound">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" className="gap-1.5" onClick={handleCompose}>
              <Plus className="h-4 w-4" /> Compose
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p>No emails synced yet.</p>
              <p className="text-sm">Connect a Gmail or Outlook account in Integrations to start syncing.</p>
            </div>
          ) : (
            <div className="divide-y">
              {emails.map((email) => (
                <EmailRow key={email.id} email={email} onClick={() => setSelectedEmail(email)} />
              ))}
            </div>
          )}
        </div>
      )}

      <EmailComposeSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        replyTo={replyTo}
      />
    </WorkspaceContainer>
  );
}

function EmailRow({ email, onClick }: { email: CreativeEmail; onClick: () => void }) {
  const dirColors = EMAIL_DIRECTION_COLORS[email.direction];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className={`flex items-start gap-3 py-3 px-2 hover:bg-muted/50 rounded cursor-pointer ${
        !email.isRead ? 'font-semibold' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm truncate">
            {email.direction === 'inbound'
              ? email.fromName || email.fromAddress
              : email.toAddresses.map((a) => a.name || a.email).join(', ')}
          </span>
          <Badge variant="outline" className={`text-xs ${dirColors.bg} ${dirColors.text}`}>
            {EMAIL_DIRECTION_LABELS[email.direction]}
          </Badge>
          {email.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
          {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
        </div>
        <p className="text-sm truncate">{email.subject || '(No subject)'}</p>
        <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
      </span>
    </div>
  );
}
```

**Step 3: Run build check**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/creative/CreativeInbox.tsx
git commit -m "feat(phase5b): wire compose, reply, thread view into CreativeInbox"
```

---

### Task 6: Update CreativeCalendar page

**Files:**
- Modify: `src/pages/creative/CreativeCalendar.tsx`

**Step 1: Update CreativeCalendar.tsx**

Add the "New Event" button and CalendarEventFormSheet. Changes:

1. Import `CalendarEventFormSheet` and `Plus` icon
2. Add `eventFormOpen` state
3. Add "New Event" button in header next to month navigation
4. Render `CalendarEventFormSheet`

The key additions to the existing file:

```tsx
// At top - add imports:
import { CalendarEventFormSheet } from '@/components/creative/calendar/CalendarEventFormSheet';
import { Plus } from 'lucide-react';

// Inside component - add state:
const [eventFormOpen, setEventFormOpen] = useState(false);

// In the header bar (after the Today button) - add New Event button:
<Button size="sm" className="gap-1.5 ml-auto" onClick={() => setEventFormOpen(true)}>
  <Plus className="h-4 w-4" /> New Event
</Button>

// After the closing </WorkspaceContainer> wrapper - add the Sheet:
<CalendarEventFormSheet open={eventFormOpen} onOpenChange={setEventFormOpen} />
```

**Step 2: Run build check**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/creative/CreativeCalendar.tsx
git commit -m "feat(phase5b): add New Event button and CalendarEventFormSheet to calendar"
```

---

### Task 7: Full verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: PASS (all existing + new tests)

**Step 2: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS

**Step 4: Run CI checks**

Run: `npm run check:security && npm run check:migrations && npm run check:design-system`
Expected: PASS

**Step 5: Final commit if any fixups needed, then push**

```bash
git push origin main
```
