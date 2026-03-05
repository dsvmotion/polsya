// src/services/creativeOpportunityService.ts
import type { CreativeOpportunity, OpportunityStage } from '@/types/creative';

export interface CreativeOpportunityRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  stage: string;
  value_cents: number | null;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  source: string | null;
  lost_reason: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeOpportunity(row: CreativeOpportunityRow): CreativeOpportunity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    contactId: row.contact_id,
    title: row.title,
    description: row.description,
    stage: row.stage as OpportunityStage,
    valueCents: row.value_cents,
    currency: row.currency ?? 'USD',
    probability: row.probability ?? 0,
    expectedCloseDate: row.expected_close_date,
    source: row.source,
    lostReason: row.lost_reason,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeOpportunities(rows: readonly CreativeOpportunityRow[]): CreativeOpportunity[] {
  return rows.map(toCreativeOpportunity);
}
