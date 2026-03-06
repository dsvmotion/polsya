# Phase 5B: Communication UX Completion — Design Document

## Problem Statement

The Creative Inbox and Calendar pages currently display synced data in read-only mode. Users can see emails and events but cannot compose emails, reply to threads, or create calendar events. The backend infrastructure (edge functions, hooks, types) was fully built in Phase 4B — only the interactive frontend UI components are missing.

## Approach

**Sheet-Based Forms + Inline Thread View (Approach A)**

- Sheet slide-over panels for form-based interactions (compose email, create event) — consistent with the existing `ActivityFormSheet`, `ProjectFormSheet`, etc. patterns
- Inline panel for email thread view — provides more reading space than a Sheet

Alternatives considered:
- Full Sheet-based (all Sheets): Thread view too cramped for reading email chains
- Separate pages: Breaks single-workspace feel, adds routing complexity

## Components

### 1. EmailComposeSheet

**Location:** `src/components/creative/email/EmailComposeSheet.tsx`

Slide-over Sheet form for composing new emails and replying.

**Form fields:**
- Integration selector (dropdown of connected email providers via `useIntegrations()`)
- To (multi-email input with chip/tag UX)
- CC / BCC (collapsible section, same multi-email input)
- Subject (text input)
- Body (textarea)

**Modes:**
- **New email:** All fields empty, user selects integration
- **Reply:** Pre-fills `replyToMessageId`, `to` (from original sender), `subject` (prefixed "Re:"), integration (from original email's integrationId)

**Wires to:** `useSendEmail()` mutation from `useCreativeEmails.ts`

**Success behavior:** Toast notification, close sheet, cache auto-invalidated by hook

### 2. EmailThreadView

**Location:** `src/components/creative/email/EmailThreadView.tsx`

Inline panel that replaces the email list when a row is clicked.

**Behavior:**
- Activated by clicking an `EmailRow` in the inbox
- Shows back arrow to return to email list
- Fetches thread via `useCreativeEmailThread(threadId)` hook
- Renders messages chronologically: sender info, timestamp, body content
- Older messages collapsed by default (show snippet, expand on click)
- "Reply" button at bottom opens `EmailComposeSheet` in reply mode
- Single emails (no threadId) render as a one-message view

### 3. CalendarEventFormSheet

**Location:** `src/components/creative/calendar/CalendarEventFormSheet.tsx`

Slide-over Sheet form for creating new calendar events.

**Form fields:**
- Integration selector (dropdown of connected calendar providers)
- Title (text input, required)
- All Day toggle (checkbox)
- Date (date picker, required)
- Start Time / End Time (time inputs, hidden when All Day is checked)
- Location (text input, optional)
- Description (textarea, optional)
- Attendees (multi-email input, optional)

**Wires to:** `useCreateCalendarEvent()` mutation from `useCreativeCalendarEvents.ts`

**Success behavior:** Toast notification, close sheet, cache auto-invalidated by hook

### 4. MultiEmailInput (Shared)

**Location:** `src/components/creative/shared/MultiEmailInput.tsx`

Reusable input component for entering multiple email addresses. Used by both EmailComposeSheet (To/CC/BCC) and CalendarEventFormSheet (Attendees).

**Behavior:**
- Type email, press Enter/comma/Tab to add as a chip
- Click X on chip to remove
- Basic email format validation before adding
- Integrates with react-hook-form via Controller

## Page Modifications

### CreativeInbox.tsx

- Add `selectedEmail` state (null = list view, set = thread view)
- Conditional render: thread view vs. email list
- Add floating "Compose" button (bottom-right)
- EmailRow onClick sets selectedEmail
- Compose button opens EmailComposeSheet

### CreativeCalendar.tsx

- Add "New Event" button in header bar (next to month navigation)
- Sheet open/close state management
- Button opens CalendarEventFormSheet

## Existing Infrastructure (no changes needed)

| Layer | Asset | Status |
|-------|-------|--------|
| Hook | `useSendEmail()` | Complete |
| Hook | `useCreateCalendarEvent()` | Complete |
| Hook | `useCreativeEmailThread()` | Complete |
| Hook | `useIntegrations()` | Complete |
| Types | `SendEmailInput` | Complete |
| Types | `CreateCalendarEventInput` | Complete |
| Types | `CreativeEmail`, `CreativeCalendarEvent` | Complete |
| Edge fn | `email-send` | Deployed |
| Edge fn | `calendar-event-create` | Deployed |
| DB | `creative_emails`, `creative_calendar_events` | Migrated |

## Testing Strategy

- Unit tests for `MultiEmailInput` (add/remove/validate emails)
- Unit tests for form validation logic in compose and event sheets
- Component render tests for Sheet open/close and form submission (mocked mutations)
- No backend testing needed (all backend tested in Phase 4B)

## File Summary

| Action | File |
|--------|------|
| Create | `src/components/creative/email/EmailComposeSheet.tsx` |
| Create | `src/components/creative/email/EmailThreadView.tsx` |
| Create | `src/components/creative/calendar/CalendarEventFormSheet.tsx` |
| Create | `src/components/creative/shared/MultiEmailInput.tsx` |
| Create | Test files for above components |
| Modify | `src/pages/creative/CreativeInbox.tsx` |
| Modify | `src/pages/creative/CreativeCalendar.tsx` |
