import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { Badge } from '@/components/ui/badge';
import { useCreativeCalendarEvents } from '@/hooks/useCreativeCalendarEvents';
import { CALENDAR_STATUS_LABELS, CALENDAR_STATUS_COLORS } from '@/types/creative-calendar';
import type { CreativeCalendarEvent } from '@/types/creative-calendar';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function CreativeCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startAfter = startOfMonth(currentMonth).toISOString();
  const endBefore = endOfMonth(currentMonth).toISOString();

  const { data: events = [], isLoading } = useCreativeCalendarEvents({
    startAfter,
    endBefore,
    limit: 200,
  });

  const eventsByDate = useMemo(() => {
    const map: Record<string, CreativeCalendarEvent[]> = {};
    for (const evt of events) {
      const dateKey = format(new Date(evt.startAt), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(evt);
    }
    return map;
  }, [events]);

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <WorkspaceContainer
      title="Calendar"
      subtitle={format(currentMonth, 'MMMM yyyy')}
      icon={CalendarIcon}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            &larr; Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            Next &rarr;
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>No events this month.</p>
            <p className="text-sm">Connect a Gmail or Outlook account to sync calendar events.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {format(new Date(dateKey), 'EEEE, MMMM d')}
                </h3>
                <div className="space-y-2">
                  {eventsByDate[dateKey].map((evt) => (
                    <CalendarEventCard key={evt.id} event={evt} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceContainer>
  );
}

function CalendarEventCard({ event }: { event: CreativeCalendarEvent }) {
  const statusColors = CALENDAR_STATUS_COLORS[event.status];

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{event.title}</span>
            <Badge variant="outline" className={`text-xs ${statusColors.bg} ${statusColors.text}`}>
              {CALENDAR_STATUS_LABELS[event.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.allDay
                ? 'All day'
                : `${format(new Date(event.startAt), 'h:mm a')} \u2013 ${format(new Date(event.endAt), 'h:mm a')}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
            {event.attendees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.attendees.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
