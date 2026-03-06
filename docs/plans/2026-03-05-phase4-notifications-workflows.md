# Phase 4: Smart Notifications & Workflow Automation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add in-app notifications, activity reminders, configurable workflow rules, and AI weekly digest to make the platform proactive.

**Architecture:** New DB tables for notifications + workflow rules, extend creative_activities with task fields, cron edge functions for reminders and digests, trigger-based workflow engine, NotificationBell + Panel in sidebar, Workflows page at `/creative/workflows`.

**Tech Stack:** Supabase (Postgres, Edge Functions, Realtime), React, TanStack Query, Lucide icons, Shadcn UI (Sheet, Tabs, Badge, Switch), Deno (edge functions).

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260311100000_notifications_workflows.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Phase 4: Notifications, Activity Task Fields, Workflow Rules
-- ============================================================

-- 1. creative_notifications
create table if not exists public.creative_notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('reminder', 'workflow', 'mention', 'system', 'ai_insight')),
  title           text not null,
  body            text,
  entity_type     text,
  entity_id       uuid,
  is_read         boolean not null default false,
  action_url      text,
  created_at      timestamptz not null default now()
);

create index idx_notifications_user_unread
  on public.creative_notifications(user_id, is_read)
  where is_read = false;
create index idx_notifications_org
  on public.creative_notifications(organization_id);

alter table public.creative_notifications enable row level security;

create policy "Users can view their own notifications"
  on public.creative_notifications for select
  using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on public.creative_notifications for update
  using (user_id = auth.uid());

create policy "Service role can insert notifications"
  on public.creative_notifications for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- 2. Extend creative_activities with task fields
alter table public.creative_activities
  add column if not exists due_date      timestamptz,
  add column if not exists is_completed  boolean not null default false,
  add column if not exists reminder_at   timestamptz,
  add column if not exists assigned_to   uuid references auth.users(id),
  add column if not exists reminder_sent boolean not null default false;

create index if not exists idx_activities_reminders
  on public.creative_activities(reminder_at, is_completed, reminder_sent)
  where reminder_at is not null and is_completed = false and reminder_sent = false;

create index if not exists idx_activities_due
  on public.creative_activities(due_date)
  where due_date is not null and is_completed = false;

-- 3. creative_workflow_rules
create table if not exists public.creative_workflow_rules (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  trigger_entity    text not null check (trigger_entity in ('client', 'project', 'opportunity', 'contact')),
  trigger_event     text not null check (trigger_event in ('stage_change', 'status_change', 'created')),
  trigger_condition jsonb not null default '{}',
  actions           jsonb not null default '[]',
  is_active         boolean not null default true,
  created_by        uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_workflow_rules_org on public.creative_workflow_rules(organization_id);
create index idx_workflow_rules_trigger
  on public.creative_workflow_rules(trigger_entity, trigger_event)
  where is_active = true;

alter table public.creative_workflow_rules enable row level security;

create policy "Users can view workflow rules in their organization"
  on public.creative_workflow_rules for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can insert workflow rules in their organization"
  on public.creative_workflow_rules for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can update workflow rules in their organization"
  on public.creative_workflow_rules for update
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can delete workflow rules in their organization"
  on public.creative_workflow_rules for delete
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
```

**Step 2: Apply the migration**

Run: `npx supabase db push` (or apply via Supabase dashboard)

**Step 3: Regenerate types**

Run: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/20260311100000_notifications_workflows.sql src/integrations/supabase/types.ts
git commit -m "feat(db): add notifications, activity task fields, and workflow rules migration"
```

---

### Task 2: Notification Types + Hook

**Files:**
- Create: `src/types/creative-notification.ts`
- Create: `src/hooks/useNotifications.ts`

**Step 1: Create notification types**

File: `src/types/creative-notification.ts`

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
```

**Step 2: Create notification hook**

File: `src/hooks/useNotifications.ts`

Pattern: Same as `useAiDocuments.ts` — `fromTable`, query keys, `toNotification` mapper.

Hooks needed:
- `useNotifications()` — fetch recent 50 notifications (read + unread) ordered by created_at desc
- `useUnreadCount()` — lightweight count query: `select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)`
- `useMarkAsRead(id)` — mutation to update `is_read = true`
- `useMarkAllAsRead()` — mutation to update all unread to `is_read = true` for the current user
- Set up Supabase Realtime subscription (via `useEffect` + `supabase.channel`) on `creative_notifications` filtered by `user_id` → invalidate query on INSERT

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/types/creative-notification.ts src/hooks/useNotifications.ts
git commit -m "feat: add notification types and useNotifications hook with realtime"
```

