import { AlertTriangle, CheckCircle2, Clock3, Loader2, Timer, Waves } from 'lucide-react';
import { useIntegrationHealth } from '@/hooks/useIntegrationHealth';
import { cn } from '@/lib/utils';

function msToSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IntegrationHealthCard() {
  const { data, isLoading } = useIntegrationHealth(24);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading integration health...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const levelTone = {
    ok: 'text-green-700 bg-green-100',
    warning: 'text-amber-700 bg-amber-100',
    critical: 'text-red-700 bg-red-100',
  }[data.level];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Integration Health (24h)</h3>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', levelTone)}>
          {data.level}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded border border-gray-100 p-2">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            p95 duration
          </p>
          <p className="text-sm font-semibold text-gray-900">{msToSeconds(data.p95DurationMs)}</p>
        </div>
        <div className="rounded border border-gray-100 p-2">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Waves className="h-3.5 w-3.5" />
            error rate
          </p>
          <p className="text-sm font-semibold text-gray-900">{data.errorRatePct.toFixed(1)}%</p>
        </div>
        <div className="rounded border border-gray-100 p-2">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            stuck queued
          </p>
          <p className="text-sm font-semibold text-gray-900">{data.stuckQueuedJobs}</p>
        </div>
        <div className="rounded border border-gray-100 p-2">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            dead letters
          </p>
          <p className="text-sm font-semibold text-gray-900">{data.deadLetteredJobs}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Jobs: {data.totalJobs} total, {data.runningJobs} running, {data.queuedJobs} queued
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          last run: {data.lastRunAt ? timeAgo(data.lastRunAt) : 'none'}
        </span>
      </div>
    </div>
  );
}
