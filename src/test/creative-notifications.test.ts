import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
} from '@/types/creative-notification';
import type { CreativeNotification, NotificationType } from '@/types/creative-notification';

// ---------------------------------------------------------------------------
// 1. Type maps and constants
// ---------------------------------------------------------------------------
describe('creative-notification type maps and constants', () => {
  it('NOTIFICATION_TYPES contains exactly 5 items: reminder, workflow, mention, system, ai_insight', () => {
    expect([...NOTIFICATION_TYPES]).toEqual(['reminder', 'workflow', 'mention', 'system', 'ai_insight']);
  });

  it('NOTIFICATION_TYPE_LABELS has a label for every type and labels are non-empty strings', () => {
    for (const type of NOTIFICATION_TYPES) {
      const label = NOTIFICATION_TYPE_LABELS[type];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('NOTIFICATION_TYPE_COLORS has bg and text for every type', () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_COLORS[type]).toHaveProperty('bg');
      expect(NOTIFICATION_TYPE_COLORS[type]).toHaveProperty('text');
    }
  });

  it('label map keys match NOTIFICATION_TYPES exactly (no extras, no missing)', () => {
    expect(Object.keys(NOTIFICATION_TYPE_LABELS).sort()).toEqual([...NOTIFICATION_TYPES].sort());
  });

  it('color map keys match NOTIFICATION_TYPES exactly', () => {
    expect(Object.keys(NOTIFICATION_TYPE_COLORS).sort()).toEqual([...NOTIFICATION_TYPES].sort());
  });
});

// ---------------------------------------------------------------------------
// 2. toNotification mapper
// ---------------------------------------------------------------------------

// Mirror of NotificationRow from src/hooks/useNotifications.ts
interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// Mirror of toNotification from src/hooks/useNotifications.ts
function toNotification(row: NotificationRow): CreativeNotification {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    actionUrl: row.action_url,
    createdAt: row.created_at,
  };
}

describe('toNotification mapper', () => {
  const baseRow: NotificationRow = {
    id: 'notif-001',
    organization_id: 'org-123',
    user_id: 'user-456',
    type: 'reminder',
    title: 'Follow up with client',
    body: 'Remember to send the proposal.',
    entity_type: 'client',
    entity_id: 'client-789',
    is_read: false,
    action_url: '/clients/client-789',
    created_at: '2026-01-15T10:30:00Z',
  };

  it('maps all snake_case fields to camelCase correctly', () => {
    const n = toNotification(baseRow);
    expect(n.id).toBe('notif-001');
    expect(n.organizationId).toBe('org-123');
    expect(n.userId).toBe('user-456');
    expect(n.type).toBe('reminder');
    expect(n.title).toBe('Follow up with client');
    expect(n.body).toBe('Remember to send the proposal.');
    expect(n.entityType).toBe('client');
    expect(n.entityId).toBe('client-789');
    expect(n.isRead).toBe(false);
    expect(n.actionUrl).toBe('/clients/client-789');
    expect(n.createdAt).toBe('2026-01-15T10:30:00Z');
  });

  it('preserves null values for optional fields (body, entity_type, entity_id, action_url)', () => {
    const row: NotificationRow = {
      ...baseRow,
      body: null,
      entity_type: null,
      entity_id: null,
      action_url: null,
    };
    const n = toNotification(row);
    expect(n.body).toBeNull();
    expect(n.entityType).toBeNull();
    expect(n.entityId).toBeNull();
    expect(n.actionUrl).toBeNull();
  });

  it('handles all notification types correctly', () => {
    for (const type of NOTIFICATION_TYPES) {
      const n = toNotification({ ...baseRow, type });
      expect(n.type).toBe(type);
    }
  });

  it('maps unread notification (is_read: false)', () => {
    const n = toNotification({ ...baseRow, is_read: false });
    expect(n.isRead).toBe(false);
  });

  it('maps read notification (is_read: true)', () => {
    const n = toNotification({ ...baseRow, is_read: true });
    expect(n.isRead).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. CreativeNotification type contract
// ---------------------------------------------------------------------------
describe('CreativeNotification type contract', () => {
  it('constructs valid notification with all fields populated', () => {
    const notification: CreativeNotification = {
      id: 'notif-full',
      organizationId: 'org-100',
      userId: 'user-200',
      type: 'workflow',
      title: 'Stage changed',
      body: 'Project moved to In Progress.',
      entityType: 'project',
      entityId: 'proj-300',
      isRead: false,
      actionUrl: '/projects/proj-300',
      createdAt: '2026-02-01T08:00:00Z',
    };
    expect(notification.id).toBe('notif-full');
    expect(notification.type).toBe('workflow');
    expect(notification.body).toBe('Project moved to In Progress.');
    expect(notification.entityType).toBe('project');
    expect(notification.actionUrl).toBe('/projects/proj-300');
  });

  it('constructs notification with minimal fields (nulls where allowed)', () => {
    const notification: CreativeNotification = {
      id: 'notif-min',
      organizationId: 'org-100',
      userId: 'user-200',
      type: 'system',
      title: 'System update',
      body: null,
      entityType: null,
      entityId: null,
      isRead: true,
      actionUrl: null,
      createdAt: '2026-03-01T12:00:00Z',
    };
    expect(notification.body).toBeNull();
    expect(notification.entityType).toBeNull();
    expect(notification.entityId).toBeNull();
    expect(notification.actionUrl).toBeNull();
  });

  it('constructs notification for each type', () => {
    for (const type of NOTIFICATION_TYPES) {
      const notification: CreativeNotification = {
        id: `notif-${type}`,
        organizationId: 'org-100',
        userId: 'user-200',
        type,
        title: `Test ${type}`,
        body: null,
        entityType: null,
        entityId: null,
        isRead: false,
        actionUrl: null,
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(notification.type).toBe(type);
      expect(notification.id).toBe(`notif-${type}`);
    }
  });
});
