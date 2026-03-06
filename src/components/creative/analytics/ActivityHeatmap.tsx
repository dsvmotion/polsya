import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityHeatmapDay } from '@/types/analytics';

interface ActivityHeatmapProps {
  data: ActivityHeatmapDay[];
  loading?: boolean;
}

const getIntensity = (count: number, max: number): string => {
  if (count === 0) return 'bg-muted';
  const ratio = count / max;
  if (ratio <= 0.25) return 'bg-green-200 dark:bg-green-900';
  if (ratio <= 0.5) return 'bg-green-400 dark:bg-green-700';
  if (ratio <= 0.75) return 'bg-green-500 dark:bg-green-600';
  return 'bg-green-600 dark:bg-green-500';
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CellData {
  date: string;
  count: number;
  dayOfWeek: number;
  weekIndex: number;
}

export default function ActivityHeatmap({
  data,
  loading = false,
}: ActivityHeatmapProps) {
  const { grid, maxCount, totalWeeks } = useMemo(() => {
    if (data.length === 0) {
      return { grid: [] as CellData[], maxCount: 0, totalWeeks: 0 };
    }

    const countMap = new Map<string, number>();
    data.forEach((d) => countMap.set(d.date, d.count));

    // Sort dates to find range
    const sortedDates = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const startDate = new Date(sortedDates[0].date + 'T00:00:00');
    const endDate = new Date(
      sortedDates[sortedDates.length - 1].date + 'T00:00:00'
    );

    // Align to the start of the week (Sunday)
    const alignedStart = new Date(startDate);
    alignedStart.setDate(alignedStart.getDate() - alignedStart.getDay());

    const cells: CellData[] = [];
    let maxVal = 0;
    const current = new Date(alignedStart);

    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      const count = countMap.get(dateStr) ?? 0;
      const dayOfWeek = current.getDay();
      const diffDays = Math.floor(
        (current.getTime() - alignedStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekIndex = Math.floor(diffDays / 7);

      if (count > maxVal) maxVal = count;

      cells.push({ date: dateStr, count, dayOfWeek, weekIndex });
      current.setDate(current.getDate() + 1);
    }

    const weeks =
      cells.length > 0
        ? cells[cells.length - 1].weekIndex + 1
        : 0;

    return { grid: cells, maxCount: maxVal, totalWeeks: weeks };
  }, [data]);

  if (loading) {
    const skeletonWeeks = 12;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 mr-1">
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="h-3 w-6 text-[10px] text-muted-foreground flex items-center"
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="grid gap-1"
              style={{
                gridTemplateRows: 'repeat(7, 12px)',
                gridTemplateColumns: `repeat(${skeletonWeeks}, 12px)`,
                gridAutoFlow: 'column',
              }}
            >
              {Array.from({ length: 7 * skeletonWeeks }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm bg-muted animate-pulse"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-1 overflow-x-auto">
            <div className="flex flex-col gap-1 mr-1 shrink-0">
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="h-3 w-6 text-[10px] text-muted-foreground flex items-center"
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="grid gap-1"
              style={{
                gridTemplateRows: 'repeat(7, 12px)',
                gridTemplateColumns: `repeat(${totalWeeks}, 12px)`,
                gridAutoFlow: 'column',
              }}
            >
              {grid.map((cell) => (
                <Tooltip key={cell.date}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3 h-3 rounded-sm cursor-default ${getIntensity(cell.count, maxCount)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{cell.date}</p>
                    <p>
                      {cell.count} {cell.count === 1 ? 'activity' : 'activities'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
