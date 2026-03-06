import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logEdgeEvent } from '../_shared/observability.ts';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: 'activity-reminders', error: 'missing_config' });
    return new Response(JSON.stringify({ error: 'Missing service config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find activities with pending reminders
  const { data: activities, error } = await supabase
    .from('creative_activities')
    .select('*')
    .lte('reminder_at', new Date().toISOString())
    .eq('is_completed', false)
    .eq('reminder_sent', false)
    .limit(100);

  if (error) {
    logEdgeEvent('error', { fn: 'activity-reminders', error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  for (const act of activities ?? []) {
    const targetUserId = act.assigned_to || act.created_by;
    if (!targetUserId) continue;

    // Determine action_url based on entity type
    const actionUrl = act.entity_type ? `/creative/${act.entity_type}s` : '/creative';

    const { error: insertError } = await supabase
      .from('creative_notifications')
      .insert({
        organization_id: act.organization_id,
        user_id: targetUserId,
        type: 'reminder',
        title: `Task reminder: ${act.title}`,
        body: act.description?.slice(0, 200) || null,
        entity_type: act.entity_type,
        entity_id: act.entity_id,
        action_url: actionUrl,
      });

    if (insertError) {
      logEdgeEvent('warn', {
        fn: 'activity-reminders',
        activity_id: act.id,
        error: insertError.message,
      });
      continue;
    }

    const { error: updateError } = await supabase
      .from('creative_activities')
      .update({ reminder_sent: true })
      .eq('id', act.id);

    if (updateError) {
      logEdgeEvent('warn', {
        fn: 'activity-reminders',
        activity_id: act.id,
        error: updateError.message,
      });
      continue;
    }

    sent++;
  }

  logEdgeEvent('info', { fn: 'activity-reminders', sent, total: (activities ?? []).length });

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
