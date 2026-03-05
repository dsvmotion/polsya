import type { ResolutionCandidate } from '@/types/entity-resolution';
import { RESOLUTION_STATUS_LABELS, RESOLUTION_STATUS_COLORS } from '@/types/entity-resolution';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useResolveCandidate } from '@/hooks/useEntityResolution';
import { Check, X } from 'lucide-react';

interface CandidateCardProps {
  candidate: ResolutionCandidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const resolveMutation = useResolveCandidate();
  const pct = Math.round(candidate.confidenceScore * 100);
  const statusColors = RESOLUTION_STATUS_COLORS[candidate.status];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0`}>
          {RESOLUTION_STATUS_LABELS[candidate.status]}
        </Badge>
        <Badge variant="secondary" className={`border-0 ${pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
          {pct}% match
        </Badge>
      </div>

      {/* Entities comparison */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 rounded border p-2 text-center">
          <div className="text-xs text-muted-foreground capitalize">{candidate.entityAType}</div>
          <div className="font-mono text-xs mt-0.5">{candidate.entityAId.slice(0, 12)}…</div>
        </div>
        <span className="text-muted-foreground font-bold text-xs">vs</span>
        <div className="flex-1 rounded border p-2 text-center">
          <div className="text-xs text-muted-foreground capitalize">{candidate.entityBType}</div>
          <div className="font-mono text-xs mt-0.5">{candidate.entityBId.slice(0, 12)}…</div>
        </div>
      </div>

      {/* Match reasons */}
      {candidate.matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.matchReasons.map((reason, i) => (
            <Badge key={i} variant="outline" className="text-xs">{reason}</Badge>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {candidate.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1"
            onClick={() => resolveMutation.mutate({ id: candidate.id, status: 'confirmed' })}
            disabled={resolveMutation.isPending}
          >
            <Check className="h-3 w-3" /> Confirm Match
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8 text-xs gap-1 text-destructive"
            onClick={() => resolveMutation.mutate({ id: candidate.id, status: 'rejected' })}
            disabled={resolveMutation.isPending}
          >
            <X className="h-3 w-3" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
