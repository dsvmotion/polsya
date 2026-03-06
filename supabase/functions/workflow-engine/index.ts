import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';

const FN = 'workflow-engine';

const ENTITY_TABLE_MAP: Record<string, string> = {
  client: 'creative_clients',
  project: 'creative_projects',
  opportunity: 'creative_opportunities',
  contact: 'creative_contacts',
};

interface TriggerPayload {
  entity_type: string;
  entity_id: string;
  organization_id: string;
  old_record: Record<string, unknown> | null;
  new_record: Record<string, unknown>;
}

interface TriggerCondition {
  field: string;
  from?: string;
  to: string;
}

interface RuleAction {
  type: string;
  // create_activity fields
  activityType?: string;
  title?: string;
  description?: string;
  // create_notification fields
  notifyRole?: string;
  body?: string;
  // update_entity fields
  field?: string;
  value?: unknown;
  // create_project fields
  titleTemplate?: string;
  status?: string;
}

interface WorkflowRule {
  id: string;
  trigger_entity: string;
  trigger_event: string;
  trigger_condition: TriggerCondition;
  actions: RuleAction[];
  organization_id: string;
}

function determineEvent(
  oldRecord: Record<string, unknown> | null,
  newRecord: Record<string, unknown>,
): string | null {
  // If old_record is null or empty object -> created
  if (!oldRecord || Object.keys(oldRecord).length === 0) {
    return 'created';
  }

  if (oldRecord.stage !== newRecord.stage) {
    return 'stage_change';
  }

  if (oldRecord.status !== newRecord.status) {
    return 'status_change';
  }

  return null;
}

