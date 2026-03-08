import { describe, it, expect } from 'vitest';
import {
  toCreativeOpportunity,
  toCreativeOpportunities,
  type CreativeOpportunityRow,
} from '@/services/creativeOpportunityService';

const makeRow = (o: Partial<CreativeOpportunityRow> = {}): CreativeOpportunityRow => ({
  id: 'op-1',
  organization_id: 'org-1',
  client_id: 'cl-1',
  contact_id: 'ct-1',
  title: 'Brand Redesign',
  description: 'Full rebrand for Acme',
  stage: 'proposal',
  value_cents: 500000,
  currency: 'USD',
  probability: 0.75,
  expected_close_date: '2025-12-01',
  source: 'referral',
  lost_reason: null,
  tags: ['priority'],
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

describe('creativeOpportunityService', () => {
  describe('toCreativeOpportunity', () => {
    it('maps all fields', () => {
      const result = toCreativeOpportunity(makeRow());
      expect(result.id).toBe('op-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.clientId).toBe('cl-1');
      expect(result.contactId).toBe('ct-1');
      expect(result.title).toBe('Brand Redesign');
      expect(result.description).toBe('Full rebrand for Acme');
      expect(result.stage).toBe('proposal');
      expect(result.valueCents).toBe(500000);
      expect(result.currency).toBe('USD');
      expect(result.probability).toBe(0.75);
      expect(result.expectedCloseDate).toBe('2025-12-01');
      expect(result.source).toBe('referral');
      expect(result.lostReason).toBeNull();
    });

    it('handles null optional fields', () => {
      const result = toCreativeOpportunity(
        makeRow({
          client_id: null,
          contact_id: null,
          description: null,
          value_cents: null,
          expected_close_date: null,
          source: null,
          lost_reason: null,
        }),
      );
      expect(result.clientId).toBeNull();
      expect(result.contactId).toBeNull();
      expect(result.description).toBeNull();
      expect(result.valueCents).toBeNull();
      expect(result.expectedCloseDate).toBeNull();
      expect(result.source).toBeNull();
    });

    it('defaults nullish currency to USD', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).currency = null;
      expect(toCreativeOpportunity(row).currency).toBe('USD');
    });

    it('defaults nullish probability to 0', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).probability = null;
      expect(toCreativeOpportunity(row).probability).toBe(0);
    });

    it('defaults nullish tags/metadata to empty', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).tags = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toCreativeOpportunity(row);
      expect(result.tags).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('toCreativeOpportunities', () => {
    it('maps array', () => {
      const result = toCreativeOpportunities([makeRow({ id: 'a' }), makeRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toCreativeOpportunities([])).toEqual([]);
    });
  });
});
