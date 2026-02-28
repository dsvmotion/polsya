import { useState } from 'react';
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
} from '@/types/agents';
import type { AgentActionLog } from '@/types/agents';
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
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busyId: string | null;
}

function ActionRow({ action, onApprove, onReject, busyId }: ActionRowProps) {
  const isBusy = busyId === action.id;

  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
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
              disabled={isBusy}
              title="Approve"
            >
              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onReject(action.id)}
              disabled={isBusy}
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
  );
}

export function AgentActionsCard() {
  const { data: actions = [], isLoading } = useAgentActions(10);
  const createAction = useCreateAgentAction();
  const approveAction = useApproveAgentAction();
  const rejectAction = useRejectAgentAction();
  const [isSimulating, setIsSimulating] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

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

  const handleApprove = async (id: string) => {
    setBusyActionId(id);
    try {
      await approveAction.mutateAsync({
        id,
        approvedBy: 'manual-review',
        approvalNote: 'Reviewed from dashboard',
      });
      toast.success('Action approved');
    } catch {
      toast.error('Failed to approve action');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyActionId(id);
    try {
      await rejectAction.mutateAsync({
        id,
        approvedBy: 'manual-review',
        approvalNote: 'Reviewed from dashboard',
      });
      toast.success('Action rejected');
    } catch {
      toast.error('Failed to reject action');
    } finally {
      setBusyActionId(null);
    }
  };

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
                onApprove={handleApprove}
                onReject={handleReject}
                busyId={busyActionId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
