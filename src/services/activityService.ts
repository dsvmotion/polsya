import type { AccountActivity, ActivityType } from '@/types/entity';

export interface ActivityRow {
  id: string;
  pharmacy_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  due_at: string | null;
  completed_at: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export function toAccountActivity(row: ActivityRow): AccountActivity {
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

export function toAccountActivities(rows: readonly ActivityRow[]): AccountActivity[] {
  return rows.map(toAccountActivity);
}
