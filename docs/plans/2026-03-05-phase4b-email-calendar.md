# Phase 4B: Email & Calendar Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sync emails and calendar events from Gmail/Outlook/IMAP into the CRM, with entity auto-matching, send/create capabilities, and inbox/calendar UI pages.

**Architecture:** Hybrid sync — cron edge functions pull data into local Supabase tables for fast reads; POST edge functions handle writes (send email, create event). Entity auto-matching links messages and events to contacts/clients by email address and domain.

**Tech Stack:** Supabase (Postgres, Edge Functions, RLS, Realtime), Deno, Gmail API, Microsoft Graph, IMAP/SMTP, React + TanStack Query, Tailwind CSS, Vitest.

---

## Task 1: Database Migration — Email Tables

**Files:**
- Create: `supabase/migrations/20260312100000_creative_emails.sql`

**Step 1: Write the migration file**

```sql
-- creative_emails: synced email messages linked to org + entities
CREATE TABLE creative_emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'email_imap')),
  message_id      text NOT NULL,
  thread_id       text,
  subject         text,
  from_address    text NOT NULL,
  from_name       text,
  to_addresses    jsonb NOT NULL DEFAULT '[]',
  cc_addresses    jsonb NOT NULL DEFAULT '[]',
  bcc_addresses   jsonb NOT NULL DEFAULT '[]',
  body_text       text,
  body_html       text,
  snippet         text,
  labels          text[] NOT NULL DEFAULT '{}',
  is_read         boolean NOT NULL DEFAULT false,
  is_starred      boolean NOT NULL DEFAULT false,
  is_draft        boolean NOT NULL DEFAULT false,
  direction       text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sent_at         timestamptz NOT NULL,
  has_attachments boolean NOT NULL DEFAULT false,
  raw_headers     jsonb,
  entity_type     text,
  entity_id       uuid,
  matched_by      text CHECK (matched_by IN ('auto_email', 'auto_domain', 'manual')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, message_id)
);

CREATE INDEX idx_creative_emails_org_entity
  ON creative_emails(organization_id, entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE INDEX idx_creative_emails_org_sent
  ON creative_emails(organization_id, sent_at DESC);

CREATE INDEX idx_creative_emails_thread
  ON creative_emails(organization_id, thread_id)
  WHERE thread_id IS NOT NULL;

-- creative_email_attachments: metadata for email attachments
CREATE TABLE creative_email_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id        uuid NOT NULL REFERENCES creative_emails(id) ON DELETE CASCADE,
  filename        text NOT NULL,
  content_type    text,
  size_bytes      integer,
  storage_path    text,
  provider_ref    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_email_attachments_email
  ON creative_email_attachments(email_id);

-- RLS
ALTER TABLE creative_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their emails"
  ON creative_emails FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert emails"
  ON creative_emails FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update emails"
  ON creative_emails FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can delete emails"
  ON creative_emails FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org members can view email attachments"
  ON creative_email_attachments FOR SELECT
  USING (
    email_id IN (
      SELECT e.id FROM creative_emails e
      WHERE e.organization_id IN (
        SELECT om.organization_id FROM organization_members om
        WHERE om.user_id = auth.uid()
      )
    )
  );

-- Updated-at trigger (reuse existing function)
CREATE TRIGGER update_creative_emails_updated_at
  BEFORE UPDATE ON creative_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Verify the migration applies cleanly**

Run: `npx supabase db reset --local 2>&1 | tail -20`
Expected: Migrations apply without errors.

**Step 3: Commit**

```bash
git add supabase/migrations/20260312100000_creative_emails.sql
git commit -m "feat: add creative_emails + attachments migration with RLS"
```

---

## Task 2: Database Migration — Calendar Events Table

**Files:**
- Create: `supabase/migrations/20260312100001_creative_calendar_events.sql`

**Step 1: Write the migration file**

```sql
-- creative_calendar_events: synced calendar events linked to org + entities
CREATE TABLE creative_calendar_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id    uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  provider          text NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  provider_event_id text NOT NULL,
  calendar_id       text NOT NULL DEFAULT 'primary',
  title             text NOT NULL,
  description       text,
  location          text,
  start_at          timestamptz NOT NULL,
  end_at            timestamptz NOT NULL,
  all_day           boolean NOT NULL DEFAULT false,
  status            text NOT NULL CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  organizer_email   text,
  organizer_name    text,
  attendees         jsonb NOT NULL DEFAULT '[]',
  recurrence        text[],
  html_link         text,
  color_id          text,
  entity_type       text,
  entity_id         uuid,
  matched_by        text CHECK (matched_by IN ('auto_email', 'auto_domain', 'manual')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, provider_event_id)
);

CREATE INDEX idx_creative_calendar_events_org_range
  ON creative_calendar_events(organization_id, start_at, end_at);

