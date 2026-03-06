# Phase 4B Design: Deep Email & Calendar Integration

**Date:** 2026-03-05
**Status:** Approved

---

## Overview

Transform the Creative Intelligence Platform from an external-tool-dependent workflow into a unified communication hub. Users can send, receive, and manage emails and calendar events directly within the CRM, with automatic entity matching that links correspondence to contacts, clients, and opportunities.

**Architecture:** Hybrid Sync — periodic cron-based sync pulls emails and calendar events into local tables for fast reads; real-time edge function calls handle writes (send email, create/update calendar event). Entity auto-matching links messages and events to contacts/clients by email address and domain.

**Providers:** Gmail (OAuth), Outlook (OAuth), IMAP/SMTP (credentials).

---

## 1. Database Schema

### `creative_emails`

Stores synced email messages linked to organization and optionally to entities.

```sql
CREATE TABLE creative_emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'email_imap')),
  message_id      text NOT NULL,                    -- provider message ID
  thread_id       text,                             -- provider thread/conversation ID
  subject         text,
  from_address    text NOT NULL,
  from_name       text,
  to_addresses    jsonb NOT NULL DEFAULT '[]',      -- [{email, name}]
  cc_addresses    jsonb NOT NULL DEFAULT '[]',
  bcc_addresses   jsonb NOT NULL DEFAULT '[]',
  body_text       text,                             -- plain text body
  body_html       text,                             -- HTML body
  snippet         text,                             -- first ~200 chars preview
  labels          text[] NOT NULL DEFAULT '{}',     -- Gmail labels / Outlook categories
  is_read         boolean NOT NULL DEFAULT false,
  is_starred      boolean NOT NULL DEFAULT false,
  is_draft        boolean NOT NULL DEFAULT false,
  direction       text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sent_at         timestamptz NOT NULL,
  has_attachments boolean NOT NULL DEFAULT false,
  raw_headers     jsonb,                            -- selected headers for debugging
  -- Entity linking (auto-matched or manual)
  entity_type     text,                             -- 'contact', 'client', 'opportunity'
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
```

### `creative_email_attachments`

Stores metadata about email attachments (files stored in Supabase Storage).

```sql
CREATE TABLE creative_email_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id        uuid NOT NULL REFERENCES creative_emails(id) ON DELETE CASCADE,
  filename        text NOT NULL,
  content_type    text,
  size_bytes      integer,
  storage_path    text,       -- Supabase Storage path (null if not downloaded)
  provider_ref    text,       -- provider attachment ID for lazy download
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_email_attachments_email
  ON creative_email_attachments(email_id);
```

### `creative_calendar_events`

Stores synced calendar events linked to organization and optionally to entities.

```sql
CREATE TABLE creative_calendar_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  provider_event_id text NOT NULL,                  -- provider's event ID
  calendar_id     text NOT NULL DEFAULT 'primary',  -- which calendar
  title           text NOT NULL,
  description     text,
  location        text,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  all_day         boolean NOT NULL DEFAULT false,
  status          text NOT NULL CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  organizer_email text,
  organizer_name  text,
  attendees       jsonb NOT NULL DEFAULT '[]',      -- [{email, name, status}]
  recurrence      text[],                           -- RRULE strings
  html_link       text,                             -- link to open in provider
  color_id        text,
  -- Entity linking (auto-matched or manual)
  entity_type     text,
  entity_id       uuid,
  matched_by      text CHECK (matched_by IN ('auto_email', 'auto_domain', 'manual')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, provider_event_id)
);

CREATE INDEX idx_creative_calendar_events_org_range
  ON creative_calendar_events(organization_id, start_at, end_at);

CREATE INDEX idx_creative_calendar_events_org_entity
  ON creative_calendar_events(organization_id, entity_type, entity_id)
  WHERE entity_id IS NOT NULL;
```

### OAuth scope expansion (migration)

Extend the `integration_oauth_tokens` and `integration_oauth_states` provider CHECK constraints to include `google_calendar` as a provider value. Add calendar scopes to the provider registry.

