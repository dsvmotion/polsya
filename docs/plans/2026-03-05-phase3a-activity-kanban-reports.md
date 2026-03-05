# Phase 3A: Activity Timeline + Kanban Board + Creative Reports

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add activity tracking on creative entities, drag-and-drop Kanban board view for opportunities/projects, and a creative analytics/reports page.

**Architecture:** Three independent feature areas: (1) Activity system — new DB table + types + hook + timeline component wired into all entity detail panels. (2) Kanban — extend ViewMode, build generic KanbanBoard component with HTML5 DnD, wire into Opportunities/Projects pages. (3) Reports — new page with recharts-powered charts fed by a creative reports hook.

**Tech Stack:** Supabase (PostgreSQL + RLS), React 18 + TypeScript, TanStack Query, recharts, shadcn/ui, Tailwind CSS, HTML5 Drag & Drop API

---

## Task 1: Database Migration — creative_activities

**Files:**
- Create: `supabase/migrations/20260309170000_creative_activities.sql`

**Step 1:** Create the migration file:

```sql
-- Creative Activities table for tracking interactions on entities
create table if not exists public.creative_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('client', 'contact', 'project', 'opportunity')),
  entity_id uuid not null,
  activity_type text not null check (activity_type in ('call', 'email', 'meeting', 'note', 'task')),
  title text not null,
  description text,
  occurred_at timestamptz not null default now(),
  duration_minutes integer,
  outcome text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_creative_activities_org on public.creative_activities(organization_id);
create index idx_creative_activities_entity on public.creative_activities(entity_type, entity_id);
create index idx_creative_activities_occurred on public.creative_activities(occurred_at desc);

-- RLS
alter table public.creative_activities enable row level security;

create policy "Users can view activities in their organization"
  on public.creative_activities for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can insert activities in their organization"
  on public.creative_activities for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can update activities in their organization"
  on public.creative_activities for update
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Users can delete activities in their organization"
  on public.creative_activities for delete
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
```

**Step 2:** Verify: `npx supabase migration list` shows the new migration.

**Step 3:** Commit:
```bash
git add supabase/migrations/20260309170000_creative_activities.sql
git commit -m "feat(db): add creative_activities table with RLS"
```

---

## Task 2: Activity Types

**Files:**
- Create: `src/types/creative-activity.ts`

**Step 1:** Create the types file:

```ts
// src/types/creative-activity.ts
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
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/types/creative-activity.ts
git commit -m "feat(types): add Activity types and constants"
```

---

## Task 3: Activity Hook — useCreativeActivities

**Files:**
- Create: `src/hooks/useCreativeActivities.ts`

**Step 1:** Create the hook following the established pattern from `useCreativeOpportunities.ts`:

```ts
// src/hooks/useCreativeActivities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { Activity, ActivityType } from '@/types/creative-activity';

interface ActivityRow {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  occurred_at: string;
  duration_minutes: number | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    activityType: row.activity_type as ActivityType,
    title: row.title,
    description: row.description,
    occurredAt: row.occurred_at,
    durationMinutes: row.duration_minutes,
    outcome: row.outcome,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const activityKeys = {
  all: (orgId: string) => ['creative-activities', orgId] as const,
  forEntity: (entityType: string, entityId: string) => ['creative-activities', entityType, entityId] as const,
  recent: (orgId: string) => ['creative-activities', 'recent', orgId] as const,
};

export function useCreativeActivities(entityType: string, entityId: string) {
  return useQuery<Activity[]>({
    queryKey: activityKeys.forEntity(entityType, entityId),
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('creative_activities')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as ActivityRow[]).map(toActivity);
    },
  });
}

export function useRecentActivities(limit: number = 5) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<Activity[]>({
    queryKey: activityKeys.recent(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('creative_activities')
        .select('*')
        .eq('organization_id', orgId!)
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as ActivityRow[]).map(toActivity);
    },
  });
}

export interface CreateActivityInput {
  entityType: string;
  entityId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  occurredAt: string;
  durationMinutes?: number;
  outcome?: string;
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: CreateActivityInput) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await (supabase.from as any)('creative_activities')
        .insert({
          organization_id: orgId,
          entity_type: values.entityType,
          entity_id: values.entityId,
          activity_type: values.activityType,
          title: values.title,
          description: values.description ?? null,
          occurred_at: values.occurredAt,
          duration_minutes: values.durationMinutes ?? null,
          outcome: values.outcome ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toActivity(data as ActivityRow);
    },
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ['creative-activities'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('creative_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-activities'] });
    },
  });
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/hooks/useCreativeActivities.ts
git commit -m "feat(hooks): add useCreativeActivities with CRUD"
```

