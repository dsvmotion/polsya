import type { AccountOpportunity } from '@/types/entity';
import type { PharmacyOpportunity } from '@/types/pharmacy';

export function toAccountOpportunity(row: PharmacyOpportunity): AccountOpportunity {
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

export function toAccountOpportunities(rows: readonly PharmacyOpportunity[]): AccountOpportunity[] {
  return rows.map(toAccountOpportunity);
}
