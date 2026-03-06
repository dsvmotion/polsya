# Phase 4 Design: Smart Notifications & Workflow Automation

**Date:** 2026-03-05
**Status:** Approved

---

## Overview

Turn the Creative Intelligence Platform from a passive data-entry tool into a proactive productivity engine. Four capabilities:

1. **In-app notification center** — real-time notification bell with grouped, clickable, entity-linked alerts
2. **Activity reminders & task tracking** — due dates, assignments, cron-based reminder notifications
3. **Workflow rules engine** — configurable triggers ("when opportunity moves to Won → create project") with 4 action types
4. **AI weekly digest** — automated natural-language summary of the week's pipeline changes, wins, and overdue tasks

---

## 1. In-App Notification Center

### Database: `creative_notifications`

```sql
CREATE TABLE creative_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('reminder', 'workflow', 'mention', 'system', 'ai_insight')),
  title           text NOT NULL,
  body            text,
  entity_type     text,
  entity_id       uuid,
  is_read         boolean NOT NULL DEFAULT false,
  action_url      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON creative_notifications(user_id, is_read)
  WHERE is_read = false;

CREATE INDEX idx_notifications_org
  ON creative_notifications(organization_id);
```

RLS: Users can SELECT/UPDATE their own notifications (matched by `user_id`). INSERT via service role (edge functions).

### Types — `src/types/creative-notification.ts`

```typescript
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

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  reminder: 'Bell',
  workflow: 'Workflow',
  mention: 'AtSign',
  system: 'Info',
  ai_insight: 'Sparkles',
};
```

### Hook — `src/hooks/useNotifications.ts`

- `useNotifications()` — fetch unread + recent (last 50), ordered by `created_at desc`
- `useUnreadCount()` — lightweight count query for badge
- `useMarkAsRead(id)` — mutation to set `is_read = true`
- `useMarkAllAsRead()` — mutation to mark all unread as read
- Supabase Realtime subscription on `creative_notifications` filtered by `user_id` for live badge updates

### Components

- `NotificationBell.tsx` — bell icon with red unread-count badge, opens panel on click
- `NotificationPanel.tsx` — sliding panel (Sheet) listing notifications grouped by "Today", "Yesterday", "Earlier"
- `NotificationItem.tsx` — single notification row: icon by type, title, body preview, relative timestamp, click navigates to `actionUrl`

### Wiring

- `NotificationBell` placed in sidebar header (next to user avatar area in `CreativeSidebar.tsx`)
- Panel uses `useNotifications` hook with realtime subscription

---

## 2. Activity Reminders & Task Tracking

### Database: Extend `creative_activities`

```sql
ALTER TABLE creative_activities
  ADD COLUMN due_date          timestamptz,
  ADD COLUMN is_completed      boolean NOT NULL DEFAULT false,
  ADD COLUMN reminder_at       timestamptz,
  ADD COLUMN assigned_to       uuid REFERENCES auth.users(id),
  ADD COLUMN reminder_sent     boolean NOT NULL DEFAULT false;

CREATE INDEX idx_activities_reminders
  ON creative_activities(reminder_at, is_completed, reminder_sent)
  WHERE reminder_at IS NOT NULL AND is_completed = false AND reminder_sent = false;
```

### Edge function: `activity-reminders` (cron, every 15 min)

```
pg_cron: */15 * * * *
```

Logic:
1. Query activities where `reminder_at <= now() AND is_completed = false AND reminder_sent = false`
2. For each, create a `creative_notifications` row (type=`reminder`, title=activity title, entity link)
3. Set `reminder_sent = true` on the activity

### UI Updates

- `ActivityFormSheet.tsx` — add due date picker (only shown when type = `task`), assigned-to user select, reminder toggle (sets `reminder_at` to 1 hour before `due_date` by default)
- `ActivityTimeline.tsx` — show due date badge on tasks, checkmark toggle for `is_completed`, overdue styling (red text if `due_date < now() && !is_completed`)
- Dashboard — add "Overdue Tasks" count to metrics row or a small tasks widget

---

## 3. Workflow Rules Engine

### Database: `creative_workflow_rules`

```sql
CREATE TABLE creative_workflow_rules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  trigger_entity    text NOT NULL CHECK (trigger_entity IN ('client', 'project', 'opportunity', 'contact')),
  trigger_event     text NOT NULL CHECK (trigger_event IN ('stage_change', 'status_change', 'created')),
  trigger_condition jsonb NOT NULL DEFAULT '{}',
  actions           jsonb NOT NULL DEFAULT '[]',
  is_active         boolean NOT NULL DEFAULT true,
  created_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_rules_org ON creative_workflow_rules(organization_id);
CREATE INDEX idx_workflow_rules_trigger ON creative_workflow_rules(trigger_entity, trigger_event) WHERE is_active = true;
```

RLS: org members can SELECT; admins can INSERT/UPDATE/DELETE.

### Trigger Condition Schema

```typescript
interface TriggerCondition {
  field: string;       // e.g. "stage", "status"
  from?: string;       // previous value (optional, "any" if omitted)
  to: string;          // new value (required)
}
```

