import type { StyleAnalysis } from '@/types/style-intelligence';
import { Badge } from '@/components/ui/badge';

interface StyleAnalysisCardProps {
  analysis: StyleAnalysis;
  onClick?: () => void;
}

export function StyleAnalysisCard({ analysis, onClick }: StyleAnalysisCardProps) {
  const pct = Math.round(analysis.confidenceScore * 100);

  return (
    <div
      className="rounded-xl border border-border border-t-2 border-t-primary/40 bg-card overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      {/* Color palette bar */}
      <div className="h-3 flex">
        {analysis.colorPalette.length > 0 ? (
          analysis.colorPalette.map((swatch, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: swatch.hex }}
            />
          ))
        ) : (
          <div className="flex-1 bg-muted" />
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <span className="font-medium text-sm truncate">
            {analysis.sourceUrl || 'Manual Analysis'}
          </span>
          <Badge variant="secondary" className={`shrink-0 ml-2 border-0 rounded-full px-2 py-0.5 text-xs ${pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
            {pct}%
          </Badge>
        </div>

        {analysis.typographyProfile.primaryFont && (
          <p className="text-xs text-muted-foreground">
            Font: {analysis.typographyProfile.primaryFont}
            {analysis.typographyProfile.secondaryFont && ` / ${analysis.typographyProfile.secondaryFont}`}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {new Date(analysis.analyzedAt ?? analysis.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