CREATE INDEX idx_creative_calendar_events_org_entity
  ON creative_calendar_events(organization_id, entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

-- RLS
ALTER TABLE creative_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view calendar events"
  ON creative_calendar_events FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert calendar events"
  ON creative_calendar_events FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update calendar events"
  ON creative_calendar_events FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can delete calendar events"
  ON creative_calendar_events FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- Updated-at trigger
CREATE TRIGGER update_creative_calendar_events_updated_at
  BEFORE UPDATE ON creative_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Verify migration**

Run: `npx supabase db reset --local 2>&1 | tail -20`
Expected: All migrations apply cleanly.

**Step 3: Commit**

```bash
git add supabase/migrations/20260312100001_creative_calendar_events.sql
git commit -m "feat: add creative_calendar_events migration with RLS"
```

---

## Task 3: Provider Registry — Add Calendar Scopes

**Files:**
- Modify: `supabase/functions/_shared/provider-registry.ts` (gmail + outlook entries)

**Step 1: Add calendar scopes to Gmail provider**

In `supabase/functions/_shared/provider-registry.ts`, update the Gmail `scopes` array:

```typescript
// In the gmail entry, replace the scopes array:
scopes: [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
],
```

**Step 2: Add calendar scope to Outlook provider**

In the same file, update the Outlook `scopes` array:

```typescript
// In the outlook entry, replace the scopes array:
scopes: [
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Calendars.ReadWrite',
  'offline_access',
],
```

**Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit --project supabase/functions/tsconfig.json 2>&1 | head -20` (or just visually verify — Deno imports don't use tsconfig)

**Step 4: Commit**

```bash
git add supabase/functions/_shared/provider-registry.ts
git commit -m "feat: add calendar OAuth scopes to Gmail and Outlook providers"
```

---

## Task 4: Frontend Types — Email & Calendar

**Files:**
- Create: `src/types/creative-emails.ts`
- Create: `src/types/creative-calendar.ts`

**Step 1: Create email types**

Create `src/types/creative-emails.ts`:

```typescript
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
```

**Step 2: Create calendar types**

Create `src/types/creative-calendar.ts`:

```typescript
export const CALENDAR_PROVIDERS = ['gmail', 'outlook'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

export const CALENDAR_EVENT_STATUSES = ['confirmed', 'tentative', 'cancelled'] as const;
export type CalendarEventStatus = (typeof CALENDAR_EVENT_STATUSES)[number];

export const CALENDAR_MATCH_TYPES = ['auto_email', 'auto_domain', 'manual'] as const;
export type CalendarMatchType = (typeof CALENDAR_MATCH_TYPES)[number];

export interface CalendarAttendee {
  email: string;
  name?: string;
  status?: string;
}

export interface CreativeCalendarEvent {
  id: string;
  organizationId: string;
  integrationId: string;
  provider: CalendarProvider;
  providerEventId: string;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: CalendarEventStatus;
  organizerEmail: string | null;
  organizerName: string | null;
  attendees: CalendarAttendee[];
  recurrence: string[] | null;
  htmlLink: string | null;
  colorId: string | null;
  entityType: string | null;
  entityId: string | null;
  matchedBy: CalendarMatchType | null;
  createdAt: string;
  updatedAt: string;
}

export const CALENDAR_STATUS_LABELS: Record<CalendarEventStatus, string> = {
  confirmed: 'Confirmed',
  tentative: 'Tentative',
  cancelled: 'Cancelled',
};

export const CALENDAR_STATUS_COLORS: Record<CalendarEventStatus, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  tentative: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

export const CALENDAR_PROVIDER_LABELS: Record<CalendarProvider, string> = {
  gmail: 'Google Calendar',
  outlook: 'Outlook Calendar',
};
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to new type files.

**Step 4: Commit**

```bash
git add src/types/creative-emails.ts src/types/creative-calendar.ts
git commit -m "feat: add email and calendar frontend types"
```

---

## Task 5: Edge Function — Email Sync (Cron)

**Files:**
- Create: `supabase/functions/email-sync/index.ts`

This is the cron-based sync function that pulls new emails from Gmail, Outlook, and IMAP into `creative_emails`.

**Step 1: Create the edge function**

Create `supabase/functions/email-sync/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: 'email-sync', error: 'missing_config' });
    return new Response(JSON.stringify({ error: 'Missing service config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all active email integrations
  const { data: integrations, error: intError } = await supabase
    .from('integration_connections')
    .select('id, organization_id, provider, metadata, last_sync_at')
    .in('provider', ['gmail', 'outlook', 'email_imap'])
    .eq('status', 'active');

  if (intError) {
    logEdgeEvent('error', { fn: 'email-sync', error: intError.message });
    return new Response(JSON.stringify({ error: intError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let synced = 0;
  let errors = 0;

  for (const integration of integrations ?? []) {
    try {
      const { metadata } = await resolveCredentials(
        supabase,
        integration.provider,
        integration.id,
        { ...(integration.metadata ?? {}), _organization_id: integration.organization_id },
      );

      const sinceDate = integration.last_sync_at
        ? new Date(integration.last_sync_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days

      let messages: RawEmail[] = [];

      if (integration.provider === 'gmail') {
        messages = await fetchGmailMessages(metadata, sinceDate);
      } else if (integration.provider === 'outlook') {
        messages = await fetchOutlookMessages(metadata, sinceDate);
      }
      // IMAP sync deferred to future iteration

      for (const msg of messages) {
        const entityMatch = await matchEntity(supabase, integration.organization_id, msg);

        await supabase.from('creative_emails').upsert(
          {
            organization_id: integration.organization_id,
            integration_id: integration.id,
            provider: integration.provider,
            message_id: msg.messageId,
            thread_id: msg.threadId ?? null,
            subject: msg.subject ?? null,
            from_address: msg.fromAddress,
            from_name: msg.fromName ?? null,
            to_addresses: msg.toAddresses,
            cc_addresses: msg.ccAddresses ?? [],
            bcc_addresses: msg.bccAddresses ?? [],
            body_text: msg.bodyText ?? null,
            body_html: msg.bodyHtml ?? null,
            snippet: msg.snippet ?? null,
            labels: msg.labels ?? [],
            is_read: msg.isRead ?? false,
            is_starred: msg.isStarred ?? false,
            is_draft: msg.isDraft ?? false,
            direction: msg.direction,
            sent_at: msg.sentAt,
            has_attachments: msg.hasAttachments ?? false,
            entity_type: entityMatch?.entityType ?? null,
            entity_id: entityMatch?.entityId ?? null,
            matched_by: entityMatch?.matchedBy ?? null,
          },
          { onConflict: 'organization_id,provider,message_id' },
        );
      }

      // Update last_sync_at
      await supabase
        .from('integration_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      synced += messages.length;
      logEdgeEvent('info', {
        fn: 'email-sync',
        integration_id: integration.id,
        provider: integration.provider,
        messages_synced: messages.length,
      });
    } catch (err) {
      errors++;
      const errMsg = err instanceof Error ? err.message : String(err);
      logEdgeEvent('error', {
        fn: 'email-sync',
        integration_id: integration.id,
        provider: integration.provider,
        error: errMsg,
      });

      // Mark integration as errored
      await supabase
        .from('integration_connections')
        .update({ status: 'error', last_error: errMsg })
        .eq('id', integration.id);
    }
  }

  logEdgeEvent('info', { fn: 'email-sync', synced, errors, integrations: (integrations ?? []).length });

  return new Response(JSON.stringify({ synced, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawEmail {
  messageId: string;
  threadId?: string;
  subject?: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: Array<{ email: string; name?: string }>;
  ccAddresses?: Array<{ email: string; name?: string }>;
  bccAddresses?: Array<{ email: string; name?: string }>;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  isDraft?: boolean;
  direction: 'inbound' | 'outbound';
  sentAt: string;
  hasAttachments?: boolean;
}

interface EntityMatch {
  entityType: string;
  entityId: string;
  matchedBy: 'auto_email' | 'auto_domain';
}

// ---------------------------------------------------------------------------
// Gmail API fetch
// ---------------------------------------------------------------------------

async function fetchGmailMessages(
  metadata: Record<string, unknown>,
  since: Date,
): Promise<RawEmail[]> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) return [];

  const afterEpoch = Math.floor(since.getTime() / 1000);
  const query = `after:${afterEpoch}`;

  // List message IDs
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`);
  }

  const listBody = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
  if (!listBody.messages?.length) return [];

  const results: RawEmail[] = [];

  for (const ref of listBody.messages) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!msgRes.ok) continue;

    const msg = await msgRes.json() as GmailMessage;
    const parsed = parseGmailMessage(msg, metadata.gmail_account_email as string);
    if (parsed) results.push(parsed);
  }

  return results;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      filename?: string;
    }>;
  };
  internalDate: string;
}

function parseGmailMessage(msg: GmailMessage, accountEmail: string): RawEmail | null {
  const headers = msg.payload.headers;
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

  const from = getHeader('From');
  const to = getHeader('To');
  const cc = getHeader('Cc');
  const subject = getHeader('Subject');

  const fromParsed = parseEmailHeader(from);
  const toParsed = parseEmailList(to);
  const ccParsed = parseEmailList(cc);

  // Determine direction
  const fromEmail = fromParsed.email.toLowerCase();
  const direction: 'inbound' | 'outbound' =
    fromEmail === accountEmail?.toLowerCase() ? 'outbound' : 'inbound';

  // Extract body
  let bodyText = '';
  let bodyHtml = '';

  if (msg.payload.parts) {
    for (const part of msg.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = base64UrlDecode(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = base64UrlDecode(part.body.data);
      }
    }
  } else if (msg.payload.body?.data) {
    if (msg.payload.mimeType === 'text/html') {
      bodyHtml = base64UrlDecode(msg.payload.body.data);
    } else {
      bodyText = base64UrlDecode(msg.payload.body.data);
    }
  }

  const hasAttachments = (msg.payload.parts ?? []).some((p) => !!p.filename);

  return {
    messageId: msg.id,
    threadId: msg.threadId,
    subject: subject || null,
    fromAddress: fromParsed.email,
    fromName: fromParsed.name || undefined,
    toAddresses: toParsed,
    ccAddresses: ccParsed,
    bodyText: bodyText || undefined,
    bodyHtml: bodyHtml || undefined,
    snippet: msg.snippet ?? undefined,
    labels: msg.labelIds ?? [],
    isRead: !(msg.labelIds ?? []).includes('UNREAD'),
    isStarred: (msg.labelIds ?? []).includes('STARRED'),
    isDraft: (msg.labelIds ?? []).includes('DRAFT'),
    direction,
    sentAt: new Date(parseInt(msg.internalDate, 10)).toISOString(),
    hasAttachments,
  };
}

// ---------------------------------------------------------------------------
// Outlook / Microsoft Graph fetch
// ---------------------------------------------------------------------------

async function fetchOutlookMessages(
  metadata: Record<string, unknown>,
  since: Date,
): Promise<RawEmail[]> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) return [];

  const sinceISO = since.toISOString();
  const url =
    `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${sinceISO}&$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,toRecipients,ccRecipients,bccRecipients,body,bodyPreview,isRead,isDraft,hasAttachments,receivedDateTime,flag,categories`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Outlook list failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json() as { value?: OutlookMessage[] };
  const accountEmail = (metadata.outlook_account_email as string) ?? '';

  return (body.value ?? []).map((msg) => parseOutlookMessage(msg, accountEmail));
}

interface OutlookMessage {
  id: string;
  conversationId?: string;
  subject?: string;
  from?: { emailAddress: { address: string; name?: string } };
  toRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  ccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  bccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  body?: { contentType: string; content: string };
  bodyPreview?: string;
  isRead?: boolean;
  isDraft?: boolean;
  hasAttachments?: boolean;
  receivedDateTime: string;
  flag?: { flagStatus?: string };
  categories?: string[];
}

