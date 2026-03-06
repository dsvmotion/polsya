import { ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { KpiWithTrend } from '@/types/analytics';

interface KpiCardWithTrendProps {
  title: string;
  value: string;
  trend: KpiWithTrend;
  icon: React.ElementType;
  loading?: boolean;
}

export default function KpiCardWithTrend({
  title,
  value,
  trend,
  icon: Icon,
  loading = false,
}: KpiCardWithTrendProps) {
  const isPositive = trend.deltaPercent >= 0;
  const sparklineData = trend.sparkline.map((v, i) => ({ idx: i, value: v }));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-24 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>

        <div className="text-2xl font-bold">{value}</div>

        <div className="flex items-center justify-between mt-2">
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isPositive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}
          >
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(trend.deltaPercent).toFixed(1)}%
          </div>

          {sparklineData.length > 0 && (
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? 'hsl(142, 72%, 46%)' : 'hsl(0, 84%, 60%)'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
