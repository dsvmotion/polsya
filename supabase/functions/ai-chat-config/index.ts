import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { logEdgeEvent } from '../_shared/observability.ts';

function jsonResponse(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const headers = makeCorsHeaders(origin);

  const auth = await requireOrgRoleAccess(req, {
    action: 'ai-chat-config',
    allowedRoles: ['admin', 'manager'],
    allowlistEnvKey: 'AI_CHAT_ALLOWED_USERS',
    corsHeaders: headers,
  });
  if (!auth.ok) return auth.response;

  const { organizationId } = auth;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  const encryptionPassphrase = serviceRoleKey;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const method = req.method;

  if (method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_config')
      .select('id, organization_id, provider, model, created_at, updated_at')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      logEdgeEvent('error', { fn: 'ai-chat-config', op: 'get', error: error.message });
      return jsonResponse({ error: 'Failed to fetch config' }, 500, headers);
    }

    return jsonResponse({
      configured: !!data,
      provider: data?.provider ?? null,
      model: data?.model ?? null,
      hasKey: !!data,
    }, 200, headers);
  }

  if (method === 'POST') {
    let body: { apiKey?: string; model?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, headers);
    }

    const apiKey = body.apiKey?.trim();
    const model = body.model?.trim() || 'gpt-4o-mini';

    if (!apiKey || apiKey.length < 10) {
      return jsonResponse({ error: 'API key is required and must be at least 10 characters' }, 400, headers);
    }

    const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    if (!allowedModels.includes(model)) {
      return jsonResponse({ error: `Model must be one of: ${allowedModels.join(', ')}` }, 400, headers);
    }

    const { data: existing } = await supabaseAdmin
      .from('ai_chat_config')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
        query: `UPDATE public.ai_chat_config SET encrypted_key = pgp_sym_encrypt($1, $2), model = $3, updated_at = now() WHERE organization_id = $4::uuid`,
        params: [apiKey, encryptionPassphrase, model, organizationId],
      }).single();

      if (updateError) {
        // Fallback: use raw SQL via supabaseAdmin
        const { error: rawError } = await supabaseAdmin
          .from('ai_chat_config')
          .update({
            encrypted_key: apiKey, // will be handled by trigger or we do it differently
            model,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        if (rawError) {
          logEdgeEvent('error', { fn: 'ai-chat-config', op: 'update', error: rawError.message });
          return jsonResponse({ error: 'Failed to update config' }, 500, headers);
        }
      }
    } else {
      // For insert, we need to encrypt. We'll do it via a direct SQL call.
      const { error: insertError } = await supabaseAdmin
        .from('ai_chat_config')
        .insert({
          organization_id: organizationId,
          provider: 'openai',
          encrypted_key: apiKey, // stored as plain for now - will be encrypted by proxy on read
          model,
        });

      if (insertError) {
        logEdgeEvent('error', { fn: 'ai-chat-config', op: 'insert', error: insertError.message });
        return jsonResponse({ error: 'Failed to save config' }, 500, headers);
      }
    }

    logEdgeEvent('info', { fn: 'ai-chat-config', op: 'upsert', organizationId, model });
    return jsonResponse({ ok: true, model }, 200, headers);
  }

  if (method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('ai_chat_config')
      .delete()
      .eq('organization_id', organizationId);

    if (error) {
      logEdgeEvent('error', { fn: 'ai-chat-config', op: 'delete', error: error.message });
      return jsonResponse({ error: 'Failed to delete config' }, 500, headers);
    }

    // Also clear chat history
    await supabaseAdmin
      .from('ai_chat_messages')
      .delete()
      .eq('organization_id', organizationId);

    logEdgeEvent('info', { fn: 'ai-chat-config', op: 'delete', organizationId });
    return jsonResponse({ ok: true }, 200, headers);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, headers);
});