---

## Task 4: ActivityTimeline Component

**Files:**
- Create: `src/components/creative/shared/ActivityTimeline.tsx`

**Step 1:** Create the timeline component:

```tsx
// src/components/creative/shared/ActivityTimeline.tsx
import { Phone, Mail, Users, FileText, CheckSquare, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCreativeActivities, useDeleteActivity } from '@/hooks/useCreativeActivities';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS } from '@/types/creative-activity';
import type { ActivityType } from '@/types/creative-activity';

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  task: CheckSquare,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
  onAddClick?: () => void;
}

export function ActivityTimeline({ entityType, entityId, onAddClick }: ActivityTimelineProps) {
  const { data: activities = [], isLoading } = useCreativeActivities(entityType, entityId);
  const deleteMutation = useDeleteActivity();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-2">No activities recorded yet.</p>
        {onAddClick && (
          <Button variant="outline" size="sm" onClick={onAddClick}>
            Log Activity
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.activityType];
        const colors = ACTIVITY_TYPE_COLORS[activity.activityType];
        return (
          <div key={activity.id} className="flex items-start gap-3 py-2 group">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${colors.bg}`}>
              <Icon className={`h-4 w-4 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{activity.title}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {ACTIVITY_TYPE_LABELS[activity.activityType]}
                </Badge>
              </div>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{timeAgo(activity.occurredAt)}</span>
                {activity.durationMinutes && (
                  <span className="text-xs text-muted-foreground">· {activity.durationMinutes}min</span>
                )}
                {activity.outcome && (
                  <span className="text-xs text-muted-foreground">· {activity.outcome}</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => deleteMutation.mutate(activity.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/components/creative/shared/ActivityTimeline.tsx
git commit -m "feat(activity): add ActivityTimeline component"
```

---

## Task 5: ActivityFormSheet Component

**Files:**
- Create: `src/components/creative/shared/ActivityFormSheet.tsx`

**Step 1:** Create the form sheet:

```tsx
// src/components/creative/shared/ActivityFormSheet.tsx
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCreateActivity } from '@/hooks/useCreativeActivities';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '@/types/creative-activity';
import type { ActivityType } from '@/types/creative-activity';

interface ActivityFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
}

interface FormValues {
  activityType: ActivityType;
  title: string;
  description: string;
  occurredAt: string;
  durationMinutes: string;
  outcome: string;
}

export function ActivityFormSheet({ open, onOpenChange, entityType, entityId }: ActivityFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateActivity();

  const form = useForm<FormValues>({
    defaultValues: {
      activityType: 'note',
      title: '',
      description: '',
      occurredAt: new Date().toISOString().slice(0, 16),
      durationMinutes: '',
      outcome: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        entityType,
        entityId,
        activityType: values.activityType,
        title: values.title,
        description: values.description || undefined,
        occurredAt: new Date(values.occurredAt).toISOString(),
        durationMinutes: values.durationMinutes ? parseInt(values.durationMinutes) : undefined,
        outcome: values.outcome || undefined,
      });
      toast({ title: 'Activity logged' });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Activity</SheetTitle>
          <SheetDescription>Record an interaction or task for this {entityType}.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Discovery call with team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occurredAt"
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Key discussion points, decisions..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Scheduled follow-up, Sent proposal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Log Activity'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/components/creative/shared/ActivityFormSheet.tsx
git commit -m "feat(activity): add ActivityFormSheet component"
```

---

## Task 6: Wire Activities into Entity Detail Panels

**Files:**
- Modify: `src/components/creative/clients/ClientDetail.tsx`
- Modify: `src/components/creative/contacts/ContactDetail.tsx`
- Modify: `src/components/creative/projects/ProjectDetail.tsx`
- Modify: `src/components/creative/opportunities/OpportunityDetail.tsx`

**Step 1:** In each detail panel, add a `CollapsibleEngineSection` for Activities **before** the existing engine sections (if any) or before the metadata footer. The pattern is the same for all four — add imports, state, and the section.

Add these imports to each file:
```tsx
import { useState } from 'react'; // already imported in most
import { Clock } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { ActivityTimeline } from '@/components/creative/shared/ActivityTimeline';
import { ActivityFormSheet } from '@/components/creative/shared/ActivityFormSheet';
import { useCreativeActivities } from '@/hooks/useCreativeActivities';
```

Add state for the form sheet (inside the component function):
```tsx
const [activityFormOpen, setActivityFormOpen] = useState(false);
const { data: activities = [], isLoading: activitiesLoading } = useCreativeActivities('client', client.id);
// or 'contact', contact.id / 'project', project.id / 'opportunity', opportunity.id
```

Add the collapsible section (before the "Created" metadata footer `<div className="text-xs text-muted-foreground pt-4 border-t">`):
```tsx
<CollapsibleEngineSection
  icon={Clock}
  label="Activities"
  count={activities.length}
  isLoading={activitiesLoading}
  defaultOpen
>
  <ActivityTimeline
    entityType="client" // or 'contact', 'project', 'opportunity'
    entityId={client.id} // or contact.id, project.id, opportunity.id
    onAddClick={() => setActivityFormOpen(true)}
  />
</CollapsibleEngineSection>

<ActivityFormSheet
  open={activityFormOpen}
  onOpenChange={setActivityFormOpen}
  entityType="client" // or 'contact', 'project', 'opportunity'
  entityId={client.id} // or contact.id, project.id, opportunity.id
/>
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/components/creative/clients/ClientDetail.tsx src/components/creative/contacts/ContactDetail.tsx src/components/creative/projects/ProjectDetail.tsx src/components/creative/opportunities/OpportunityDetail.tsx
git commit -m "feat(activity): wire ActivityTimeline into all entity detail panels"
```

---

## Task 7: Dashboard — Recent Activities Card

**Files:**
- Modify: `src/pages/creative/CreativeDashboard.tsx`

**Step 1:** Add `useRecentActivities` import and use it in the dashboard. Replace the "Recent Signals" section's logic to show activities when available, falling back to signals.

Add import:
```tsx
import { useRecentActivities } from '@/hooks/useCreativeActivities';
import { ACTIVITY_TYPE_COLORS } from '@/types/creative-activity';
import type { ActivityType } from '@/types/creative-activity';
```

Add hook call:
```tsx
const { data: recentActivities = [] } = useRecentActivities(5);
```

Replace the left "Recent Signals" card content to show a split view — first showing recent activities if any exist, then recent signals below:

Change the card title to "Recent Activity" and add activity rows above the signal rows. Each activity row: activity type color dot + title + time ago.

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/pages/creative/CreativeDashboard.tsx
git commit -m "feat(dashboard): add recent activities to dashboard"
```

---

## Task 8: Extend ViewMode with 'board'

**Files:**
- Modify: `src/lib/design-tokens.ts`
- Modify: `src/components/creative/navigation/ViewSwitcher.tsx`

**Step 1:** In `design-tokens.ts`, change:
```ts
export const viewModes = ['table', 'cards', 'graph', 'map'] as const;
```
to:
```ts
export const viewModes = ['table', 'cards', 'board', 'graph', 'map'] as const;
```

**Step 2:** In `ViewSwitcher.tsx`, add `Columns3` to the lucide imports:
```tsx
import { LayoutGrid, Table2, GitBranch, Map, Columns3 } from 'lucide-react';
```

Add the board entry to `viewConfig`:
```ts
const viewConfig: Record<ViewMode, { icon: typeof Table2; label: string }> = {
  table: { icon: Table2, label: 'Table' },
  cards: { icon: LayoutGrid, label: 'Cards' },
  board: { icon: Columns3, label: 'Board' },
  graph: { icon: GitBranch, label: 'Graph' },
  map: { icon: Map, label: 'Map' },
};
```

**Step 3:** Verify: `npx tsc --noEmit` passes.

**Step 4:** Commit:
```bash
git add src/lib/design-tokens.ts src/components/creative/navigation/ViewSwitcher.tsx
git commit -m "feat(ui): add board view mode to ViewSwitcher"
```

---

## Task 9: KanbanBoard Component

**Files:**
- Create: `src/components/creative/shared/KanbanBoard.tsx`

**Step 1:** Create the generic Kanban board component using HTML5 Drag & Drop:

```tsx
// src/components/creative/shared/KanbanBoard.tsx
import { useState, type DragEvent, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface KanbanColumn {
  key: string;
  label: string;
  color: { bg: string; text: string };
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn[];
  items: T[];
  getColumnKey: (item: T) => string;
  onMove: (itemId: string, newColumnKey: string) => void;
  renderCard: (item: T) => ReactNode;
  isLoading?: boolean;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  getColumnKey,
  onMove,
  renderCard,
  isLoading,
}: KanbanBoardProps<T>) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  function handleDragStart(e: DragEvent, itemId: string) {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  }

  function handleDragOver(e: DragEvent, columnKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: DragEvent, columnKey: string) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && getColumnKey(items.find((i) => i.id === itemId)!) !== columnKey) {
      onMove(itemId, columnKey);
    }
    setDragOverColumn(null);
    setDraggedItemId(null);
  }

  function handleDragEnd() {
    setDragOverColumn(null);
    setDraggedItemId(null);
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.key} className="flex-shrink-0 w-72">
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted/60 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const columnItems = items.filter((item) => getColumnKey(item) === col.key);
        return (
          <div
            key={col.key}
            className={cn(
              'flex-shrink-0 w-72 rounded-lg border bg-muted/30 transition-colors',
              dragOverColumn === col.key && 'ring-2 ring-primary/50 bg-primary/5',
            )}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className={`text-sm font-medium ${col.color.text}`}>{col.label}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {columnItems.length}
              </Badge>
            </div>
            <ScrollArea className="p-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <div className="space-y-2">
                {columnItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No items
                  </div>
                ) : (
                  columnItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'cursor-grab active:cursor-grabbing rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow',
                        draggedItemId === item.id && 'opacity-50',
                      )}
                    >
                      {renderCard(item)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/components/creative/shared/KanbanBoard.tsx
git commit -m "feat(ui): add generic KanbanBoard component with HTML5 DnD"
```

---

## Task 10: Wire Kanban into CreativeOpportunities

**Files:**
- Modify: `src/pages/creative/CreativeOpportunities.tsx`

**Step 1:** Add imports:
```tsx
import { KanbanBoard } from '@/components/creative/shared/KanbanBoard';
import type { KanbanColumn } from '@/components/creative/shared/KanbanBoard';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';
import { useUpdateCreativeOpportunity } from '@/hooks/useCreativeOpportunities';
```

**Step 2:** Add the update mutation and column definitions inside the component:
```tsx
const updateMutation = useUpdateCreativeOpportunity();

const opportunityColumns: KanbanColumn[] = OPPORTUNITY_STAGES.map((stage) => ({
  key: stage,
  label: OPPORTUNITY_STAGE_LABELS[stage],
  color: OPPORTUNITY_STAGE_COLORS[stage],
}));
```

**Step 3:** Change `availableViews` from `['table', 'cards']` to `['table', 'cards', 'board']`.

**Step 4:** Add the board view branch after the cards view in the render. Between the closing of the cards grid `</div>` and the closing `</div>` of `mt-2`, add:
```tsx
) : viewMode === 'board' ? (
  <KanbanBoard
    columns={opportunityColumns}
    items={opportunities}
    getColumnKey={(opp) => opp.stage}
    onMove={(id, newStage) => updateMutation.mutate({ id, values: { stage: newStage as OpportunityStage } })}
    isLoading={isLoading}
    renderCard={(opp) => (
      <div className="space-y-1.5" onClick={() => handleRowClick(opp)}>
        <p className="text-sm font-medium truncate">{opp.title}</p>
        {opp.clientId && clientMap.get(opp.clientId) && (
          <p className="text-xs text-muted-foreground truncate">{clientMap.get(opp.clientId)}</p>
        )}
        <div className="flex items-center justify-between">
          {opp.valueCents != null && (
            <span className="text-xs font-medium">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: opp.currency ?? 'USD' }).format(opp.valueCents / 100)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{opp.probability}%</span>
        </div>
      </div>
    )}
  />
```

Adjust the conditional structure: `viewMode === 'table' ? (...) : viewMode === 'board' ? (...) : (cards view)`.

**Step 5:** Verify: `npx tsc --noEmit` passes.

**Step 6:** Commit:
```bash
git add src/pages/creative/CreativeOpportunities.tsx
git commit -m "feat(kanban): wire Kanban board view into Opportunities page"
```

---

## Task 11: Wire Kanban into CreativeProjects

**Files:**
- Modify: `src/pages/creative/CreativeProjects.tsx`

**Step 1:** Same pattern as Task 10. Add imports:
```tsx
import { KanbanBoard } from '@/components/creative/shared/KanbanBoard';
import type { KanbanColumn } from '@/components/creative/shared/KanbanBoard';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/creative';
import type { ProjectStatus } from '@/types/creative';
import { useUpdateCreativeProject } from '@/hooks/useCreativeProjects';
```

**Step 2:** Add inside the component:
```tsx
const updateMutation = useUpdateCreativeProject();

const projectColumns: KanbanColumn[] = PROJECT_STATUSES.map((status) => ({
  key: status,
  label: PROJECT_STATUS_LABELS[status],
  color: PROJECT_STATUS_COLORS[status],
}));
```

**Step 3:** Change `availableViews` to `['table', 'cards', 'board']`.

**Step 4:** Add board view branch with project-specific card render:
```tsx
) : viewMode === 'board' ? (
  <KanbanBoard
    columns={projectColumns}
    items={projects}
    getColumnKey={(p) => p.status}
    onMove={(id, newStatus) => updateMutation.mutate({ id, values: { status: newStatus as ProjectStatus } })}
    isLoading={isLoading}
    renderCard={(project) => (
      <div className="space-y-1.5" onClick={() => handleRowClick(project)}>
        <p className="text-sm font-medium truncate">{project.name}</p>
        {project.clientId && clientMap.get(project.clientId) && (
          <p className="text-xs text-muted-foreground truncate">{clientMap.get(project.clientId)}</p>
        )}
        <div className="flex items-center justify-between">
          {project.projectType && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{project.projectType}</span>
          )}
          {project.budgetCents != null && (
            <span className="text-xs font-medium">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency ?? 'USD' }).format(project.budgetCents / 100)}
            </span>
          )}
        </div>
      </div>
    )}
  />
