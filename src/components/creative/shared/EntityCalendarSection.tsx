import { Calendar, MapPin, Clock } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useCreativeCalendarEvents } from '@/hooks/useCreativeCalendarEvents';
import { CALENDAR_STATUS_LABELS, CALENDAR_STATUS_COLORS } from '@/types/creative-calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EntityCalendarSectionProps {
  entityType: string;
  entityId: string;
}

export function EntityCalendarSection({ entityType, entityId }: EntityCalendarSectionProps) {
  const { data: events = [], isLoading } = useCreativeCalendarEvents({
    entityType,
    entityId,
    limit: 10,
  });

  return (
    <CollapsibleEngineSection
      icon={Calendar}
      label="Calendar"
      count={events.length}
      isLoading={isLoading}
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No linked events.</p>
      ) : (
        <div className="space-y-2">
          {events.map((evt) => {
            const statusColors = CALENDAR_STATUS_COLORS[evt.status];
            return (
              <div key={evt.id} className="border rounded p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{evt.title}</span>
                  <Badge variant="outline" className={`text-xs ${statusColors.bg} ${statusColors.text}`}>
                    {CALENDAR_STATUS_LABELS[evt.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {evt.allDay
                      ? format(new Date(evt.startAt), 'MMM d')
                      : format(new Date(evt.startAt), 'MMM d, h:mm a')}
                  </span>
                  {evt.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {evt.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleEngineSection>
  );
}
