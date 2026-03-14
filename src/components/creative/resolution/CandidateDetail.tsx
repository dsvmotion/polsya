import type { ResolutionCandidate } from '@/types/entity-resolution';
import { RESOLUTION_STATUS_LABELS, RESOLUTION_STATUS_COLORS } from '@/types/entity-resolution';
import { useResolveCandidate } from '@/hooks/useEntityResolution';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface CandidateDetailProps {
  candidate: ResolutionCandidate;
  onClose: () => void;
}

function confidenceBadgeClasses(pct: number): string {
  if (pct >= 80) return 'bg-green-100 text-green-800';
  if (pct >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-muted text-foreground';
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  const resolveMutation = useResolveCandidate();
  const pct = Math.round(candidate.confidenceScore * 100);
  const statusColors = RESOLUTION_STATUS_COLORS[candidate.status];

  function handleResolve(status: 'confirmed' | 'rejected') {
    resolveMutation.mutate(
      { id: candidate.id, status },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0`}>
          {RESOLUTION_STATUS_LABELS[candidate.status]}
        </Badge>
        <Badge variant="secondary" className={`border-0 ${confidenceBadgeClasses(pct)}`}>
          {pct}% confidence
        </Badge>
      </div>

      {/* Side-by-side entity comparison */}
      <div>
        <h3 className="text-sm font-medium mb-2">Entity Comparison</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Entity A</div>
            <div className="text-sm capitalize">{candidate.entityAType}</div>
            <div className="font-mono text-xs text-muted-foreground break-all">
              {candidate.entityAId}
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Entity B</div>
            <div className="text-sm capitalize">{candidate.entityBType}</div>
            <div className="font-mono text-xs text-muted-foreground break-all">
              {candidate.entityBId}
            </div>
          </div>
        </div>
      </div>

      {/* Match reasons */}
      {candidate.matchReasons.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Match Reasons</h3>
          <div className="flex flex-wrap gap-1">
            {candidate.matchReasons.map((reason) => (
              <Badge key={reason} variant="outline" className="text-xs">
                {reason}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <div>Detected {new Date(candidate.createdAt).toLocaleDateString()}</div>
        {candidate.resolvedAt && (
          <div>Resolved {new Date(candidate.resolvedAt).toLocaleDateString()}</div>
        )}
      </div>

      {/* Action buttons */}
      {candidate.status === 'pending' && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => handleResolve('confirmed')}
            disabled={resolveMutation.isPending}
          >
            <Check className="h-4 w-4" />
            Confirm Merge
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 gap-1.5 text-destructive"
            onClick={() => handleResolve('rejected')}
            disabled={resolveMutation.isPending}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
