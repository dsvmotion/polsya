export const NOTIFICATION_TYPES = ['reminder', 'workflow', 'mention', 'system', 'ai_insight'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreativeNotification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  reminder: 'Reminder',
  workflow: 'Workflow',
  mention: 'Mention',
  system: 'System',
  ai_insight: 'AI Insight',
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, { bg: string; text: string }> = {
  reminder: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  workflow: { bg: 'bg-purple-100', text: 'text-purple-800' },
  mention: { bg: 'bg-blue-100', text: 'text-blue-800' },
  system: { bg: 'bg-gray-100', text: 'text-gray-800' },
  ai_insight: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
};
