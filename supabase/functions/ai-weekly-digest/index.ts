import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: 'ai-weekly-digest', error: 'missing_supabase_config' });
    return new Response(JSON.stringify({ error: 'Missing service config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!openaiKey) {
    logEdgeEvent('error', { fn: 'ai-weekly-digest', error: 'missing_openai_key' });
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all active organizations
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, name');

  if (orgError) {
    logEdgeEvent('error', { fn: 'ai-weekly-digest', error: orgError.message });
    return new Response(JSON.stringify({ error: orgError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  let organizationsProcessed = 0;
  let digestsSent = 0;

  for (const org of organizations ?? []) {
    const orgId = org.id as string;
    const orgName = org.name as string;

    try {
      // ── Gather metrics for the past 7 days ──────────────────────────

      // New creative clients this week
      const { count: newClientsCount } = await supabase
        .from('creative_clients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', sevenDaysAgo);

      // New creative projects this week
      const { count: newProjectsCount } = await supabase
        .from('creative_projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', sevenDaysAgo);

      // Total pipeline value from active opportunities (not won, not lost)
      const { data: pipelineData } = await supabase
        .from('creative_opportunities')
        .select('value_cents')
        .eq('organization_id', orgId)
        .not('stage', 'in', '("won","lost")');

      const totalPipelineValueCents = (pipelineData ?? []).reduce(
        (sum: number, opp: { value_cents: number | null }) => sum + (opp.value_cents ?? 0),
        0,
      );

      // Opportunities won this week
      const { count: opportunitiesWonCount } = await supabase
        .from('creative_opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', 'won')
        .gte('updated_at', sevenDaysAgo);

      // Opportunities lost this week
      const { count: opportunitiesLostCount } = await supabase
        .from('creative_opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', 'lost')
        .gte('updated_at', sevenDaysAgo);

      // Overdue tasks
      const { count: overdueTasksCount } = await supabase
        .from('creative_activities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('activity_type', 'task')
        .eq('is_completed', false)
        .lt('due_date', now);

      // New activities this week
      const { count: newActivitiesCount } = await supabase
        .from('creative_activities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', sevenDaysAgo);

      // ── Build structured metrics object ─────────────────────────────
      const metrics = {
        organization_name: orgName,
        period: `${sevenDaysAgo.slice(0, 10)} to ${now.slice(0, 10)}`,
        new_clients: newClientsCount ?? 0,
        new_projects: newProjectsCount ?? 0,
        total_pipeline_value_cents: totalPipelineValueCents,
        total_pipeline_value: (totalPipelineValueCents / 100).toFixed(2),
        opportunities_won: opportunitiesWonCount ?? 0,
        opportunities_lost: opportunitiesLostCount ?? 0,
        overdue_tasks: overdueTasksCount ?? 0,
        new_activities: newActivitiesCount ?? 0,
      };

      // ── Call OpenAI to generate summary ─────────────────────────────
      const systemPrompt =
        'Generate a concise weekly business summary for a creative agency CRM. Format as 2-3 short paragraphs highlighting key metrics, wins, concerns, and recommended focus areas for the coming week. Be specific with numbers. Keep it under 300 words.';

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(metrics) },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        const errBody = await openaiResponse.text();
        logEdgeEvent('error', {
          fn: 'ai-weekly-digest',
          orgId,
          op: 'openai-call',
          status: openaiResponse.status,
          error: errBody,
        });
        continue;
      }

      const openaiResult = await openaiResponse.json();
      const aiGeneratedText: string =
        openaiResult.choices?.[0]?.message?.content ?? 'Unable to generate summary.';

      // ── Find admin members for this organization ────────────────────
      const { data: adminMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('role', 'admin')
        .eq('status', 'active');

      if (membersError) {
        logEdgeEvent('warn', {
          fn: 'ai-weekly-digest',
          orgId,
          op: 'fetch-admins',
          error: membersError.message,
        });
        continue;
      }

      // ── Send notification to each admin ─────────────────────────────
      for (const member of adminMembers ?? []) {
        const { error: notifError } = await supabase
          .from('creative_notifications')
          .insert({
            organization_id: orgId,
            user_id: member.user_id,
            type: 'ai_insight',
            title: 'Weekly Business Digest',
            body: aiGeneratedText,
            action_url: '/creative',
          });

        if (notifError) {
          logEdgeEvent('warn', {
            fn: 'ai-weekly-digest',
            orgId,
            userId: member.user_id,
            op: 'insert-notification',
            error: notifError.message,
          });
          continue;
        }

        digestsSent++;
      }

      // ── Deduct 1 AI credit per digest ───────────────────────────────
      const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
      try {
        const { data: existingUsage } = await supabase
          .from('ai_usage_monthly')
          .select('credits_used, operation_breakdown')
          .eq('organization_id', orgId)
          .eq('period', currentPeriod)
          .maybeSingle();

        if (existingUsage) {
          const breakdown = (existingUsage.operation_breakdown ?? {}) as Record<string, number>;
          await supabase
            .from('ai_usage_monthly')
            .update({
              credits_used: (existingUsage.credits_used ?? 0) + 1,
              operation_breakdown: {
                ...breakdown,
                weekly_digest: (breakdown.weekly_digest ?? 0) + 1,
              },
            })
            .eq('organization_id', orgId)
            .eq('period', currentPeriod);
        } else {
          await supabase
            .from('ai_usage_monthly')
            .insert({
              organization_id: orgId,
              period: currentPeriod,
              credits_used: 1,
              operation_breakdown: { weekly_digest: 1 },
            });
        }
      } catch (creditErr) {
        logEdgeEvent('warn', {
          fn: 'ai-weekly-digest',
          orgId,
          op: 'credit-deduction',
          error: creditErr instanceof Error ? creditErr.message : String(creditErr),
        });
      }

      organizationsProcessed++;
      logEdgeEvent('info', {
        fn: 'ai-weekly-digest',
        orgId,
        orgName,
        adminsNotified: (adminMembers ?? []).length,
      });
    } catch (orgErr) {
      logEdgeEvent('error', {
        fn: 'ai-weekly-digest',
        orgId,
        error: orgErr instanceof Error ? orgErr.message : String(orgErr),
      });
      // Continue processing remaining organizations
    }
  }

  logEdgeEvent('info', {
    fn: 'ai-weekly-digest',
    organizations_processed: organizationsProcessed,
    digests_sent: digestsSent,
  });

  return new Response(
    JSON.stringify({
      organizations_processed: organizationsProcessed,
      digests_sent: digestsSent,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