- **Gmail:** Add `https://www.googleapis.com/auth/calendar.readonly` and `https://www.googleapis.com/auth/calendar.events`
- **Outlook:** Add `https://graph.microsoft.com/Calendars.ReadWrite`

---

## 2. Sync Architecture

### Hybrid model

| Operation | Method | Latency |
|-----------|--------|---------|
| Read emails | Query `creative_emails` table | <50ms |
| Read calendar | Query `creative_calendar_events` table | <50ms |
| Send email | POST to `email-send` edge function → provider API | 1-3s |
| Create event | POST to `calendar-event-create` edge function → provider API | 1-2s |

### Edge functions (4 total)

1. **`email-sync`** (cron, every 5 minutes)
   - Iterates all active email integrations (gmail, outlook, email_imap)
   - Fetches new messages since `last_sync_at` using provider-specific APIs
   - Upserts into `creative_emails` with dedup on `(org_id, provider, message_id)`
   - Auto-matches entities by from/to email addresses against `creative_contacts.email`
   - Falls back to domain matching against `creative_clients.domain`
   - Updates `integration_connections.last_sync_at`
   - Refreshes OAuth tokens if expired

2. **`email-send`** (POST, authenticated)
   - Accepts `{integration_id, to, cc, bcc, subject, body_html, reply_to_message_id?}`
   - Resolves credentials (OAuth token or IMAP/SMTP)
   - Sends via Gmail API, Microsoft Graph, or SMTP
   - Inserts sent message into `creative_emails` with `direction: 'outbound'`
   - Auto-matches entity on the `to` addresses

3. **`calendar-sync`** (cron, every 15 minutes)
   - Iterates all active Gmail/Outlook integrations with calendar scopes
   - Fetches events from last sync window (default: next 30 days + past 7 days)
   - Upserts into `creative_calendar_events` with dedup on `(org_id, provider, provider_event_id)`
   - Auto-matches entities by attendee email addresses
   - Handles cancelled events (update status to 'cancelled')
   - Refreshes OAuth tokens if expired

4. **`calendar-event-create`** (POST, authenticated)
   - Accepts `{integration_id, title, description?, location?, start_at, end_at, attendees?, all_day?}`
   - Creates event via Google Calendar API or Microsoft Graph
   - Inserts into `creative_calendar_events`
   - Auto-matches entities on attendee emails

### Token refresh pattern

All sync functions follow the same token refresh pattern:
1. Load token from `integration_oauth_tokens`
2. Check `expires_at` — if within 5 minutes, refresh via provider token endpoint
3. Update stored token with new `access_token` and `expires_at`
4. Proceed with API call using fresh token

### Entity auto-matching algorithm

```
For each email address in a message/event:
  1. Exact match: SELECT id FROM creative_contacts WHERE email = ?
  2. Domain match: Extract domain → SELECT id FROM creative_clients WHERE domain = ?
  3. If match found, set entity_type + entity_id + matched_by
  4. Priority: contact match > client match
  5. If multiple matches, pick the most recently updated entity
```

---

## 3. Frontend Architecture

### Types (`src/types/creative-emails.ts`, `src/types/creative-calendar.ts`)

```typescript
// Email types
export interface CreativeEmail {
  id: string;
  organizationId: string;
  integrationId: string;
  provider: 'gmail' | 'outlook' | 'email_imap';
  messageId: string;
  threadId: string | null;
  subject: string | null;
  fromAddress: string;
  fromName: string | null;
  toAddresses: { email: string; name?: string }[];
  ccAddresses: { email: string; name?: string }[];
  bccAddresses: { email: string; name?: string }[];
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string | null;
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  direction: 'inbound' | 'outbound';
  sentAt: string;
  hasAttachments: boolean;
  entityType: string | null;
  entityId: string | null;
  matchedBy: 'auto_email' | 'auto_domain' | 'manual' | null;
  createdAt: string;
  updatedAt: string;
}

// Calendar types
export interface CreativeCalendarEvent {
  id: string;
  organizationId: string;
  integrationId: string;
  provider: 'gmail' | 'outlook';
  providerEventId: string;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  organizerEmail: string | null;
  organizerName: string | null;
  attendees: { email: string; name?: string; status?: string }[];
  recurrence: string[] | null;
  htmlLink: string | null;
  entityType: string | null;
  entityId: string | null;
  matchedBy: 'auto_email' | 'auto_domain' | 'manual' | null;
  createdAt: string;
  updatedAt: string;
}
```

