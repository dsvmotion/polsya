import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: 'email-sync', error: 'missing_config' });
    return new Response(JSON.stringify({ error: 'Missing service config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all active email integrations
  const { data: integrations, error: intError } = await supabase
    .from('integration_connections')
    .select('id, organization_id, provider, metadata, last_sync_at')
    .in('provider', ['gmail', 'outlook', 'email_imap'])
    .eq('status', 'active');

  if (intError) {
    logEdgeEvent('error', { fn: 'email-sync', error: intError.message });
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

      const sinceDate = integration.last_sync_at
        ? new Date(integration.last_sync_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days

      let messages: RawEmail[] = [];

      if (integration.provider === 'gmail') {
        messages = await fetchGmailMessages(metadata, sinceDate);
      } else if (integration.provider === 'outlook') {
        messages = await fetchOutlookMessages(metadata, sinceDate);
      }
      // IMAP sync deferred to future iteration

      for (const msg of messages) {
        const entityMatch = await matchEntity(supabase, integration.organization_id, msg);

        await supabase.from('creative_emails').upsert(
          {
            organization_id: integration.organization_id,
            integration_id: integration.id,
            provider: integration.provider,
            message_id: msg.messageId,
            thread_id: msg.threadId ?? null,
            subject: msg.subject ?? null,
            from_address: msg.fromAddress,
            from_name: msg.fromName ?? null,
            to_addresses: msg.toAddresses,
            cc_addresses: msg.ccAddresses ?? [],
            bcc_addresses: msg.bccAddresses ?? [],
            body_text: msg.bodyText ?? null,
            body_html: msg.bodyHtml ?? null,
            snippet: msg.snippet ?? null,
            labels: msg.labels ?? [],
            is_read: msg.isRead ?? false,
            is_starred: msg.isStarred ?? false,
            is_draft: msg.isDraft ?? false,
            direction: msg.direction,
            sent_at: msg.sentAt,
            has_attachments: msg.hasAttachments ?? false,
            entity_type: entityMatch?.entityType ?? null,
            entity_id: entityMatch?.entityId ?? null,
            matched_by: entityMatch?.matchedBy ?? null,
          },
          { onConflict: 'organization_id,provider,message_id' },
        );
      }

      // Update last_sync_at
      await supabase
        .from('integration_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      synced += messages.length;
      logEdgeEvent('info', {
        fn: 'email-sync',
        integration_id: integration.id,
        provider: integration.provider,
        messages_synced: messages.length,
      });
    } catch (err) {
      errors++;
      const errMsg = err instanceof Error ? err.message : String(err);
      logEdgeEvent('error', {
        fn: 'email-sync',
        integration_id: integration.id,
        provider: integration.provider,
        error: errMsg,
      });

      // Mark integration as errored
      await supabase
        .from('integration_connections')
        .update({ status: 'error', last_error: errMsg })
        .eq('id', integration.id);
    }
  }

  logEdgeEvent('info', { fn: 'email-sync', synced, errors, integrations: (integrations ?? []).length });

  return new Response(JSON.stringify({ synced, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawEmail {
  messageId: string;
  threadId?: string;
  subject?: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: Array<{ email: string; name?: string }>;
  ccAddresses?: Array<{ email: string; name?: string }>;
  bccAddresses?: Array<{ email: string; name?: string }>;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  isDraft?: boolean;
  direction: 'inbound' | 'outbound';
  sentAt: string;
  hasAttachments?: boolean;
}

interface EntityMatch {
  entityType: string;
  entityId: string;
  matchedBy: 'auto_email' | 'auto_domain';
}

// ---------------------------------------------------------------------------
// Gmail API fetch
// ---------------------------------------------------------------------------

async function fetchGmailMessages(
  metadata: Record<string, unknown>,
  since: Date,
): Promise<RawEmail[]> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) return [];

  const afterEpoch = Math.floor(since.getTime() / 1000);
  const query = `after:${afterEpoch}`;

  // List message IDs
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`);
  }

  const listBody = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
  if (!listBody.messages?.length) return [];

  const results: RawEmail[] = [];

  for (const ref of listBody.messages) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!msgRes.ok) continue;

    const msg = await msgRes.json() as GmailMessage;
    const parsed = parseGmailMessage(msg, metadata.gmail_account_email as string);
    if (parsed) results.push(parsed);
  }

  return results;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      filename?: string;
    }>;
  };
  internalDate: string;
}

function parseGmailMessage(msg: GmailMessage, accountEmail: string): RawEmail | null {
  const headers = msg.payload.headers;
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

  const from = getHeader('From');
  const to = getHeader('To');
  const cc = getHeader('Cc');
  const subject = getHeader('Subject');

  const fromParsed = parseEmailHeader(from);
  const toParsed = parseEmailList(to);
  const ccParsed = parseEmailList(cc);

  // Determine direction
  const fromEmail = fromParsed.email.toLowerCase();
  const direction: 'inbound' | 'outbound' =
    fromEmail === accountEmail?.toLowerCase() ? 'outbound' : 'inbound';

  // Extract body
  let bodyText = '';
  let bodyHtml = '';

  if (msg.payload.parts) {
    for (const part of msg.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = base64UrlDecode(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = base64UrlDecode(part.body.data);
      }
    }
  } else if (msg.payload.body?.data) {
    if (msg.payload.mimeType === 'text/html') {
      bodyHtml = base64UrlDecode(msg.payload.body.data);
    } else {
      bodyText = base64UrlDecode(msg.payload.body.data);
    }
  }

  const hasAttachments = (msg.payload.parts ?? []).some((p) => !!p.filename);

  return {
    messageId: msg.id,
    threadId: msg.threadId,
    subject: subject || null,
    fromAddress: fromParsed.email,
    fromName: fromParsed.name || undefined,
    toAddresses: toParsed,
    ccAddresses: ccParsed,
    bodyText: bodyText || undefined,
    bodyHtml: bodyHtml || undefined,
    snippet: msg.snippet ?? undefined,
    labels: msg.labelIds ?? [],
    isRead: !(msg.labelIds ?? []).includes('UNREAD'),
    isStarred: (msg.labelIds ?? []).includes('STARRED'),
    isDraft: (msg.labelIds ?? []).includes('DRAFT'),
    direction,
    sentAt: new Date(parseInt(msg.internalDate, 10)).toISOString(),
    hasAttachments,
  };
}

// ---------------------------------------------------------------------------
// Outlook / Microsoft Graph fetch
// ---------------------------------------------------------------------------

async function fetchOutlookMessages(
  metadata: Record<string, unknown>,
  since: Date,
): Promise<RawEmail[]> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) return [];

  const sinceISO = since.toISOString();
  const url =
    `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${sinceISO}&$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,toRecipients,ccRecipients,bccRecipients,body,bodyPreview,isRead,isDraft,hasAttachments,receivedDateTime,flag,categories`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Outlook list failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json() as { value?: OutlookMessage[] };
  const accountEmail = (metadata.outlook_account_email as string) ?? '';

  return (body.value ?? []).map((msg) => parseOutlookMessage(msg, accountEmail));
}

interface OutlookMessage {
  id: string;
  conversationId?: string;
  subject?: string;
  from?: { emailAddress: { address: string; name?: string } };
  toRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  ccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  bccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  body?: { contentType: string; content: string };
  bodyPreview?: string;
  isRead?: boolean;
  isDraft?: boolean;
  hasAttachments?: boolean;
  receivedDateTime: string;
  flag?: { flagStatus?: string };
  categories?: string[];
}

function parseOutlookMessage(msg: OutlookMessage, accountEmail: string): RawEmail {
  const fromEmail = msg.from?.emailAddress?.address ?? '';
  const direction: 'inbound' | 'outbound' =
    fromEmail.toLowerCase() === accountEmail.toLowerCase() ? 'outbound' : 'inbound';

  return {
    messageId: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject,
    fromAddress: fromEmail,
    fromName: msg.from?.emailAddress?.name,
    toAddresses: (msg.toRecipients ?? []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    ccAddresses: (msg.ccRecipients ?? []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    bccAddresses: (msg.bccRecipients ?? []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    bodyText: msg.body?.contentType === 'text' ? msg.body.content : undefined,
    bodyHtml: msg.body?.contentType === 'html' ? msg.body.content : undefined,
    snippet: msg.bodyPreview,
    labels: msg.categories ?? [],
    isRead: msg.isRead ?? false,
    isStarred: msg.flag?.flagStatus === 'flagged',
    isDraft: msg.isDraft ?? false,
    direction,
    sentAt: msg.receivedDateTime,
    hasAttachments: msg.hasAttachments ?? false,
  };
}

// ---------------------------------------------------------------------------
// Entity auto-matching
// ---------------------------------------------------------------------------

async function matchEntity(
  supabase: any,
  organizationId: string,
  email: RawEmail,
): Promise<EntityMatch | null> {
  // Collect all email addresses from this message
  const allAddresses = [
    email.fromAddress,
    ...email.toAddresses.map((a) => a.email),
    ...(email.ccAddresses ?? []).map((a) => a.email),
  ].filter(Boolean);

  for (const addr of allAddresses) {
    // 1. Exact contact email match
    const { data: contact } = await supabase
      .from('creative_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', addr.toLowerCase())
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    // 2. Domain match against clients
    // NOTE: creative_clients has `website` not `domain`.
    // Extract domain from website URL for comparison.
    const domain = addr.split('@')[1]?.toLowerCase();
    if (domain) {
      const { data: client } = await supabase
        .from('creative_clients')
        .select('id, website')
        .eq('organization_id', organizationId)
        .not('website', 'is', null)
        .order('updated_at', { ascending: false });

      if (client) {
        const matched = client.find((c: { id: string; website: string }) => {
          try {
            const clientDomain = new URL(
              c.website.startsWith('http') ? c.website : `https://${c.website}`,
            ).hostname.replace(/^www\./, '');
            return clientDomain === domain;
          } catch {
            return c.website.toLowerCase().includes(domain);
          }
        });

        if (matched) {
          return { entityType: 'client', entityId: matched.id, matchedBy: 'auto_domain' };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseEmailHeader(raw: string): { email: string; name?: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
  }
  return { email: raw.trim() };
}

function parseEmailList(raw: string): Array<{ email: string; name?: string }> {
  if (!raw) return [];
  return raw.split(',').map((s) => parseEmailHeader(s.trim())).filter((e) => e.email);
}

function base64UrlDecode(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return atob(base64);
  } catch {
    return '';
  }
}
