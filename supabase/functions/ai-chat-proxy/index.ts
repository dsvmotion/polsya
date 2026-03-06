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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Check if the org has an optional provider/model override
  const { data: config } = await supabaseAdmin
    .from('ai_chat_config')
    .select('provider, model')
    .eq('organization_id', organizationId)
    .maybeSingle();

  const provider = (config?.provider === 'anthropic' ? 'anthropic' : 'openai') as 'openai' | 'anthropic';
  const model = config?.model || (provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : DEFAULT_MODEL);

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (provider === 'anthropic' && !anthropicKey) {
    logEdgeEvent('error', { fn: 'ai-chat-proxy', error: 'ANTHROPIC_API_KEY not configured for anthropic provider' });
    return jsonResponse({ error: 'AI assistant is temporarily unavailable' }, 503, headers);
  }
  if (provider === 'openai' && !openaiKey) {
    logEdgeEvent('error', { fn: 'ai-chat-proxy', error: 'OPENAI_API_KEY not configured' });
    return jsonResponse({ error: 'AI assistant is temporarily unavailable' }, 503, headers);
  }

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

  // ── Creative domain context ──────────────────────────────────────
  const { count: creativeClientCount } = await supabaseAdmin
    .from('creative_clients')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { data: recentClients } = await supabaseAdmin
    .from('creative_clients')
    .select('name, industry, status')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: creativeProjectCount } = await supabaseAdmin
    .from('creative_projects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { data: recentProjects } = await supabaseAdmin
    .from('creative_projects')
    .select('name, status, budget')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { count: creativeOpportunityCount } = await supabaseAdmin
    .from('creative_opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { data: recentCreativeOpportunities } = await supabaseAdmin
    .from('creative_opportunities')
    .select('title, stage, value')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { count: creativeContactCount } = await supabaseAdmin
    .from('creative_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { count: creativeActivityCount } = await supabaseAdmin
    .from('creative_activities')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { data: recentCreativeActivities } = await supabaseAdmin
    .from('creative_activities')
    .select('activity_type, title, occurred_at')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(5);

  // ── Credit check ────────────────────────────────────────────────
  const { data: budgetData } = await supabaseAdmin
    .rpc('get_org_ai_budget', { p_org_id: organizationId });

  const budget = Array.isArray(budgetData) ? budgetData[0] : budgetData;
  const monthlyCredits = budget?.monthly_credits ?? null;
  const creditsUsed = budget?.credits_used ?? 0;
  const creditsPurchased = budget?.credits_purchased ?? 0;
  const aiFeatures: string[] = budget?.ai_features ?? ['chat', 'rag', 'documents'];

  // Check if credits are exhausted (null = unlimited)
  if (monthlyCredits !== null && creditsUsed >= monthlyCredits + creditsPurchased) {
    return jsonResponse({
      error: 'AI credits exhausted for this month. Upgrade your plan for more credits.',
      code: 'CREDITS_EXHAUSTED',
    }, 402, headers);
  }

  // ── RAG retrieval (if org has 'rag' feature) ────────────────────
  let ragContext = '';
  let ragSources: Array<{ title: string; documentId: string }> = [];
  let usedRag = false;

  if (aiFeatures.includes('rag')) {
    try {
      // Embed the user message
      const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small',
          input: userMessage,
        }),
      });

      if (embeddingRes.ok) {
        const embData = (await embeddingRes.json()) as { data?: Array<{ embedding: number[] }> };
        const queryEmbedding = embData.data?.[0]?.embedding;

        if (queryEmbedding) {
          // Search for matching chunks
          const { data: chunks } = await supabaseAdmin
            .rpc('match_document_chunks', {
              query_embedding: JSON.stringify(queryEmbedding),
              match_org_id: organizationId,
              match_threshold: 0.7,
              match_count: 5,
            });

          if (chunks && chunks.length > 0) {
            usedRag = true;
            const seen = new Set<string>();
            ragSources = chunks
              .filter((c: { document_id: string; title: string }) => {
                if (seen.has(c.document_id)) return false;
                seen.add(c.document_id);
                return true;
              })
              .map((c: { document_id: string; title: string }) => ({
                title: c.title,
                documentId: c.document_id,
              }));

            ragContext = `\n\nKNOWLEDGE BASE CONTEXT:\nThe following snippets were retrieved from the organization's uploaded documents and may be relevant to the user's question:\n\n${
              chunks.map((c: { content: string; title: string; similarity: number }, i: number) =>
                `[Source: ${c.title}] (relevance: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`
              ).join('\n\n---\n\n')
            }\n\nUse these snippets to inform your answer when relevant. Cite the source document title when referencing this information.`;
          }
        }
      }
    } catch (ragErr) {
      logEdgeEvent('warn', { fn: 'ai-chat-proxy', op: 'rag-retrieval', error: ragErr instanceof Error ? ragErr.message : String(ragErr) });
      // RAG failure is non-fatal — continue without knowledge base context
    }
  }

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
    creativeClientCount: creativeClientCount ?? 0,
    recentClients: recentClients ?? [],
    creativeProjectCount: creativeProjectCount ?? 0,
    recentProjects: recentProjects ?? [],
    creativeOpportunityCount: creativeOpportunityCount ?? 0,
    recentCreativeOpportunities: recentCreativeOpportunities ?? [],
    creativeContactCount: creativeContactCount ?? 0,
    creativeActivityCount: creativeActivityCount ?? 0,
    recentCreativeActivities: recentCreativeActivities ?? [],
    ragContext,
  });

  // ── Conversation history (scoped to this user only) ───────────────
  const { data: history } = await supabaseAdmin
    .from('ai_chat_messages')
    .select('role, content')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(MAX_CONTEXT_MESSAGES);

  const historyArr = (history ?? []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

  let assistantContent: string;
  if (provider === 'anthropic') {
    const hist = historyArr.filter((m) => m.role !== 'system');
    const anthropicMessages = [
      ...hist,
      { role: 'user' as const, content: userMessage },
    ];
    if (anthropicMessages.length > 0 && anthropicMessages[0].role !== 'user') {
      anthropicMessages.unshift({ role: 'user' as const, content: 'Hi' });
    }
    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          system: systemPrompt,
          messages: anthropicMessages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: m.content,
          })),
        }),
      });
      if (!anthropicRes.ok) {
        const errBody = await anthropicRes.text();
        logEdgeEvent('error', { fn: 'ai-chat-proxy', provider: 'anthropic', status: anthropicRes.status, error: errBody });
        if (anthropicRes.status === 429) {
          return jsonResponse({ error: 'The assistant is busy right now. Please wait a moment and try again.' }, 429, headers);
        }
        return jsonResponse({ error: 'AI assistant encountered an error. Please try again.' }, 502, headers);
      }
      const result = await anthropicRes.json() as { content?: Array<{ type: string; text?: string }> };
      assistantContent = result.content?.[0]?.text ?? 'No response generated.';
    } catch (err) {
      logEdgeEvent('error', { fn: 'ai-chat-proxy', provider: 'anthropic', error: err instanceof Error ? err.message : String(err) });
      return jsonResponse({ error: 'Failed to communicate with AI assistant' }, 502, headers);
    }
  } else {
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...historyArr,
      { role: 'user' as const, content: userMessage },
    ];
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
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
        logEdgeEvent('error', { fn: 'ai-chat-proxy', provider: 'openai', status: openaiResponse.status, error: errBody });
        if (openaiResponse.status === 429) {
          return jsonResponse({ error: 'The assistant is busy right now. Please wait a moment and try again.' }, 429, headers);
        }
        return jsonResponse({ error: 'AI assistant encountered an error. Please try again.' }, 502, headers);
      }
      const result = await openaiResponse.json();
      assistantContent = result.choices?.[0]?.message?.content ?? 'No response generated.';
    } catch (err) {
      logEdgeEvent('error', { fn: 'ai-chat-proxy', provider: 'openai', error: err instanceof Error ? err.message : String(err) });
      return jsonResponse({ error: 'Failed to communicate with AI assistant' }, 502, headers);
    }
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

  logEdgeEvent('info', { fn: 'ai-chat-proxy', organizationId, userId: user.id, provider, model });

  // ── Credit deduction ────────────────────────────────────────────
  const creditCost = usedRag ? 2 : 1;
  const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
  try {
    const { data: existingUsage } = await supabaseAdmin
      .from('ai_usage_monthly')
      .select('credits_used, operation_breakdown')
      .eq('organization_id', organizationId)
      .eq('period', currentPeriod)
      .maybeSingle();

    if (existingUsage) {
      const breakdown = (existingUsage.operation_breakdown ?? {}) as Record<string, number>;
      const opKey = usedRag ? 'rag_chat' : 'chat';
      await supabaseAdmin
        .from('ai_usage_monthly')
        .update({
          credits_used: (existingUsage.credits_used ?? 0) + creditCost,
          operation_breakdown: { ...breakdown, [opKey]: (breakdown[opKey] ?? 0) + 1 },
        })
        .eq('organization_id', organizationId)
        .eq('period', currentPeriod);
    } else {
      const opKey = usedRag ? 'rag_chat' : 'chat';
      await supabaseAdmin
        .from('ai_usage_monthly')
        .insert({
          organization_id: organizationId,
          period: currentPeriod,
          credits_used: creditCost,
          operation_breakdown: { [opKey]: 1 },
        });
    }
  } catch (creditErr) {
    logEdgeEvent('warn', { fn: 'ai-chat-proxy', op: 'credit-deduction', error: creditErr instanceof Error ? creditErr.message : String(creditErr) });
  }

  return jsonResponse({
    reply: assistantContent,
    ...(ragSources.length > 0 ? { sources: ragSources } : {}),
  }, 200, headers);
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
  creativeClientCount: number;
  recentClients: Array<{ name: string; industry: string; status: string }>;
  creativeProjectCount: number;
  recentProjects: Array<{ name: string; status: string; budget: number }>;
  creativeOpportunityCount: number;
  recentCreativeOpportunities: Array<{ title: string; stage: string; value: number }>;
  creativeContactCount: number;
  creativeActivityCount: number;
  recentCreativeActivities: Array<{ activity_type: string; title: string; occurred_at: string }>;
  ragContext: string;
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

  const clientSummary = data.recentClients.length > 0
    ? `\nRecent creative clients:\n${data.recentClients.map(c =>
        `- ${c.name} (${c.industry || 'no industry'}, ${c.status})`
      ).join('\n')}`
    : '';

  const projectSummary = data.recentProjects.length > 0
    ? `\nRecent creative projects:\n${data.recentProjects.map(p =>
        `- ${p.name}: ${p.status}${p.budget ? `, budget: ${data.currency} ${p.budget}` : ''}`
      ).join('\n')}`
    : '';

  const creativeOppSummary = data.recentCreativeOpportunities.length > 0
    ? `\nRecent creative opportunities:\n${data.recentCreativeOpportunities.map(o =>
        `- ${o.title}: ${o.stage} stage${o.value ? `, value: ${data.currency} ${o.value}` : ''}`
      ).join('\n')}`
    : '';

  const creativeActSummary = data.recentCreativeActivities.length > 0
    ? `\nRecent creative activities:\n${data.recentCreativeActivities.map(a =>
        `- ${a.title} (${a.activity_type}, ${a.occurred_at})`
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
- Total creative clients: ${data.creativeClientCount}
- Total creative projects: ${data.creativeProjectCount}
- Total creative opportunities: ${data.creativeOpportunityCount}
- Total creative contacts: ${data.creativeContactCount}
- Total creative activities: ${data.creativeActivityCount}
${entitySummary}${oppSummary}${clientSummary}${projectSummary}${creativeOppSummary}${creativeActSummary}${additionalCtx}
${data.ragContext}
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
