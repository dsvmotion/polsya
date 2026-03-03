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

const MAX_CONTEXT_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_MODEL = 'gpt-4o-mini';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const headers = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers);
  }

  // All authenticated org members can use the chat
  const auth = await requireOrgRoleAccess(req, {
    action: 'ai-chat-proxy',
    allowedRoles: ['admin', 'manager', 'rep', 'ops'],
    allowlistEnvKey: 'AI_CHAT_ALLOWED_USERS',
    corsHeaders: headers,
  });
  if (!auth.ok) return auth.response;

  const { organizationId, user } = auth;

  let body: { message?: string; context?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, headers);
  }

  const userMessage = body.message?.trim();
  if (!userMessage || userMessage.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ error: `Message is required (max ${MAX_MESSAGE_LENGTH} chars)` }, 400, headers);
  }

  // Platform-level API key: set once in Supabase Edge Function secrets.
  // This is YOUR key as the platform owner - clients never see or configure it.
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    logEdgeEvent('error', { fn: 'ai-chat-proxy', error: 'OPENAI_API_KEY not configured' });
    return jsonResponse({ error: 'AI assistant is temporarily unavailable' }, 503, headers);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Check if the org has an optional model override
  const { data: config } = await supabaseAdmin
    .from('ai_chat_config')
    .select('model')
    .eq('organization_id', organizationId)
    .maybeSingle();

  const model = config?.model || DEFAULT_MODEL;

  // ── Gather workspace context ──────────────────────────────────────
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('name, industry_template_key, locale, currency, entity_label_singular, entity_label_plural')
    .eq('id', organizationId)
    .maybeSingle();

  const { count: entityCount } = await supabaseAdmin
    .from('entities')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { count: contactCount } = await supabaseAdmin
    .from('pharmacy_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { count: opportunityCount } = await supabaseAdmin
    .from('pharmacy_opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { count: activityCount } = await supabaseAdmin
    .from('pharmacy_activities')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { data: recentEntities } = await supabaseAdmin
    .from('entities')
    .select('name, city, province, commercial_status, client_type')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentOpportunities } = await supabaseAdmin
    .from('pharmacy_opportunities')
    .select('title, stage, amount, expected_close_date')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  // ── Build system prompt ───────────────────────────────────────────
  const entityLabel = org?.entity_label_plural || 'entities';
  const systemPrompt = buildSystemPrompt({
    orgName: org?.name || 'Unknown',
    industry: org?.industry_template_key || 'general_b2b',
    currency: org?.currency || 'EUR',
    locale: org?.locale || 'en-US',
    entityLabel,
    entityCount: entityCount ?? 0,
    contactCount: contactCount ?? 0,
    opportunityCount: opportunityCount ?? 0,
    activityCount: activityCount ?? 0,
    recentEntities: recentEntities ?? [],
    recentOpportunities: recentOpportunities ?? [],
    additionalContext: body.context ?? {},
  });

  // ── Conversation history (scoped to this user only) ───────────────
  const { data: history } = await supabaseAdmin
    .from('ai_chat_messages')
    .select('role, content')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(MAX_CONTEXT_MESSAGES);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history ?? []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // ── Call OpenAI (server-side, key never reaches client) ───────────
  let assistantContent: string;
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text();
      logEdgeEvent('error', { fn: 'ai-chat-proxy', status: openaiResponse.status, error: errBody });

      if (openaiResponse.status === 429) {
        return jsonResponse({ error: 'The assistant is busy right now. Please wait a moment and try again.' }, 429, headers);
      }
      return jsonResponse({ error: 'AI assistant encountered an error. Please try again.' }, 502, headers);
    }

    const result = await openaiResponse.json();
    assistantContent = result.choices?.[0]?.message?.content ?? 'No response generated.';
  } catch (err) {
    logEdgeEvent('error', { fn: 'ai-chat-proxy', error: err instanceof Error ? err.message : String(err) });
    return jsonResponse({ error: 'Failed to communicate with AI assistant' }, 502, headers);
  }

  // ── Persist both messages (private to this user) ──────────────────
  const messagesToInsert = [
    { organization_id: organizationId, user_id: user.id, role: 'user', content: userMessage },
    { organization_id: organizationId, user_id: user.id, role: 'assistant', content: assistantContent },
  ];

  const { error: insertError } = await supabaseAdmin
    .from('ai_chat_messages')
    .insert(messagesToInsert);

  if (insertError) {
    logEdgeEvent('warn', { fn: 'ai-chat-proxy', op: 'persist', error: insertError.message });
  }

  logEdgeEvent('info', { fn: 'ai-chat-proxy', organizationId, userId: user.id, model });

  return jsonResponse({ reply: assistantContent }, 200, headers);
});

// ── System prompt builder ─────────────────────────────────────────────

interface SystemPromptData {
  orgName: string;
  industry: string;
  currency: string;
  locale: string;
  entityLabel: string;
  entityCount: number;
  contactCount: number;
  opportunityCount: number;
  activityCount: number;
  recentEntities: Array<{ name: string; city: string; province: string; commercial_status: string; client_type: string }>;
  recentOpportunities: Array<{ title: string; stage: string; amount: number; expected_close_date: string }>;
  additionalContext: Record<string, unknown>;
}

function buildSystemPrompt(data: SystemPromptData): string {
  const entitySummary = data.recentEntities.length > 0
    ? `\nRecent ${data.entityLabel}:\n${data.recentEntities.map(e =>
        `- ${e.name} (${e.city || 'unknown city'}, ${e.commercial_status})`
      ).join('\n')}`
    : '';

  const oppSummary = data.recentOpportunities.length > 0
    ? `\nRecent opportunities:\n${data.recentOpportunities.map(o =>
        `- ${o.title}: ${o.stage} stage, ${data.currency} ${o.amount}${o.expected_close_date ? `, close: ${o.expected_close_date}` : ''}`
      ).join('\n')}`
    : '';

  const additionalCtx = Object.keys(data.additionalContext).length > 0
    ? `\nAdditional context from current view:\n${JSON.stringify(data.additionalContext, null, 2)}`
    : '';

  return `You are the built-in AI Sales Assistant for "${data.orgName}".
You help this company's sales team analyze their data, suggest strategies, prioritize leads, and improve their sales process.

WORKSPACE OVERVIEW:
- Organization: ${data.orgName}
- Industry: ${data.industry}
- Currency: ${data.currency}
- Locale: ${data.locale}
- Total ${data.entityLabel}: ${data.entityCount}
- Total contacts: ${data.contactCount}
- Total opportunities: ${data.opportunityCount}
- Total activities: ${data.activityCount}
${entitySummary}${oppSummary}${additionalCtx}

GUIDELINES:
- Be concise but helpful. Use bullet points for lists.
- Reference specific data when possible (entity names, opportunity stages, etc.).
- Suggest concrete, actionable next steps.
- When analyzing sales performance, consider conversion rates, pipeline health, and activity levels.
- If asked about data you don't have, explain what information would help and suggest how to find it in the app.
- Use the organization's currency (${data.currency}) for any monetary amounts.
- All data discussed is STRICTLY PRIVATE and belongs solely to this organization. Never suggest sharing it externally.
- Respond in the same language the user writes in.
- You are part of this platform — never mention API keys, OpenAI, or any technical configuration to the user.`;
}
