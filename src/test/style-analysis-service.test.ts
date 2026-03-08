import { describe, it, expect } from 'vitest';
import {
  toStyleAnalysis,
  toStyleAnalyses,
  type StyleAnalysisRow,
} from '@/services/styleAnalysisService';

const makeRow = (o: Partial<StyleAnalysisRow> = {}): StyleAnalysisRow => ({
  id: 'sa-1',
  organization_id: 'org-1',
  client_id: 'c-1',
  portfolio_id: 'p-1',
  source_url: 'https://brand.example.com',
  style_embedding: [0.1, 0.2, 0.3],
  color_palette: [{ hex: '#ff0000', name: 'Red' }],
  typography_profile: { primary: 'Inter', secondary: 'Georgia' },
  layout_patterns: ['grid', 'hero-banner'],
  brand_attributes: { tone: 'professional' },
  confidence_score: 0.95,
  analyzed_at: '2025-06-01T00:00:00Z',
  metadata: { version: 2 },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

describe('styleAnalysisService', () => {
  describe('toStyleAnalysis', () => {
    it('maps all fields', () => {
      const result = toStyleAnalysis(makeRow());
      expect(result.id).toBe('sa-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.clientId).toBe('c-1');
      expect(result.portfolioId).toBe('p-1');
      expect(result.sourceUrl).toBe('https://brand.example.com');
      expect(result.colorPalette).toEqual([{ hex: '#ff0000', name: 'Red' }]);
      expect(result.typographyProfile).toEqual({ primary: 'Inter', secondary: 'Georgia' });
      expect(result.layoutPatterns).toEqual(['grid', 'hero-banner']);
      expect(result.brandAttributes).toEqual({ tone: 'professional' });
      expect(result.confidenceScore).toBe(0.95);
      expect(result.analyzedAt).toBe('2025-06-01T00:00:00Z');
    });

    it('handles null optional fields', () => {
      const result = toStyleAnalysis(
        makeRow({ client_id: null, portfolio_id: null, source_url: null, analyzed_at: null }),
      );
      expect(result.clientId).toBeNull();
      expect(result.portfolioId).toBeNull();
      expect(result.sourceUrl).toBeNull();
      expect(result.analyzedAt).toBeNull();
    });

    it('defaults nullish arrays/objects', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).color_palette = null;
      (row as unknown as Record<string, unknown>).typography_profile = null;
      (row as unknown as Record<string, unknown>).layout_patterns = null;
      (row as unknown as Record<string, unknown>).brand_attributes = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toStyleAnalysis(row);
      expect(result.colorPalette).toEqual([]);
      expect(result.typographyProfile).toEqual({});
      expect(result.layoutPatterns).toEqual([]);
      expect(result.brandAttributes).toEqual({});
      expect(result.metadata).toEqual({});
    });

    it('coerces confidence_score to number', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).confidence_score = '0.88';
      expect(toStyleAnalysis(row).confidenceScore).toBe(0.88);
    });

    it('defaults invalid confidence_score to 0', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).confidence_score = 'invalid';
      expect(toStyleAnalysis(row).confidenceScore).toBe(0);
    });
  });

  describe('toStyleAnalyses', () => {
    it('maps array', () => {
      const result = toStyleAnalyses([makeRow({ id: 'a' }), makeRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('returns empty for empty input', () => {
      expect(toStyleAnalyses([])).toEqual([]);
    });
  });
});
