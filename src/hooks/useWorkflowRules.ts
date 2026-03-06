import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { WorkflowRule, TriggerEntity, TriggerEvent, TriggerCondition, WorkflowAction } from '@/types/creative-workflow';

interface WorkflowRuleRow {
  id: string;
  organization_id: string;
  name: string;
  trigger_entity: string;
  trigger_event: string;
  trigger_condition: Record<string, unknown>;
  actions: Record<string, unknown>[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toWorkflowRule(row: WorkflowRuleRow): WorkflowRule {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    triggerEntity: row.trigger_entity as TriggerEntity,
    triggerEvent: row.trigger_event as TriggerEvent,
    triggerCondition: row.trigger_condition as unknown as TriggerCondition,
    actions: row.actions as unknown as WorkflowAction[],
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const workflowKeys = {
  all: (orgId: string) => ['workflow-rules', orgId] as const,
};

export function useWorkflowRules() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useQuery<WorkflowRule[]>({
    queryKey: workflowKeys.all(orgId ?? ''),
    queryFn: async () => {
      const { data, error } = await fromTable('creative_workflow_rules')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as WorkflowRuleRow[]).map(toWorkflowRule);
    },
    enabled: !!orgId,
  });
}

export interface CreateRuleInput {
  name: string;
  triggerEntity: TriggerEntity;
  triggerEvent: TriggerEvent;
  triggerCondition: TriggerCondition;
  actions: WorkflowAction[];
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      if (!orgId) throw new Error('No organization');
      const { data, error } = await fromTable('creative_workflow_rules')
        .insert({
          organization_id: orgId,
          name: input.name,
          trigger_entity: input.triggerEntity,
          trigger_event: input.triggerEvent,
          trigger_condition: input.triggerCondition,
          actions: input.actions,
          created_by: membership?.user_id,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toWorkflowRule(data as WorkflowRuleRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateRuleInput> & { id: string }) => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.triggerEntity !== undefined) dbUpdates.trigger_entity = updates.triggerEntity;
      if (updates.triggerEvent !== undefined) dbUpdates.trigger_event = updates.triggerEvent;
      if (updates.triggerCondition !== undefined) dbUpdates.trigger_condition = updates.triggerCondition;
      if (updates.actions !== undefined) dbUpdates.actions = updates.actions;

      const { error } = await fromTable('creative_workflow_rules')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('creative_workflow_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
}

export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await fromTable('creative_workflow_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
}
