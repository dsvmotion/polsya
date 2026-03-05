import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';

// ─── Types ────────────────────────────────────

type EnrichmentRunRow = {
  id: string;
  organization_id: string;
  recipe_id: string | null;
  status: string;
  entity_type: string;
  entity_ids: string[];
  results: unknown[];
  credits_used: number;
  started_at: string | null;
  completed_at: string | null;
  error_log: unknown[];
  metadata: Record<string, unknown>;
};

type EnrichmentRecipeRow = {
  id: string;
  steps: unknown[];
};

type StepResult = {
  entityId: string;
  step: string;
  data: Record<string, unknown>;
};

type StepError = {
  entityId: string;
  step: string;
  error: string;
};

// ─── Helpers ──────────────────────────────────

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function entityTableForType(entityType: string): string {
  switch (entityType) {
    case 'client':
      return 'creative_clients';
    case 'contact':
      return 'contacts';
    case 'project':
      return 'creative_projects';
    default:
      return 'creative_clients';
  }
}

async function fetchUrlMetadata(url: string): Promise<Record<string, string>> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PolsyaEnrichmentBot/1.0' },
    redirect: 'follow',
  });
  const html = await response.text();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

  return {
    title: titleMatch?.[1]?.trim() ?? '',
    description: descriptionMatch?.[1]?.trim() ?? '',
    ogTitle: ogTitleMatch?.[1]?.trim() ?? '',
    ogDescription: ogDescMatch?.[1]?.trim() ?? '',
    ogImage: ogImageMatch?.[1]?.trim() ?? '',
  };
}

// ─── Main ─────────────────────────────────────

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  if (!serviceRoleKey || !supabaseUrl) {
    return jsonResponse({ error: 'Server misconfiguration' }, 500, corsHeaders);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { runId } = await req.json();
    if (!runId || typeof runId !== 'string') {
      return jsonResponse({ error: 'Missing or invalid runId' }, 400, corsHeaders);
    }

    // 1. Fetch the run
    const { data: runData, error: runError } = await supabase
      .from('enrichment_runs')
      .select('*')
      .eq('id', runId)
      .maybeSingle();

    if (runError || !runData) {
      return jsonResponse({ error: runError?.message ?? 'Run not found' }, 404, corsHeaders);
    }

    const run = runData as unknown as EnrichmentRunRow;

    // 2. Mark as running
    const startedAt = new Date().toISOString();
    await supabase
      .from('enrichment_runs')
      .update({ status: 'running', started_at: startedAt })
      .eq('id', run.id);

    // 3. Fetch recipe for steps
    let steps: unknown[] = [];
    if (run.recipe_id) {
      const { data: recipeData } = await supabase
        .from('enrichment_recipes')
        .select('id, steps')
        .eq('id', run.recipe_id)
        .maybeSingle();

      if (recipeData) {
        const recipe = recipeData as unknown as EnrichmentRecipeRow;
        steps = recipe.steps ?? [];
      }
    }

    // 4. Process each entity
    const results: StepResult[] = [];
    const errorLog: StepError[] = [];
    let creditsUsed = 0;
    const tableName = entityTableForType(run.entity_type);

    for (const entityId of run.entity_ids) {
      // Fetch entity
      const { data: entityData, error: entityError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', entityId)
        .maybeSingle();

      if (entityError || !entityData) {
        errorLog.push({
          entityId,
          step: 'fetch_entity',
          error: entityError?.message ?? 'Entity not found',
        });
        continue;
      }

      const entity = entityData as Record<string, unknown>;

      // Process each step
      for (const rawStep of steps) {
        const step = rawStep as Record<string, unknown>;
        const action = (step.action as string) ?? '';

        try {
          switch (action) {
            case 'fetch_url_metadata': {
              const websiteUrl = (entity.website as string) ?? '';
              if (!websiteUrl) {
                errorLog.push({ entityId, step: action, error: 'No website URL on entity' });
                break;
              }
              const metadata = await fetchUrlMetadata(websiteUrl);
              results.push({ entityId, step: action, data: metadata });
              creditsUsed += 1;
              break;
            }

            case 'enrich_from_source': {
              const { data: mappings } = await supabase
                .from('entity_source_mappings')
                .select('source_data')
                .eq('entity_id', entityId)
                .order('updated_at', { ascending: false })
                .limit(1);

              const sourceData = (mappings?.[0] as Record<string, unknown> | undefined)?.source_data ?? null;
              results.push({ entityId, step: action, data: { sourceData } });
              creditsUsed += 1;
              break;
            }

            case 'compute_style': {
              const { data: styleRow, error: styleError } = await supabase
                .from('creative_style_analyses')
                .insert({
                  organization_id: run.organization_id,
                  entity_type: run.entity_type,
                  entity_id: entityId,
                  analysis_type: 'auto_enrichment',
                  confidence_score: 0,
                  style_attributes: {},
                  source_urls: [],
                })
                .select('id')
                .single();

              if (styleError) {
                errorLog.push({ entityId, step: action, error: styleError.message });
              } else {
                results.push({ entityId, step: action, data: { styleAnalysisId: styleRow.id } });
              }
              creditsUsed += 1;
              break;
            }

            default: {
              errorLog.push({ entityId, step: action, error: `Unknown step action: ${action}` });
            }
          }
        } catch (stepErr) {
          errorLog.push({ entityId, step: action, error: String(stepErr) });
        }
      }
    }

    // 5. Finalize the run
    const completedAt = new Date().toISOString();
    const finalStatus = errorLog.length > 0 && results.length === 0 ? 'failed' : 'completed';

    await supabase
      .from('enrichment_runs')
      .update({
        status: finalStatus,
        completed_at: completedAt,
        results,
        error_log: errorLog,
        credits_used: creditsUsed,
      })
      .eq('id', run.id);

    // 6. Update recipe run_count and last_run_at
    if (run.recipe_id) {
      await supabase.rpc('increment_enrichment_recipe_run_count', {
        p_recipe_id: run.recipe_id,
      }).catch(() => {
        // Fallback: not critical if RPC does not exist
      });
    }

    return jsonResponse(
      {
        runId: run.id,
        status: finalStatus,
        creditsUsed,
        resultsCount: results.length,
        errorsCount: errorLog.length,
      },
      200,
      corsHeaders,
    );
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500, corsHeaders);
  }
});
