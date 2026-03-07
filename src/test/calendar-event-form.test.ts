import { describe, it, expect } from 'vitest';
import {
  toCreateEventInput,
} from '@/components/creative/calendar/CalendarEventFormSheet.helpers';
import type { EventFormValues } from '@/components/creative/calendar/CalendarEventFormSheet.helpers';

// ---------------------------------------------------------------------------
// Helper: build base form values
// ---------------------------------------------------------------------------

function baseValues(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    integrationId: 'int-gmail-1',
    title: 'Team sync',
    date: '2026-03-10',
    startTime: '14:00',
    endTime: '15:00',
    allDay: false,
    location: '',
    description: '',
    attendees: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('toCreateEventInput', () => {
  it('converts a timed event with correct startAt/endAt format', () => {
    const result = toCreateEventInput(baseValues());

    expect(result.startAt).toBe('2026-03-10T14:00:00');
    expect(result.endAt).toBe('2026-03-10T15:00:00');
    expect(result.allDay).toBeUndefined();
  });

  it('converts an all-day event with 00:00:00 and 23:59:59', () => {
    const result = toCreateEventInput(baseValues({ allDay: true }));

    expect(result.startAt).toBe('2026-03-10T00:00:00');
    expect(result.endAt).toBe('2026-03-10T23:59:59');
    expect(result.allDay).toBe(true);
  });

  it('omits location when it is an empty string', () => {
    const result = toCreateEventInput(baseValues({ location: '' }));
    expect(result.location).toBeUndefined();
  });

  it('omits description when it is an empty string', () => {
    const result = toCreateEventInput(baseValues({ description: '' }));
    expect(result.description).toBeUndefined();
  });

  it('omits attendees when the array is empty', () => {
    const result = toCreateEventInput(baseValues({ attendees: [] }));
    expect(result.attendees).toBeUndefined();
  });

  it('maps non-empty attendees to [{ email }]', () => {
    const result = toCreateEventInput(
      baseValues({ attendees: ['alice@example.com', 'bob@example.com'] }),
    );
    expect(result.attendees).toEqual([
      { email: 'alice@example.com' },
      { email: 'bob@example.com' },
    ]);
  });

  it('includes all fields when every value is filled', () => {
    const result = toCreateEventInput(
      baseValues({
        location: 'Conference Room A',
        description: 'Weekly standup meeting',
        attendees: ['carol@example.com'],
        allDay: false,
      }),
    );

    expect(result).toEqual({
      integrationId: 'int-gmail-1',
      title: 'Team sync',
      startAt: '2026-03-10T14:00:00',
      endAt: '2026-03-10T15:00:00',
      location: 'Conference Room A',
      description: 'Weekly standup meeting',
      attendees: [{ email: 'carol@example.com' }],
    });
  });

  it('preserves integrationId and title from input', () => {
    const result = toCreateEventInput(
      baseValues({ integrationId: 'int-outlook-5', title: 'Client call' }),
    );
    expect(result.integrationId).toBe('int-outlook-5');
    expect(result.title).toBe('Client call');
  });
});
