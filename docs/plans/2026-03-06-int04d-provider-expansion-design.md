# INT-04D: Provider Expansion — Design

## Status

INT-04D is ~90% complete from Phase 4B work. This design covers only the remaining gaps.

## What's Already Done

| Component | Status | Details |
|-----------|--------|---------|
| Provider registry | Done | Gmail, Outlook, IMAP all registered with types/scopes |
| Gmail OAuth | Done | `gmail-oauth-url`, `gmail-oauth-exchange` edge functions |
| Outlook OAuth | Done | `outlook-oauth-url`, `outlook-oauth-exchange` edge functions |
| IMAP/SMTP vault | Done | `email-imap-upsert` edge function, `integration_email_credentials` table |
| Credential resolver | Done | Handles OAuth refresh, IMAP credential fetch, API keys |
| Gmail email sync | Done | Full implementation in `email-sync/index.ts` |
| Outlook email sync | Done | Full implementation in `email-sync/index.ts` |
| Gmail email send | Done | MIME builder + Gmail API in `email-send/index.ts` |
| Outlook email send | Done | Microsoft Graph sendMail in `email-send/index.ts` |
| Calendar sync | Done | Both Gmail and Outlook in `calendar-sync/index.ts` |
| Calendar event create | Done | Both Gmail and Outlook in `calendar-event-create/index.ts` |
| Frontend hooks | Done | `useOutlookOAuth`, `useEmailImapCredentials`, provider forms in IntegrationsCard |
| OAuth callback pages | Done | Both Gmail and Outlook callback pages |

## Remaining Gaps

### Gap 1: IMAP Email Sync

**File:** `supabase/functions/email-sync/index.ts` (line 147)

**Current state:** Comment `// IMAP sync deferred to future iteration`

**Solution:** Add `fetchImapMessages(metadata, sinceDate)` function using Deno-compatible IMAP library (`denopop` or raw TCP with IMAP protocol commands).

- Connect using `imap_host`, `imap_port`, `imap_secure`, `imap_username`, `imap_password` from resolved metadata
- Search INBOX for messages since `sinceDate` using IMAP SEARCH command
- Fetch envelope (From, To, Cc, Subject, Date, Message-ID) and body (HTML preferred, text fallback)
- Parse into existing `RawEmailMessage` format used by Gmail/Outlook paths
- Wire into the `if/else` chain replacing the deferred comment

**Estimated lines:** ~80-100 new lines

### Gap 2: SMTP Email Send

**File:** `supabase/functions/email-send/index.ts` (line 139)

**Current state:** Returns `501 Not Yet Supported` for non-Gmail/Outlook providers

**Solution:** Add `sendViaSmtp(metadata, params)` function using Deno SMTP client (`denomailer`).

- Connect to SMTP server using `smtp_host`, `smtp_port`, `smtp_secure` from resolved metadata
- Authenticate with `smtp_username`/`smtp_password` (or fallback to `imap_username`/`imap_password`)
- Build MIME message using existing `buildMimeMessage()` helper
- Send and return generated Message-ID
- Replace `501` response at line 139 with the SMTP path

**Estimated lines:** ~50-60 new lines

## Non-Goals

- **Calendar for IMAP users** — IMAP is email-only, no calendar protocol needed
- **New UI** — IntegrationsCard already has the IMAP form and connect flows
- **New DB tables** — All tables exist
- **New hooks** — All frontend hooks exist

## Technical Notes

- Deno edge functions run in V8 isolates with limited npm compatibility. IMAP/SMTP libraries must be Deno-native or ESM-compatible.
- The credential resolver already handles IMAP credentials — `resolveCustomCredentials()` reads from `integration_email_credentials` and flattens into metadata.
- Entity auto-matching (contact by email, client by domain) is already implemented and shared across all providers.
