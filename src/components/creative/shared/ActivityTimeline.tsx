import { Phone, Mail, Users, FileText, CheckSquare, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCreativeActivities, useDeleteActivity, useToggleComplete } from '@/hooks/useCreativeActivities';
import { useToast } from '@/hooks/use-toast';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS } from '@/types/creative-activity';
import type { ActivityType } from '@/types/creative-activity';
import { cn, getErrorMessage } from '@/lib/utils';

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  task: CheckSquare,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
  onAddClick?: () => void;
}

export function ActivityTimeline({ entityType, entityId, onAddClick }: ActivityTimelineProps) {
  const { data: activities = [], isLoading } = useCreativeActivities(entityType, entityId);
  const deleteMutation = useDeleteActivity();
  const toggleMutation = useToggleComplete();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-2">No activities recorded yet.</p>
        {onAddClick && (
          <Button variant="outline" size="sm" onClick={onAddClick}>
            Log Activity
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.activityType] ?? FileText;
        const colors = ACTIVITY_TYPE_COLORS[activity.activityType] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
          <div key={activity.id} className="flex items-start gap-3 py-2 group">
            {activity.activityType === 'task' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMutation.mutate(
                    { id: activity.id, isCompleted: activity.isCompleted },
                    { onError: (err) => toast({ title: 'Failed to update activity', description: getErrorMessage(err), variant: 'destructive' }) },
                  );
                }}
                className="shrink-0 mt-0.5"
                aria-label={activity.isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
              >
                {activity.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500 transition-colors" />
                )}
              </button>
            )}
            <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${colors.bg}`}>
              <Icon className={`h-4 w-4 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium truncate',
                  activity.isCompleted && 'line-through text-muted-foreground'
                )}>
                  {activity.title}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {ACTIVITY_TYPE_LABELS[activity.activityType]}
                </Badge>
              </div>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{timeAgo(activity.occurredAt)}</span>
                {activity.durationMinutes && (
                  <span className="text-xs text-muted-foreground">· {activity.durationMinutes}min</span>
                )}
                {activity.outcome && (
                  <span className="text-xs text-muted-foreground">· {activity.outcome}</span>
                )}
                {activity.dueDate && (
                  <span className={cn(
                    'text-xs',
                    !activity.isCompleted && new Date(activity.dueDate) < new Date()
                      ? 'text-red-600 font-medium'
                      : 'text-muted-foreground'
                  )}>
                    · Due {new Date(activity.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              aria-label="Delete activity"
              onClick={() => deleteMutation.mutate(activity.id, {
                onError: (err) => toast({ title: 'Failed to delete activity', description: getErrorMessage(err), variant: 'destructive' }),
              })}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
