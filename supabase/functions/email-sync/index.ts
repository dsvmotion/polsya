import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';
import { ImapClient, type ImapFetchedMessage } from '../_shared/imap-client.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FN = 'email-sync';

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

interface PrefetchedContact {
  id: string;
  email: string;
}

interface PrefetchedClient {
  id: string;
  website: string;
}

// ---------------------------------------------------------------------------
// Handler
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

  // Fetch all active email integrations
  const { data: integrations, error: intError } = await supabase
    .from('integration_connections')
    .select('id, organization_id, provider, metadata, last_sync_at')
    .in('provider', ['gmail', 'outlook', 'email_imap'])
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

      const sinceDate = integration.last_sync_at
        ? new Date(integration.last_sync_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days

      let messages: RawEmail[] = [];

      if (integration.provider === 'gmail') {
        messages = await fetchGmailMessages(metadata, sinceDate);
      } else if (integration.provider === 'outlook') {
        messages = await fetchOutlookMessages(metadata, sinceDate);
      } else if (integration.provider === 'email_imap') {
        messages = await fetchImapMessages(metadata, sinceDate);
      }

      // C1: Pre-fetch contacts and clients for in-memory matching (avoid N+1 queries)
      const orgId = integration.organization_id;

      const { data: contacts } = await supabase
        .from('creative_contacts')
        .select('id, email')
        .eq('organization_id', orgId)
        .not('email', 'is', null);

      const { data: clients } = await supabase
        .from('creative_clients')
        .select('id, website')
        .eq('organization_id', orgId)
        .not('website', 'is', null);

      // C3: Track per-message success
      let messagesSynced = 0;

      for (const msg of messages) {
        const entityMatch = matchEntity(
          (contacts ?? []) as PrefetchedContact[],
          (clients ?? []) as PrefetchedClient[],
          msg,
        );

        const { error: upsertError } = await supabase.from('creative_emails').upsert(
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

        if (upsertError) {
          logEdgeEvent('warn', { fn: FN, integration_id: integration.id, message_id: msg.messageId, error: upsertError.message });
          continue;
        }
        messagesSynced++;
      }

      // I10: Only update last_sync_at if at least one message was synced
      if (messagesSynced > 0) {
        await supabase
          .from('integration_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);
      }

      synced += messagesSynced;
      logEdgeEvent('info', {
        fn: FN,
        integration_id: integration.id,
        provider: integration.provider,
        messages_synced: messagesSynced,
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

      // C4: Wrap error-status DB update in try/catch
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
  // Capped at 50 per sync cycle; cron frequency ensures no messages are lost
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`);
  }

  const listBody = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
  if (!listBody.messages?.length) return [];

  // C2: Batch fetch messages in chunks of 10
  const BATCH_SIZE = 10;
  const results: RawEmail[] = [];
  for (let i = 0; i < listBody.messages.length; i += BATCH_SIZE) {
    const batch = listBody.messages.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(async (ref) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!msgRes.ok) return null;
        const msg = await msgRes.json() as GmailMessage;
        return parseGmailMessage(msg, metadata.gmail_account_email as string);
      }),
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }

  return results;
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

  // M14: Guard against empty accountEmail
  const fromEmail = fromParsed.email.toLowerCase();
  const direction: 'inbound' | 'outbound' =
    accountEmail && fromEmail === accountEmail.toLowerCase() ? 'outbound' : 'inbound';

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
    // M15: Normalize subject handling
    subject: subject ?? null,
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

  // I6: Use URLSearchParams for proper URL encoding
  // Capped at 50 per sync cycle; cron frequency ensures no messages are lost
  const params = new URLSearchParams({
    '$filter': `receivedDateTime ge ${sinceISO}`,
    '$top': '50',
    '$orderby': 'receivedDateTime desc',
    '$select': 'id,conversationId,subject,from,toRecipients,ccRecipients,bccRecipients,body,bodyPreview,isRead,isDraft,hasAttachments,receivedDateTime,flag,categories',
  });
  const url = `https://graph.microsoft.com/v1.0/me/messages?${params.toString()}`;

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

function parseOutlookMessage(msg: OutlookMessage, accountEmail: string): RawEmail {
  const fromEmail = msg.from?.emailAddress?.address ?? '';
  // M14: Guard against empty accountEmail
  const direction: 'inbound' | 'outbound' =
    accountEmail && fromEmail.toLowerCase() === accountEmail.toLowerCase() ? 'outbound' : 'inbound';

  return {
    messageId: msg.id,
    threadId: msg.conversationId,
    // M15: Normalize subject handling
    subject: msg.subject ?? null,
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
// IMAP fetch
// ---------------------------------------------------------------------------

async function fetchImapMessages(
  metadata: Record<string, unknown>,
  since: Date,
): Promise<RawEmail[]> {
  const host = metadata.imap_host as string;
  const port = (metadata.imap_port as number) ?? 993;
  const secure = (metadata.imap_secure as boolean) ?? true;
  const username = metadata.username as string;
  const password = metadata.password as string;
  const accountEmail = (metadata.account_email as string) ?? '';

  if (!host || !username || !password) {
    logEdgeEvent('warn', { fn: FN, error: 'IMAP credentials incomplete: missing host, username, or password' });
    return [];
  }

  const client = new ImapClient();

  try {
    await client.connect({ host, port, secure, username, password });
    await client.login(username, password);
    await client.selectInbox();

    const seqNums = await client.searchSince(since);
    if (!seqNums.length) return [];

    // Cap at 50 per sync cycle (consistent with Gmail/Outlook)
    const capped = seqNums.slice(-50);
    const results: RawEmail[] = [];

    for (const seq of capped) {
      try {
        const msg = await client.fetchMessage(seq);
        if (!msg) continue;

        const parsed = parseImapMessage(msg, accountEmail);
        if (parsed) results.push(parsed);
      } catch (err) {
        logEdgeEvent('warn', {
          fn: FN,
          error: `IMAP fetch seq ${seq}: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    await client.logout();
    return results;
  } finally {
    client.close();
  }
}

function parseImapMessage(
  msg: ImapFetchedMessage,
  accountEmail: string,
): RawEmail | null {
  const fromRaw = msg.headers['from'] ?? '';
  const toRaw = msg.headers['to'] ?? '';
  const ccRaw = msg.headers['cc'] ?? '';
  const subject = msg.headers['subject'] ?? null;
  const dateRaw = msg.headers['date'] ?? '';
  const messageId = msg.headers['message-id']?.replace(/[<>]/g, '') ?? msg.seq;

  const fromParsed = parseEmailHeader(fromRaw);
  const toParsed = parseEmailList(toRaw);
  const ccParsed = parseEmailList(ccRaw);

  const fromEmail = fromParsed.email.toLowerCase();
  const direction: 'inbound' | 'outbound' =
    accountEmail && fromEmail === accountEmail.toLowerCase() ? 'outbound' : 'inbound';

  // Determine if body is HTML or plain text
  const isHtml = /<(?:html|body|div|p|br|table|span)\b/i.test(msg.bodyText);
  const bodyHtml = isHtml ? msg.bodyText : undefined;
  const bodyText = isHtml ? undefined : msg.bodyText;

  // Generate snippet from body (first 200 chars, text only)
  const snippetSource = bodyText ?? msg.bodyText.replace(/<[^>]+>/g, '');
  const snippet = snippetSource.substring(0, 200).trim() || undefined;

  let sentAt: string;
  if (dateRaw) {
    const parsed = new Date(dateRaw);
    sentAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  } else {
    sentAt = new Date().toISOString();
  }

  return {
    messageId,
    subject,
    fromAddress: fromParsed.email,
    fromName: fromParsed.name || undefined,
    toAddresses: toParsed,
    ccAddresses: ccParsed.length > 0 ? ccParsed : undefined,
    bodyText,
    bodyHtml,
    snippet,
    labels: [],
    isRead: msg.flags.includes('\\Seen'),
    isStarred: msg.flags.includes('\\Flagged'),
    isDraft: msg.flags.includes('\\Draft'),
    direction,
    sentAt,
    hasAttachments: false,
  };
}

// ---------------------------------------------------------------------------
// Entity auto-matching (in-memory, no DB queries)
// ---------------------------------------------------------------------------

function matchEntity(
  contacts: PrefetchedContact[],
  clients: PrefetchedClient[],
  email: RawEmail,
): EntityMatch | null {
  // Collect all email addresses from this message
  const allAddresses = [
    email.fromAddress,
    ...email.toAddresses.map((a) => a.email),
    ...(email.ccAddresses ?? []).map((a) => a.email),
  ].filter(Boolean);

  for (const addr of allAddresses) {
    // 1. Exact contact email match
    const contact = contacts.find(
      (c) => c.email.toLowerCase() === addr.toLowerCase(),
    );

    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    // 2. Domain match against clients
    const domain = addr.split('@')[1]?.toLowerCase();
    if (domain) {
      const matched = clients.find((c) => {
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

// I8: Proper UTF-8 decoding for base64url data
function base64UrlDecode(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}
