import { useState, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Plug, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntegrationHealth } from '@/hooks/useIntegrationHealth';
import { useRiskAlerts } from '@/hooks/useRiskAlerts';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const typeIcons: Record<Notification['type'], React.ElementType> = {
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
  info: Info,
};

const typeColors: Record<Notification['type'], string> = {
  warning: 'text-warning',
  error: 'text-destructive',
  success: 'text-success',
  info: 'text-primary',
};

export function NotificationCenter() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { data: healthSummary } = useIntegrationHealth();
  const { alerts: riskAlerts = [] } = useRiskAlerts('pharmacy');

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    if (healthSummary) {
      if (healthSummary.errorJobs > 0) {
        items.push({
          id: 'int-errors',
          type: 'error',
          title: `${healthSummary.errorJobs} integration job(s) failed`,
          message: `Error rate: ${healthSummary.errorRatePct.toFixed(1)}%. Check integrations page for details.`,
          time: healthSummary.lastRunAt ?? new Date().toISOString(),
          read: readIds.has('int-errors'),
        });
      }
      if (healthSummary.stuckQueuedJobs > 0) {
        items.push({
          id: 'int-stuck',
          type: 'warning',
          title: `${healthSummary.stuckQueuedJobs} stuck sync job(s)`,
          message: 'Jobs have been queued longer than expected.',
          time: healthSummary.lastRunAt ?? new Date().toISOString(),
          read: readIds.has('int-stuck'),
        });
      }
      if (healthSummary.deadLetteredJobs > 0) {
        items.push({
          id: 'int-dead',
          type: 'error',
          title: `${healthSummary.deadLetteredJobs} dead-lettered job(s)`,
          message: 'These jobs exhausted all retries and require manual review.',
          time: healthSummary.lastRunAt ?? new Date().toISOString(),
          read: readIds.has('int-dead'),
        });
      }
    }

    for (const alert of riskAlerts.slice(0, 5)) {
      const id = `risk-${alert.pharmacyId}`;
      items.push({
        id,
        type: 'warning',
        title: `At-risk: ${alert.pharmacyName}`,
        message: alert.reasons.join(', '),
        time: new Date().toISOString(),
        read: readIds.has(id),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'welcome',
        type: 'info',
        title: 'All clear',
        message: 'No pending notifications. You\'re up to date.',
        time: new Date().toISOString(),
        read: true,
      });
    }

    return items;
  }, [healthSummary, riskAlerts, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH}h ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-2 border-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[380px]">
          <div className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type];
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer',
                    !n.read && 'bg-muted/30',
                  )}
                  onClick={() => setReadIds((prev) => new Set(prev).add(n.id))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReadIds((prev) => new Set(prev).add(n.id)); } }}
                >
                  <div className={cn('shrink-0 mt-0.5', typeColors[n.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.time)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