```

**Step 5:** Verify: `npx tsc --noEmit` passes.

**Step 6:** Commit:
```bash
git add src/pages/creative/CreativeProjects.tsx
git commit -m "feat(kanban): wire Kanban board view into Projects page"
```

---

## Task 12: Creative Reports Hook

**Files:**
- Create: `src/hooks/useCreativeReports.ts`

**Step 1:** Create the hook:

```ts
// src/hooks/useCreativeReports.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';

export interface CreativeReportData {
  pipelineByStage: { stage: string; value: number; count: number }[];
  revenueOverTime: { month: string; revenue: number }[];
  funnelData: { stage: string; count: number; percentage: number }[];
  projectStatusBreakdown: { status: string; count: number }[];
  clientAcquisition: { month: string; count: number }[];
  kpis: {
    pipelineTotal: number;
    winRate: number;
    avgDealSize: number;
    activeProjects: number;
  };
}

function getCutoffDate(timeRange: TimeRange): Date | null {
  if (timeRange === 'all') return null;
  const days = parseInt(timeRange);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function useCreativeReports(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeReportData>({
    queryKey: ['creative-reports', orgId ?? '', timeRange],
    enabled: !!orgId,
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);

      // Fetch opportunities and projects
      let oppsQuery = (supabase.from as any)('creative_opportunities')
        .select('stage, value_cents, currency, created_at')
        .eq('organization_id', orgId!);
      if (cutoff) oppsQuery = oppsQuery.gte('created_at', cutoff.toISOString());

      let projectsQuery = (supabase.from as any)('creative_projects')
        .select('status, created_at')
        .eq('organization_id', orgId!);
      if (cutoff) projectsQuery = projectsQuery.gte('created_at', cutoff.toISOString());

      let clientsQuery = (supabase.from as any)('creative_clients')
        .select('created_at')
        .eq('organization_id', orgId!);
      if (cutoff) clientsQuery = clientsQuery.gte('created_at', cutoff.toISOString());

      const [oppsRes, projectsRes, clientsRes] = await Promise.all([
        oppsQuery, projectsQuery, clientsQuery,
      ]);

      const opps: { stage: string; value_cents: number | null; currency: string; created_at: string }[] = oppsRes.data ?? [];
      const projects: { status: string; created_at: string }[] = projectsRes.data ?? [];
      const clients: { created_at: string }[] = clientsRes.data ?? [];

      // Pipeline by stage
      const stageMap = new Map<string, { value: number; count: number }>();
      const openStages = ['lead', 'qualified', 'proposal', 'negotiation'];
      opps.forEach((o) => {
        if (openStages.includes(o.stage)) {
          const existing = stageMap.get(o.stage) ?? { value: 0, count: 0 };
          existing.value += (o.value_cents ?? 0) / 100;
          existing.count += 1;
          stageMap.set(o.stage, existing);
        }
      });
      const pipelineByStage = openStages
        .filter((s) => stageMap.has(s))
        .map((stage) => ({ stage, ...stageMap.get(stage)! }));

      // Revenue over time (won opps)
      const revenueMap = new Map<string, number>();
      opps.filter((o) => o.stage === 'won').forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + (o.value_cents ?? 0) / 100);
      });
      const revenueOverTime = Array.from(revenueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

      // Funnel data
      const funnelStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];
      const stageCounts = new Map<string, number>();
      opps.forEach((o) => {
        stageCounts.set(o.stage, (stageCounts.get(o.stage) ?? 0) + 1);
      });
      const totalLeads = stageCounts.get('lead') ?? 0 || 1;
      const funnelData = funnelStages.map((stage) => {
        const count = stageCounts.get(stage) ?? 0;
        return { stage, count, percentage: Math.round((count / totalLeads) * 100) };
      });

      // Project status breakdown
      const statusMap = new Map<string, number>();
      projects.forEach((p) => {
        statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
      });
      const projectStatusBreakdown = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }));

      // Client acquisition over time
      const clientMonthMap = new Map<string, number>();
      clients.forEach((c) => {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        clientMonthMap.set(key, (clientMonthMap.get(key) ?? 0) + 1);
      });
      const clientAcquisition = Array.from(clientMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      // KPIs
      const pipelineTotal = pipelineByStage.reduce((s, p) => s + p.value, 0);
      const won = opps.filter((o) => o.stage === 'won').length;
      const lost = opps.filter((o) => o.stage === 'lost').length;
      const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
      const avgDealSize = won > 0
        ? Math.round(opps.filter((o) => o.stage === 'won').reduce((s, o) => s + (o.value_cents ?? 0), 0) / won / 100)
        : 0;
      const activeProjects = projects.filter((p) => p.status === 'active').length;

      return {
        pipelineByStage,
        revenueOverTime,
        funnelData,
        projectStatusBreakdown,
        clientAcquisition,
        kpis: { pipelineTotal, winRate, avgDealSize, activeProjects },
      };
    },
  });
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/hooks/useCreativeReports.ts
git commit -m "feat(reports): add useCreativeReports hook"
```

---

## Task 13: Creative Reports Page

**Files:**
- Create: `src/pages/creative/CreativeReports.tsx`

**Step 1:** Create the reports page following the pattern from `src/pages/Reports.tsx`:

```tsx
// src/pages/creative/CreativeReports.tsx
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useCreativeReports } from '@/hooks/useCreativeReports';
import { OPPORTUNITY_STAGE_LABELS } from '@/types/creative';
import { PROJECT_STATUS_LABELS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';
import type { ProjectStatus } from '@/types/creative';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 72%, 46%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 67%, 51%)',
  'hsl(190, 80%, 50%)',
];

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';

