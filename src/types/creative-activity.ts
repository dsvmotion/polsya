// Domain types for creative entity activities.

export const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'task'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  task: 'Task',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, { bg: string; text: string }> = {
  call: { bg: 'bg-blue-100', text: 'text-blue-800' },
  email: { bg: 'bg-purple-100', text: 'text-purple-800' },
  meeting: { bg: 'bg-green-100', text: 'text-green-800' },
  note: { bg: 'bg-amber-100', text: 'text-amber-800' },
  task: { bg: 'bg-pink-100', text: 'text-pink-800' },
};

export interface Activity {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  occurredAt: string;
  durationMinutes: number | null;
  outcome: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  isCompleted: boolean;
  reminderAt: string | null;
  assignedTo: string | null;
  reminderSent: boolean;
}
