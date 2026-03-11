import type { Signal } from '@/types/signal-engine';
import { SIGNAL_SEVERITY_LABELS, SIGNAL_SEVERITY_COLORS, SIGNAL_STATUS_LABELS, SIGNAL_STATUS_COLORS } from '@/types/signal-engine';
import { useUpdateSignalStatus } from '@/hooks/useSignals';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';
import { timeAgo } from '@/lib/time-utils';

interface SignalDetailProps {
  signal: Signal;
  onClose: () => void;
}

export function SignalDetail({ signal, onClose }: SignalDetailProps) {
  const updateStatus = useUpdateSignalStatus();
  const { toast } = useToast();
  const severityColors = SIGNAL_SEVERITY_COLORS[signal.severity];
  const statusColors = SIGNAL_STATUS_COLORS[signal.status];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{signal.title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className={`${severityColors.bg} ${severityColors.text} border-0`}>
            {SIGNAL_SEVERITY_LABELS[signal.severity]}
          </Badge>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0`}>
            {SIGNAL_STATUS_LABELS[signal.status]}
          </Badge>
        </div>
      </div>

      {signal.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{signal.description}</p>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entity Type</span>
          <span className="font-medium capitalize">{signal.entityType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entity ID</span>
          <span className="font-mono text-xs">{signal.entityId}</span>
        </div>
        {signal.ruleId && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rule ID</span>
            <span className="font-mono text-xs">{signal.ruleId}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created</span>
          <span>{timeAgo(signal.createdAt)}</span>
        </div>
        {signal.seenAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seen</span>
            <span>{timeAgo(signal.seenAt)}</span>
          </div>
        )}
        {signal.actionedAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Actioned</span>
            <span>{timeAgo(signal.actionedAt)}</span>
          </div>
        )}
      </div>

      {signal.data && Object.keys(signal.data).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Data</h3>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
            {JSON.stringify(signal.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate(
            { id: signal.id, status: 'seen' },
            { onError: (err) => toast({ title: 'Failed to update signal', description: getErrorMessage(err), variant: 'destructive' }) },
          )}
          disabled={updateStatus.isPending}
        >
          <Eye className="h-3.5 w-3.5" /> Mark Seen
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate(
            { id: signal.id, status: 'actioned' },
            { onError: (err) => toast({ title: 'Failed to update signal', description: getErrorMessage(err), variant: 'destructive' }) },
          )}
          disabled={updateStatus.isPending}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Action
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate(
            { id: signal.id, status: 'dismissed' },
            { onError: (err) => toast({ title: 'Failed to update signal', description: getErrorMessage(err), variant: 'destructive' }) },
          )}
          disabled={updateStatus.isPending}
        >
          <XCircle className="h-3.5 w-3.5" /> Dismiss
        </Button>
      </div>
    </div>
  );
}
