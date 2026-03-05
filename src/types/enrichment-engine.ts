// src/types/enrichment-engine.ts
// Domain types for Enrichment Engine.
// Matches DB tables: enrichment_credits, enrichment_recipes, enrichment_runs.

// ─── Credits ──────────────────────────────────

export interface EnrichmentCredit {
  id: string;
  organizationId: string;
  provider: string;
  totalCredits: number;
  usedCredits: number;
  resetAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Recipe ───────────────────────────────────

export const RECIPE_TARGET_TYPES = ['client', 'contact', 'project'] as const;
export type RecipeTargetType = (typeof RECIPE_TARGET_TYPES)[number];

export const RECIPE_TARGET_LABELS: Record<RecipeTargetType, string> = {
  client: 'Client',
  contact: 'Contact',
  project: 'Project',
};

export interface EnrichmentRecipe {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  steps: unknown[];
  targetEntityType: RecipeTargetType;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Run ──────────────────────────────────────

export const ENRICHMENT_RUN_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
export type EnrichmentRunStatus = (typeof ENRICHMENT_RUN_STATUSES)[number];

export const ENRICHMENT_RUN_STATUS_LABELS: Record<EnrichmentRunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export const ENRICHMENT_RUN_STATUS_COLORS: Record<EnrichmentRunStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface EnrichmentRun {
  id: string;
  organizationId: string;
  recipeId: string | null;
  status: EnrichmentRunStatus;
  entityType: string;
  entityIds: string[];
  results: unknown[];
  creditsUsed: number;
  startedAt: string | null;
  completedAt: string | null;
  errorLog: unknown[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
