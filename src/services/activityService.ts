import type { AccountActivity } from '@/types/entity';
import type { PharmacyActivity } from '@/types/pharmacy';

export function toAccountActivity(row: PharmacyActivity): AccountActivity {
  return {
    id: row.id,
    entityId: row.pharmacy_id,
    activityType: row.activity_type,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    owner: row.owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAccountActivities(rows: readonly PharmacyActivity[]): AccountActivity[] {
  return rows.map(toAccountActivity);
}
