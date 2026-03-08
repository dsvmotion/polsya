import type { Signal } from '@/types/signal-engine';
import { SIGNAL_SEVERITY_LABELS, SIGNAL_SEVERITY_COLORS, SIGNAL_STATUS_LABELS, SIGNAL_STATUS_COLORS } from '@/types/signal-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUpdateSignalStatus } from '@/hooks/useSignals';
import { useToast } from '@/hooks/use-toast';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const updateStatus = useUpdateSignalStatus();
  const { toast } = useToast();
  const severityColors = SIGNAL_SEVERITY_COLORS[signal.severity];
  const statusColors = SIGNAL_STATUS_COLORS[signal.status];

  const timeAgo = getTimeAgo(signal.createdAt);

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4">
      {/* Severity stripe */}
      <div className={`w-1 shrink-0 rounded-full ${severityColors.bg.replace('-100', '-400')}`} />

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm">{signal.title}</h4>
            {signal.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{signal.description}</p>
            )}
          </div>
          <Badge variant="secondary" className={`${severityColors.bg} ${severityColors.text} border-0 shrink-0`}>
            {SIGNAL_SEVERITY_LABELS[signal.severity]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs capitalize">{signal.entityType}</Badge>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 text-xs`}>
            {SIGNAL_STATUS_LABELS[signal.status]}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
        </div>

        {signal.status === 'new' && (
          <div className="flex gap-1 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => updateStatus.mutate(
                { id: signal.id, status: 'seen' },
                { onError: (err) => toast({ title: 'Failed to update signal', description: getErrorMessage(err), variant: 'destructive' }) },
              )}
              disabled={updateStatus.isPending}
            >
              <Eye className="h-3 w-3" /> Mark Seen
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => updateStatus.mutate(
                { id: signal.id, status: 'actioned' },
                { onError: (err) => toast({ title: 'Failed to update signal', description: getErrorMessage(err), variant: 'destructive' }) },
              )}
              disabled={updateStatus.isPending}
            >
              <CheckCircle2 className="h-3 w-3" /> Action
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={() => updateStatus.mutate(
                { id: signal.id, status: 'dismissed' },
                { onError: (err) => toast({ title: 'Failed to update signal', description: getErrorMessage(err), variant: 'destructive' }) },
              )}
              disabled={updateStatus.isPending}
            >
              <XCircle className="h-3 w-3" /> Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
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
