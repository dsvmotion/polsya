// src/types/style-intelligence.ts
// Domain types for Style Intelligence engine.
// Matches DB table: creative_style_analyses.

export interface ColorSwatch {
  hex: string;
  name?: string;
  percentage?: number;
}

export interface TypographyProfile {
  primaryFont?: string;
  secondaryFont?: string;
  headingStyle?: string;
  bodyStyle?: string;
  scale?: string;
}

export interface StyleAnalysis {
  id: string;
  organizationId: string;
  clientId: string | null;
  portfolioId: string | null;
  sourceUrl: string | null;
  colorPalette: ColorSwatch[];
  typographyProfile: TypographyProfile;
  layoutPatterns: string[];
  brandAttributes: Record<string, unknown>;
  confidenceScore: number;
  analyzedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StyleSimilarityResult {
  id: string;
  clientId: string | null;
  portfolioId: string | null;
  similarity: number;
}