function evaluateCondition(
  condition: TriggerCondition,
  oldRecord: Record<string, unknown> | null,
  newRecord: Record<string, unknown>,
): boolean {
  const field = condition.field;

  // The "to" value must match the new value of that field
  if (condition.to !== undefined && String(newRecord[field]) !== String(condition.to)) {
    return false;
  }

  // If "from" is specified, it must match the old value of that field
  if (condition.from !== undefined) {
    const oldValue = oldRecord ? String(oldRecord[field]) : undefined;
    if (oldValue !== String(condition.from)) {
      return false;
    }
  }

  return true;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const cors = makeCorsHeaders(origin);
  const headers = { ...cors, 'Content-Type': 'application/json' };

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers },
    );
  }

  // Parse request body
  let payload: TriggerPayload;
  try {
    payload = await req.json();
  } catch {
    logEdgeEvent('error', { fn: FN, error: 'invalid_json' });
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers },
    );
  }

  // Validate required fields
  const { entity_type, entity_id, organization_id, old_record, new_record } = payload;
  if (!entity_type || !entity_id || !organization_id || !new_record) {
    logEdgeEvent('error', {
      fn: FN,
      error: 'missing_required_fields',
      entity_type,
      entity_id,
      organization_id,
    });
    return new Response(
      JSON.stringify({ error: 'Missing required fields: entity_type, entity_id, organization_id, new_record' }),
      { status: 400, headers },
    );
  }

  // Validate entity_type
  if (!ENTITY_TABLE_MAP[entity_type]) {
    logEdgeEvent('error', { fn: FN, error: 'invalid_entity_type', entity_type });
    return new Response(
      JSON.stringify({ error: `Invalid entity_type: ${entity_type}` }),
      { status: 400, headers },
    );
  }

  // Initialize Supabase service-role client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    logEdgeEvent('error', { fn: FN, error: 'missing_config' });
    return new Response(
      JSON.stringify({ error: 'Missing service config' }),
      { status: 500, headers },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Step 1: Determine trigger event
  const triggerEvent = determineEvent(old_record, new_record);
  if (!triggerEvent) {
    logEdgeEvent('info', { fn: FN, entity_type, entity_id, message: 'no_matching_event' });
    return new Response(
      JSON.stringify({ matched: 0, executed: 0 }),
      { status: 200, headers },
    );
  }

  logEdgeEvent('info', {
    fn: FN,
    entity_type,
    entity_id,
    organization_id,
    trigger_event: triggerEvent,
  });

  // Step 2: Query active workflow rules matching entity + event + org
  const { data: rules, error: rulesError } = await supabase
    .from('creative_workflow_rules')
    .select('*')
    .eq('trigger_entity', entity_type)
    .eq('trigger_event', triggerEvent)
    .eq('organization_id', organization_id)
    .eq('is_active', true);

  if (rulesError) {
    logEdgeEvent('error', { fn: FN, error: rulesError.message, step: 'query_rules' });
    return new Response(
      JSON.stringify({ error: rulesError.message }),
      { status: 500, headers },
    );
  }

  if (!rules || rules.length === 0) {
    logEdgeEvent('info', { fn: FN, entity_type, entity_id, message: 'no_active_rules' });
    return new Response(
      JSON.stringify({ matched: 0, executed: 0 }),
      { status: 200, headers },
    );
  }

  // Step 3: Evaluate conditions and collect matching rules
  const matchingRules: WorkflowRule[] = [];
  for (const rule of rules) {
    const condition = rule.trigger_condition as TriggerCondition;
    if (!condition || evaluateCondition(condition, old_record, new_record)) {
      matchingRules.push(rule as WorkflowRule);
    }
  }

  logEdgeEvent('info', {
    fn: FN,
    entity_type,
    entity_id,
    total_rules: rules.length,
    matching_rules: matchingRules.length,
  });

  // Step 4: Execute actions for matching rules
  let executed = 0;

  for (const rule of matchingRules) {
    const actions = rule.actions as RuleAction[];
    if (!actions || !Array.isArray(actions)) continue;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_activity': {
            const { error: activityError } = await supabase
              .from('creative_activities')
              .insert({
                organization_id,
                entity_type,
                entity_id,
                activity_type: action.activityType,
                title: action.title,
                description: action.description,
                created_by:
                  (new_record.created_by as string) ||
                  (new_record.updated_by as string),
              });

            if (activityError) {
              logEdgeEvent('warn', {
                fn: FN,
                rule_id: rule.id,
                action_type: action.type,
                error: activityError.message,
              });
            } else {
              executed++;
            }
            break;
          }

          case 'create_notification': {
            // Query organization members to find users to notify
            let membersQuery = supabase
              .from('organization_members')
              .select('user_id')
              .eq('organization_id', organization_id);

            if (action.notifyRole === 'admins') {
              membersQuery = membersQuery.eq('role', 'admin');
            }

            const { data: members, error: membersError } = await membersQuery;

            if (membersError) {
              logEdgeEvent('warn', {
                fn: FN,
                rule_id: rule.id,
                action_type: action.type,
                error: membersError.message,
              });
              break;
            }

            let notified = 0;
            for (const member of members ?? []) {
              const { error: notifError } = await supabase
                .from('creative_notifications')
                .insert({
                  organization_id,
                  user_id: member.user_id,
                  type: 'workflow',
                  title: action.title,
                  body: action.body,
                  entity_type,
                  entity_id,
                });

              if (notifError) {
                logEdgeEvent('warn', {
                  fn: FN,
                  rule_id: rule.id,
                  action_type: action.type,
                  user_id: member.user_id,
                  error: notifError.message,
                });
              } else {
                notified++;
              }
            }

            if (notified > 0) executed++;
            break;
          }

          case 'update_entity': {
            const tableName = ENTITY_TABLE_MAP[entity_type];
            if (!tableName || !action.field) {
              logEdgeEvent('warn', {
                fn: FN,
                rule_id: rule.id,
                action_type: action.type,
                error: 'missing_field_or_table',
              });
              break;
            }

            const { error: updateError } = await supabase
              .from(tableName)
              .update({ [action.field]: action.value })
              .eq('id', entity_id);

            if (updateError) {
              logEdgeEvent('warn', {
                fn: FN,
                rule_id: rule.id,
                action_type: action.type,
                error: updateError.message,
              });
            } else {
              executed++;
            }
            break;
          }

          case 'create_project': {
            const projectName = action.titleTemplate
              ? action.titleTemplate.replace(
                  '{{name}}',
                  (new_record.name as string) || '',
                )
              : '';

            const clientId =
              entity_type === 'client'
                ? entity_id
                : (new_record.client_id as string);

            const { error: projectError } = await supabase
              .from('creative_projects')
              .insert({
                organization_id,
                name: projectName,
                status: action.status || 'planning',
                client_id: clientId,
                created_by:
                  (new_record.created_by as string) ||
                  (new_record.updated_by as string),
              });

            if (projectError) {
              logEdgeEvent('warn', {
                fn: FN,
                rule_id: rule.id,
                action_type: action.type,
                error: projectError.message,
              });
            } else {
              executed++;
            }
            break;
          }

          default: {
            logEdgeEvent('warn', {
              fn: FN,
              rule_id: rule.id,
              action_type: action.type,
              error: 'unknown_action_type',
            });
          }
        }
      } catch (actionError) {
        logEdgeEvent('error', {
          fn: FN,
          rule_id: rule.id,
          action_type: action.type,
          error: String(actionError),
        });
      }
    }
  }

  logEdgeEvent('info', {
    fn: FN,
    entity_type,
    entity_id,
    matched: matchingRules.length,
    executed,
  });

  return new Response(
    JSON.stringify({ matched: matchingRules.length, executed }),
    { status: 200, headers },
  );
});
