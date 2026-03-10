import { describe, it, expect } from 'vitest';
import {
  toCreativeProject,
  toCreativeProjects,
  type CreativeProjectRow,
} from '@/services/creativeProjectService';

const makeRow = (o: Partial<CreativeProjectRow> = {}): CreativeProjectRow => ({
  id: 'pr-1',
  organization_id: 'org-1',
  client_id: 'cl-1',
  name: 'Spring Campaign',
  slug: 'spring-campaign',
  description: 'Marketing campaign for spring launch',
  project_type: 'campaign',
  status: 'in_progress',
  budget_cents: 1000000,
  currency: 'USD',
  start_date: '2025-03-01',
  end_date: '2025-06-30',
  deliverables: [{ type: 'video', count: 3 }],
  tags: ['marketing', 'spring'],
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

describe('creativeProjectService', () => {
  describe('toCreativeProject', () => {
    it('maps all fields', () => {
      const result = toCreativeProject(makeRow());
      expect(result.id).toBe('pr-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.clientId).toBe('cl-1');
      expect(result.name).toBe('Spring Campaign');
      expect(result.slug).toBe('spring-campaign');
      expect(result.description).toBe('Marketing campaign for spring launch');
      expect(result.projectType).toBe('campaign');
      expect(result.status).toBe('in_progress');
      expect(result.budgetCents).toBe(1000000);
      expect(result.currency).toBe('USD');
      expect(result.startDate).toBe('2025-03-01');
      expect(result.endDate).toBe('2025-06-30');
      expect(result.deliverables).toEqual([{ type: 'video', count: 3 }]);
      expect(result.tags).toEqual(['marketing', 'spring']);
    });

    it('handles null optional fields', () => {
      const result = toCreativeProject(
        makeRow({
          client_id: null,
          slug: null,
          description: null,
          project_type: null,
          budget_cents: null,
          start_date: null,
          end_date: null,
        }),
      );
      expect(result.clientId).toBeNull();
      expect(result.slug).toBeNull();
      expect(result.description).toBeNull();
      expect(result.projectType).toBeNull();
      expect(result.budgetCents).toBeNull();
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it('defaults nullish currency to USD', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).currency = null;
      expect(toCreativeProject(row).currency).toBe('USD');
    });

    it('defaults nullish deliverables/tags/metadata to empty', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).deliverables = null;
      (row as unknown as Record<string, unknown>).tags = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toCreativeProject(row);
      expect(result.deliverables).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('toCreativeProjects', () => {
    it('maps array', () => {
      const result = toCreativeProjects([makeRow({ id: 'a' }), makeRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toCreativeProjects([])).toEqual([]);
    });
  });
});
