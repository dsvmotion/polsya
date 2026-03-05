// src/services/creativeClientService.ts
import type { CreativeClient, ClientStatus, ClientSize } from '@/types/creative';

export interface CreativeClientRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  website: string | null;
  industry: string | null;
  sub_industry: string | null;
  size_category: string | null;
  status: string;
  logo_url: string | null;
  description: string | null;
  tags: string[];
  social_links: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeClient(row: CreativeClientRow): CreativeClient {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    website: row.website,
    industry: row.industry,
    subIndustry: row.sub_industry,
    sizeCategory: (row.size_category as ClientSize) ?? null,
    status: row.status as ClientStatus,
    logoUrl: row.logo_url,
    description: row.description,
    tags: row.tags ?? [],
    socialLinks: row.social_links ?? {},
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeClients(rows: readonly CreativeClientRow[]): CreativeClient[] {
  return rows.map(toCreativeClient);
}
