import { describe, it, expect } from 'vitest';
import {
  toCreateEventInput,
  type EventFormValues,
} from '@/components/creative/calendar/CalendarEventFormSheet.helpers';

const makeValues = (o: Partial<EventFormValues> = {}): EventFormValues => ({
  integrationId: 'int-1',
  title: 'Team Meeting',
  date: '2025-06-15',
  startTime: '10:00',
  endTime: '11:00',
  allDay: false,
  location: '',
  description: '',
  attendees: [],
  ...o,
});

describe('CalendarEventFormSheet.helpers', () => {
  describe('toCreateEventInput', () => {
    it('maps timed event correctly', () => {
      const result = toCreateEventInput(makeValues());
      expect(result.integrationId).toBe('int-1');
      expect(result.title).toBe('Team Meeting');
      expect(result.startAt).toBe('2025-06-15T10:00:00');
      expect(result.endAt).toBe('2025-06-15T11:00:00');
      expect(result.allDay).toBeUndefined();
    });

    it('maps all-day event correctly', () => {
      const result = toCreateEventInput(makeValues({ allDay: true }));
      expect(result.startAt).toBe('2025-06-15T00:00:00');
      expect(result.endAt).toBe('2025-06-15T23:59:59');
      expect(result.allDay).toBe(true);
    });

    it('includes location when non-empty', () => {
      const result = toCreateEventInput(makeValues({ location: 'Room A' }));
      expect(result.location).toBe('Room A');
    });

    it('omits location when empty', () => {
      const result = toCreateEventInput(makeValues({ location: '' }));
      expect(result.location).toBeUndefined();
    });

    it('includes description when non-empty', () => {
      const result = toCreateEventInput(makeValues({ description: 'Discuss Q3' }));
      expect(result.description).toBe('Discuss Q3');
    });

    it('omits description when empty', () => {
      const result = toCreateEventInput(makeValues({ description: '' }));
      expect(result.description).toBeUndefined();
    });

    it('maps attendees as email objects when non-empty', () => {
      const result = toCreateEventInput(
        makeValues({ attendees: ['alice@example.com', 'bob@example.com'] }),
      );
      expect(result.attendees).toEqual([
        { email: 'alice@example.com' },
        { email: 'bob@example.com' },
      ]);
    });

    it('omits attendees when empty', () => {
      const result = toCreateEventInput(makeValues({ attendees: [] }));
      expect(result.attendees).toBeUndefined();
    });
  });
});
