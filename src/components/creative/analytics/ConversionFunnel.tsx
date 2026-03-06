import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FunnelStage } from '@/types/analytics';

interface ConversionFunnelProps {
  stages: FunnelStage[];
  loading?: boolean;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function interpolateColor(index: number, total: number): string {
  // Gradient from blue hsl(217, 91%, 60%) to green hsl(142, 72%, 46%)
  const t = total <= 1 ? 0 : index / (total - 1);
  const h = 217 + (142 - 217) * t;
  const s = 91 + (72 - 91) * t;
  const l = 60 + (46 - 60) * t;
  return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
}

export default function ConversionFunnel({
  stages,
  loading = false,
}: ConversionFunnelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                <div
                  className="h-8 rounded bg-muted animate-pulse"
                  style={{ width: `${100 - i * 15}%` }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const firstCount = stages.length > 0 ? stages[0].count : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercent =
              firstCount > 0
                ? Math.max((stage.count / firstCount) * 100, 8)
                : 100;
            const bgColor = interpolateColor(index, stages.length);
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-muted-foreground">
                    {stage.count} deals &middot; {formatCurrency(stage.valueCents)}
                  </span>
                </div>

                <div
                  className="h-8 rounded-md flex items-center px-3 text-white text-xs font-medium transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: bgColor,
                    minWidth: '60px',
                  }}
                >
                  {stage.count}
                </div>

                {!isLast && (
                  <div className="flex items-center gap-1 mt-1 ml-2 text-xs text-muted-foreground">
                    <span>&darr;</span>
                    <span>{stage.conversionRate.toFixed(1)}% conversion</span>
                    <span className="ml-2">
                      avg {stage.avgDaysInStage.toFixed(0)}d in stage
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
