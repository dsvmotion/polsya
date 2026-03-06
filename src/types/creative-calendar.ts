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