---

### Task 3: NotificationBell + NotificationPanel Components

**Files:**
- Create: `src/components/creative/notifications/NotificationBell.tsx`
- Create: `src/components/creative/notifications/NotificationPanel.tsx`
- Create: `src/components/creative/notifications/NotificationItem.tsx`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` — add bell to header area

**Step 1: Create NotificationItem component**

Renders a single notification row:
- Icon based on `type` (Bell, Workflow, AtSign, Info, Sparkles from lucide-react)
- Title + truncated body
- Relative timestamp (use `formatDistanceToNow` from date-fns or manual helper)
- Unread indicator (blue dot)
- Click handler: navigate to `actionUrl`, mark as read

**Step 2: Create NotificationPanel component**

Uses Shadcn Sheet (side="right"):
- Header with title "Notifications" and "Mark all read" button
- Group notifications by date: "Today", "Yesterday", "Earlier"
- Map notifications to NotificationItem components
- Empty state: "No notifications yet"
- Loading skeleton

**Step 3: Create NotificationBell component**

Small button component:
- Bell icon from lucide-react
- Red badge with unread count (uses `useUnreadCount`)
- onClick opens NotificationPanel

**Step 4: Wire into CreativeSidebar**

In `CreativeSidebar.tsx`, add `NotificationBell` to the sidebar header area (next to the logo). The sidebar already has a clean header section — add the bell to the right side of the header div. Import from `@/components/creative/notifications/NotificationBell`.

**Step 5: Run app and verify visually**

Run: `npm run dev`, check sidebar shows bell, click opens panel

**Step 6: Commit**

```bash
git add src/components/creative/notifications/ src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat: add NotificationBell, Panel, and Item components in sidebar"
```

---

### Task 4: Activity Reminders — Extend Form + Timeline

**Files:**
- Modify: `src/types/creative-activity.ts` — add `dueDate`, `isCompleted`, `reminderAt`, `assignedTo`, `reminderSent` to Activity interface
- Modify: `src/hooks/useCreativeActivities.ts` — update `toActivity` mapper, add `useToggleComplete` mutation, add `useOverdueTasks` query
- Modify: `src/components/creative/activities/ActivityFormSheet.tsx` — add due date picker, assigned-to select, reminder toggle (visible when type=task)
- Modify: `src/components/creative/activities/ActivityTimeline.tsx` — show due date badge, completion checkbox, overdue styling

**Step 1: Update Activity type**

Add to `Activity` interface:
```typescript
dueDate: string | null;
isCompleted: boolean;
reminderAt: string | null;
assignedTo: string | null;
reminderSent: boolean;
```

**Step 2: Update hook mapper**

Update `toActivity` in `useCreativeActivities.ts`:
- Map `due_date` → `dueDate`
- Map `is_completed` → `isCompleted`
- Map `reminder_at` → `reminderAt`
- Map `assigned_to` → `assignedTo`
- Map `reminder_sent` → `reminderSent`

Add `useToggleComplete(activityId)` mutation — updates `is_completed` toggle.
Add `useOverdueTasks()` query — filters `activity_type = 'task' AND due_date < now() AND is_completed = false`.

**Step 3: Update ActivityFormSheet**

When `activity_type === 'task'`:
- Show date picker for `due_date`
- Show select for `assigned_to` (populated from `useOrganizationMembers()`)
- Show toggle for "Set reminder" — when enabled, sets `reminder_at` = `due_date - 1 hour`

**Step 4: Update ActivityTimeline**

- Show due date badge on task items (green if future, red if overdue)
- Show checkbox to toggle `is_completed`
- Strikethrough completed tasks

**Step 5: Commit**

```bash
git add src/types/creative-activity.ts src/hooks/useCreativeActivities.ts src/components/creative/activities/
git commit -m "feat: extend activities with task tracking — due dates, completion, reminders"
```

---

### Task 5: Activity Reminders Edge Function

**Files:**
- Create: `supabase/functions/activity-reminders/index.ts`

**Step 1: Write the edge function**

Pattern follows `ai-document-ingest/index.ts`:
- Import shared CORS + auth helpers
- Uses service role client (no user auth — cron-triggered)
- Query: `creative_activities WHERE reminder_at <= now() AND is_completed = false AND reminder_sent = false`
- For each matching activity:
  - Look up `assigned_to` user (or fall back to `created_by`)
  - Insert `creative_notifications` row (type=`reminder`, title=activity title, entity link)
  - Update activity: set `reminder_sent = true`
- Return JSON with count of reminders sent

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Service role client (no user auth for cron)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: activities, error } = await supabase
    .from('creative_activities')
    .select('*')
    .lte('reminder_at', new Date().toISOString())
    .eq('is_completed', false)
    .eq('reminder_sent', false)
    .limit(100);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;
  for (const act of activities ?? []) {
    const targetUserId = act.assigned_to || act.created_by;
    if (!targetUserId) continue;

    await supabase.from('creative_notifications').insert({
      organization_id: act.organization_id,
      user_id: targetUserId,
      type: 'reminder',
      title: `Task reminder: ${act.title}`,
      body: act.description?.slice(0, 200) || null,
      entity_type: act.entity_type,
      entity_id: act.entity_id,
      action_url: `/creative/${act.entity_type}s`,
    });

    await supabase
      .from('creative_activities')
      .update({ reminder_sent: true })
      .eq('id', act.id);

    sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Step 2: Commit**

```bash
git add supabase/functions/activity-reminders/
git commit -m "feat: add activity-reminders cron edge function"
```

---

### Task 6: Workflow Types + Hook

**Files:**
- Create: `src/types/creative-workflow.ts`
- Create: `src/hooks/useWorkflowRules.ts`

**Step 1: Create workflow types**

File: `src/types/creative-workflow.ts`

```typescript
export const TRIGGER_ENTITIES = ['client', 'project', 'opportunity', 'contact'] as const;
export type TriggerEntity = (typeof TRIGGER_ENTITIES)[number];

