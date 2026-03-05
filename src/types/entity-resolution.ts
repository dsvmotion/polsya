// src/types/entity-resolution.ts
// Domain types for Entity Resolution engine.
// Matches DB tables: entity_resolution_candidates, entity_source_mappings.

// ─── Resolution Candidate ────────────────────

export const RESOLUTION_STATUSES = ['pending', 'confirmed', 'rejected', 'auto_merged'] as const;
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

export const RESOLUTION_STATUS_LABELS: Record<ResolutionStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  auto_merged: 'Auto-Merged',
};

export const RESOLUTION_STATUS_COLORS: Record<ResolutionStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  auto_merged: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export const ENTITY_TYPES = ['client', 'contact', 'project'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface ResolutionCandidate {
  id: string;
  organizationId: string;
  entityAType: string;
  entityAId: string;
  entityBType: string;
  entityBId: string;
  confidenceScore: number;
  matchReasons: string[];
  status: ResolutionStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Source Mapping ──────────────────────────

export interface EntitySourceMapping {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  sourceProvider: string;
  sourceId: string;
  sourceData: Record<string, unknown>;
  isPrimary: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
