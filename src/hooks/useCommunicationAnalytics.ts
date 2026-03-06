// src/hooks/useCommunicationAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { computeCommunicationScores, getCutoffDate } from '@/services/analyticsService';
import type { TimeRange, CommunicationAnalyticsData } from '@/types/analytics';

export function useCommunicationAnalytics(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CommunicationAnalyticsData>({
    queryKey: ['communication-analytics', orgId ?? '', timeRange],
    enabled: !!orgId,
    staleTime: 120_000,
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);
      const cutoffIso = cutoff?.toISOString() ?? null;

      const [emailsRes, eventsRes, clientsRes] = await Promise.all([
        fromTable('creative_emails')
          .select('id, client_id, direction, received_at, thread_id')
          .eq('organization_id', orgId!)
          .order('received_at', { ascending: false })
          .limit(2000),
        fromTable('creative_calendar_events')
          .select('id, client_id, start_time, end_time, duration_minutes')
          .eq('organization_id', orgId!)
          .order('start_time', { ascending: false })
          .limit(1000),
        fromTable('creative_clients')
          .select('id, name')
          .eq('organization_id', orgId!),
      ]);

      const allEmails = (emailsRes.data ?? []) as {
        id: string; client_id: string | null; direction: string;
        received_at: string; thread_id: string | null;
      }[];
      const allEvents = (eventsRes.data ?? []) as {
        id: string; client_id: string | null; start_time: string;
        end_time: string | null; duration_minutes: number | null;
      }[];
      const clients = (clientsRes.data ?? []) as {
        id: string; name: string;
      }[];

      // Filter by time range
      const emails = cutoffIso
        ? allEmails.filter((e) => e.received_at >= cutoffIso)
        : allEmails;
      const events = cutoffIso
        ? allEvents.filter((e) => e.start_time >= cutoffIso)
        : allEvents;

      // Build client name lookup
      const clientNameMap = new Map<string, string>();
      for (const c of clients) {
        clientNameMap.set(c.id, c.name);
      }

      // ── Email Metrics ──

      const inboundCount = emails.filter((e) => e.direction === 'inbound').length;
      const outboundCount = emails.filter((e) => e.direction === 'outbound').length;

      // Avg thread depth: group by thread_id, compute average count per thread
      const threadCounts = new Map<string, number>();
      for (const e of emails) {
        if (e.thread_id) {
          threadCounts.set(e.thread_id, (threadCounts.get(e.thread_id) ?? 0) + 1);
        }
      }
      const threadCountValues = Array.from(threadCounts.values());
      const avgThreadDepth = threadCountValues.length > 0
        ? Math.round((threadCountValues.reduce((s, v) => s + v, 0) / threadCountValues.length) * 10) / 10
        : 0;

      // By client: group by client_id, count inbound/outbound
      const emailsByClient = new Map<string, { inbound: number; outbound: number }>();
      for (const e of emails) {
        if (e.client_id) {
          const existing = emailsByClient.get(e.client_id) ?? { inbound: 0, outbound: 0 };
          if (e.direction === 'inbound') existing.inbound++;
          else if (e.direction === 'outbound') existing.outbound++;
          emailsByClient.set(e.client_id, existing);
        }
      }
      const byClient = Array.from(emailsByClient.entries())
        .map(([clientId, data]) => ({
          clientName: clientNameMap.get(clientId) ?? clientId,
          inbound: data.inbound,
          outbound: data.outbound,
        }))
        .sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound));

      // ── Calendar Metrics ──

      // Meetings per week: group events by ISO week
      const weekCounts = new Map<string, number>();
      for (const e of events) {
        const d = new Date(e.start_time);
        // ISO week key: find Monday of the week
        const day = d.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(monday.getDate() + mondayOffset);
        const weekKey = monday.toISOString().slice(0, 10);
        weekCounts.set(weekKey, (weekCounts.get(weekKey) ?? 0) + 1);
      }
      const meetingsPerWeek = Array.from(weekCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, count]) => ({ week, count }));

      // Deals with meetings: placeholder empty array
      const dealsWithMeetings: { label: string; count: number }[] = [];

      // Client face time: group by client_id, sum duration_minutes
      const faceTimeByClient = new Map<string, number>();
      for (const e of events) {
        if (e.client_id && e.duration_minutes) {
          faceTimeByClient.set(
            e.client_id,
            (faceTimeByClient.get(e.client_id) ?? 0) + e.duration_minutes,
          );
        }
      }
      const clientFaceTime = Array.from(faceTimeByClient.entries())
        .map(([clientId, totalMinutes]) => ({
          clientName: clientNameMap.get(clientId) ?? clientId,
          totalMinutes,
        }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

      // ── Communication Scores ──

      // emailActivity per client (already computed as emailsByClient)
      // meetingCounts per client
      const meetingCounts = new Map<string, number>();
      for (const e of events) {
        if (e.client_id) {
          meetingCounts.set(e.client_id, (meetingCounts.get(e.client_id) ?? 0) + 1);
        }
      }

      // lastActivityDate per client: latest email or event
      const lastActivityDate = new Map<string, string>();
      for (const e of allEmails) {
        if (e.client_id) {
          const existing = lastActivityDate.get(e.client_id);
          if (!existing || e.received_at > existing) {
            lastActivityDate.set(e.client_id, e.received_at);
          }
        }
      }
      for (const e of allEvents) {
        if (e.client_id) {
          const existing = lastActivityDate.get(e.client_id);
          if (!existing || e.start_time > existing) {
            lastActivityDate.set(e.client_id, e.start_time);
          }
        }
      }

      const communicationScores = computeCommunicationScores(
        clients,
        emailsByClient,
        meetingCounts,
        lastActivityDate,
      );

      return {
        emailMetrics: {
          inboundCount,
          outboundCount,
          avgResponseTimeMinutes: 0, // placeholder — needs thread analysis
          avgThreadDepth,
          byClient,
        },
        calendarMetrics: {
          meetingsPerWeek,
          dealsWithMeetings,
          clientFaceTime,
        },
        communicationScores,
      };
    },
  });
}
