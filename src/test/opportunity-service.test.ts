import { describe, it, expect } from 'vitest';
import {
  toAccountOpportunity,
  toAccountOpportunities,
  type OpportunityRow,
} from '@/services/opportunityService';

const makeRow = (overrides: Partial<OpportunityRow> = {}): OpportunityRow => ({
  id: 'opp-1',
  pharmacy_id: 'ph-1',
  title: 'Annual contract',
  stage: 'proposal',
  amount: 5000,
  probability: 0.75,
  expected_close_date: '2025-12-01',
  notes: 'Needs approval',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('opportunityService', () => {
  describe('toAccountOpportunity', () => {
    it('maps all fields from snake_case to camelCase', () => {
      const result = toAccountOpportunity(makeRow());
      expect(result).toEqual({
        id: 'opp-1',
        entityId: 'ph-1',
        title: 'Annual contract',
        stage: 'proposal',
        amount: 5000,
        probability: 0.75,
        expectedCloseDate: '2025-12-01',
        notes: 'Needs approval',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });
    });

    it('handles null optional fields', () => {
      const result = toAccountOpportunity(
        makeRow({ expected_close_date: null, notes: null }),
      );
      expect(result.expectedCloseDate).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('preserves numeric values', () => {
      const result = toAccountOpportunity(makeRow({ amount: 0, probability: 0 }));
      expect(result.amount).toBe(0);
      expect(result.probability).toBe(0);
    });
  });

  describe('toAccountOpportunities', () => {
    it('maps an array of rows', () => {
      const rows = [
        makeRow({ id: 'o1', amount: 100 }),
        makeRow({ id: 'o2', amount: 200 }),
      ];
      const result = toAccountOpportunities(rows);
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(100);
      expect(result[1].amount).toBe(200);
    });

    it('returns empty array for empty input', () => {
      expect(toAccountOpportunities([])).toEqual([]);
    });
  });
});
