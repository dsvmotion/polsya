import type { EnrichmentRun, EnrichmentRunStatus } from '@/types/enrichment-engine';
import { ENRICHMENT_RUN_STATUS_LABELS, ENRICHMENT_RUN_STATUS_COLORS } from '@/types/enrichment-engine';
import { Badge } from '@/components/ui/badge';

interface RunDetailProps {
  run: EnrichmentRun;
  onClose: () => void;
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '--';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export function RunDetail({ run }: RunDetailProps) {
  const status = run.status as EnrichmentRunStatus;
  const colors = ENRICHMENT_RUN_STATUS_COLORS[status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Enrichment Run</h2>
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0 mt-1`}>
          {ENRICHMENT_RUN_STATUS_LABELS[status]}
        </Badge>
      </div>

      {/* Summary */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Recipe ID</span>
          <span className="font-mono text-xs">
            {run.recipeId ? `${run.recipeId.slice(0, 8)}...` : '--'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entity Count</span>
          <span>{run.entityIds.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Credits Used</span>
          <span>{run.creditsUsed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span>{formatDuration(run.startedAt, run.completedAt)}</span>
        </div>
      </div>

      {/* Entity IDs */}
      <div>
        <h3 className="text-sm font-medium mb-2">Entity IDs</h3>
        <div className="flex flex-wrap gap-1">
          {run.entityIds.map((id) => (
            <Badge key={id} variant="outline" className="font-mono text-xs">
              {id.slice(0, 8)}...
            </Badge>
          ))}
        </div>
      </div>

      {/* Results */}
      {run.results.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Results</h3>
          <pre className="rounded-md border bg-muted/50 p-3 text-xs overflow-auto max-h-64">
            {JSON.stringify(run.results, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Log */}
      {run.errorLog.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 text-destructive">Error Log</h3>
          <pre className="rounded-md border border-red-200 bg-red-50 p-3 text-xs overflow-auto max-h-64 text-red-900 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
            {JSON.stringify(run.errorLog, null, 2)}
          </pre>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(run.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
