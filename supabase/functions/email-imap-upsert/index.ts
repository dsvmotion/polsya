import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';

function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toPort(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const port = Math.trunc(parsed);
  if (port <= 0 || port > 65535) return fallback;
  return port;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'email_imap_upsert',
    allowedRoles: ['admin', 'manager', 'ops'],
    allowlistEnvKey: 'EMAIL_IMAP_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfiguration: missing Supabase service credentials' }, 500, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const billing = await requireBillingAccessForOrg(supabaseAdmin, auth.organizationId, {
    action: 'email_imap_upsert',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));

    const integrationId = toTrimmedString(body.integrationId);
    const accountEmail = toTrimmedString(body.accountEmail).toLowerCase();
    const username = toTrimmedString(body.username);
    const password = toTrimmedString(body.password);
    const imapHost = toTrimmedString(body.imapHost);
    const smtpHost = toTrimmedString(body.smtpHost);
    const imapPort = toPort(body.imapPort, 993);
    const smtpPort = toPort(body.smtpPort, 465);
    const imapSecure = body.imapSecure === false ? false : true;
    const smtpSecure = body.smtpSecure === false ? false : true;

    if (!integrationId) {
      return jsonResponse({ error: 'integrationId is required' }, 400, corsHeaders);
    }

    if (!accountEmail || !username || !password || !imapHost || !smtpHost) {
      return jsonResponse(
        {
          error: 'Missing required fields: accountEmail, username, password, imapHost, smtpHost',
        },
        400,
        corsHeaders,
      );
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('id, provider, organization_id, metadata')
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integration) {
      return jsonResponse({ error: 'Integration not found for this organization' }, 404, corsHeaders);
    }

    if (integration.provider !== 'email_imap') {
      return jsonResponse({ error: 'Integration provider must be email_imap' }, 400, corsHeaders);
    }

    const { error: upsertError } = await supabaseAdmin
      .from('integration_email_credentials')
      .upsert({
        organization_id: auth.organizationId,
        integration_id: integrationId,
        provider: 'email_imap',
        account_email: accountEmail,
        username,
        password,
        imap_host: imapHost,
        imap_port: imapPort,
        imap_secure: imapSecure,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_secure: smtpSecure,
      }, {
        onConflict: 'organization_id,integration_id,provider',
      });

    if (upsertError) {
      return jsonResponse({ error: `Failed to save IMAP credentials: ${upsertError.message}` }, 500, corsHeaders);
    }

    const metadata = (typeof integration.metadata === 'object' && integration.metadata !== null && !Array.isArray(integration.metadata))
      ? { ...(integration.metadata as Record<string, unknown>) }
      : {};
    metadata.account_email = accountEmail;

    await supabaseAdmin
      .from('integration_connections')
      .update({
        metadata,
        status: 'connected',
        last_error: null,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId);

    return jsonResponse({
      saved: true,
      integrationId,
      provider: 'email_imap',
      accountEmail,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      imapSecure,
      smtpSecure,
    }, 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
});