export const TRIGGER_EVENTS = ['stage_change', 'status_change', 'created'] as const;
export type TriggerEvent = (typeof TRIGGER_EVENTS)[number];

export const ACTION_TYPES = ['create_activity', 'create_notification', 'update_entity', 'create_project'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface TriggerCondition {
  field: string;
  from?: string;
  to: string;
}

export type WorkflowAction =
  | { type: 'create_activity'; activityType: string; title: string; description?: string }
  | { type: 'create_notification'; title: string; body?: string; notifyRole?: 'all' | 'admins' }
  | { type: 'update_entity'; field: string; value: unknown }
  | { type: 'create_project'; titleTemplate: string; status?: string };

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

export const TRIGGER_ENTITY_LABELS: Record<TriggerEntity, string> = {
  client: 'Client',
  project: 'Project',
  opportunity: 'Opportunity',
  contact: 'Contact',
};

export const TRIGGER_EVENT_LABELS: Record<TriggerEvent, string> = {
  stage_change: 'Stage Change',
  status_change: 'Status Change',
  created: 'Created',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  create_activity: 'Create Activity',
  create_notification: 'Send Notification',
  update_entity: 'Update Entity',
  create_project: 'Create Project',
};
```

**Step 2: Create workflow rules hook**

File: `src/hooks/useWorkflowRules.ts`

Pattern: Same as `useAiDocuments.ts` — `fromTable`, query keys, mapper.

Hooks:
- `useWorkflowRules()` — fetch all rules for org, ordered by created_at desc
- `useCreateRule` — insert mutation
- `useUpdateRule` — update mutation
- `useDeleteRule` — delete mutation
- `useToggleRule(id)` — toggle `is_active` boolean

**Step 3: Commit**

```bash
git add src/types/creative-workflow.ts src/hooks/useWorkflowRules.ts
git commit -m "feat: add workflow rule types and useWorkflowRules hook"
```

---

### Task 7: Workflow Rules Page + Sheet Components

**Files:**
- Create: `src/pages/creative/CreativeWorkflows.tsx`
- Create: `src/components/creative/workflows/WorkflowRuleCard.tsx`
- Create: `src/components/creative/workflows/WorkflowRuleFormSheet.tsx`
- Modify: `src/App.tsx` — add lazy import + route for `/creative/workflows`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` — add Workflows to nav items

**Step 1: Create WorkflowRuleCard component**

Displays a single rule in a card:
- Name, trigger summary ("When Opportunity stage changes to Won")
- Action count badge
- Active/inactive toggle (Switch component)
- Edit button, delete button

**Step 2: Create WorkflowRuleFormSheet**

Sheet for creating/editing rules:
- Name input
- Trigger section:
  - Entity select (client, project, opportunity, contact)
  - Event select (stage_change, status_change, created)
  - Condition builder (field, from, to — using entity-specific field options)
- Actions section:
  - Add action button
  - Per action card: type select + type-specific fields
  - Remove action button per card
- Save / Cancel buttons

For entity-specific fields:
- opportunity: stages (lead, qualified, proposal, negotiation, won, lost)
- project: statuses (draft, active, on_hold, completed, cancelled)
- client: statuses (prospect, active, inactive, archived)
- contact: statuses (active, inactive, archived)

**Step 3: Create CreativeWorkflows page**

Pattern: Same as `CreativeSignals.tsx` — uses `WorkspaceContainer`, lists rules via `useWorkflowRules()`, add button opens `WorkflowRuleFormSheet`, grid of `WorkflowRuleCard` components.

**Step 4: Add route in App.tsx**

Add lazy import:
```typescript
const CreativeWorkflows = lazy(() => import("./pages/creative/CreativeWorkflows"));
```

Add route inside CreativeLayout routes:
```tsx
<Route path="workflows" element={<CreativeWorkflows />} />
```

**Step 5: Add sidebar nav item**

In `CreativeSidebar.tsx`, add to `mainNavItems` after Signals:
```typescript
import { ..., Workflow } from 'lucide-react';

// In mainNavItems array, after Signals:
{ label: 'Workflows', icon: Workflow, path: '/creative/workflows' },
```

Note: The icon `Workflow` may not exist in lucide-react. Alternative: `GitBranch`, `Repeat`, or `Activity`. Check `lucide-react` exports. If `Workflow` doesn't exist, use `GitBranch`.

**Step 6: Run and verify**

Run: `npm run dev`, navigate to `/creative/workflows`, verify page loads, create a rule.

**Step 7: Commit**

```bash
git add src/pages/creative/CreativeWorkflows.tsx src/components/creative/workflows/ src/App.tsx src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat: add Workflows page with rule cards, form sheet, and sidebar nav"
```

---

### Task 8: Workflow Engine Edge Function

**Files:**
- Create: `supabase/functions/workflow-engine/index.ts`

**Step 1: Write the workflow engine edge function**

This function is called when entity changes occur. It receives:
```typescript
{
  entity_type: string;
  entity_id: string;
  organization_id: string;
  old_record: Record<string, unknown>;
  new_record: Record<string, unknown>;
}
```

Logic:
1. Determine the trigger event: compare old vs new to detect stage_change, status_change, or created
2. Query active rules matching `trigger_entity` + `trigger_event` + `organization_id`
3. Evaluate each rule's `trigger_condition` against the actual change
4. For matching rules, execute each action:
   - `create_activity` → insert into `creative_activities`
   - `create_notification` → insert into `creative_notifications` for relevant users
   - `update_entity` → update the entity record
   - `create_project` → insert into `creative_projects`
5. Return summary of executed actions

Use service role client. No user auth required (triggered by DB trigger or direct call).

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';

// ... (full implementation)
```

**Step 2: Commit**

```bash
git add supabase/functions/workflow-engine/
git commit -m "feat: add workflow-engine edge function for rule evaluation and action execution"
```

---

### Task 9: AI Weekly Digest Edge Function

**Files:**
- Create: `supabase/functions/ai-weekly-digest/index.ts`

**Step 1: Write the weekly digest edge function**

Pattern follows `ai-chat-proxy/index.ts` for AI call.

Logic per organization (iterate all active orgs):
1. Query metrics: count of new clients, pipeline value changes, opportunities won/lost, overdue tasks, new activities this week
2. Build structured summary
3. Call OpenAI (or configured provider) with system prompt: "Generate a concise weekly business summary for a creative agency CRM based on these metrics"
4. Insert notification (type=`ai_insight`) for each org admin
5. Deduct 1 AI credit

Keep this function lightweight — no complex aggregations, just counts and sums for the past 7 days.

**Step 2: Commit**

```bash
git add supabase/functions/ai-weekly-digest/
git commit -m "feat: add ai-weekly-digest cron edge function"
```

---

### Task 10: Tests

**Files:**
- Create: `src/test/creative-notifications.test.ts`
- Create: `src/test/creative-workflows.test.ts`

**Step 1: Write notification tests**

Pattern: Same as `src/test/ai-documents.test.ts`.

Test sections:
1. Type maps and constants — `NOTIFICATION_TYPES`, labels, colors (same pattern as ai-documents)
2. `toNotification` mapper — snake_case → camelCase, null handling
3. Notification type contract — construct valid `CreativeNotification` objects

**Step 2: Write workflow tests**

Test sections:
1. Type maps — `TRIGGER_ENTITIES`, `TRIGGER_EVENTS`, `ACTION_TYPES`, labels
2. `toWorkflowRule` mapper — snake_case → camelCase
3. `shouldTriggerRule` pure function — evaluates trigger condition against old/new records
4. Action type validation — ensure action objects conform to `WorkflowAction` union
5. Workflow rule type contract — construct valid `WorkflowRule` objects

Mirror `shouldTriggerRule` from the workflow engine for testability:
```typescript
function shouldTriggerRule(
  rule: { triggerEvent: string; triggerCondition: TriggerCondition },
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
): boolean {
  const { field, from, to } = rule.triggerCondition;
  const oldValue = oldRecord[field];
  const newValue = newRecord[field];

  if (newValue !== to) return false;
  if (from && from !== 'any' && oldValue !== from) return false;
  if (oldValue === newValue) return false;

  return true;
}
```

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (335 existing + new tests)

**Step 4: Commit**

```bash
git add src/test/creative-notifications.test.ts src/test/creative-workflows.test.ts
git commit -m "test: add notification and workflow rule tests"
```

---

### Task 11: Build + Deploy Verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Production build**

Run: `npx vite build`
Expected: Build succeeds

**Step 4: Push and create PR**

```bash
git push -u origin feat/phase-4-notifications-workflows
gh pr create --title "Phase 4: Smart Notifications & Workflow Automation" --body "..."
```
