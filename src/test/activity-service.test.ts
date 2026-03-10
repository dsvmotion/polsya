import { describe, it, expect } from 'vitest';
import {
  toAccountActivity,
  toAccountActivities,
  type ActivityRow,
} from '@/services/activityService';

const makeRow = (overrides: Partial<ActivityRow> = {}): ActivityRow => ({
  id: 'act-1',
  pharmacy_id: 'ph-1',
  activity_type: 'call',
  title: 'Follow-up call',
  description: 'Discuss renewal',
  due_at: '2025-06-01T10:00:00Z',
  completed_at: null,
  owner: 'rep-1',
  created_at: '2025-05-01T00:00:00Z',
  updated_at: '2025-05-01T00:00:00Z',
  ...overrides,
});

describe('activityService', () => {
  describe('toAccountActivity', () => {
    it('maps all fields from snake_case to camelCase', () => {
      const result = toAccountActivity(makeRow());
      expect(result).toEqual({
        id: 'act-1',
        entityId: 'ph-1',
        activityType: 'call',
        title: 'Follow-up call',
        description: 'Discuss renewal',
        dueAt: '2025-06-01T10:00:00Z',
        completedAt: null,
        owner: 'rep-1',
        createdAt: '2025-05-01T00:00:00Z',
        updatedAt: '2025-05-01T00:00:00Z',
      });
    });

    it('handles null optional fields', () => {
      const result = toAccountActivity(
        makeRow({ description: null, due_at: null, owner: null }),
      );
      expect(result.description).toBeNull();
      expect(result.dueAt).toBeNull();
      expect(result.owner).toBeNull();
    });

    it('maps pharmacy_id to entityId', () => {
      const result = toAccountActivity(makeRow({ pharmacy_id: 'xyz' }));
      expect(result.entityId).toBe('xyz');
    });
  });

  describe('toAccountActivities', () => {
    it('maps an array of rows', () => {
      const rows = [makeRow({ id: 'a1' }), makeRow({ id: 'a2' })];
      const result = toAccountActivities(rows);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a1');
      expect(result[1].id).toBe('a2');
    });

    it('returns empty array for empty input', () => {
      expect(toAccountActivities([])).toEqual([]);
    });
  });
});
