import { describe, it, expect } from 'vitest';
import {
  toResolutionCandidate,
  toResolutionCandidates,
  toEntitySourceMapping,
  toEntitySourceMappings,
  type ResolutionCandidateRow,
  type EntitySourceMappingRow,
} from '@/services/entityResolutionService';

/* ─── Factories ─── */

const makeCandidateRow = (
  o: Partial<ResolutionCandidateRow> = {},
): ResolutionCandidateRow => ({
  id: 'rc-1',
  organization_id: 'org-1',
  entity_a_type: 'client',
  entity_a_id: 'c-1',
  entity_b_type: 'client',
  entity_b_id: 'c-2',
  confidence_score: 0.92,
  match_reasons: ['name_similarity', 'address_match'],
  status: 'pending',
  resolved_by: null,
  resolved_at: null,
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

const makeMappingRow = (
  o: Partial<EntitySourceMappingRow> = {},
): EntitySourceMappingRow => ({
  id: 'sm-1',
  organization_id: 'org-1',
  entity_type: 'client',
  entity_id: 'c-1',
  source_provider: 'woocommerce',
  source_id: 'wc-123',
  source_data: { wc_id: 123 },
  is_primary: true,
  last_synced_at: '2025-06-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

/* ─── Tests ─── */

describe('entityResolutionService', () => {
  describe('toResolutionCandidate', () => {
    it('maps all fields', () => {
      const result = toResolutionCandidate(makeCandidateRow());
      expect(result.id).toBe('rc-1');
      expect(result.entityAType).toBe('client');
      expect(result.entityAId).toBe('c-1');
      expect(result.entityBType).toBe('client');
      expect(result.entityBId).toBe('c-2');
      expect(result.confidenceScore).toBe(0.92);
      expect(result.matchReasons).toEqual(['name_similarity', 'address_match']);
      expect(result.status).toBe('pending');
    });

    it('coerces confidence_score to number', () => {
      const row = makeCandidateRow();
      (row as unknown as Record<string, unknown>).confidence_score = '0.85';
      expect(toResolutionCandidate(row).confidenceScore).toBe(0.85);
    });

    it('defaults non-array match_reasons to empty array', () => {
      const row = makeCandidateRow();
      (row as unknown as Record<string, unknown>).match_reasons = 'not-an-array';
      expect(toResolutionCandidate(row).matchReasons).toEqual([]);
    });

    it('defaults nullish match_reasons to empty array', () => {
      const row = makeCandidateRow();
      (row as unknown as Record<string, unknown>).match_reasons = null;
      expect(toResolutionCandidate(row).matchReasons).toEqual([]);
    });

    it('defaults invalid confidence_score to 0', () => {
      const row = makeCandidateRow();
      (row as unknown as Record<string, unknown>).confidence_score = 'invalid';
      expect(toResolutionCandidate(row).confidenceScore).toBe(0);
    });

    it('handles resolved candidates', () => {
      const result = toResolutionCandidate(
        makeCandidateRow({
          status: 'merged',
          resolved_by: 'user-1',
          resolved_at: '2025-06-15T00:00:00Z',
        }),
      );
      expect(result.status).toBe('merged');
      expect(result.resolvedBy).toBe('user-1');
      expect(result.resolvedAt).toBe('2025-06-15T00:00:00Z');
    });
  });

  describe('toResolutionCandidates', () => {
    it('maps array', () => {
      const result = toResolutionCandidates([
        makeCandidateRow({ id: 'a' }),
        makeCandidateRow({ id: 'b' }),
      ]);
      expect(result).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toResolutionCandidates([])).toEqual([]);
    });
  });

  describe('toEntitySourceMapping', () => {
    it('maps all fields', () => {
      const result = toEntitySourceMapping(makeMappingRow());
      expect(result.id).toBe('sm-1');
      expect(result.sourceProvider).toBe('woocommerce');
      expect(result.sourceId).toBe('wc-123');
      expect(result.isPrimary).toBe(true);
      expect(result.sourceData).toEqual({ wc_id: 123 });
    });

    it('defaults nullish source_data to empty object', () => {
      const row = makeMappingRow();
      (row as unknown as Record<string, unknown>).source_data = null;
      expect(toEntitySourceMapping(row).sourceData).toEqual({});
    });

    it('defaults nullish is_primary to false', () => {
      const row = makeMappingRow();
      (row as unknown as Record<string, unknown>).is_primary = null;
      expect(toEntitySourceMapping(row).isPrimary).toBe(false);
    });
  });

  describe('toEntitySourceMappings', () => {
    it('maps array', () => {
      expect(toEntitySourceMappings([makeMappingRow()])).toHaveLength(1);
    });
  });
});
