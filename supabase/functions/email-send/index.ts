import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';
import { SmtpClient } from '../_shared/smtp-client.ts';

const FN = 'email-send';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendEmailRequest {
  integrationId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  replyToMessageId?: string;
}

interface SendParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  replyToMessageId?: string;
}

interface EntityMatch {
  entityType: string;
  entityId: string;
  matchedBy: 'auto_email' | 'auto_domain';
}

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...makeCorsHeaders(origin) },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // CORS preflight
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

  // Auth: extract user JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify user
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: SendEmailRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const { integrationId, to, cc, bcc, subject, bodyHtml, replyToMessageId } = body;

  if (!integrationId || !to?.length || !subject) {
    return jsonResponse({ error: 'Missing required fields: integrationId, to, subject' }, 400, origin);
  }

  // Load integration
  const { data: integration, error: intError } = await supabaseAdmin
    .from('integration_connections')
    .select('id, organization_id, provider, metadata')
    .eq('id', integrationId)
    .single();

  if (intError || !integration) {
    return jsonResponse({ error: 'Integration not found' }, 404, origin);
  }

  // Verify user belongs to org
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

    let sentMessageId: string;

    if (integration.provider === 'gmail') {
      sentMessageId = await sendViaGmail(metadata, { to, cc, bcc, subject, bodyHtml, replyToMessageId });
    } else if (integration.provider === 'outlook') {
      sentMessageId = await sendViaOutlook(metadata, { to, cc, bcc, subject, bodyHtml, replyToMessageId });
    } else if (integration.provider === 'email_imap') {
      sentMessageId = await sendViaSmtp(metadata, { to, cc, bcc, subject, bodyHtml, replyToMessageId });
    } else {
      return jsonResponse({ error: `Unsupported provider: ${integration.provider}` }, 501, origin);
    }

    // Insert sent message into creative_emails with entity matching
    const entityMatch = await matchEntityFromAddresses(
      supabaseAdmin,
      integration.organization_id,
      to,
    );

    const { error: insertError } = await supabaseAdmin.from('creative_emails').insert({
      organization_id: integration.organization_id,
      integration_id: integration.id,
      provider: integration.provider,
      message_id: sentMessageId,
      subject,
      from_address: integration.provider === 'email_imap'
        ? (metadata.account_email as string) ?? ''
        : (metadata[`${integration.provider}_account_email`] as string) ?? '',
      to_addresses: to.map((email: string) => ({ email })),
      cc_addresses: (cc ?? []).map((email: string) => ({ email })),
      bcc_addresses: (bcc ?? []).map((email: string) => ({ email })),
      body_html: bodyHtml ?? null,
      direction: 'outbound',
      sent_at: new Date().toISOString(),
      entity_type: entityMatch?.entityType ?? null,
      entity_id: entityMatch?.entityId ?? null,
      matched_by: entityMatch?.matchedBy ?? null,
    });

    if (insertError) {
      logEdgeEvent('warn', { fn: FN, error: insertError.message, message_id: sentMessageId });
    }

    logEdgeEvent('info', { fn: FN, provider: integration.provider, to_count: to.length });

    return jsonResponse({ success: true, messageId: sentMessageId }, 200, origin);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logEdgeEvent('error', { fn: FN, error: errMsg });
    return jsonResponse({ error: errMsg }, 500, origin);
  }
});

// ---------------------------------------------------------------------------
// Gmail send
// ---------------------------------------------------------------------------

