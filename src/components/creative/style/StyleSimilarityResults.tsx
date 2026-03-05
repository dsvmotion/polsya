import { Badge } from '@/components/ui/badge';
import { useStyleSimilarity } from '@/hooks/useStyleAnalyses';

interface StyleSimilarityResultsProps {
  analysisId: string | null;
}

function matchBadgeClass(pct: number): string {
  if (pct >= 80) return 'bg-green-100 text-green-800';
  if (pct >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-800';
}

function resultLabel(clientId: string | null, portfolioId: string | null): string {
  if (clientId) return `Client ${clientId.slice(0, 8)}…`;
  if (portfolioId) return `Portfolio ${portfolioId.slice(0, 8)}…`;
  return 'Unknown';
}

export function StyleSimilarityResults({ analysisId }: StyleSimilarityResultsProps) {
  const { data: results = [], isLoading } = useStyleSimilarity(analysisId);

  if (!analysisId) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Select a style analysis and click "Find Similar" to search for matches.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-muted rounded mb-2" />
            <div className="h-3 w-1/2 bg-muted/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No embeddings available. Similarity search requires style analysis embeddings to be populated.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r) => {
        const palette = Array.isArray(r.color_palette) ? (r.color_palette as string[]) : [];
        const pct = Math.round(r.similarity * 100);
        return (
          <div key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate">
                {resultLabel(r.client_id, r.portfolio_id)}
              </span>
              <Badge variant="secondary" className={matchBadgeClass(pct)}>
                {pct}% match
              </Badge>
            </div>
            {palette.length > 0 && (
              <div className="flex gap-1">
                {palette.slice(0, 6).map((color, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
