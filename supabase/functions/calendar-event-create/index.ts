import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

const FN = 'calendar-event-create';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateEventRequest {
  integrationId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  attendees?: Array<{ email: string; name?: string }>;
  allDay?: boolean;
}

interface EntityMatch {
  entityType: string;
  entityId: string;
  matchedBy: string;
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
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...makeCorsHeaders(origin) },
  });
}

/**
 * Match attendees to CRM entities in-memory (no N+1 queries).
 * Checks contacts by email first, then clients by domain extracted from website.
 */
function matchEntityFromAttendees(
  contacts: PrefetchedContact[],
  clients: PrefetchedClient[],
  attendees: Array<{ email: string; name?: string }>,
): EntityMatch | null {
  for (const att of attendees) {
    const email = att.email.toLowerCase();

    const contact = contacts.find((c) => c.email === email);
    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    const domain = email.split('@')[1];
    if (!domain) continue;

    const client = clients.find((c) => {
      if (!c.website) return false;
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

  return null;
}

// ---------------------------------------------------------------------------
// Google Calendar create
// ---------------------------------------------------------------------------

async function createGoogleCalendarEvent(
  metadata: Record<string, unknown>,
  params: CreateEventRequest,
): Promise<{ id: string; htmlLink?: string }> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) throw new Error('Google Calendar access token not available');

  const event: Record<string, unknown> = {
    summary: params.title,
    description: params.description,
    location: params.location,
    start: params.allDay
      ? { date: params.startAt.split('T')[0] }
      : { dateTime: params.startAt },
    end: params.allDay
      ? { date: params.endAt.split('T')[0] }
      : { dateTime: params.endAt },
  };

  if (params.attendees?.length) {
    event.attendees = params.attendees.map((a) => ({ email: a.email, displayName: a.name }));
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    throw new Error(`Google Calendar create failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as { id: string; htmlLink?: string };
}

// ---------------------------------------------------------------------------
// Outlook Calendar create
// ---------------------------------------------------------------------------

async function createOutlookCalendarEvent(
  metadata: Record<string, unknown>,
  params: CreateEventRequest,
): Promise<{ id: string; webLink?: string }> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) throw new Error('Outlook Calendar access token not available');

  const event: Record<string, unknown> = {
    subject: params.title,
    body: params.description ? { contentType: 'text', content: params.description } : undefined,
    location: params.location ? { displayName: params.location } : undefined,
    start: { dateTime: params.startAt, timeZone: 'UTC' },
    end: { dateTime: params.endAt, timeZone: 'UTC' },
    isAllDay: params.allDay ?? false,
  };

  if (params.attendees?.length) {
    event.attendees = params.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: 'required',
    }));
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    throw new Error(`Outlook Calendar create failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as { id: string; webLink?: string };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const corsResult = handleCors(req);
  if (corsResult) return corsResult;

  const origin = req.headers.get('Origin') || '';

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing service config' }, 500, origin);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: CreateEventRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const { integrationId, title, description, location, startAt, endAt, attendees, allDay } = body;

  if (!integrationId || !title || !startAt || !endAt) {
    return jsonResponse(
      { error: 'Missing required fields: integrationId, title, startAt, endAt' },
      400,
      origin,
    );
  }

  const { data: integration, error: intError } = await supabaseAdmin
    .from('integration_connections')
    .select('id, organization_id, provider, metadata')
    .eq('id', integrationId)
    .single();

  if (intError || !integration) {
    return jsonResponse({ error: 'Integration not found' }, 404, origin);
  }

  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', integration.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return jsonResponse({ error: 'Access denied' }, 403, origin);
  }

  try {
    const { metadata } = await resolveCredentials(
      supabaseAdmin,
      integration.provider,
      integration.id,
      { ...(integration.metadata ?? {}), _organization_id: integration.organization_id },
    );

    let providerEventId: string;
    let htmlLink: string | null = null;

    if (integration.provider === 'gmail') {
      const result = await createGoogleCalendarEvent(metadata, body);
      providerEventId = result.id;
      htmlLink = result.htmlLink ?? null;
    } else if (integration.provider === 'outlook') {
      const result = await createOutlookCalendarEvent(metadata, body);
      providerEventId = result.id;
      htmlLink = result.webLink ?? null;
    } else {
      return jsonResponse({ error: 'Calendar not supported for this provider' }, 400, origin);
    }

    // Pre-fetch contacts & clients for in-memory entity matching (no N+1)
    let entityMatch: EntityMatch | null = null;
    if (attendees?.length) {
      const [{ data: contacts }, { data: clients }] = await Promise.all([
        supabaseAdmin
          .from('creative_contacts')
          .select('id, email')
          .eq('organization_id', integration.organization_id)
          .not('email', 'is', null),
        supabaseAdmin
          .from('creative_clients')
          .select('id, website')
          .eq('organization_id', integration.organization_id)
          .not('website', 'is', null),
      ]);

      entityMatch = matchEntityFromAttendees(
        (contacts ?? []) as PrefetchedContact[],
        (clients ?? []) as PrefetchedClient[],
        attendees,
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from('creative_calendar_events')
      .insert({
        organization_id: integration.organization_id,
        integration_id: integration.id,
        provider: integration.provider,
        provider_event_id: providerEventId,
        title,
        description: description ?? null,
        location: location ?? null,
        start_at: startAt,
        end_at: endAt,
        all_day: allDay ?? false,
        status: 'confirmed',
        attendees: attendees ?? [],
        html_link: htmlLink,
        entity_type: entityMatch?.entityType ?? null,
        entity_id: entityMatch?.entityId ?? null,
        matched_by: entityMatch?.matchedBy ?? null,
      });

    if (insertError) {
      logEdgeEvent('warn', {
        fn: FN,
        msg: 'Event created in provider but DB insert failed',
        error: insertError.message,
      });
    }

    logEdgeEvent('info', { fn: FN, provider: integration.provider });

    return jsonResponse({ success: true, eventId: providerEventId, htmlLink }, 200, origin);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logEdgeEvent('error', { fn: FN, error: errMsg });
    return jsonResponse({ error: errMsg }, 500, origin);
  }
});