async function sendViaGmail(metadata: Record<string, unknown>, params: SendParams): Promise<string> {
  const accessToken = metadata.gmail_access_token as string;
  if (!accessToken) throw new Error('Gmail access token not available');

  const rawEmail = buildMimeMessage(
    metadata.gmail_account_email as string,
    params,
  );

  // Encode to base64url (UTF-8 safe)
  const encoded = base64UrlEncode(rawEmail);

  const sendBody: Record<string, unknown> = { raw: encoded };
  if (params.replyToMessageId) {
    sendBody.threadId = params.replyToMessageId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sendBody),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status} ${await res.text()}`);
  }

  const result = await res.json() as { id: string };
  return result.id;
}

// ---------------------------------------------------------------------------
// Outlook send
// ---------------------------------------------------------------------------

async function sendViaOutlook(metadata: Record<string, unknown>, params: SendParams): Promise<string> {
  const accessToken = metadata.outlook_access_token as string;
  if (!accessToken) throw new Error('Outlook access token not available');

  const message: Record<string, unknown> = {
    subject: params.subject,
    body: {
      contentType: 'html',
      content: params.bodyHtml ?? '',
    },
    toRecipients: params.to.map((email) => ({
      emailAddress: { address: email },
    })),
  };

  if (params.cc?.length) {
    message.ccRecipients = params.cc.map((email) => ({
      emailAddress: { address: email },
    }));
  }

  if (params.bcc?.length) {
    message.bccRecipients = params.bcc.map((email) => ({
      emailAddress: { address: email },
    }));
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!res.ok) {
    throw new Error(`Outlook send failed: ${res.status} ${await res.text()}`);
  }

  // Outlook sendMail returns 202 with no body; generate a client-side ID
  return `outlook-sent-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// SMTP send (for IMAP/SMTP provider)
// ---------------------------------------------------------------------------

async function sendViaSmtp(metadata: Record<string, unknown>, params: SendParams): Promise<string> {
  const smtpHost = metadata.smtp_host as string;
  const smtpPort = (metadata.smtp_port as number) ?? 465;
  const smtpSecure = (metadata.smtp_secure as boolean) ?? true;
  const username = metadata.username as string;
  const password = metadata.password as string;
  const accountEmail = (metadata.account_email as string) ?? '';

  if (!smtpHost || !username || !password) {
    throw new Error('SMTP credentials not configured');
  }

  const fromAddress = accountEmail || username;
  const mimeMessage = buildMimeMessage(fromAddress, params);

  const client = new SmtpClient();

  try {
    await client.connect({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      username,
      password,
    });

    await client.sendMail(
      fromAddress,
      params.to,
      params.cc ?? [],
      params.bcc ?? [],
      mimeMessage,
    );

    await client.quit();
  } finally {
    client.close();
  }

  // Generate a client-side message ID (SMTP doesn't return one in sendMail)
  return `smtp-sent-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Entity matching (for sent emails)
// ---------------------------------------------------------------------------

async function matchEntityFromAddresses(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  addresses: string[],
): Promise<EntityMatch | null> {
  for (const addr of addresses) {
    // 1. Exact contact email match
    const { data: contact } = await supabase
      .from('creative_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', addr.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (contact) {
      return { entityType: 'contact', entityId: contact.id, matchedBy: 'auto_email' };
    }

    // 2. Domain match against clients (using website column, not domain)
    const domain = addr.split('@')[1]?.toLowerCase();
    if (domain) {
      const { data: clients } = await supabase
        .from('creative_clients')
        .select('id, website')
        .eq('organization_id', organizationId)
        .not('website', 'is', null);

      if (clients) {
        const matched = clients.find((c: { id: string; website: string }) => {
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

function buildMimeMessage(from: string, params: SendParams): string {
  const lines: string[] = [];
  lines.push(`From: ${from}`);
  lines.push(`To: ${params.to.join(', ')}`);
  if (params.cc?.length) lines.push(`Cc: ${params.cc.join(', ')}`);
  if (params.bcc?.length) lines.push(`Bcc: ${params.bcc.join(', ')}`);
  lines.push(`Subject: ${params.subject}`);
  lines.push('MIME-Version: 1.0');
  lines.push('Content-Type: text/html; charset=UTF-8');
  lines.push('');
  lines.push(params.bodyHtml ?? '');
  return lines.join('\r\n');
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
