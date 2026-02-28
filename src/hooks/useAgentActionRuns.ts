import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgentActionRun, AgentActionRunStatus } from '@/types/agents';

function queryKey(actionId: string) {
  return ['agent-action-runs', actionId] as const;
}

export function useAgentActionRuns(actionId: string | null, limit = 5) {
  return useQuery<AgentActionRun[]>({
    queryKey: queryKey(actionId ?? ''),
    enabled: !!actionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_action_runs')
        .select('*')
        .eq('action_id', actionId!)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AgentActionRun[];
    },
  });
}

interface CreateRunInput {
  actionId: string;
  runStatus: AgentActionRunStatus;
  operationSummary?: string | null;
  errorMessage?: string | null;
  finishedAt?: string | null;
}

export function useCreateAgentActionRun() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRunInput) => {
      const { data, error } = await supabase
        .from('agent_action_runs')
        .insert({
          action_id: input.actionId,
          run_status: input.runStatus,
          operation_summary: input.operationSummary ?? null,
          error_message: input.errorMessage ?? null,
          finished_at: input.finishedAt ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as AgentActionRun;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKey(variables.actionId) });
    },
  });
}

interface UpdateRunInput {
  id: string;
  actionId: string;
  runStatus: AgentActionRunStatus;
  operationSummary?: string | null;
  errorMessage?: string | null;
  rollbackSummary?: string | null;
}

export function useUpdateAgentActionRun() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRunInput) => {
      const updates: Record<string, unknown> = {
        run_status: input.runStatus,
        finished_at: new Date().toISOString(),
      };
      if (input.operationSummary !== undefined) updates.operation_summary = input.operationSummary;
      if (input.errorMessage !== undefined) updates.error_message = input.errorMessage;
      if (input.rollbackSummary !== undefined) updates.rollback_summary = input.rollbackSummary;

      const { data, error } = await supabase
        .from('agent_action_runs')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as AgentActionRun;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKey(variables.actionId) });
    },
  });
}

/**
 * Create a "started" run for an action. Returns the run id.
 */
export async function logRunStart(actionId: string): Promise<string> {
  const { data, error } = await supabase
    .from('agent_action_runs')
    .insert({ action_id: actionId, run_status: 'started' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

/**
 * Close a run as success with an operation summary.
 */
export async function logRunSuccess(runId: string, summary: string): Promise<void> {
  const { error } = await supabase
    .from('agent_action_runs')
    .update({
      run_status: 'success',
      finished_at: new Date().toISOString(),
      operation_summary: summary,
    })
    .eq('id', runId);

  if (error) throw new Error(error.message);
}

/**
 * Close a run as error with an error message.
 */
export async function logRunError(runId: string, errorMsg: string): Promise<void> {
  const { error } = await supabase
    .from('agent_action_runs')
    .update({
      run_status: 'error',
      finished_at: new Date().toISOString(),
      error_message: errorMsg,
    })
    .eq('id', runId);

  if (error) throw new Error(error.message);
}
