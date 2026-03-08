import { describe, it, expect } from 'vitest';
import {
  toCreativeClient,
  toCreativeClients,
  type CreativeClientRow,
} from '@/services/creativeClientService';

const makeRow = (o: Partial<CreativeClientRow> = {}): CreativeClientRow => ({
  id: 'cl-1',
  organization_id: 'org-1',
  name: 'Acme Studios',
  slug: 'acme-studios',
  website: 'https://acme.com',
  industry: 'design',
  sub_industry: 'branding',
  size_category: 'mid-market',
  status: 'active',
  logo_url: 'https://acme.com/logo.png',
  description: 'Creative agency',
  tags: ['premium', 'design'],
  social_links: { twitter: '@acme' },
  metadata: { source: 'manual' },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

describe('creativeClientService', () => {
  describe('toCreativeClient', () => {
    it('maps all fields from snake_case to camelCase', () => {
      const result = toCreativeClient(makeRow());
      expect(result.id).toBe('cl-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.name).toBe('Acme Studios');
      expect(result.slug).toBe('acme-studios');
      expect(result.website).toBe('https://acme.com');
      expect(result.industry).toBe('design');
      expect(result.subIndustry).toBe('branding');
      expect(result.sizeCategory).toBe('mid-market');
      expect(result.status).toBe('active');
      expect(result.logoUrl).toBe('https://acme.com/logo.png');
      expect(result.description).toBe('Creative agency');
      expect(result.tags).toEqual(['premium', 'design']);
      expect(result.socialLinks).toEqual({ twitter: '@acme' });
      expect(result.metadata).toEqual({ source: 'manual' });
    });

    it('handles null optional fields', () => {
      const result = toCreativeClient(
        makeRow({
          slug: null,
          website: null,
          industry: null,
          sub_industry: null,
          size_category: null,
          logo_url: null,
          description: null,
        }),
      );
      expect(result.slug).toBeNull();
      expect(result.website).toBeNull();
      expect(result.industry).toBeNull();
      expect(result.subIndustry).toBeNull();
      expect(result.sizeCategory).toBeNull();
      expect(result.logoUrl).toBeNull();
      expect(result.description).toBeNull();
    });

    it('defaults nullish tags/socialLinks/metadata to empty', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).tags = null;
      (row as unknown as Record<string, unknown>).social_links = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toCreativeClient(row);
      expect(result.tags).toEqual([]);
      expect(result.socialLinks).toEqual({});
      expect(result.metadata).toEqual({});
    });
  });

  describe('toCreativeClients', () => {
    it('maps array', () => {
      const result = toCreativeClients([makeRow({ id: 'a' }), makeRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('returns empty for empty input', () => {
      expect(toCreativeClients([])).toEqual([]);
    });
  });
});