function parseOutlookMessage(msg: OutlookMessage, accountEmail: string): RawEmail {
  const fromEmail = msg.from?.emailAddress?.address ?? '';
  const direction: 'inbound' | 'outbound' =
    fromEmail.toLowerCase() === accountEmail.toLowerCase() ? 'outbound' : 'inbound';

  return {
    messageId: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject,
    fromAddress: fromEmail,
    fromName: msg.from?.emailAddress?.name,
    toAddresses: (msg.toRecipients ?? []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    ccAddresses: (msg.ccRecipients ?? []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    bccAddresses: (msg.bccRecipients ?? []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    bodyText: msg.body?.contentType === 'text' ? msg.body.content : undefined,
    bodyHtml: msg.body?.contentType === 'html' ? msg.body.content : undefined,
    snippet: msg.bodyPreview,
    labels: msg.categories ?? [],
    isRead: msg.isRead ?? false,
    isStarred: msg.flag?.flagStatus === 'flagged',
    isDraft: msg.isDraft ?? false,
    direction,
    sentAt: msg.receivedDateTime,
    hasAttachments: msg.hasAttachments ?? false,
  };
}

// ---------------------------------------------------------------------------
// Entity auto-matching
// ---------------------------------------------------------------------------

async function matchEntity(
  supabase: any,
  organizationId: string,
  email: RawEmail,
): Promise<EntityMatch | null> {
  // Collect all email addresses from this message
  const allAddresses = [
    email.fromAddress,
    ...email.toAddresses.map((a) => a.email),
    ...(email.ccAddresses ?? []).map((a) => a.email),
  ].filter(Boolean);

  for (const addr of allAddresses) {
    // 1. Exact contact email match
    const { data: contact } = await supabase
      .from('creative_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', addr.toLowerCase())
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    // 2. Domain match against clients
    const domain = addr.split('@')[1]?.toLowerCase();
    if (domain) {
      const { data: client } = await supabase
        .from('creative_clients')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('domain', domain)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (client) {
        return { entityType: 'client', entityId: client.id, matchedBy: 'auto_domain' };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseEmailHeader(raw: string): { email: string; name?: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
  }
  return { email: raw.trim() };
}

function parseEmailList(raw: string): Array<{ email: string; name?: string }> {
  if (!raw) return [];
  return raw.split(',').map((s) => parseEmailHeader(s.trim())).filter((e) => e.email);
}

function base64UrlDecode(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return atob(base64);
  } catch {
    return '';
  }
}
```

**Step 2: Verify edge function structure**

Run: `ls supabase/functions/email-sync/`
Expected: `index.ts` exists.

**Step 3: Commit**

```bash
git add supabase/functions/email-sync/index.ts
git commit -m "feat: add email-sync cron edge function for Gmail and Outlook"
```

---

## Task 6: Edge Function — Email Send (POST)

**Files:**
- Create: `supabase/functions/email-send/index.ts`

**Step 1: Create the edge function**

Create `supabase/functions/email-send/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

function jsonResponse(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...makeCorsHeaders(origin) },
  });
}

serve(async (req) => {
  // CORS preflight
  const corsResult = handleCors(req);
  if (corsResult) return corsResult;

  const origin = req.headers.get('Origin') || '';

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing service config' }, 500, origin);
  }

  // Auth: extract user JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify user
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: SendEmailRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const { integrationId, to, cc, bcc, subject, bodyHtml, replyToMessageId } = body;

  if (!integrationId || !to?.length || !subject) {
    return jsonResponse({ error: 'Missing required fields: integrationId, to, subject' }, 400, origin);
  }

  // Load integration
  const { data: integration, error: intError } = await supabaseAdmin
    .from('integration_connections')
    .select('id, organization_id, provider, metadata')
    .eq('id', integrationId)
    .single();

  if (intError || !integration) {
    return jsonResponse({ error: 'Integration not found' }, 404, origin);
  }

  // Verify user belongs to org
  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', integration.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return jsonResponse({ error: 'Access denied' }, 403, origin);
  }

  try {
    const { metadata } = await resolveCredentials(
      supabaseAdmin,
      integration.provider,
      integration.id,
      { ...(integration.metadata ?? {}), _organization_id: integration.organization_id },
    );

    let sentMessageId: string;

    if (integration.provider === 'gmail') {
      sentMessageId = await sendViaGmail(metadata, { to, cc, bcc, subject, bodyHtml, replyToMessageId });
    } else if (integration.provider === 'outlook') {
      sentMessageId = await sendViaOutlook(metadata, { to, cc, bcc, subject, bodyHtml, replyToMessageId });
    } else {
      return jsonResponse({ error: 'SMTP send not yet supported' }, 501, origin);
    }

    // Insert sent message into creative_emails
    const entityMatch = await matchEntityFromAddresses(
      supabaseAdmin,
      integration.organization_id,
      to,
    );

    await supabaseAdmin.from('creative_emails').insert({
      organization_id: integration.organization_id,
      integration_id: integration.id,
      provider: integration.provider,
      message_id: sentMessageId,
      subject,
      from_address: (metadata[`${integration.provider}_account_email`] as string) ?? '',
      to_addresses: to.map((email: string) => ({ email })),
      cc_addresses: (cc ?? []).map((email: string) => ({ email })),
      bcc_addresses: (bcc ?? []).map((email: string) => ({ email })),
      body_html: bodyHtml ?? null,
      direction: 'outbound',
      sent_at: new Date().toISOString(),
      entity_type: entityMatch?.entityType ?? null,
      entity_id: entityMatch?.entityId ?? null,
      matched_by: entityMatch?.matchedBy ?? null,
    });

    logEdgeEvent('info', { fn: 'email-send', provider: integration.provider, to_count: to.length });

    return jsonResponse({ success: true, messageId: sentMessageId }, 200, origin);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logEdgeEvent('error', { fn: 'email-send', error: errMsg });
    return jsonResponse({ error: errMsg }, 500, origin);
  }
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendEmailRequest {
  integrationId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  replyToMessageId?: string;
}

interface SendParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  replyToMessageId?: string;
}

// ---------------------------------------------------------------------------
// Gmail send
// ---------------------------------------------------------------------------

async function sendViaGmail(metadata: Record<string, unknown>, params: SendParams): Promise<string> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) throw new Error('Gmail access token not available');

  const rawEmail = buildMimeMessage(
    metadata.gmail_account_email as string,
    params,
  );

  const encoded = btoa(rawEmail).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const url = params.replyToMessageId
    ? `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
    : `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`;

  const body: Record<string, unknown> = { raw: encoded };
  if (params.replyToMessageId) {
    body.threadId = params.replyToMessageId;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status} ${await res.text()}`);
  }

  const result = await res.json() as { id: string };
  return result.id;
}

// ---------------------------------------------------------------------------
// Outlook send
// ---------------------------------------------------------------------------

async function sendViaOutlook(metadata: Record<string, unknown>, params: SendParams): Promise<string> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) throw new Error('Outlook access token not available');

  const message: Record<string, unknown> = {
    subject: params.subject,
    body: {
      contentType: 'html',
      content: params.bodyHtml ?? '',
    },
    toRecipients: params.to.map((email) => ({
      emailAddress: { address: email },
    })),
  };

  if (params.cc?.length) {
    message.ccRecipients = params.cc.map((email) => ({
      emailAddress: { address: email },
    }));
  }

  if (params.bcc?.length) {
    message.bccRecipients = params.bcc.map((email) => ({
      emailAddress: { address: email },
    }));
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!res.ok) {
    throw new Error(`Outlook send failed: ${res.status} ${await res.text()}`);
  }

  // Outlook sendMail returns 202 with no body; generate a client-side ID
  return `outlook-sent-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMimeMessage(from: string, params: SendParams): string {
  const lines: string[] = [];
  lines.push(`From: ${from}`);
  lines.push(`To: ${params.to.join(', ')}`);
  if (params.cc?.length) lines.push(`Cc: ${params.cc.join(', ')}`);
  if (params.bcc?.length) lines.push(`Bcc: ${params.bcc.join(', ')}`);
  lines.push(`Subject: ${params.subject}`);
  lines.push('MIME-Version: 1.0');
  lines.push('Content-Type: text/html; charset=UTF-8');
  lines.push('');
  lines.push(params.bodyHtml ?? '');
  return lines.join('\r\n');
}

async function matchEntityFromAddresses(
  supabase: any,
  organizationId: string,
  addresses: string[],
): Promise<{ entityType: string; entityId: string; matchedBy: 'auto_email' | 'auto_domain' } | null> {
  for (const addr of addresses) {
    const { data: contact } = await supabase
      .from('creative_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', addr.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    const domain = addr.split('@')[1]?.toLowerCase();
    if (domain) {
      const { data: client } = await supabase
        .from('creative_clients')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('domain', domain)
        .limit(1)
        .maybeSingle();

      if (client) {
        return { entityType: 'client', entityId: client.id, matchedBy: 'auto_domain' };
      }
    }
  }
  return null;
}
```

