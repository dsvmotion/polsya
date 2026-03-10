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

const CHUNK_SIZE = 2000; // ~512 tokens
const CHUNK_OVERLAP = 200; // ~50 tokens
const MAX_CHUNKS_PER_BATCH = 100;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const INGEST_CREDIT_COST = 5;

/** Split text into overlapping chunks */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  if (!text.trim()) return chunks;

  // Split on paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // Overlap: keep the tail of the previous chunk
        const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
        currentChunk = currentChunk.slice(overlapStart) + '\n\n' + trimmedPara;
      } else {
        // Single paragraph larger than chunk size — split on sentences
        const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= CHUNK_SIZE) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
              currentChunk = currentChunk.slice(overlapStart) + ' ' + sentence;
            } else {
              // Single sentence larger than chunk — force push
              currentChunk = sentence.slice(0, CHUNK_SIZE);
              if (sentence.length > CHUNK_SIZE) {
                chunks.push(currentChunk);
                currentChunk = sentence.slice(CHUNK_SIZE - CHUNK_OVERLAP);
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/** Rough token count estimate (~4 chars per token for English) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Strip HTML tags from content */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Batch embed texts via OpenAI API */
async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI embeddings failed (${response.status}): ${errBody}`);
  }

  const data = (await response.json()) as { data?: Array<{ embedding: number[] }> };
  return (data.data ?? []).map((d) => d.embedding);
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const headers = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'ai-document-ingest',
    allowedRoles: ['admin', 'manager', 'rep', 'ops'],
    allowlistEnvKey: 'AI_DOCUMENT_INGEST_ALLOWED_USERS',
    corsHeaders: headers,
  });
  if (!auth.ok) return auth.response;

  const { organizationId } = auth;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    logEdgeEvent('error', { fn: 'ai-document-ingest', error: 'OPENAI_API_KEY not configured' });
    return jsonResponse({ error: 'AI service is temporarily unavailable' }, 503, headers);
  }

  let body: { document_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, headers);
  }

  const documentId = body.document_id;
  if (!documentId) {
    return jsonResponse({ error: 'document_id is required' }, 400, headers);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Fetch the document
  const { data: doc, error: docError } = await supabaseAdmin
    .from('ai_documents')
    .select('*')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (docError || !doc) {
    return jsonResponse({ error: 'Document not found' }, 404, headers);
  }

  // Set status → processing
  await supabaseAdmin
    .from('ai_documents')
    .update({ status: 'processing' })
    .eq('id', documentId);

  try {
    // ── Step 1: Extract text based on source_type ──────────────────────
    let rawText = '';

    if (doc.source_type === 'pdf') {
      // Download from Supabase Storage
      const { data: fileData, error: fileError } = await supabaseAdmin.storage
        .from('ai-documents')
        .download(doc.source_url);

      if (fileError || !fileData) {
        throw new Error(`Failed to download PDF: ${fileError?.message ?? 'unknown error'}`);
      }

      // Extract text from PDF using basic text extraction
      // For Deno, we extract raw text content from the PDF binary
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const pdfContent = decoder.decode(bytes);

      // Basic PDF text extraction: find text between BT/ET markers and parentheses
      const textMatches = pdfContent.match(/\(([^)]*)\)/g);
      if (textMatches) {
        rawText = textMatches
          .map((m) => m.slice(1, -1))
          .filter((t) => t.length > 1)
          .join(' ');
      }

      // If basic extraction yields very little, try extracting stream content
      if (rawText.length < 100) {
        const streamMatches = pdfContent.match(/stream\r?\n([\s\S]*?)\r?\nendstream/g);
        if (streamMatches) {
          const streamText = streamMatches
            .map((s) => s.replace(/^stream\r?\n/, '').replace(/\r?\nendstream$/, ''))
            .filter((s) => /[a-zA-Z]{3,}/.test(s))
            .join('\n');
          if (streamText.length > rawText.length) {
            rawText = streamText;
          }
        }
      }

      if (!rawText.trim()) {
        throw new Error('Could not extract text from PDF. The file may be image-based or encrypted.');
      }
    } else if (doc.source_type === 'text') {
      rawText = doc.metadata?.raw_content ?? '';
      if (!rawText) {
        throw new Error('No text content found in document metadata');
      }
    } else if (doc.source_type === 'url') {
      if (!doc.source_url) {
        throw new Error('No URL specified');
      }
      const fetchAbort = new AbortController();
      const fetchTimeout = setTimeout(() => fetchAbort.abort(), 30_000);
      const fetchRes = await fetch(doc.source_url, {
        headers: { 'User-Agent': 'Polsya-AI-Bot/1.0' },
        signal: fetchAbort.signal,
      });
      clearTimeout(fetchTimeout);
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch URL (${fetchRes.status})`);
      }
      const html = await fetchRes.text();
      rawText = stripHtml(html);
    } else {
      throw new Error(`Unsupported source type: ${doc.source_type}`);
    }

    // ── Step 2: Chunk the text ────────────────────────────────────────
    const chunks = chunkText(rawText);
    if (chunks.length === 0) {
      throw new Error('Document produced no text chunks');
    }

    logEdgeEvent('info', {
      fn: 'ai-document-ingest',
      documentId,
      chunksCount: chunks.length,
      rawTextLength: rawText.length,
    });

    // ── Step 3: Embed in batches ──────────────────────────────────────
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += MAX_CHUNKS_PER_BATCH) {
      const batch = chunks.slice(i, i + MAX_CHUNKS_PER_BATCH);
      const embeddings = await embedBatch(batch, apiKey);
      allEmbeddings.push(...embeddings);
    }

    // ── Step 4: Insert chunks into database ───────────────────────────
    if (allEmbeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: got ${allEmbeddings.length} embeddings for ${chunks.length} chunks`
      );
    }
    const chunkRows = chunks.map((content, idx) => ({
      document_id: documentId,
      organization_id: organizationId,
      chunk_index: idx,
      content,
      token_count: estimateTokens(content),
      embedding: JSON.stringify(allEmbeddings[idx]),
      metadata: {},
    }));

    // Delete any existing chunks (for re-processing)
    const { error: deleteError } = await supabaseAdmin
      .from('ai_document_chunks')
      .delete()
      .eq('document_id', documentId);
    if (deleteError) {
      console.error('Failed to delete existing chunks:', deleteError.message);
    }

    // Insert in batches of 50
    for (let i = 0; i < chunkRows.length; i += 50) {
      const batch = chunkRows.slice(i, i + 50);
      const { error: insertError } = await supabaseAdmin
        .from('ai_document_chunks')
        .insert(batch);
      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // ── Step 5: Update document status ────────────────────────────────
    const wordCount = rawText.split(/\s+/).length;
    const { error: statusError } = await supabaseAdmin
      .from('ai_documents')
      .update({
        status: 'ready',
        chunk_count: chunks.length,
        metadata: {
          ...doc.metadata,
          word_count: wordCount,
          char_count: rawText.length,
          raw_content: undefined, // Remove raw content to save space
        },
      })
      .eq('id', documentId);
    if (statusError) {
      console.error('Failed to update document status to ready:', statusError.message);
    }

    // ── Step 6: Track credit usage ────────────────────────────────────
    const currentPeriod = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01

    const { error: usageError } = await supabaseAdmin
      .from('ai_usage_monthly')
      .upsert(
        {
          organization_id: organizationId,
          period: currentPeriod,
          credits_used: INGEST_CREDIT_COST,
          operation_breakdown: { ingest: 1 },
        },
        { onConflict: 'organization_id,period' }
      );

    // If upsert inserted a new row, that's fine.
    // If there's a conflict, we need to increment — use a manual update
    if (usageError) {
      // Fallback: try updating directly
      const { data: existing } = await supabaseAdmin
        .from('ai_usage_monthly')
        .select('credits_used, operation_breakdown')
        .eq('organization_id', organizationId)
        .eq('period', currentPeriod)
        .single();

      if (existing) {
        const breakdown = (existing.operation_breakdown ?? {}) as Record<string, number>;
        await supabaseAdmin
          .from('ai_usage_monthly')
          .update({
            credits_used: (existing.credits_used ?? 0) + INGEST_CREDIT_COST,
            operation_breakdown: {
              ...breakdown,
              ingest: (breakdown.ingest ?? 0) + 1,
            },
          })
          .eq('organization_id', organizationId)
          .eq('period', currentPeriod);
      } else {
        // Insert fresh row
        await supabaseAdmin
          .from('ai_usage_monthly')
          .insert({
            organization_id: organizationId,
            period: currentPeriod,
            credits_used: INGEST_CREDIT_COST,
            operation_breakdown: { ingest: 1 },
          });
      }
    }

    logEdgeEvent('info', {
      fn: 'ai-document-ingest',
      documentId,
      status: 'ready',
      chunks: chunks.length,
    });

    return jsonResponse({
      success: true,
      document_id: documentId,
      chunk_count: chunks.length,
      status: 'ready',
    }, 200, headers);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logEdgeEvent('error', { fn: 'ai-document-ingest', documentId, error: errorMessage });

    // Set document error status
    await supabaseAdmin
      .from('ai_documents')
      .update({
        status: 'error',
        error_message: errorMessage,
      })
      .eq('id', documentId);

    return jsonResponse({
      error: 'Document ingestion failed',
      detail: errorMessage,
      document_id: documentId,
    }, 500, headers);
  }
});