### Hooks

- **`useCreativeEmails(orgId, filters?)`** — list emails with pagination, filtering by entity, direction, date range
- **`useCreativeEmailThread(orgId, threadId)`** — load thread view
- **`useSendEmail()`** — mutation to POST to `email-send` edge function
- **`useCreativeCalendarEvents(orgId, filters?)`** — list events with date range filtering
- **`useCreateCalendarEvent()`** — mutation to POST to `calendar-event-create` edge function

### Pages

1. **Inbox page** (`/creative/inbox`) — full email management with thread view, compose, reply
2. **Calendar page** (`/creative/calendar`) — month/week/day views with event creation

### Entity detail sections

- **EntityEmailSection** — CollapsibleEngineSection on contact/client/opportunity detail pages showing linked emails
- **EntityCalendarSection** — CollapsibleEngineSection showing upcoming events linked to the entity

### Sidebar

Add Email (✉️) and Calendar (📅) entries to the creative sidebar navigation.

---

## 4. Error Handling & Testing

### Error handling

- **Token expiry:** Auto-refresh with retry. If refresh fails, mark integration `status: 'error'` with `last_error`.
- **Rate limiting:** Gmail has 250 quota units/second. Back off with exponential retry (max 3 attempts).
- **IMAP failures:** Catch connection errors, log via `logEdgeEvent`, mark integration status.
- **Send failures:** Return error response to frontend with user-friendly message.
- **Sync failures:** Per-integration try/catch. One integration failing doesn't block others.

### Testing strategy

- **Type + mapper tests** (Vitest) — type maps, snake_case→camelCase mapper, constants
- **Pure function tests** — entity matching algorithm, email address parsing, token expiry check
- **Edge function integration** — manual testing with real OAuth tokens in staging

---

## 5. Migration & Task Breakdown

### Migration sequence

1. Add `creative_emails` table + indexes + RLS
2. Add `creative_email_attachments` table + indexes
3. Add `creative_calendar_events` table + indexes + RLS
4. Extend OAuth provider CHECK constraints for calendar provider
5. Add calendar scopes to provider registry

### Task breakdown (14 tasks, ~3,500-4,500 lines)

| # | Task | Type | Est. Lines |
|---|------|------|-----------|
| 1 | Migration: `creative_emails` + `creative_email_attachments` | SQL | 100 |
| 2 | Migration: `creative_calendar_events` | SQL | 80 |
| 3 | Migration: OAuth scope expansion for calendar | SQL | 30 |
| 4 | Provider registry: add calendar scopes | TS | 20 |
| 5 | Frontend types: `creative-emails.ts` + `creative-calendar.ts` | TS | 200 |
| 6 | Edge function: `email-sync` (cron) | TS | 400 |
| 7 | Edge function: `email-send` (POST) | TS | 250 |
| 8 | Edge function: `calendar-sync` (cron) | TS | 350 |
| 9 | Edge function: `calendar-event-create` (POST) | TS | 200 |
| 10 | Hooks: `useCreativeEmails` + `useSendEmail` | TS | 200 |
| 11 | Hooks: `useCreativeCalendarEvents` + `useCreateCalendarEvent` | TS | 150 |
| 12 | Pages: Inbox + Calendar + entity sections | TSX | 800 |
| 13 | Sidebar: add Email + Calendar nav entries | TSX | 30 |
| 14 | Tests: type maps, mappers, pure functions | TS | 400 |
