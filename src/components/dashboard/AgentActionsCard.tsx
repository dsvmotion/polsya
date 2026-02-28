import { useState, useCallback, useRef } from 'react';
import { Bot, Plus, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useAgentActions,
  useCreateAgentAction,
  useApproveAgentAction,
  useRejectAgentAction,
  createIdempotencyKey,
} from '@/hooks/useAgentActions';
import {
  ACTION_TYPE_LABELS,
  ACTION_STATUS_COLORS,
  TARGET_TYPE_LABELS,
  RUN_STATUS_COLORS,
} from '@/types/agents';
import type { AgentActionLog, AgentActionRun } from '@/types/agents';
import {
  logRunStart,
  logRunSuccess,
  logRunError,
} from '@/hooks/useAgentActionRuns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface ActionRowProps {
  action: AgentActionLog;
  runs: AgentActionRun[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}

function ActionRow({ action, runs, onApprove, onReject, isPending }: ActionRowProps) {

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-700 truncate">
              {action.agent_name}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">
              {ACTION_TYPE_LABELS[action.action_type] ?? action.action_type}
            </span>
            <span className="text-gray-300">→</span>
            <span className="text-xs text-gray-500">
              {TARGET_TYPE_LABELS[action.target_type] ?? action.target_type}
            </span>
          </div>
          {action.status === 'error' && action.error_message && (
            <p className="text-xs text-red-600 mt-0.5 truncate">{action.error_message}</p>
          )}
          {action.approved_by && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {action.status === 'rejected' ? 'Rejected' : 'Approved'} by {action.approved_by}
              {action.approved_at ? ` · ${timeAgo(action.approved_at)}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {action.status === 'queued' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-green-600 hover:text-green-800 hover:bg-green-50"
                onClick={() => onApprove(action.id)}
                disabled={isPending}
                title="Approve"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onReject(action.id)}
                disabled={isPending}
                title="Reject"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              ACTION_STATUS_COLORS[action.status] ?? 'bg-gray-100 text-gray-600',
            )}
          >
            {action.status}
          </span>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">
            {timeAgo(action.created_at)}
          </span>
        </div>
      </div>
      {runs.length > 0 && (
        <div className="mt-1 ml-3 flex flex-col gap-0.5">
          {runs.slice(0, 2).map((run) => (
            <div key={run.id} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[9px] font-medium px-1 py-px rounded',
                  RUN_STATUS_COLORS[run.run_status] ?? 'bg-gray-100 text-gray-500',
                )}
              >
                {run.run_status}
              </span>
              {run.operation_summary && (
                <span className="text-[9px] text-gray-400 truncate max-w-[180px]">{run.operation_summary}</span>
              )}
              {run.error_message && (
                <span className="text-[9px] text-red-500 truncate max-w-[180px]">{run.error_message}</span>
              )}
              <span className="text-[9px] text-gray-300">{timeAgo(run.started_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentActionsCard() {
  const { data: actions = [], isLoading } = useAgentActions(10);
  const createAction = useCreateAgentAction();
  const approveAction = useApproveAgentAction();
  const rejectAction = useRejectAgentAction();
  const [isSimulating, setIsSimulating] = useState(false);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set());
  const pendingRef = useRef(pendingActionIds);
  pendingRef.current = pendingActionIds;
  const qc = useQueryClient();

  const actionIds = actions.map((a) => a.id);
  const runsQueryKey = ['agent-action-runs-bulk', actionIds.join(',')];

  const { data: allRuns = [] } = useQuery<AgentActionRun[]>({
    queryKey: runsQueryKey,
    enabled: actionIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_action_runs')
        .select('*')
        .in('action_id', actionIds)
        .order('started_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AgentActionRun[];
    },
  });

  const runsPerAction: Record<string, AgentActionRun[]> = {};
  for (const id of actionIds) runsPerAction[id] = [];
  for (const run of allRuns) {
    if (runsPerAction[run.action_id]) {
      runsPerAction[run.action_id].push(run);
    }
  }

  const invalidateRuns = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['agent-action-runs-bulk'] });
  }, [qc]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const key = createIdempotencyKey({
        agent: 'openclaw',
        action: 'create_task',
        target: 'pharmacy',
        ts: new Date().toISOString(),
      });

      await createAction.mutateAsync({
        agentName: 'openclaw',
        actionType: 'create_task',
        targetType: 'pharmacy',
        payload: {
          description: 'Follow-up task created by OpenClaw agent',
          simulated: true,
        },
        idempotencyKey: key,
      });
      toast.success('Queued action created — approve or reject it');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('idempotency_key')) {
        toast.info('Duplicate action — idempotency key already exists');
      } else {
        toast.error(`Failed to log action: ${msg}`);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const addPending = useCallback((id: string) => {
    setPendingActionIds((prev) => new Set(prev).add(id));
  }, []);

  const removePending = useCallback((id: string) => {
    setPendingActionIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleApprove = useCallback(async (id: string) => {
    if (pendingRef.current.has(id)) return;
    const action = actions.find((a) => a.id === id);
    if (!action || action.status !== 'queued') return;

    addPending(id);
    let runId: string | null = null;
    try {
      runId = await logRunStart(id);
      await approveAction.mutateAsync({
        id,
        approvedBy: 'manual-review',
        approvalNote: 'Reviewed from dashboard',
      });
      await logRunSuccess(runId, 'Approved from dashboard');
      invalidateRuns();
      toast.success('Action approved');
    } catch (err) {
      if (runId) {
        try { await logRunError(runId, err instanceof Error ? err.message : 'Unknown error'); } catch { /* best-effort */ }
        invalidateRuns();
      }
      toast.error('Failed to approve action');
    } finally {
      removePending(id);
    }
  }, [actions, addPending, removePending, approveAction, invalidateRuns]);

  const handleReject = useCallback(async (id: string) => {
    if (pendingRef.current.has(id)) return;
    const action = actions.find((a) => a.id === id);
    if (!action || action.status !== 'queued') return;

    addPending(id);
    let runId: string | null = null;
    try {
      runId = await logRunStart(id);
      await rejectAction.mutateAsync({
        id,
        approvedBy: 'manual-review',
        approvalNote: 'Reviewed from dashboard',
      });
      await logRunSuccess(runId, 'Rejected from dashboard');
      invalidateRuns();
      toast.success('Action rejected');
    } catch (err) {
      if (runId) {
        try { await logRunError(runId, err instanceof Error ? err.message : 'Unknown error'); } catch { /* best-effort */ }
        invalidateRuns();
      }
      toast.error('Failed to reject action');
    } finally {
      removePending(id);
    }
  }, [actions, addPending, removePending, rejectAction, invalidateRuns]);

  const statusCounts = actions.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Agent Actions</h3>
          {actions.length > 0 && (
            <span className="text-[10px] text-gray-400">
              {statusCounts.success ?? 0} ok · {statusCounts.error ?? 0} err · {statusCounts.queued ?? 0} queued
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleSimulate}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Plus className="h-3 w-3 mr-1" />
          )}
          Simulate action
        </Button>
      </div>

      <div className="px-4 py-2">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {!isLoading && actions.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No agent actions recorded yet
          </p>
        )}

        {!isLoading && actions.length > 0 && (
          <div>
            {actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                runs={runsPerAction[action.id] ?? []}
                onApprove={handleApprove}
                onReject={handleReject}
                isPending={pendingActionIds.has(action.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
