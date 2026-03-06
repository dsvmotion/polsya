import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import type {
  CreativeCalendarEvent,
  CalendarProvider,
  CalendarEventStatus,
  CalendarMatchType,
} from '@/types/creative-calendar';

interface CalendarEventRow {
  id: string;
  organization_id: string;
  integration_id: string;
  provider: string;
  provider_event_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  status: string;
  organizer_email: string | null;
  organizer_name: string | null;
  attendees: Array<{ email: string; name?: string; status?: string }>;
  recurrence: string[] | null;
  html_link: string | null;
  color_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  matched_by: string | null;
  created_at: string;
  updated_at: string;
}

function toCalendarEvent(row: CalendarEventRow): CreativeCalendarEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationId: row.integration_id,
    provider: row.provider as CalendarProvider,
    providerEventId: row.provider_event_id,
    calendarId: row.calendar_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    status: row.status as CalendarEventStatus,
    organizerEmail: row.organizer_email,
    organizerName: row.organizer_name,
    attendees: row.attendees,
    recurrence: row.recurrence,
    htmlLink: row.html_link,
    colorId: row.color_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    matchedBy: row.matched_by as CalendarMatchType | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const calendarKeys = {
  all: (orgId: string) => ['creative-calendar-events', orgId] as const,
  forEntity: (entityType: string, entityId: string) =>
    ['creative-calendar-events', 'entity', entityType, entityId] as const,
  range: (orgId: string, start: string, end: string) =>
    ['creative-calendar-events', 'range', orgId, start, end] as const,
};

export function useCreativeCalendarEvents(filters?: {
  entityType?: string;
  entityId?: string;
  startAfter?: string;
  endBefore?: string;
  limit?: number;
}) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeCalendarEvent[]>({
    queryKey: filters?.entityType && filters?.entityId
      ? calendarKeys.forEntity(filters.entityType, filters.entityId)
      : calendarKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('creative_calendar_events')
        .select('*')
        .eq('organization_id', orgId!)
        .neq('status', 'cancelled')
        .order('start_at', { ascending: true });

      if (filters?.entityType && filters?.entityId) {
        query = query.eq('entity_type', filters.entityType).eq('entity_id', filters.entityId);
      }
      if (filters?.startAfter) {
        query = query.gte('start_at', filters.startAfter);
      }
      if (filters?.endBefore) {
        query = query.lte('end_at', filters.endBefore);
      }
      query = query.limit(filters?.limit ?? 50);

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as CalendarEventRow[]).map(toCalendarEvent);
    },
  });
}

export interface CreateCalendarEventInput {
  integrationId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  attendees?: Array<{ email: string; name?: string }>;
  allDay?: boolean;
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateCalendarEventInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-event-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            integrationId: values.integrationId,
            title: values.title,
            description: values.description,
            location: values.location,
            startAt: values.startAt,
            endAt: values.endAt,
            attendees: values.attendees,
            allDay: values.allDay,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Create failed' }));
        throw new Error((err as { error: string }).error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-calendar-events'] });
    },
  });
}
