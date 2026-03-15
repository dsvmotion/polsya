import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  AgentActionLog,
  AgentActionType,
  AgentActionStatus,
  AgentTargetType,
} from '@/types/agents';

const QUERY_KEY = ['agent-actions'] as const;

export function useAgentActions(limit = 20) {
  return useQuery<AgentActionLog[]>({
    queryKey: [...QUERY_KEY, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_actions_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const msg = (error.message ?? '').toLowerCase();
        if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache')) {
          return [];
        }
        throw new Error(error.message);
      }
      return (data ?? []) as unknown as AgentActionLog[];
    },
  });
}

interface CreateAgentActionInput {
  agentName: string;
  actionType: AgentActionType;
  targetType: AgentTargetType;
  targetId?: string | null;
  payload?: Record<string, unknown>;
  status?: AgentActionStatus;
  errorMessage?: string | null;
  requestedBy?: string | null;
  idempotencyKey?: string | null;
}

export function useCreateAgentAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgentActionInput) => {
      const { data, error } = await supabase
        .from('agent_actions_log')
        .insert({
          agent_name: input.agentName,
          action_type: input.actionType,
          target_type: input.targetType,
          target_id: input.targetId ?? null,
          payload: (input.payload ?? {}) as unknown as import('@/integrations/supabase/types').Json,
          status: input.status ?? 'queued',
          error_message: input.errorMessage ?? null,
          requested_by: input.requestedBy ?? null,
          idempotency_key: input.idempotencyKey ?? null,
          completed_at: input.status && input.status !== 'queued'
            ? new Date().toISOString()
            : null,
          approved_at: input.status && input.status !== 'queued'
            ? new Date().toISOString()
            : null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as AgentActionLog;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

interface UpdateAgentActionStatusInput {
  id: string;
  status: AgentActionStatus;
  errorMessage?: string | null;
}

export function useUpdateAgentActionStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAgentActionStatusInput) => {
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        status: input.status,
      };
      if (input.status !== 'queued') {
        updates.completed_at = now;
        updates.approved_at = now;
      }
      if (input.errorMessage !== undefined) {
        updates.error_message = input.errorMessage;
      }

      const { data, error } = await supabase
        .from('agent_actions_log')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as AgentActionLog;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

interface ApproveAgentActionInput {
  id: string;
  approvedBy?: string;
  approvalNote?: string;
}

export function useApproveAgentAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApproveAgentActionInput) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('agent_actions_log')
        .update({
          status: 'success',
          approved_by: input.approvedBy ?? 'manual-review',
          approved_at: now,
          approval_note: input.approvalNote ?? null,
          completed_at: now,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as AgentActionLog;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

interface RejectAgentActionInput {
  id: string;
  approvedBy?: string;
  approvalNote?: string;
}

export function useRejectAgentAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RejectAgentActionInput) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('agent_actions_log')
        .update({
          status: 'rejected',
          approved_by: input.approvedBy ?? 'manual-review',
          approved_at: now,
          approval_note: input.approvalNote ?? null,
          completed_at: now,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as AgentActionLog;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Deterministic string builder for idempotency keys.
 * Produces a stable key from an object by sorting keys and joining values.
 */
export function createIdempotencyKey(input: Record<string, unknown>): string {
  const parts = Object.keys(input)
    .sort()
    .map((k) => `${k}:${String(input[k] ?? '')}`)
    .join('|');
  let hash = 0;
  for (let i = 0; i < parts.length; i++) {
    hash = ((hash << 5) - hash + parts.charCodeAt(i)) | 0;
  }
  return `idk_${(hash >>> 0).toString(36)}`;
}
