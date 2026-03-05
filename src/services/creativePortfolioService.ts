import type { CreativePortfolio, PortfolioCategory } from '@/types/creative';

export interface CreativePortfolioRow {
  id: string;
  organization_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  media_urls: string[];
  thumbnail_url: string | null;
  is_public: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativePortfolio(row: CreativePortfolioRow): CreativePortfolio {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    category: (row.category as PortfolioCategory) ?? null,
    mediaUrls: row.media_urls ?? [],
    thumbnailUrl: row.thumbnail_url,
    isPublic: row.is_public ?? false,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativePortfolios(rows: readonly CreativePortfolioRow[]): CreativePortfolio[] {
  return rows.map(toCreativePortfolio);
}
