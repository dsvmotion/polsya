import type { EnrichmentCredit, EnrichmentRecipe, RecipeTargetType, EnrichmentRun, EnrichmentRunStatus } from '@/types/enrichment-engine';

// ─── Credit Row ──────────────────────────────

export interface EnrichmentCreditRow {
  id: string;
  organization_id: string;
  provider: string;
  total_credits: number;
  used_credits: number;
  reset_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toEnrichmentCredit(row: EnrichmentCreditRow): EnrichmentCredit {
  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: row.provider,
    totalCredits: row.total_credits ?? 0,
    usedCredits: row.used_credits ?? 0,
    resetAt: row.reset_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toEnrichmentCredits(rows: readonly EnrichmentCreditRow[]): EnrichmentCredit[] {
  return rows.map(toEnrichmentCredit);
}

// ─── Recipe Row ──────────────────────────────

export interface EnrichmentRecipeRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  steps: unknown[];
  target_entity_type: string;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toEnrichmentRecipe(row: EnrichmentRecipeRow): EnrichmentRecipe {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    steps: (row.steps ?? []) as unknown[],
    targetEntityType: row.target_entity_type as RecipeTargetType,
    isActive: row.is_active ?? true,
    runCount: row.run_count ?? 0,
    lastRunAt: row.last_run_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toEnrichmentRecipes(rows: readonly EnrichmentRecipeRow[]): EnrichmentRecipe[] {
  return rows.map(toEnrichmentRecipe);
}

// ─── Run Row ─────────────────────────────────

export interface EnrichmentRunRow {
  id: string;
  organization_id: string;
  recipe_id: string | null;
  status: string;
  entity_type: string;
  entity_ids: string[];
  results: unknown[];
  credits_used: number;
  started_at: string | null;
  completed_at: string | null;
  error_log: unknown[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toEnrichmentRun(row: EnrichmentRunRow): EnrichmentRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    recipeId: row.recipe_id,
    status: row.status as EnrichmentRunStatus,
    entityType: row.entity_type,
    entityIds: row.entity_ids ?? [],
    results: (row.results ?? []) as unknown[],
    creditsUsed: row.credits_used ?? 0,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorLog: (row.error_log ?? []) as unknown[],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toEnrichmentRuns(rows: readonly EnrichmentRunRow[]): EnrichmentRun[] {
  return rows.map(toEnrichmentRun);
}
