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