**Step 2: Verify file exists**

Run: `ls supabase/functions/email-send/`
Expected: `index.ts` exists.

**Step 3: Commit**

```bash
git add supabase/functions/email-send/index.ts
git commit -m "feat: add email-send POST edge function for Gmail and Outlook"
```

---

## Task 7: Edge Function — Calendar Sync (Cron)

**Files:**
- Create: `supabase/functions/calendar-sync/index.ts`

**Step 1: Create the edge function**

Create `supabase/functions/calendar-sync/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: 'calendar-sync', error: 'missing_config' });
    return new Response(JSON.stringify({ error: 'Missing service config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all active Gmail/Outlook integrations (calendar uses same OAuth as email)
  const { data: integrations, error: intError } = await supabase
    .from('integration_connections')
    .select('id, organization_id, provider, metadata, last_sync_at')
    .in('provider', ['gmail', 'outlook'])
    .eq('status', 'active');

  if (intError) {
    logEdgeEvent('error', { fn: 'calendar-sync', error: intError.message });
    return new Response(JSON.stringify({ error: intError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let synced = 0;
  let errors = 0;

  for (const integration of integrations ?? []) {
    try {
      const { metadata } = await resolveCredentials(
        supabase,
        integration.provider,
        integration.id,
        { ...(integration.metadata ?? {}), _organization_id: integration.organization_id },
      );

      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // past 7 days
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // next 30 days

      let events: RawCalendarEvent[] = [];

      if (integration.provider === 'gmail') {
        events = await fetchGoogleCalendarEvents(metadata, timeMin, timeMax);
      } else if (integration.provider === 'outlook') {
        events = await fetchOutlookCalendarEvents(metadata, timeMin, timeMax);
      }

      for (const evt of events) {
        const entityMatch = await matchEntityFromAttendees(
          supabase,
          integration.organization_id,
          evt.attendees ?? [],
        );

        await supabase.from('creative_calendar_events').upsert(
          {
            organization_id: integration.organization_id,
            integration_id: integration.id,
            provider: integration.provider,
            provider_event_id: evt.providerEventId,
            calendar_id: evt.calendarId ?? 'primary',
            title: evt.title,
            description: evt.description ?? null,
            location: evt.location ?? null,
            start_at: evt.startAt,
            end_at: evt.endAt,
            all_day: evt.allDay ?? false,
            status: evt.status,
            organizer_email: evt.organizerEmail ?? null,
            organizer_name: evt.organizerName ?? null,
            attendees: evt.attendees ?? [],
            recurrence: evt.recurrence ?? null,
            html_link: evt.htmlLink ?? null,
            color_id: evt.colorId ?? null,
            entity_type: entityMatch?.entityType ?? null,
            entity_id: entityMatch?.entityId ?? null,
            matched_by: entityMatch?.matchedBy ?? null,
          },
          { onConflict: 'organization_id,provider,provider_event_id' },
        );
      }

      synced += events.length;
      logEdgeEvent('info', {
        fn: 'calendar-sync',
        integration_id: integration.id,
        provider: integration.provider,
        events_synced: events.length,
      });
    } catch (err) {
      errors++;
      const errMsg = err instanceof Error ? err.message : String(err);
      logEdgeEvent('error', {
        fn: 'calendar-sync',
        integration_id: integration.id,
        provider: integration.provider,
        error: errMsg,
      });

      await supabase
        .from('integration_connections')
        .update({ status: 'error', last_error: errMsg })
        .eq('id', integration.id);
    }
  }

  logEdgeEvent('info', { fn: 'calendar-sync', synced, errors, integrations: (integrations ?? []).length });

  return new Response(JSON.stringify({ synced, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawCalendarEvent {
  providerEventId: string;
  calendarId?: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  organizerEmail?: string;
  organizerName?: string;
  attendees?: Array<{ email: string; name?: string; status?: string }>;
  recurrence?: string[];
  htmlLink?: string;
  colorId?: string;
}

// ---------------------------------------------------------------------------
// Google Calendar API
// ---------------------------------------------------------------------------

async function fetchGoogleCalendarEvents(
  metadata: Record<string, unknown>,
  timeMin: Date,
  timeMax: Date,
): Promise<RawCalendarEvent[]> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) return [];

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '100',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Google Calendar list failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json() as { items?: GoogleCalendarEvent[] };

  return (body.items ?? []).map((item): RawCalendarEvent => {
    const isAllDay = !!item.start?.date;
    return {
      providerEventId: item.id,
      title: item.summary ?? '(No title)',
      description: item.description,
      location: item.location,
      startAt: item.start?.dateTime ?? `${item.start?.date}T00:00:00Z`,
      endAt: item.end?.dateTime ?? `${item.end?.date}T00:00:00Z`,
      allDay: isAllDay,
      status: mapGoogleStatus(item.status),
      organizerEmail: item.organizer?.email,
      organizerName: item.organizer?.displayName,
      attendees: (item.attendees ?? []).map((a) => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus,
      })),
      recurrence: item.recurrence,
      htmlLink: item.htmlLink,
      colorId: item.colorId,
    };
  });
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  recurrence?: string[];
  htmlLink?: string;
  colorId?: string;
}

function mapGoogleStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
  if (status === 'tentative') return 'tentative';
  if (status === 'cancelled') return 'cancelled';
  return 'confirmed';
}

// ---------------------------------------------------------------------------
// Outlook Calendar API
// ---------------------------------------------------------------------------

async function fetchOutlookCalendarEvents(
  metadata: Record<string, unknown>,
  timeMin: Date,
  timeMax: Date,
): Promise<RawCalendarEvent[]> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) return [];

  const url =
    `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${timeMin.toISOString()}&endDateTime=${timeMax.toISOString()}&$top=100&$select=id,subject,body,location,start,end,isAllDay,showAs,organizer,attendees,recurrence,webLink`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  });

  if (!res.ok) {
    throw new Error(`Outlook Calendar list failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json() as { value?: OutlookCalendarEvent[] };

  return (body.value ?? []).map((item): RawCalendarEvent => ({
    providerEventId: item.id,
    title: item.subject ?? '(No title)',
    description: item.body?.content,
    location: item.location?.displayName,
    startAt: item.start?.dateTime ? `${item.start.dateTime}Z` : new Date().toISOString(),
    endAt: item.end?.dateTime ? `${item.end.dateTime}Z` : new Date().toISOString(),
    allDay: item.isAllDay ?? false,
    status: mapOutlookStatus(item.showAs),
    organizerEmail: item.organizer?.emailAddress?.address,
    organizerName: item.organizer?.emailAddress?.name,
    attendees: (item.attendees ?? []).map((a) => ({
      email: a.emailAddress?.address ?? '',
      name: a.emailAddress?.name,
      status: a.status?.response,
    })),
    htmlLink: item.webLink,
  }));
}

interface OutlookCalendarEvent {
  id: string;
  subject?: string;
  body?: { contentType?: string; content?: string };
  location?: { displayName?: string };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isAllDay?: boolean;
  showAs?: string;
  organizer?: { emailAddress?: { address?: string; name?: string } };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    status?: { response?: string };
  }>;
  recurrence?: unknown;
  webLink?: string;
}

function mapOutlookStatus(showAs?: string): 'confirmed' | 'tentative' | 'cancelled' {
  if (showAs === 'tentative') return 'tentative';
  if (showAs === 'free') return 'cancelled';
  return 'confirmed';
}

// ---------------------------------------------------------------------------
// Entity matching from attendees
// ---------------------------------------------------------------------------

