import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
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
  due_date: string | null;
  is_completed: boolean;
  reminder_at: string | null;
  assigned_to: string | null;
  reminder_sent: boolean;
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
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    reminderAt: row.reminder_at,
    assignedTo: row.assigned_to,
    reminderSent: row.reminder_sent,
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
      const { data, error } = await fromTable('creative_activities')
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
      const { data, error } = await fromTable('creative_activities')
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
  dueDate?: string;
  assignedTo?: string;
  reminderAt?: string;
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: CreateActivityInput) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await fromTable('creative_activities')
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
          due_date: values.dueDate ?? null,
          assigned_to: values.assignedTo ?? null,
          reminder_at: values.reminderAt ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toActivity(data as ActivityRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-activities'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('creative_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-activities'] });
    },
  });
}

export function useToggleComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { error } = await fromTable('creative_activities')
        .update({ is_completed: !isCompleted })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-activities'] });
    },
  });
}

export function useOverdueTasks() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<Activity[]>({
    queryKey: ['creative-activities', 'overdue', orgId ?? ''],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await fromTable('creative_activities')
        .select('*')
        .eq('organization_id', orgId!)
        .eq('activity_type', 'task')
        .eq('is_completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as ActivityRow[]).map(toActivity);
    },
  });
}
