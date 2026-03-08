import { describe, it, expect } from 'vitest';
import {
  toEnrichmentCredit,
  toEnrichmentCredits,
  toEnrichmentRecipe,
  toEnrichmentRecipes,
  toEnrichmentRun,
  toEnrichmentRuns,
  type EnrichmentCreditRow,
  type EnrichmentRecipeRow,
  type EnrichmentRunRow,
} from '@/services/enrichmentService';

/* ─── Factories ─── */

const makeCreditRow = (o: Partial<EnrichmentCreditRow> = {}): EnrichmentCreditRow => ({
  id: 'cr-1',
  organization_id: 'org-1',
  provider: 'clearbit',
  total_credits: 1000,
  used_credits: 250,
  reset_at: '2025-07-01T00:00:00Z',
  metadata: { tier: 'pro' },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

const makeRecipeRow = (o: Partial<EnrichmentRecipeRow> = {}): EnrichmentRecipeRow => ({
  id: 'rec-1',
  organization_id: 'org-1',
  name: 'Company enrichment',
  description: 'Enrich company data',
  steps: [{ action: 'lookup' }],
  target_entity_type: 'client',
  is_active: true,
  run_count: 5,
  last_run_at: '2025-06-01T00:00:00Z',
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

const makeRunRow = (o: Partial<EnrichmentRunRow> = {}): EnrichmentRunRow => ({
  id: 'run-1',
  organization_id: 'org-1',
  recipe_id: 'rec-1',
  status: 'completed',
  entity_type: 'client',
  entity_ids: ['e1', 'e2'],
  results: [{ matched: true }],
  credits_used: 10,
  started_at: '2025-06-01T10:00:00Z',
  completed_at: '2025-06-01T10:05:00Z',
  error_log: [],
  metadata: {},
  created_at: '2025-06-01T10:00:00Z',
  updated_at: '2025-06-01T10:05:00Z',
  ...o,
});

/* ─── Tests ─── */

describe('enrichmentService', () => {
  describe('toEnrichmentCredit', () => {
    it('maps all fields', () => {
      const result = toEnrichmentCredit(makeCreditRow());
      expect(result.id).toBe('cr-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.provider).toBe('clearbit');
      expect(result.totalCredits).toBe(1000);
      expect(result.usedCredits).toBe(250);
      expect(result.resetAt).toBe('2025-07-01T00:00:00Z');
      expect(result.metadata).toEqual({ tier: 'pro' });
    });

    it('defaults nullish credits to 0', () => {
      const row = makeCreditRow();
      // Simulate nullish values via type assertion
      (row as unknown as Record<string, unknown>).total_credits = null;
      (row as unknown as Record<string, unknown>).used_credits = null;
      const result = toEnrichmentCredit(row);
      expect(result.totalCredits).toBe(0);
      expect(result.usedCredits).toBe(0);
    });

    it('defaults nullish metadata to empty object', () => {
      const row = makeCreditRow();
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toEnrichmentCredit(row);
      expect(result.metadata).toEqual({});
    });
  });

  describe('toEnrichmentCredits', () => {
    it('maps array', () => {
      const result = toEnrichmentCredits([makeCreditRow({ id: 'a' }), makeCreditRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toEnrichmentCredits([])).toEqual([]);
    });
  });

  describe('toEnrichmentRecipe', () => {
    it('maps all fields', () => {
      const result = toEnrichmentRecipe(makeRecipeRow());
      expect(result.name).toBe('Company enrichment');
      expect(result.targetEntityType).toBe('client');
      expect(result.isActive).toBe(true);
      expect(result.runCount).toBe(5);
      expect(result.steps).toEqual([{ action: 'lookup' }]);
    });

    it('defaults nullish boolean/number fields', () => {
      const row = makeRecipeRow();
      (row as unknown as Record<string, unknown>).is_active = null;
      (row as unknown as Record<string, unknown>).run_count = null;
      (row as unknown as Record<string, unknown>).steps = null;
      const result = toEnrichmentRecipe(row);
      expect(result.isActive).toBe(true);
      expect(result.runCount).toBe(0);
      expect(result.steps).toEqual([]);
    });
  });

  describe('toEnrichmentRecipes', () => {
    it('maps array', () => {
      expect(toEnrichmentRecipes([makeRecipeRow()])).toHaveLength(1);
    });
  });

  describe('toEnrichmentRun', () => {
    it('maps all fields', () => {
      const result = toEnrichmentRun(makeRunRow());
      expect(result.recipeId).toBe('rec-1');
      expect(result.status).toBe('completed');
      expect(result.entityIds).toEqual(['e1', 'e2']);
      expect(result.creditsUsed).toBe(10);
      expect(result.errorLog).toEqual([]);
    });

    it('defaults nullish array/number fields', () => {
      const row = makeRunRow();
      (row as unknown as Record<string, unknown>).entity_ids = null;
      (row as unknown as Record<string, unknown>).results = null;
      (row as unknown as Record<string, unknown>).credits_used = null;
      (row as unknown as Record<string, unknown>).error_log = null;
      const result = toEnrichmentRun(row);
      expect(result.entityIds).toEqual([]);
      expect(result.results).toEqual([]);
      expect(result.creditsUsed).toBe(0);
      expect(result.errorLog).toEqual([]);
    });
  });

  describe('toEnrichmentRuns', () => {
    it('maps array', () => {
      expect(toEnrichmentRuns([makeRunRow(), makeRunRow()])).toHaveLength(2);
    });
  });
});
