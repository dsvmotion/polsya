import { describe, it, expect } from 'vitest';
import {
  TRIGGER_ENTITIES,
  TRIGGER_EVENTS,
  ACTION_TYPES,
  TRIGGER_ENTITY_LABELS,
  TRIGGER_EVENT_LABELS,
  ACTION_TYPE_LABELS,
} from '@/types/creative-workflow';
import type {
  WorkflowRule,
  TriggerEntity,
  TriggerEvent,
  TriggerCondition,
  WorkflowAction,
} from '@/types/creative-workflow';

// ---------------------------------------------------------------------------
// 1. Type maps and constants
// ---------------------------------------------------------------------------
describe('creative-workflow type maps and constants', () => {
  it('TRIGGER_ENTITIES contains exactly 4 items: client, project, opportunity, contact', () => {
    expect([...TRIGGER_ENTITIES]).toEqual(['client', 'project', 'opportunity', 'contact']);
  });

  it('TRIGGER_EVENTS contains exactly 3 items: stage_change, status_change, created', () => {
    expect([...TRIGGER_EVENTS]).toEqual(['stage_change', 'status_change', 'created']);
  });

  it('ACTION_TYPES contains exactly 4 items: create_activity, create_notification, update_entity, create_project', () => {
    expect([...ACTION_TYPES]).toEqual(['create_activity', 'create_notification', 'update_entity', 'create_project']);
  });

  it('TRIGGER_ENTITY_LABELS has a label for every trigger entity and labels are non-empty strings', () => {
    for (const entity of TRIGGER_ENTITIES) {
      const label = TRIGGER_ENTITY_LABELS[entity];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('TRIGGER_EVENT_LABELS has a label for every trigger event and labels are non-empty strings', () => {
    for (const event of TRIGGER_EVENTS) {
      const label = TRIGGER_EVENT_LABELS[event];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('ACTION_TYPE_LABELS has a label for every action type and labels are non-empty strings', () => {
    for (const action of ACTION_TYPES) {
      const label = ACTION_TYPE_LABELS[action];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('entity label map keys match TRIGGER_ENTITIES exactly', () => {
    expect(Object.keys(TRIGGER_ENTITY_LABELS).sort()).toEqual([...TRIGGER_ENTITIES].sort());
  });

  it('event label map keys match TRIGGER_EVENTS exactly', () => {
    expect(Object.keys(TRIGGER_EVENT_LABELS).sort()).toEqual([...TRIGGER_EVENTS].sort());
  });

  it('action label map keys match ACTION_TYPES exactly', () => {
    expect(Object.keys(ACTION_TYPE_LABELS).sort()).toEqual([...ACTION_TYPES].sort());
  });
});

// ---------------------------------------------------------------------------
// 2. toWorkflowRule mapper
// ---------------------------------------------------------------------------

// Mirror of WorkflowRuleRow from src/hooks/useWorkflowRules.ts
interface WorkflowRuleRow {
  id: string;
  organization_id: string;
  name: string;
  trigger_entity: string;
  trigger_event: string;
  trigger_condition: Record<string, unknown>;
  actions: Record<string, unknown>[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Mirror of toWorkflowRule from src/hooks/useWorkflowRules.ts
function toWorkflowRule(row: WorkflowRuleRow): WorkflowRule {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    triggerEntity: row.trigger_entity as TriggerEntity,
    triggerEvent: row.trigger_event as TriggerEvent,
    triggerCondition: row.trigger_condition as unknown as TriggerCondition,
    actions: row.actions as unknown as WorkflowAction[],
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

describe('toWorkflowRule mapper', () => {
  const baseRow: WorkflowRuleRow = {
    id: 'rule-001',
    organization_id: 'org-123',
    name: 'Move to active on stage change',
    trigger_entity: 'opportunity',
    trigger_event: 'stage_change',
    trigger_condition: { field: 'stage', from: 'lead', to: 'qualified' },
    actions: [
      { type: 'create_activity', activityType: 'task', title: 'Follow up' },
    ],
    is_active: true,
    created_by: 'user-456',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-01-12T14:00:00Z',
  };

  it('maps all snake_case fields to camelCase correctly', () => {
    const rule = toWorkflowRule(baseRow);
    expect(rule.id).toBe('rule-001');
    expect(rule.organizationId).toBe('org-123');
    expect(rule.name).toBe('Move to active on stage change');
    expect(rule.triggerEntity).toBe('opportunity');
    expect(rule.triggerEvent).toBe('stage_change');
    expect(rule.triggerCondition).toEqual({ field: 'stage', from: 'lead', to: 'qualified' });
    expect(rule.actions).toEqual([
      { type: 'create_activity', activityType: 'task', title: 'Follow up' },
    ]);
    expect(rule.isActive).toBe(true);
    expect(rule.createdBy).toBe('user-456');
    expect(rule.createdAt).toBe('2026-01-10T09:00:00Z');
    expect(rule.updatedAt).toBe('2026-01-12T14:00:00Z');
  });

  it('handles all trigger entity types', () => {
    for (const entity of TRIGGER_ENTITIES) {
      const rule = toWorkflowRule({ ...baseRow, trigger_entity: entity });
      expect(rule.triggerEntity).toBe(entity);
    }
  });

  it('handles all trigger event types', () => {
    for (const event of TRIGGER_EVENTS) {
      const rule = toWorkflowRule({ ...baseRow, trigger_event: event });
      expect(rule.triggerEvent).toBe(event);
    }
  });

  it('maps active rule (is_active: true)', () => {
    const rule = toWorkflowRule({ ...baseRow, is_active: true });
    expect(rule.isActive).toBe(true);
  });

  it('maps inactive rule (is_active: false)', () => {
    const rule = toWorkflowRule({ ...baseRow, is_active: false });
    expect(rule.isActive).toBe(false);
  });

  it('preserves trigger_condition object', () => {
    const condition = { field: 'status', to: 'completed' };
    const rule = toWorkflowRule({ ...baseRow, trigger_condition: condition });
    expect(rule.triggerCondition).toEqual({ field: 'status', to: 'completed' });
  });

  it('preserves actions array with multiple items', () => {
    const actions: Record<string, unknown>[] = [
      { type: 'create_activity', activityType: 'note', title: 'Stage changed' },
      { type: 'create_notification', title: 'Opportunity qualified', body: 'Check it out' },
      { type: 'update_entity', field: 'priority', value: 'high' },
    ];
    const rule = toWorkflowRule({ ...baseRow, actions });
    expect(rule.actions).toHaveLength(3);
    expect(rule.actions[0]).toEqual({ type: 'create_activity', activityType: 'note', title: 'Stage changed' });
    expect(rule.actions[1]).toEqual({ type: 'create_notification', title: 'Opportunity qualified', body: 'Check it out' });
    expect(rule.actions[2]).toEqual({ type: 'update_entity', field: 'priority', value: 'high' });
  });
});

// ---------------------------------------------------------------------------
// 3. shouldTriggerRule pure function
// ---------------------------------------------------------------------------

function shouldTriggerRule(
  condition: TriggerCondition,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
): boolean {
  const newValue = String(newRecord[condition.field] ?? '');
  if (newValue !== condition.to) return false;
  if (condition.from !== undefined) {
    const oldValue = String(oldRecord[condition.field] ?? '');
    if (oldValue !== condition.from) return false;
  }
  return true;
}

describe('shouldTriggerRule', () => {
  it('returns true when condition.to matches new value and no from specified', () => {
    const condition: TriggerCondition = { field: 'status', to: 'active' };
    expect(shouldTriggerRule(condition, { status: 'draft' }, { status: 'active' })).toBe(true);
  });

  it('returns true when both from and to match', () => {
    const condition: TriggerCondition = { field: 'stage', from: 'lead', to: 'qualified' };
    expect(shouldTriggerRule(condition, { stage: 'lead' }, { stage: 'qualified' })).toBe(true);
  });

  it('returns false when condition.to does not match new value', () => {
    const condition: TriggerCondition = { field: 'status', to: 'active' };
    expect(shouldTriggerRule(condition, { status: 'draft' }, { status: 'archived' })).toBe(false);
  });

  it('returns false when condition.from does not match old value', () => {
    const condition: TriggerCondition = { field: 'stage', from: 'lead', to: 'qualified' };
    expect(shouldTriggerRule(condition, { stage: 'proposal' }, { stage: 'qualified' })).toBe(false);
  });

  it('returns true when from is undefined (any old value accepted)', () => {
    const condition: TriggerCondition = { field: 'status', to: 'completed' };
    expect(shouldTriggerRule(condition, { status: 'anything' }, { status: 'completed' })).toBe(true);
    expect(shouldTriggerRule(condition, { status: '' }, { status: 'completed' })).toBe(true);
  });

  it('handles missing field in records gracefully (treats as empty string)', () => {
    const condition: TriggerCondition = { field: 'status', to: '' };
    // Missing field in newRecord -> String(undefined) via ?? '' -> ''
    expect(shouldTriggerRule(condition, {}, {})).toBe(true);

    const conditionWithFrom: TriggerCondition = { field: 'stage', from: '', to: '' };
    expect(shouldTriggerRule(conditionWithFrom, {}, {})).toBe(true);

    // When to is non-empty but field is missing, should be false
    const conditionNonEmpty: TriggerCondition = { field: 'status', to: 'active' };
    expect(shouldTriggerRule(conditionNonEmpty, {}, {})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. WorkflowAction type validation
// ---------------------------------------------------------------------------
describe('WorkflowAction type validation', () => {
  it('constructs valid create_activity action', () => {
    const action: WorkflowAction = {
      type: 'create_activity',
      activityType: 'task',
      title: 'Follow up with client',
      description: 'Send proposal by end of week',
    };
    expect(action.type).toBe('create_activity');
    expect(action.activityType).toBe('task');
    expect(action.title).toBe('Follow up with client');
    expect(action.description).toBe('Send proposal by end of week');
  });

  it('constructs valid create_notification action', () => {
    const action: WorkflowAction = {
      type: 'create_notification',
      title: 'Deal won',
      body: 'Opportunity has been closed-won.',
      notifyRole: 'all',
    };
    expect(action.type).toBe('create_notification');
    expect(action.title).toBe('Deal won');
    expect(action.body).toBe('Opportunity has been closed-won.');
    expect(action.notifyRole).toBe('all');
  });

  it('constructs valid update_entity action', () => {
    const action: WorkflowAction = {
      type: 'update_entity',
      field: 'priority',
      value: 'high',
    };
    expect(action.type).toBe('update_entity');
    expect(action.field).toBe('priority');
    expect(action.value).toBe('high');
  });

  it('constructs valid create_project action', () => {
    const action: WorkflowAction = {
      type: 'create_project',
      titleTemplate: 'Onboarding: {{client_name}}',
      status: 'not_started',
    };
    expect(action.type).toBe('create_project');
    expect(action.titleTemplate).toBe('Onboarding: {{client_name}}');
    expect(action.status).toBe('not_started');
  });

  it('verifies each action type exists in ACTION_TYPES array', () => {
    const actionTypes: WorkflowAction['type'][] = [
      'create_activity',
      'create_notification',
      'update_entity',
      'create_project',
    ];
    for (const type of actionTypes) {
      expect((ACTION_TYPES as readonly string[]).includes(type)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. WorkflowRule type contract
// ---------------------------------------------------------------------------
describe('WorkflowRule type contract', () => {
  it('constructs valid rule with all fields', () => {
    const rule: WorkflowRule = {
      id: 'rule-full',
      organizationId: 'org-100',
      name: 'Auto-create project on deal close',
      triggerEntity: 'opportunity',
      triggerEvent: 'stage_change',
      triggerCondition: { field: 'stage', from: 'negotiation', to: 'closed_won' },
      actions: [
        { type: 'create_project', titleTemplate: 'Onboarding: {{name}}', status: 'not_started' },
      ],
      isActive: true,
      createdBy: 'user-admin',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    expect(rule.id).toBe('rule-full');
    expect(rule.triggerEntity).toBe('opportunity');
    expect(rule.triggerEvent).toBe('stage_change');
    expect(rule.isActive).toBe(true);
    expect(rule.actions).toHaveLength(1);
  });

  it('constructs rule with multiple actions (mix of types)', () => {
    const rule: WorkflowRule = {
      id: 'rule-multi',
      organizationId: 'org-100',
      name: 'Full onboarding workflow',
      triggerEntity: 'client',
      triggerEvent: 'created',
      triggerCondition: { field: 'status', to: 'active' },
      actions: [
        { type: 'create_activity', activityType: 'task', title: 'Send welcome email' },
        { type: 'create_notification', title: 'New client created', notifyRole: 'admins' },
        { type: 'create_project', titleTemplate: 'Onboarding: {{name}}' },
        { type: 'update_entity', field: 'onboarding_status', value: 'in_progress' },
      ],
      isActive: true,
      createdBy: 'user-admin',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };
    expect(rule.actions).toHaveLength(4);
    expect(rule.actions[0].type).toBe('create_activity');
    expect(rule.actions[1].type).toBe('create_notification');
    expect(rule.actions[2].type).toBe('create_project');
    expect(rule.actions[3].type).toBe('update_entity');
  });
});