### Action Schema (4 types for v1)

```typescript
type WorkflowAction =
  | { type: 'create_activity'; activityType: string; title: string; description?: string }
  | { type: 'create_notification'; title: string; body?: string; notifyRole?: 'all' | 'admins' }
  | { type: 'update_entity'; field: string; value: unknown }
  | { type: 'create_project'; titleTemplate: string; status?: string };
```

### Edge function: `workflow-engine`

Called by database triggers on `creative_clients`, `creative_projects`, `creative_opportunities`, `creative_contacts` tables (AFTER UPDATE trigger).

Logic:
1. Receive `{ entity_type, entity_id, old_record, new_record }` from DB trigger
2. Determine which fields changed
3. Query active rules matching `trigger_entity` + `trigger_event`
4. Evaluate `trigger_condition` against old→new values
5. Execute matching actions (insert activities, notifications, update entities, create projects)

### Database Triggers

```sql
CREATE OR REPLACE FUNCTION trigger_workflow_engine()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/workflow-engine',
    body := jsonb_build_object(
      'entity_type', TG_ARGV[0],
      'entity_id', NEW.id,
      'organization_id', NEW.organization_id,
      'old_record', to_jsonb(OLD),
      'new_record', to_jsonb(NEW)
    ),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to each entity table with the entity type as argument.

### Types — `src/types/creative-workflow.ts`

```typescript
export const TRIGGER_ENTITIES = ['client', 'project', 'opportunity', 'contact'] as const;
export type TriggerEntity = (typeof TRIGGER_ENTITIES)[number];

export const TRIGGER_EVENTS = ['stage_change', 'status_change', 'created'] as const;
export type TriggerEvent = (typeof TRIGGER_EVENTS)[number];

export const ACTION_TYPES = ['create_activity', 'create_notification', 'update_entity', 'create_project'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface WorkflowRule {
  id: string;
  organizationId: string;
  name: string;
  triggerEntity: TriggerEntity;
  triggerEvent: TriggerEvent;
  triggerCondition: TriggerCondition;
  actions: WorkflowAction[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Hook — `src/hooks/useWorkflowRules.ts`

- `useWorkflowRules()` — fetch all rules for org
- `useCreateRule` / `useUpdateRule` / `useDeleteRule` mutations
- `useToggleRule(id)` — quick toggle `is_active`

### Components

- `WorkflowRulesPage.tsx` — `/creative/workflows` route; list of rules with name, trigger summary, action count, active toggle, create button
- `WorkflowRuleSheet.tsx` — create/edit sheet with trigger config (entity select, event select, condition builder) and action list (add/remove action cards with type-specific fields)
- `WorkflowRuleCard.tsx` — list item showing rule summary

### Sidebar

- Add "Workflows" icon (Workflow from lucide-react) between Signals and Enrichment
- Route: `/creative/workflows`

---

## 4. AI Weekly Digest

### Edge function: `ai-weekly-digest` (cron, weekly Monday 8am)

```
pg_cron: 0 8 * * 1
```

Logic per organization:
1. Query key metrics: new clients this week, pipeline value change, opportunities won/lost, overdue tasks count, new activities count
2. Build a structured summary object
3. Call AI (same proxy pattern as chat) with system prompt: "Generate a concise weekly business summary for a creative agency CRM"
4. Create a `creative_notifications` row (type=`ai_insight`) for each org admin with the AI-generated digest
5. Deduct 1 credit per digest generation

### Notification Display

AI insight notifications render with a special card style in the notification panel — slightly larger, with a sparkle icon and formatted body.

---

## 5. Migration Plan

Single migration file: `gen_49_notifications_workflows.sql`

1. Create `creative_notifications` table + indices + RLS
2. Alter `creative_activities` with new columns + index
3. Create `creative_workflow_rules` table + indices + RLS
4. Create `trigger_workflow_engine()` function
5. Create triggers on entity tables

---

## 6. Testing Strategy

1. **Type maps & constants** — notification types, trigger entities, action types (same pattern as ai-documents tests)
2. **Workflow rule evaluation** — pure function that takes (old_record, new_record, rule) → boolean (should trigger?)
3. **Action executor** — pure function for each action type
4. **Notification creation** — type contract tests for `CreativeNotification`
5. **Reminder scheduling** — pure function that determines if reminder should fire
6. **toNotification / toWorkflowRule mappers** — snake_case → camelCase conversion

---

## 7. Implementation Task Breakdown

| # | Task | Complexity |
|---|------|-----------|
| 1 | DB migration (notifications, activity columns, workflow rules, triggers) | Medium |
| 2 | Notification types + hook | Low |
| 3 | NotificationBell + NotificationPanel components | Medium |
| 4 | Activity reminders (extend form, timeline, edge function) | Medium |
| 5 | Workflow types + hook | Low |
| 6 | Workflow rules page + sheet components | Medium |
| 7 | Workflow engine edge function + DB triggers | High |
| 8 | AI weekly digest edge function | Medium |
| 9 | Tests | Medium |
| 10 | Build + deploy verification | Low |