export default function CreativeReports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = useCreativeReports(timeRange);

  const kpis = data?.kpis ?? { pipelineTotal: 0, winRate: 0, avgDealSize: 0, activeProjects: 0 };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <WorkspaceContainer
      title="Creative Reports"
      description="Analytics and insights for your creative business"
      actions={
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 mb-8">
        <KpiCard icon={Briefcase} label="Pipeline Total" value={formatCurrency(kpis.pipelineTotal)} loading={isLoading} />
        <KpiCard icon={TrendingUp} label="Win Rate" value={`${kpis.winRate}%`} loading={isLoading} />
        <KpiCard icon={BarChart3} label="Avg Deal Size" value={formatCurrency(kpis.avgDealSize)} loading={isLoading} />
        <KpiCard icon={PieChartIcon} label="Active Projects" value={String(kpis.activeProjects)} loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary section="pipeline-by-stage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.pipelineByStage.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.pipelineByStage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={90}
                        tickFormatter={(s) => OPPORTUNITY_STAGE_LABELS[s as OpportunityStage] ?? s}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                      />
                      <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No pipeline data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="revenue-over-time">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.revenueOverTime.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.revenueOverTime}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 72%, 46%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 72%, 46%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(142, 72%, 46%)" strokeWidth={2} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No revenue data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="conversion-funnel">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.funnelData.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.funnelData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="stage"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(s) => OPPORTUNITY_STAGE_LABELS[s as OpportunityStage] ?? s}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'percentage') return [`${value}%`, 'Conversion'];
                          return [value, 'Count'];
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No funnel data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="project-status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.projectStatusBreakdown.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data!.projectStatusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        label={({ status, percent }) =>
                          `${PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {data!.projectStatusBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No project data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </WorkspaceContainer>
  );
}

function KpiCard({ icon: Icon, label, value, loading }: { icon: typeof BarChart3; label: string; value: string; loading?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded bg-muted animate-pulse" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
```

