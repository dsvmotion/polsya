import type { StyleAnalysis, ColorSwatch, TypographyProfile } from '@/types/style-intelligence';

export interface StyleAnalysisRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  portfolio_id: string | null;
  source_url: string | null;
  style_embedding: unknown;
  color_palette: unknown;
  typography_profile: unknown;
  layout_patterns: unknown;
  brand_attributes: Record<string, unknown>;
  confidence_score: number;
  analyzed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toStyleAnalysis(row: StyleAnalysisRow): StyleAnalysis {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    portfolioId: row.portfolio_id,
    sourceUrl: row.source_url,
    colorPalette: (row.color_palette ?? []) as ColorSwatch[],
    typographyProfile: (row.typography_profile ?? {}) as TypographyProfile,
    layoutPatterns: (row.layout_patterns ?? []) as string[],
    brandAttributes: row.brand_attributes ?? {},
    confidenceScore: Number(row.confidence_score) || 0,
    analyzedAt: row.analyzed_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toStyleAnalyses(rows: readonly StyleAnalysisRow[]): StyleAnalysis[] {
  return rows.map(toStyleAnalysis);
}