async function matchEntityFromAttendees(
  supabase: any,
  organizationId: string,
  attendees: Array<{ email: string; name?: string; status?: string }>,
): Promise<{ entityType: string; entityId: string; matchedBy: 'auto_email' | 'auto_domain' } | null> {
  for (const attendee of attendees) {
    const { data: contact } = await supabase
      .from('creative_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', attendee.email.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    const domain = attendee.email.split('@')[1]?.toLowerCase();
    if (domain) {
      const { data: client } = await supabase
        .from('creative_clients')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('domain', domain)
        .limit(1)
        .maybeSingle();

      if (client) {
        return { entityType: 'client', entityId: client.id, matchedBy: 'auto_domain' };
      }
    }
  }
  return null;
}
```

**Step 2: Verify file exists**

Run: `ls supabase/functions/calendar-sync/`
Expected: `index.ts` exists.

**Step 3: Commit**

```bash
git add supabase/functions/calendar-sync/index.ts
git commit -m "feat: add calendar-sync cron edge function for Google and Outlook"
```

---

## Task 8: Edge Function — Calendar Event Create (POST)

**Files:**
- Create: `supabase/functions/calendar-event-create/index.ts`

**Step 1: Create the edge function**

Create `supabase/functions/calendar-event-create/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

function jsonResponse(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...makeCorsHeaders(origin) },
  });
}

