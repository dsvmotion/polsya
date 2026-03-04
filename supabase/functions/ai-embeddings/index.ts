import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { logEdgeEvent } from '../_shared/observability.ts';

function jsonResponse(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

const DEFAULT_MODEL = 'text-embedding-3-small';
const MAX_TEXT_LENGTH = 8000;
const MAX_TEXTS = 100;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const headers = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'ai-embeddings',
    allowedRoles: ['admin', 'manager', 'rep', 'ops'],
    allowlistEnvKey: 'AI_EMBEDDINGS_ALLOWED_USERS',
    corsHeaders: headers,
  });
  if (!auth.ok) return auth.response;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    logEdgeEvent('error', { fn: 'ai-embeddings', error: 'OPENAI_API_KEY not configured' });
    return jsonResponse({ error: 'Embeddings service is temporarily unavailable' }, 503, headers);
  }

  let body: { text?: string; texts?: string[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, headers);
  }

  const texts: string[] = [];
  if (typeof body.text === 'string' && body.text.trim()) {
    texts.push(body.text.trim());
  } else if (Array.isArray(body.texts)) {
    for (const t of body.texts) {
      if (typeof t === 'string' && t.trim()) texts.push(t.trim());
    }
  }

  if (texts.length === 0 || texts.length > MAX_TEXTS) {
    return jsonResponse(
      { error: `Provide "text" (string) or "texts" (array of strings, max ${MAX_TEXTS} items)` },
      400,
      headers,
    );
  }

  for (const t of texts) {
    if (t.length > MAX_TEXT_LENGTH) {
      return jsonResponse(
        { error: `Each text must be at most ${MAX_TEXT_LENGTH} characters` },
        400,
        headers,
      );
    }
  }

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? DEFAULT_MODEL,
        input: texts.length === 1 ? texts[0] : texts,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      logEdgeEvent('error', { fn: 'ai-embeddings', status: res.status, error: errBody });
      if (res.status === 429) {
        return jsonResponse({ error: 'Embeddings service is busy. Please retry shortly.' }, 429, headers);
      }
      return jsonResponse({ error: 'Embeddings request failed' }, 502, headers);
    }

    const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const embeddings = (data.data ?? []).map((d) => d.embedding).filter((e): e is number[] => Array.isArray(e));

    if (texts.length === 1 && embeddings.length === 1) {
      return jsonResponse({ embedding: embeddings[0] }, 200, headers);
    }
    return jsonResponse({ embeddings }, 200, headers);
  } catch (err) {
    logEdgeEvent('error', { fn: 'ai-embeddings', error: err instanceof Error ? err.message : String(err) });
    return jsonResponse({ error: 'Failed to generate embeddings' }, 502, headers);
  }
});
