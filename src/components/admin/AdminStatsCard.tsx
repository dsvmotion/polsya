import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  formatValue?: (value: number | string) => string;
}

export function AdminStatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  formatValue,
}: AdminStatsCardProps) {
  const displayValue = formatValue
    ? formatValue(value)
    : typeof value === 'number'
      ? value.toLocaleString()
      : value;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{displayValue}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                'font-medium',
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500',
              )}
            >
              {trend.direction === 'up' ? '+' : '-'}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