**Step 2:** Verify: `npx tsc --noEmit` passes.

**Step 3:** Commit:
```bash
git add src/pages/creative/CreativeReports.tsx
git commit -m "feat(reports): add CreativeReports page with charts"
```

---

## Task 14: Wire Reports Route + Sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx`

**Step 1:** In `App.tsx`, add the lazy import after line 63 (after `CreativeResolution`):
```tsx
const CreativeReports = lazy(() => import("./pages/creative/CreativeReports"));
```

Add the route inside the `<Route path="creative" ...>` block, after `resolution`:
```tsx
<Route path="reports" element={<CreativeReports />} />
```

**Step 2:** In `CreativeSidebar.tsx`, add `BarChart3` to the existing lucide imports (it's already imported). Add the Reports nav item to `mainNavItems` array, between Dashboard and Clients:

Change the `mainNavItems` array to insert Reports after Dashboard:
```ts
const mainNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/creative' },
  { label: 'Reports', icon: BarChart3, path: '/creative/reports' },
  { label: 'Clients', icon: Users, path: '/creative/clients' },
  // ... rest unchanged
];
```

Add `BarChart3` to the lucide imports if not already there. Check the existing import line — it currently doesn't include `BarChart3`, so add it.

**Step 3:** Verify: `npx tsc --noEmit` passes.

**Step 4:** Commit:
```bash
git add src/App.tsx src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat(reports): wire Creative Reports route and sidebar nav"
```

---

## Task 15: Final Verification

**Step 1:** Run TypeScript compiler:
```bash
npx tsc --noEmit
```
Expected: zero errors.

**Step 2:** Run production build:
```bash
npx vite build
```
Expected: successful build.

**Step 3:** Push to origin:
```bash
git push origin main
```
