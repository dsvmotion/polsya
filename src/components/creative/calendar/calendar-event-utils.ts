import type { CreateCalendarEventInput } from '@/hooks/useCreativeCalendarEvents';

export interface EventFormValues {
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

export function toCreateEventInput(values: EventFormValues): CreateCalendarEventInput {
  const startAt = values.allDay
    ? `${values.date}T00:00:00`
    : `${values.date}T${values.startTime}:00`;

  const endAt = values.allDay
    ? `${values.date}T23:59:59`
    : `${values.date}T${values.endTime}:00`;

  const input: CreateCalendarEventInput = {
    integrationId: values.integrationId,
    title: values.title,
    startAt,
    endAt,
    allDay: values.allDay || undefined,
  };

  if (values.location) {
    input.location = values.location;
  }

  if (values.description) {
    input.description = values.description;
  }

  if (values.attendees.length > 0) {
    input.attendees = values.attendees.map((email) => ({ email }));
  }

  return input;
}
