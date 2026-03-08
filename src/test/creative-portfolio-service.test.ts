import { describe, it, expect } from 'vitest';
import {
  toCreativePortfolio,
  toCreativePortfolios,
  type CreativePortfolioRow,
} from '@/services/creativePortfolioService';

const makeRow = (o: Partial<CreativePortfolioRow> = {}): CreativePortfolioRow => ({
  id: 'pf-1',
  organization_id: 'org-1',
  project_id: 'pr-1',
  client_id: 'cl-1',
  title: 'Acme Branding',
  description: 'Full brand identity package',
  category: 'branding',
  media_urls: ['https://cdn.example.com/img1.jpg', 'https://cdn.example.com/img2.jpg'],
  thumbnail_url: 'https://cdn.example.com/thumb.jpg',
  is_public: true,
  tags: ['featured'],
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

describe('creativePortfolioService', () => {
  describe('toCreativePortfolio', () => {
    it('maps all fields', () => {
      const result = toCreativePortfolio(makeRow());
      expect(result.id).toBe('pf-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.projectId).toBe('pr-1');
      expect(result.clientId).toBe('cl-1');
      expect(result.title).toBe('Acme Branding');
      expect(result.description).toBe('Full brand identity package');
      expect(result.category).toBe('branding');
      expect(result.mediaUrls).toEqual([
        'https://cdn.example.com/img1.jpg',
        'https://cdn.example.com/img2.jpg',
      ]);
      expect(result.thumbnailUrl).toBe('https://cdn.example.com/thumb.jpg');
      expect(result.isPublic).toBe(true);
      expect(result.tags).toEqual(['featured']);
    });

    it('handles null optional fields', () => {
      const result = toCreativePortfolio(
        makeRow({
          project_id: null,
          client_id: null,
          description: null,
          category: null,
          thumbnail_url: null,
        }),
      );
      expect(result.projectId).toBeNull();
      expect(result.clientId).toBeNull();
      expect(result.description).toBeNull();
      expect(result.category).toBeNull();
      expect(result.thumbnailUrl).toBeNull();
    });

    it('defaults nullish is_public to false', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).is_public = null;
      expect(toCreativePortfolio(row).isPublic).toBe(false);
    });

    it('defaults nullish media_urls/tags/metadata to empty', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).media_urls = null;
      (row as unknown as Record<string, unknown>).tags = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toCreativePortfolio(row);
      expect(result.mediaUrls).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('toCreativePortfolios', () => {
    it('maps array', () => {
      const result = toCreativePortfolios([makeRow({ id: 'a' }), makeRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toCreativePortfolios([])).toEqual([]);
    });
  });
});
