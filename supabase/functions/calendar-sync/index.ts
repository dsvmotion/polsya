import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

const FN = 'calendar-sync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawCalendarEvent {
  providerEventId: string;
  calendarId?: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  organizerEmail?: string;
  organizerName?: string;
  attendees?: Array<{ email: string; name?: string; status?: string }>;
  recurrence?: string[];
  htmlLink?: string;
  colorId?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  recurrence?: string[];
  htmlLink?: string;
  colorId?: string;
}

interface OutlookCalendarEvent {
  id: string;
  subject?: string;
  body?: { contentType?: string; content?: string };
  location?: { displayName?: string };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isAllDay?: boolean;
  showAs?: string;
  organizer?: { emailAddress?: { address?: string; name?: string } };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    status?: { response?: string };
  }>;
  recurrence?: unknown;
  webLink?: string;
}

interface EntityMatch {
  entityType: string;
  entityId: string;
  matchedBy: 'auto_email' | 'auto_domain';
}

interface PrefetchedContact {
  id: string;
  email: string;
}

interface PrefetchedClient {
  id: string;
  website: string;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

// NOTE: This function is invoked by the Supabase cron scheduler (service-role),
// not by browser clients. CORS handling is intentionally omitted.
serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: FN, error: 'missing_config' });
    return new Response(JSON.stringify({ error: 'Missing service config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all active Gmail/Outlook integrations (calendar uses same OAuth as email)
  const { data: integrations, error: intError } = await supabase
    .from('integration_connections')
    .select('id, organization_id, provider, metadata, last_sync_at')
    .in('provider', ['gmail', 'outlook'])
    .eq('status', 'active');

  if (intError) {
    logEdgeEvent('error', { fn: FN, error: intError.message });
    return new Response(JSON.stringify({ error: intError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let synced = 0;
  let errors = 0;

  for (const integration of integrations ?? []) {
    try {
      const { metadata } = await resolveCredentials(
        supabase,
        integration.provider,
        integration.id,
        { ...(integration.metadata ?? {}), _organization_id: integration.organization_id },
      );

      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // past 7 days
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // next 30 days

      let events: RawCalendarEvent[] = [];

      if (integration.provider === 'gmail') {
        events = await fetchGoogleCalendarEvents(metadata, timeMin, timeMax);
      } else if (integration.provider === 'outlook') {
        events = await fetchOutlookCalendarEvents(metadata, timeMin, timeMax);
      }

      // Pre-fetch contacts and clients for in-memory entity matching
      const { data: contacts } = await supabase
        .from('creative_contacts')
        .select('id, email')
        .eq('organization_id', integration.organization_id)
        .not('email', 'is', null);

      const { data: clients } = await supabase
        .from('creative_clients')
        .select('id, website')
        .eq('organization_id', integration.organization_id)
        .not('website', 'is', null);

      let eventsSynced = 0;

      for (const evt of events) {
        const entityMatch = matchEntityFromAttendees(
          (contacts as PrefetchedContact[]) ?? [],
          (clients as PrefetchedClient[]) ?? [],
          evt.attendees ?? [],
        );

        const { error: upsertError } = await supabase.from('creative_calendar_events').upsert(
          {
            organization_id: integration.organization_id,
            integration_id: integration.id,
            provider: integration.provider,
            provider_event_id: evt.providerEventId,
            calendar_id: evt.calendarId ?? 'primary',
            title: evt.title,
            description: evt.description ?? null,
            location: evt.location ?? null,
            start_at: evt.startAt,
            end_at: evt.endAt,
            all_day: evt.allDay ?? false,
            status: evt.status,
            organizer_email: evt.organizerEmail ?? null,
            organizer_name: evt.organizerName ?? null,
            attendees: evt.attendees ?? [],
            recurrence: evt.recurrence ?? null,
            html_link: evt.htmlLink ?? null,
            color_id: evt.colorId ?? null,
            entity_type: entityMatch?.entityType ?? null,
            entity_id: entityMatch?.entityId ?? null,
            matched_by: entityMatch?.matchedBy ?? null,
          },
          { onConflict: 'organization_id,provider,provider_event_id' },
        );

        if (upsertError) {
          logEdgeEvent('warn', {
            fn: FN,
            integration_id: integration.id,
            event_id: evt.providerEventId,
            error: upsertError.message,
          });
          continue;
        }
        eventsSynced++;
      }

      // Only update last_sync_at if events were successfully synced
      if (eventsSynced > 0) {
        await supabase
          .from('integration_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);
      }

      synced += eventsSynced;
      logEdgeEvent('info', {
        fn: FN,
        integration_id: integration.id,
        provider: integration.provider,
        events_synced: eventsSynced,
      });
    } catch (err) {
      errors++;
      const errMsg = err instanceof Error ? err.message : String(err);
      logEdgeEvent('error', {
        fn: FN,
        integration_id: integration.id,
        provider: integration.provider,
        error: errMsg,
      });

      // Mark integration as errored (wrapped in try/catch to prevent cascading failures)
      try {
        await supabase
          .from('integration_connections')
          .update({ status: 'error', last_error: errMsg })
          .eq('id', integration.id);
      } catch (updateErr) {
        logEdgeEvent('error', { fn: FN, integration_id: integration.id, error: 'failed_to_update_error_status' });
      }
    }
  }

  logEdgeEvent('info', { fn: FN, synced, errors, integrations: (integrations ?? []).length });

  return new Response(JSON.stringify({ synced, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ---------------------------------------------------------------------------
// Google Calendar API
// ---------------------------------------------------------------------------

async function fetchGoogleCalendarEvents(
  metadata: Record<string, unknown>,
  timeMin: Date,
  timeMax: Date,
): Promise<RawCalendarEvent[]> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) return [];

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '100', // Capped at 100 per sync cycle; cron frequency ensures no events are lost
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Google Calendar list failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json() as { items?: GoogleCalendarEvent[] };

  return (body.items ?? []).map((item): RawCalendarEvent => {
    const isAllDay = !!item.start?.date;
    return {
      providerEventId: item.id,
      title: item.summary ?? '(No title)',
      description: item.description,
      location: item.location,
      startAt: item.start?.dateTime ?? `${item.start?.date}T00:00:00Z`,
      endAt: item.end?.dateTime ?? `${item.end?.date}T00:00:00Z`,
      allDay: isAllDay,
      status: mapGoogleStatus(item.status),
      organizerEmail: item.organizer?.email,
      organizerName: item.organizer?.displayName,
      attendees: (item.attendees ?? []).map((a) => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus,
      })),
      recurrence: item.recurrence,
      htmlLink: item.htmlLink,
      colorId: item.colorId,
    };
  });
}

function mapGoogleStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
  if (status === 'tentative') return 'tentative';
  if (status === 'cancelled') return 'cancelled';
  return 'confirmed';
}

// ---------------------------------------------------------------------------
// Outlook Calendar API
// ---------------------------------------------------------------------------

async function fetchOutlookCalendarEvents(
  metadata: Record<string, unknown>,
  timeMin: Date,
  timeMax: Date,
): Promise<RawCalendarEvent[]> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) return [];

  // URL-encode all query params for correctness
  const params = new URLSearchParams({
    startDateTime: timeMin.toISOString(),
    endDateTime: timeMax.toISOString(),
    '$top': '100', // Capped at 100 per sync cycle; cron frequency ensures no events are lost
    '$select': 'id,subject,body,location,start,end,isAllDay,showAs,organizer,attendees,recurrence,webLink',
  });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Outlook Calendar list failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json() as { value?: OutlookCalendarEvent[] };

  return (body.value ?? []).map((item): RawCalendarEvent => ({
    providerEventId: item.id,
    title: item.subject ?? '(No title)',
    description: item.body?.content,
    location: item.location?.displayName,
    startAt: item.start?.dateTime ? `${item.start.dateTime}Z` : new Date().toISOString(),
    endAt: item.end?.dateTime ? `${item.end.dateTime}Z` : new Date().toISOString(),
    allDay: item.isAllDay ?? false,
    status: mapOutlookStatus(item.showAs),
    organizerEmail: item.organizer?.emailAddress?.address,
    organizerName: item.organizer?.emailAddress?.name,
    attendees: (item.attendees ?? []).filter((a) => a.emailAddress?.address).map((a) => ({
      email: a.emailAddress!.address!,
      name: a.emailAddress?.name,
      status: a.status?.response,
    })),
    htmlLink: item.webLink,
  }));
}

function mapOutlookStatus(showAs?: string): 'confirmed' | 'tentative' | 'cancelled' {
  if (showAs === 'tentative') return 'tentative';
  if (showAs === 'free') return 'cancelled';
  return 'confirmed';
}

// ---------------------------------------------------------------------------
// Entity matching from attendees (in-memory, no DB queries)
// ---------------------------------------------------------------------------

function matchEntityFromAttendees(
  contacts: PrefetchedContact[],
  clients: PrefetchedClient[],
  attendees: Array<{ email: string; name?: string; status?: string }>,
): EntityMatch | null {
  for (const attendee of attendees) {
    if (!attendee.email) continue;

    // 1. Exact contact email match
    const contact = contacts.find(
      (c) => c.email.toLowerCase() === attendee.email.toLowerCase(),
    );
    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    // 2. Domain match against clients (using website column)
    const domain = attendee.email.split('@')[1]?.toLowerCase();
    if (domain) {
      const client = clients.find((c) => {
        try {
          const clientDomain = new URL(
            c.website.startsWith('http') ? c.website : `https://${c.website}`,
          ).hostname.replace(/^www\./, '');
          return clientDomain === domain;
        } catch {
          return c.website.toLowerCase().includes(domain);
        }
      });

      if (client) {
        return { entityType: 'client', entityId: client.id, matchedBy: 'auto_domain' };
      }
    }
  }
  return null;
}
