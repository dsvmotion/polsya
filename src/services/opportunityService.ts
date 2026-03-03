import type { AccountOpportunity, OpportunityStage } from '@/types/entity';

export interface OpportunityRow {
  id: string;
  pharmacy_id: string;
  title: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toAccountOpportunity(row: OpportunityRow): AccountOpportunity {
  return {
    id: row.id,
    entityId: row.pharmacy_id,
    title: row.title,
    stage: row.stage,
    amount: row.amount,
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAccountOpportunities(rows: readonly OpportunityRow[]): AccountOpportunity[] {
  return rows.map(toAccountOpportunity);
}
