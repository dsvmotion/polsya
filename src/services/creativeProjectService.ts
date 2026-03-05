// src/services/creativeProjectService.ts
import type { CreativeProject, ProjectStatus } from '@/types/creative';

export interface CreativeProjectRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  project_type: string | null;
  status: string;
  budget_cents: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  deliverables: unknown[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeProject(row: CreativeProjectRow): CreativeProject {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    projectType: row.project_type,
    status: row.status as ProjectStatus,
    budgetCents: row.budget_cents,
    currency: row.currency ?? 'USD',
    startDate: row.start_date,
    endDate: row.end_date,
    deliverables: row.deliverables ?? [],
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeProjects(rows: readonly CreativeProjectRow[]): CreativeProject[] {
  return rows.map(toCreativeProject);
}