serve(async (req) => {
  const corsResult = handleCors(req);
  if (corsResult) return corsResult;

  const origin = req.headers.get('Origin') || '';

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing service config' }, 500, origin);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: CreateEventRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const { integrationId, title, description, location, startAt, endAt, attendees, allDay } = body;

  if (!integrationId || !title || !startAt || !endAt) {
    return jsonResponse({ error: 'Missing required fields: integrationId, title, startAt, endAt' }, 400, origin);
  }

  const { data: integration, error: intError } = await supabaseAdmin
    .from('integration_connections')
    .select('id, organization_id, provider, metadata')
    .eq('id', integrationId)
    .single();

  if (intError || !integration) {
    return jsonResponse({ error: 'Integration not found' }, 404, origin);
  }

  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', integration.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return jsonResponse({ error: 'Access denied' }, 403, origin);
  }

  try {
    const { metadata } = await resolveCredentials(
      supabaseAdmin,
      integration.provider,
      integration.id,
      { ...(integration.metadata ?? {}), _organization_id: integration.organization_id },
    );

    let providerEventId: string;
    let htmlLink: string | null = null;

    if (integration.provider === 'gmail') {
      const result = await createGoogleCalendarEvent(metadata, body);
      providerEventId = result.id;
      htmlLink = result.htmlLink ?? null;
    } else if (integration.provider === 'outlook') {
      const result = await createOutlookCalendarEvent(metadata, body);
      providerEventId = result.id;
      htmlLink = result.webLink ?? null;
    } else {
      return jsonResponse({ error: 'Calendar not supported for this provider' }, 400, origin);
    }

    // Match entity from attendees
    let entityMatch: { entityType: string; entityId: string; matchedBy: string } | null = null;
    if (attendees?.length) {
      for (const att of attendees) {
        const { data: contact } = await supabaseAdmin
          .from('creative_contacts')
          .select('id')
          .eq('organization_id', integration.organization_id)
          .eq('email', att.email.toLowerCase())
          .limit(1)
          .maybeSingle();

        if (contact) {
          entityMatch = { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
          break;
        }

        const domain = att.email.split('@')[1]?.toLowerCase();
        if (domain) {
          const { data: client } = await supabaseAdmin
            .from('creative_clients')
            .select('id')
            .eq('organization_id', integration.organization_id)
            .eq('domain', domain)
            .limit(1)
            .maybeSingle();

          if (client) {
            entityMatch = { entityType: 'client', entityId: client.id, matchedBy: 'auto_domain' };
            break;
          }
        }
      }
    }

    await supabaseAdmin.from('creative_calendar_events').insert({
      organization_id: integration.organization_id,
      integration_id: integration.id,
      provider: integration.provider,
      provider_event_id: providerEventId,
      title,
      description: description ?? null,
      location: location ?? null,
      start_at: startAt,
      end_at: endAt,
      all_day: allDay ?? false,
      status: 'confirmed',
      attendees: attendees ?? [],
      html_link: htmlLink,
      entity_type: entityMatch?.entityType ?? null,
      entity_id: entityMatch?.entityId ?? null,
      matched_by: entityMatch?.matchedBy ?? null,
    });

    logEdgeEvent('info', { fn: 'calendar-event-create', provider: integration.provider });

    return jsonResponse({ success: true, eventId: providerEventId, htmlLink }, 200, origin);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logEdgeEvent('error', { fn: 'calendar-event-create', error: errMsg });
    return jsonResponse({ error: errMsg }, 500, origin);
  }
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateEventRequest {
  integrationId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  attendees?: Array<{ email: string; name?: string }>;
  allDay?: boolean;
}

// ---------------------------------------------------------------------------
// Google Calendar create
// ---------------------------------------------------------------------------

async function createGoogleCalendarEvent(
  metadata: Record<string, unknown>,
  params: CreateEventRequest,
): Promise<{ id: string; htmlLink?: string }> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) throw new Error('Google Calendar access token not available');

  const event: Record<string, unknown> = {
    summary: params.title,
    description: params.description,
    location: params.location,
    start: params.allDay
      ? { date: params.startAt.split('T')[0] }
      : { dateTime: params.startAt },
    end: params.allDay
      ? { date: params.endAt.split('T')[0] }
      : { dateTime: params.endAt },
  };

  if (params.attendees?.length) {
    event.attendees = params.attendees.map((a) => ({ email: a.email, displayName: a.name }));
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    throw new Error(`Google Calendar create failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as { id: string; htmlLink?: string };
}

// ---------------------------------------------------------------------------
// Outlook Calendar create
// ---------------------------------------------------------------------------

async function createOutlookCalendarEvent(
  metadata: Record<string, unknown>,
  params: CreateEventRequest,
): Promise<{ id: string; webLink?: string }> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) throw new Error('Outlook Calendar access token not available');

  const event: Record<string, unknown> = {
    subject: params.title,
    body: params.description ? { contentType: 'text', content: params.description } : undefined,
    location: params.location ? { displayName: params.location } : undefined,
    start: { dateTime: params.startAt, timeZone: 'UTC' },
    end: { dateTime: params.endAt, timeZone: 'UTC' },
    isAllDay: params.allDay ?? false,
  };

  if (params.attendees?.length) {
    event.attendees = params.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: 'required',
    }));
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    throw new Error(`Outlook Calendar create failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as { id: string; webLink?: string };
}
```

**Step 2: Commit**

```bash
git add supabase/functions/calendar-event-create/index.ts
git commit -m "feat: add calendar-event-create POST edge function"
```

---

## Task 9: Hooks — Email

**Files:**
- Create: `src/hooks/useCreativeEmails.ts`

**Step 1: Create the email hooks file**

Create `src/hooks/useCreativeEmails.ts`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/hooks/useCreativeEmails.ts
git commit -m "feat: add useCreativeEmails hooks with send mutation"
```

---

## Task 10: Hooks — Calendar

**Files:**
- Create: `src/hooks/useCreativeCalendarEvents.ts`

**Step 1: Create the calendar hooks file**

Create `src/hooks/useCreativeCalendarEvents.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import type {
  CreativeCalendarEvent,
  CalendarProvider,
  CalendarEventStatus,
  CalendarMatchType,
} from '@/types/creative-calendar';

interface CalendarEventRow {
  id: string;
  organization_id: string;
  integration_id: string;
  provider: string;
  provider_event_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  status: string;
  organizer_email: string | null;
  organizer_name: string | null;
  attendees: Array<{ email: string; name?: string; status?: string }>;
  recurrence: string[] | null;
  html_link: string | null;
  color_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  matched_by: string | null;
  created_at: string;
  updated_at: string;
}

function toCalendarEvent(row: CalendarEventRow): CreativeCalendarEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationId: row.integration_id,
    provider: row.provider as CalendarProvider,
    providerEventId: row.provider_event_id,
    calendarId: row.calendar_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    status: row.status as CalendarEventStatus,
    organizerEmail: row.organizer_email,
    organizerName: row.organizer_name,
    attendees: row.attendees,
    recurrence: row.recurrence,
    htmlLink: row.html_link,
    colorId: row.color_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    matchedBy: row.matched_by as CalendarMatchType | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const calendarKeys = {
  all: (orgId: string) => ['creative-calendar-events', orgId] as const,
  forEntity: (entityType: string, entityId: string) =>
    ['creative-calendar-events', 'entity', entityType, entityId] as const,
  range: (orgId: string, start: string, end: string) =>
    ['creative-calendar-events', 'range', orgId, start, end] as const,
};

export function useCreativeCalendarEvents(filters?: {
  entityType?: string;
  entityId?: string;
  startAfter?: string;
  endBefore?: string;
  limit?: number;
}) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeCalendarEvent[]>({
    queryKey: filters?.entityType && filters?.entityId
      ? calendarKeys.forEntity(filters.entityType, filters.entityId)
      : calendarKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('creative_calendar_events')
        .select('*')
        .eq('organization_id', orgId!)
        .neq('status', 'cancelled')
        .order('start_at', { ascending: true });

      if (filters?.entityType && filters?.entityId) {
        query = query.eq('entity_type', filters.entityType).eq('entity_id', filters.entityId);
      }
      if (filters?.startAfter) {
        query = query.gte('start_at', filters.startAfter);
      }
      if (filters?.endBefore) {
        query = query.lte('end_at', filters.endBefore);
      }
      query = query.limit(filters?.limit ?? 50);

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as CalendarEventRow[]).map(toCalendarEvent);
    },
  });
}

export interface CreateCalendarEventInput {
  integrationId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  attendees?: Array<{ email: string; name?: string }>;
  allDay?: boolean;
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateCalendarEventInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-event-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            integrationId: values.integrationId,
            title: values.title,
            description: values.description,
            location: values.location,
            startAt: values.startAt,
            endAt: values.endAt,
            attendees: values.attendees,
            allDay: values.allDay,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Create failed' }));
        throw new Error((err as { error: string }).error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-calendar-events'] });
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/hooks/useCreativeCalendarEvents.ts
git commit -m "feat: add useCreativeCalendarEvents hooks with create mutation"
```

---

## Task 11: Sidebar — Add Email & Calendar Nav

**Files:**
- Modify: `src/components/creative/layout/CreativeSidebar.tsx`

**Step 1: Add imports and nav items**

In `CreativeSidebar.tsx`, add `Mail` and `Calendar` to the lucide-react import:

```typescript
// Add to existing lucide-react import line:
import {
  // ... existing imports ...
  Mail,
  Calendar,
} from 'lucide-react';
```

Then add two entries to the `mainNavItems` array, after the `Ingestion` entry:

```typescript
  { label: 'Ingestion', icon: Download, path: '/creative/ingestion' },
  { label: 'Email', icon: Mail, path: '/creative/inbox' },
  { label: 'Calendar', icon: Calendar, path: '/creative/calendar' },
```

**Step 2: Commit**

```bash
git add src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat: add Email and Calendar sidebar navigation entries"
```

---

## Task 12: Pages — Inbox & Calendar

**Files:**
- Create: `src/pages/creative/CreativeInbox.tsx`
- Create: `src/pages/creative/CreativeCalendar.tsx`
- Modify: `src/App.tsx` (add routes + lazy imports)

**Step 1: Create the Inbox page**

Create `src/pages/creative/CreativeInbox.tsx`:

```tsx
import { useState } from 'react';
import { Mail, Send, RefreshCw, Star, Paperclip } from 'lucide-react';
import { WorkspaceContainer } from '@/components/creative/shared/WorkspaceContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreativeEmails } from '@/hooks/useCreativeEmails';
import { EMAIL_DIRECTION_LABELS, EMAIL_DIRECTION_COLORS } from '@/types/creative-emails';
import type { CreativeEmail, EmailDirection } from '@/types/creative-emails';
import { formatDistanceToNow } from 'date-fns';

export default function CreativeInbox() {
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');

  const directionFilter: EmailDirection | undefined =
    activeTab === 'all' ? undefined : activeTab;

  const { data: emails = [], isLoading } = useCreativeEmails({
    direction: directionFilter,
    limit: 100,
  });

  return (
    <WorkspaceContainer
      title="Email"
      subtitle={`${emails.length} messages`}
      icon={Mail}
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="inbound">Received</TabsTrigger>
            <TabsTrigger value="outbound">Sent</TabsTrigger>
          </TabsList>
        </Tabs>

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
              <EmailRow key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>
    </WorkspaceContainer>
  );
}

function EmailRow({ email }: { email: CreativeEmail }) {
  const dirColors = EMAIL_DIRECTION_COLORS[email.direction];

  return (
    <div
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

**Step 2: Create the Calendar page**

Create `src/pages/creative/CreativeCalendar.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { WorkspaceContainer } from '@/components/creative/shared/WorkspaceContainer';
import { Badge } from '@/components/ui/badge';
import { useCreativeCalendarEvents } from '@/hooks/useCreativeCalendarEvents';
import { CALENDAR_STATUS_LABELS, CALENDAR_STATUS_COLORS } from '@/types/creative-calendar';
import type { CreativeCalendarEvent } from '@/types/creative-calendar';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function CreativeCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startAfter = startOfMonth(currentMonth).toISOString();
  const endBefore = endOfMonth(currentMonth).toISOString();

  const { data: events = [], isLoading } = useCreativeCalendarEvents({
    startAfter,
    endBefore,
    limit: 200,
  });

  const eventsByDate = useMemo(() => {
    const map: Record<string, CreativeCalendarEvent[]> = {};
    for (const evt of events) {
      const dateKey = format(new Date(evt.startAt), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(evt);
    }
    return map;
  }, [events]);

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <WorkspaceContainer
      title="Calendar"
      subtitle={format(currentMonth, 'MMMM yyyy')}
      icon={CalendarIcon}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            ← Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            Next →
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>No events this month.</p>
            <p className="text-sm">Connect a Gmail or Outlook account to sync calendar events.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {format(new Date(dateKey), 'EEEE, MMMM d')}
                </h3>
                <div className="space-y-2">
                  {eventsByDate[dateKey].map((evt) => (
                    <CalendarEventCard key={evt.id} event={evt} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceContainer>
  );
}

function CalendarEventCard({ event }: { event: CreativeCalendarEvent }) {
  const statusColors = CALENDAR_STATUS_COLORS[event.status];

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{event.title}</span>
            <Badge variant="outline" className={`text-xs ${statusColors.bg} ${statusColors.text}`}>
              {CALENDAR_STATUS_LABELS[event.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.allDay
                ? 'All day'
                : `${format(new Date(event.startAt), 'h:mm a')} – ${format(new Date(event.endAt), 'h:mm a')}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
            {event.attendees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.attendees.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add routes to App.tsx**

Add lazy imports near other creative page imports:

```typescript
const CreativeInbox = lazy(() => import("./pages/creative/CreativeInbox"));
const CreativeCalendar = lazy(() => import("./pages/creative/CreativeCalendar"));
```

Add routes inside the creative route group, after the `workflows` route:

```tsx
<Route path="inbox" element={<CreativeInbox />} />
<Route path="calendar" element={<CreativeCalendar />} />
```

**Step 4: Commit**

```bash
git add src/pages/creative/CreativeInbox.tsx src/pages/creative/CreativeCalendar.tsx src/App.tsx
git commit -m "feat: add Inbox and Calendar pages with routes"
```

---

## Task 13: Entity Detail Sections — Email & Calendar

**Files:**
- Create: `src/components/creative/shared/EntityEmailSection.tsx`
- Create: `src/components/creative/shared/EntityCalendarSection.tsx`

**Step 1: Create EntityEmailSection**

Create `src/components/creative/shared/EntityEmailSection.tsx`:

```tsx
import { Mail, Paperclip, Star } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useCreativeEmails } from '@/hooks/useCreativeEmails';
import { EMAIL_DIRECTION_LABELS, EMAIL_DIRECTION_COLORS } from '@/types/creative-emails';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface EntityEmailSectionProps {
  entityType: string;
  entityId: string;
}

export function EntityEmailSection({ entityType, entityId }: EntityEmailSectionProps) {
  const { data: emails = [], isLoading } = useCreativeEmails({
    entityType,
    entityId,
    limit: 20,
  });

  return (
    <CollapsibleEngineSection
      icon={Mail}
      label="Emails"
      count={emails.length}
      isLoading={isLoading}
    >
      {emails.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No linked emails.</p>
      ) : (
        <div className="divide-y">
          {emails.map((email) => {
            const dirColors = EMAIL_DIRECTION_COLORS[email.direction];
            return (
              <div key={email.id} className="py-2 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm truncate font-medium">
                      {email.subject || '(No subject)'}
                    </span>
                    <Badge variant="outline" className={`text-xs ${dirColors.bg} ${dirColors.text}`}>
                      {EMAIL_DIRECTION_LABELS[email.direction]}
                    </Badge>
                    {email.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleEngineSection>
  );
}
```

**Step 2: Create EntityCalendarSection**

Create `src/components/creative/shared/EntityCalendarSection.tsx`:

```tsx
import { Calendar, MapPin, Clock } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useCreativeCalendarEvents } from '@/hooks/useCreativeCalendarEvents';
import { CALENDAR_STATUS_LABELS, CALENDAR_STATUS_COLORS } from '@/types/creative-calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EntityCalendarSectionProps {
  entityType: string;
  entityId: string;
}

export function EntityCalendarSection({ entityType, entityId }: EntityCalendarSectionProps) {
  const { data: events = [], isLoading } = useCreativeCalendarEvents({
    entityType,
    entityId,
    limit: 10,
  });

  return (
    <CollapsibleEngineSection
      icon={Calendar}
      label="Calendar"
      count={events.length}
      isLoading={isLoading}
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No linked events.</p>
      ) : (
        <div className="space-y-2">
          {events.map((evt) => {
            const statusColors = CALENDAR_STATUS_COLORS[evt.status];
            return (
              <div key={evt.id} className="border rounded p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{evt.title}</span>
                  <Badge variant="outline" className={`text-xs ${statusColors.bg} ${statusColors.text}`}>
                    {CALENDAR_STATUS_LABELS[evt.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {evt.allDay
                      ? format(new Date(evt.startAt), 'MMM d')
                      : format(new Date(evt.startAt), 'MMM d, h:mm a')}
                  </span>
                  {evt.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {evt.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleEngineSection>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/creative/shared/EntityEmailSection.tsx src/components/creative/shared/EntityCalendarSection.tsx
git commit -m "feat: add EntityEmailSection and EntityCalendarSection components"
```

**Note for integrating into entity detail pages:** After this task, add `<EntityEmailSection>` and `<EntityCalendarSection>` to `ContactDetail.tsx`, `ClientDetail.tsx`, and `OpportunityDetail.tsx` — import the components and place them after the existing Activities section. This is a small modification (3-4 lines per file) that the implementer should handle.

---

## Task 14: Tests — Types, Mappers, Pure Functions

**Files:**
- Create: `src/test/creative-emails.test.ts`

**Step 1: Write the test file**

Create `src/test/creative-emails.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  EMAIL_PROVIDERS,
  EMAIL_DIRECTIONS,
  EMAIL_MATCH_TYPES,
  EMAIL_PROVIDER_LABELS,
  EMAIL_PROVIDER_COLORS,
  EMAIL_DIRECTION_LABELS,
  EMAIL_DIRECTION_COLORS,
} from '@/types/creative-emails';
import {
  CALENDAR_PROVIDERS,
  CALENDAR_EVENT_STATUSES,
  CALENDAR_MATCH_TYPES,
  CALENDAR_STATUS_LABELS,
  CALENDAR_STATUS_COLORS,
  CALENDAR_PROVIDER_LABELS,
} from '@/types/creative-calendar';
import type { CreativeEmail, EmailProvider, EmailDirection } from '@/types/creative-emails';
import type { CreativeCalendarEvent, CalendarProvider, CalendarEventStatus } from '@/types/creative-calendar';

// ---------------------------------------------------------------------------
// 1. Email type maps and constants
// ---------------------------------------------------------------------------
describe('creative-emails type maps and constants', () => {
  it('EMAIL_PROVIDERS contains exactly gmail, outlook, email_imap', () => {
    expect([...EMAIL_PROVIDERS]).toEqual(['gmail', 'outlook', 'email_imap']);
  });

  it('EMAIL_DIRECTIONS contains exactly inbound, outbound', () => {
    expect([...EMAIL_DIRECTIONS]).toEqual(['inbound', 'outbound']);
  });

  it('EMAIL_MATCH_TYPES contains exactly auto_email, auto_domain, manual', () => {
    expect([...EMAIL_MATCH_TYPES]).toEqual(['auto_email', 'auto_domain', 'manual']);
  });

  it('EMAIL_PROVIDER_LABELS has a label for every provider and labels are non-empty', () => {
    for (const p of EMAIL_PROVIDERS) {
      const label = EMAIL_PROVIDER_LABELS[p];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('EMAIL_PROVIDER_COLORS has bg and text for every provider', () => {
    for (const p of EMAIL_PROVIDERS) {
      expect(EMAIL_PROVIDER_COLORS[p]).toHaveProperty('bg');
      expect(EMAIL_PROVIDER_COLORS[p]).toHaveProperty('text');
    }
  });

  it('EMAIL_DIRECTION_LABELS has a label for every direction', () => {
    for (const d of EMAIL_DIRECTIONS) {
      expect(typeof EMAIL_DIRECTION_LABELS[d]).toBe('string');
      expect(EMAIL_DIRECTION_LABELS[d].length).toBeGreaterThan(0);
    }
  });

  it('EMAIL_DIRECTION_COLORS has bg and text for every direction', () => {
    for (const d of EMAIL_DIRECTIONS) {
      expect(EMAIL_DIRECTION_COLORS[d]).toHaveProperty('bg');
      expect(EMAIL_DIRECTION_COLORS[d]).toHaveProperty('text');
    }
  });

  it('provider label map keys match EMAIL_PROVIDERS exactly', () => {
    expect(Object.keys(EMAIL_PROVIDER_LABELS).sort()).toEqual([...EMAIL_PROVIDERS].sort());
  });

  it('direction label map keys match EMAIL_DIRECTIONS exactly', () => {
    expect(Object.keys(EMAIL_DIRECTION_LABELS).sort()).toEqual([...EMAIL_DIRECTIONS].sort());
  });
});

// ---------------------------------------------------------------------------
// 2. Calendar type maps and constants
// ---------------------------------------------------------------------------
describe('creative-calendar type maps and constants', () => {
  it('CALENDAR_PROVIDERS contains exactly gmail, outlook', () => {
    expect([...CALENDAR_PROVIDERS]).toEqual(['gmail', 'outlook']);
  });

  it('CALENDAR_EVENT_STATUSES contains exactly confirmed, tentative, cancelled', () => {
    expect([...CALENDAR_EVENT_STATUSES]).toEqual(['confirmed', 'tentative', 'cancelled']);
  });

  it('CALENDAR_STATUS_LABELS has a label for every status', () => {
    for (const s of CALENDAR_EVENT_STATUSES) {
      expect(typeof CALENDAR_STATUS_LABELS[s]).toBe('string');
      expect(CALENDAR_STATUS_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  it('CALENDAR_STATUS_COLORS has bg and text for every status', () => {
    for (const s of CALENDAR_EVENT_STATUSES) {
      expect(CALENDAR_STATUS_COLORS[s]).toHaveProperty('bg');
      expect(CALENDAR_STATUS_COLORS[s]).toHaveProperty('text');
    }
  });

  it('CALENDAR_PROVIDER_LABELS has a label for every provider', () => {
    for (const p of CALENDAR_PROVIDERS) {
      expect(typeof CALENDAR_PROVIDER_LABELS[p]).toBe('string');
      expect(CALENDAR_PROVIDER_LABELS[p].length).toBeGreaterThan(0);
    }
  });

  it('status label map keys match CALENDAR_EVENT_STATUSES exactly', () => {
    expect(Object.keys(CALENDAR_STATUS_LABELS).sort()).toEqual([...CALENDAR_EVENT_STATUSES].sort());
  });
});

// ---------------------------------------------------------------------------
// 3. toCreativeEmail mapper (mirrored from hook)
// ---------------------------------------------------------------------------

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
    matchedBy: row.matched_by as CreativeEmail['matchedBy'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

describe('toCreativeEmail mapper', () => {
  const baseRow: EmailRow = {
    id: 'email-001',
    organization_id: 'org-123',
    integration_id: 'int-456',
    provider: 'gmail',
    message_id: 'msg-789',
    thread_id: 'thread-abc',
    subject: 'Test Subject',
    from_address: 'alice@example.com',
    from_name: 'Alice',
    to_addresses: [{ email: 'bob@example.com', name: 'Bob' }],
    cc_addresses: [],
    bcc_addresses: [],
    body_text: 'Hello',
    body_html: '<p>Hello</p>',
    snippet: 'Hello',
    labels: ['INBOX'],
    is_read: true,
    is_starred: false,
    is_draft: false,
    direction: 'inbound',
    sent_at: '2026-03-05T12:00:00Z',
    has_attachments: false,
    entity_type: 'contact',
    entity_id: 'contact-001',
    matched_by: 'auto_email',
    created_at: '2026-03-05T12:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
  };

  it('maps all snake_case fields to camelCase correctly', () => {
    const email = toCreativeEmail(baseRow);
    expect(email.id).toBe('email-001');
    expect(email.organizationId).toBe('org-123');
    expect(email.integrationId).toBe('int-456');
    expect(email.provider).toBe('gmail');
    expect(email.messageId).toBe('msg-789');
    expect(email.threadId).toBe('thread-abc');
    expect(email.fromAddress).toBe('alice@example.com');
    expect(email.fromName).toBe('Alice');
    expect(email.isRead).toBe(true);
    expect(email.isStarred).toBe(false);
    expect(email.direction).toBe('inbound');
    expect(email.sentAt).toBe('2026-03-05T12:00:00Z');
    expect(email.hasAttachments).toBe(false);
    expect(email.entityType).toBe('contact');
    expect(email.entityId).toBe('contact-001');
    expect(email.matchedBy).toBe('auto_email');
  });

  it('preserves null values for optional fields', () => {
    const row: EmailRow = {
      ...baseRow,
      thread_id: null,
      subject: null,
      from_name: null,
      body_text: null,
      body_html: null,
      snippet: null,
      entity_type: null,
      entity_id: null,
      matched_by: null,
    };
    const email = toCreativeEmail(row);
    expect(email.threadId).toBeNull();
    expect(email.subject).toBeNull();
    expect(email.fromName).toBeNull();
    expect(email.bodyText).toBeNull();
    expect(email.entityType).toBeNull();
    expect(email.matchedBy).toBeNull();
  });

  it('handles all provider values correctly', () => {
    for (const provider of EMAIL_PROVIDERS) {
      const email = toCreativeEmail({ ...baseRow, provider });
      expect(email.provider).toBe(provider);
    }
  });

  it('handles all direction values correctly', () => {
    for (const direction of EMAIL_DIRECTIONS) {
      const email = toCreativeEmail({ ...baseRow, direction });
      expect(email.direction).toBe(direction);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. toCalendarEvent mapper (mirrored from hook)
// ---------------------------------------------------------------------------

interface CalendarEventRow {
  id: string;
  organization_id: string;
  integration_id: string;
  provider: string;
  provider_event_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  status: string;
  organizer_email: string | null;
  organizer_name: string | null;
  attendees: Array<{ email: string; name?: string; status?: string }>;
  recurrence: string[] | null;
  html_link: string | null;
  color_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  matched_by: string | null;
  created_at: string;
  updated_at: string;
}

function toCalendarEvent(row: CalendarEventRow): CreativeCalendarEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationId: row.integration_id,
    provider: row.provider as CalendarProvider,
    providerEventId: row.provider_event_id,
    calendarId: row.calendar_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    status: row.status as CalendarEventStatus,
    organizerEmail: row.organizer_email,
    organizerName: row.organizer_name,
    attendees: row.attendees,
    recurrence: row.recurrence,
    htmlLink: row.html_link,
    colorId: row.color_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    matchedBy: row.matched_by as CreativeCalendarEvent['matchedBy'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

describe('toCalendarEvent mapper', () => {
  const baseRow: CalendarEventRow = {
    id: 'evt-001',
    organization_id: 'org-123',
    integration_id: 'int-456',
    provider: 'gmail',
    provider_event_id: 'gcal-789',
    calendar_id: 'primary',
    title: 'Team Meeting',
    description: 'Weekly sync',
    location: 'Conference Room A',
    start_at: '2026-03-05T14:00:00Z',
    end_at: '2026-03-05T15:00:00Z',
    all_day: false,
    status: 'confirmed',
    organizer_email: 'organizer@example.com',
    organizer_name: 'Organizer',
    attendees: [{ email: 'bob@example.com', name: 'Bob', status: 'accepted' }],
    recurrence: null,
    html_link: 'https://calendar.google.com/event/123',
    color_id: null,
    entity_type: 'contact',
    entity_id: 'contact-001',
    matched_by: 'auto_email',
    created_at: '2026-03-05T12:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
  };

  it('maps all snake_case fields to camelCase correctly', () => {
    const evt = toCalendarEvent(baseRow);
    expect(evt.id).toBe('evt-001');
    expect(evt.organizationId).toBe('org-123');
    expect(evt.providerEventId).toBe('gcal-789');
    expect(evt.calendarId).toBe('primary');
    expect(evt.title).toBe('Team Meeting');
    expect(evt.startAt).toBe('2026-03-05T14:00:00Z');
    expect(evt.endAt).toBe('2026-03-05T15:00:00Z');
    expect(evt.allDay).toBe(false);
    expect(evt.status).toBe('confirmed');
    expect(evt.organizerEmail).toBe('organizer@example.com');
    expect(evt.htmlLink).toBe('https://calendar.google.com/event/123');
    expect(evt.entityType).toBe('contact');
    expect(evt.matchedBy).toBe('auto_email');
  });

  it('preserves null values for optional fields', () => {
    const row: CalendarEventRow = {
      ...baseRow,
      description: null,
      location: null,
      organizer_email: null,
      organizer_name: null,
      recurrence: null,
      html_link: null,
      color_id: null,
      entity_type: null,
      entity_id: null,
      matched_by: null,
    };
    const evt = toCalendarEvent(row);
    expect(evt.description).toBeNull();
    expect(evt.location).toBeNull();
    expect(evt.organizerEmail).toBeNull();
    expect(evt.recurrence).toBeNull();
    expect(evt.htmlLink).toBeNull();
    expect(evt.entityType).toBeNull();
  });

  it('handles all status values correctly', () => {
    for (const status of CALENDAR_EVENT_STATUSES) {
      const evt = toCalendarEvent({ ...baseRow, status });
      expect(evt.status).toBe(status);
    }
  });

  it('handles all provider values correctly', () => {
    for (const provider of CALENDAR_PROVIDERS) {
      const evt = toCalendarEvent({ ...baseRow, provider });
      expect(evt.provider).toBe(provider);
    }
  });

  it('handles all-day events', () => {
    const evt = toCalendarEvent({ ...baseRow, all_day: true });
    expect(evt.allDay).toBe(true);
  });

  it('handles events with multiple attendees', () => {
    const row: CalendarEventRow = {
      ...baseRow,
      attendees: [
        { email: 'a@example.com', name: 'A', status: 'accepted' },
        { email: 'b@example.com', name: 'B', status: 'tentative' },
        { email: 'c@example.com', status: 'needsAction' },
      ],
    };
    const evt = toCalendarEvent(row);
    expect(evt.attendees).toHaveLength(3);
    expect(evt.attendees[0].email).toBe('a@example.com');
    expect(evt.attendees[2].name).toBeUndefined();
  });
});
```

**Step 2: Run the tests**

Run: `npx vitest run src/test/creative-emails.test.ts`
Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/test/creative-emails.test.ts
git commit -m "feat: add email and calendar type map and mapper tests"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Email tables migration | 1 SQL |
| 2 | Calendar events migration | 1 SQL |
| 3 | Provider registry calendar scopes | 1 TS modify |
| 4 | Frontend types (email + calendar) | 2 TS |
| 5 | Edge function: email-sync (cron) | 1 TS |
| 6 | Edge function: email-send (POST) | 1 TS |
| 7 | Edge function: calendar-sync (cron) | 1 TS |
| 8 | Edge function: calendar-event-create (POST) | 1 TS |
| 9 | Hooks: email | 1 TS |
| 10 | Hooks: calendar | 1 TS |
| 11 | Sidebar: add Email + Calendar nav | 1 TSX modify |
| 12 | Pages: Inbox + Calendar + routes | 2 TSX + 1 TSX modify |
| 13 | Entity detail sections | 2 TSX |
| 14 | Tests: type maps + mappers | 1 TS |

**Total: ~20 files, ~3,500-4,000 lines**
