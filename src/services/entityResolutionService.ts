import type { ResolutionCandidate, ResolutionStatus, EntitySourceMapping } from '@/types/entity-resolution';

// ─── Resolution Candidate Row ────────────────

export interface ResolutionCandidateRow {
  id: string;
  organization_id: string;
  entity_a_type: string;
  entity_a_id: string;
  entity_b_type: string;
  entity_b_id: string;
  confidence_score: number;
  match_reasons: unknown;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toResolutionCandidate(row: ResolutionCandidateRow): ResolutionCandidate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityAType: row.entity_a_type,
    entityAId: row.entity_a_id,
    entityBType: row.entity_b_type,
    entityBId: row.entity_b_id,
    confidenceScore: Number(row.confidence_score) || 0,
    matchReasons: (Array.isArray(row.match_reasons) ? row.match_reasons : []) as string[],
    status: row.status as ResolutionStatus,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toResolutionCandidates(rows: readonly ResolutionCandidateRow[]): ResolutionCandidate[] {
  return rows.map(toResolutionCandidate);
}

// ─── Source Mapping Row ──────────────────────

export interface EntitySourceMappingRow {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  source_provider: string;
  source_id: string;
  source_data: Record<string, unknown>;
  is_primary: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toEntitySourceMapping(row: EntitySourceMappingRow): EntitySourceMapping {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    sourceProvider: row.source_provider,
    sourceId: row.source_id,
    sourceData: row.source_data ?? {},
    isPrimary: row.is_primary ?? false,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toEntitySourceMappings(rows: readonly EntitySourceMappingRow[]): EntitySourceMapping[] {
  return rows.map(toEntitySourceMapping);
}
