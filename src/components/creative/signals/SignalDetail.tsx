import type { Signal } from '@/types/signal-engine';
import { SIGNAL_SEVERITY_LABELS, SIGNAL_SEVERITY_COLORS, SIGNAL_STATUS_LABELS, SIGNAL_STATUS_COLORS } from '@/types/signal-engine';
import { useUpdateSignalStatus } from '@/hooks/useSignals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';

interface SignalDetailProps {
  signal: Signal;
  onClose: () => void;
}

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SignalDetail({ signal, onClose }: SignalDetailProps) {
  const updateStatus = useUpdateSignalStatus();
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
          <span>{getTimeAgo(signal.createdAt)}</span>
        </div>
        {signal.seenAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seen</span>
            <span>{getTimeAgo(signal.seenAt)}</span>
          </div>
        )}
        {signal.actionedAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Actioned</span>
            <span>{getTimeAgo(signal.actionedAt)}</span>
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
          onClick={() => updateStatus.mutate({ id: signal.id, status: 'seen' })}
          disabled={updateStatus.isPending}
        >
          <Eye className="h-3.5 w-3.5" /> Mark Seen
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate({ id: signal.id, status: 'actioned' })}
          disabled={updateStatus.isPending}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Action
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate({ id: signal.id, status: 'dismissed' })}
          disabled={updateStatus.isPending}
        >
          <XCircle className="h-3.5 w-3.5" /> Dismiss
        </Button>
      </div>
    </div>
  );
}
