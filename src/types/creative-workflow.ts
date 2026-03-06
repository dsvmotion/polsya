export const TRIGGER_ENTITIES = ['client', 'project', 'opportunity', 'contact'] as const;
export type TriggerEntity = (typeof TRIGGER_ENTITIES)[number];

export const TRIGGER_EVENTS = ['stage_change', 'status_change', 'created'] as const;
export type TriggerEvent = (typeof TRIGGER_EVENTS)[number];

export const ACTION_TYPES = ['create_activity', 'create_notification', 'update_entity', 'create_project'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface TriggerCondition {
  field: string;
  from?: string;
  to: string;
}

export type WorkflowAction =
  | { type: 'create_activity'; activityType: string; title: string; description?: string }
  | { type: 'create_notification'; title: string; body?: string; notifyRole?: 'all' | 'admins' }
  | { type: 'update_entity'; field: string; value: unknown }
  | { type: 'create_project'; titleTemplate: string; status?: string };

export interface WorkflowRule {
  id: string;
  organizationId: string;
  name: string;
  triggerEntity: TriggerEntity;
  triggerEvent: TriggerEvent;
  triggerCondition: TriggerCondition;
  actions: WorkflowAction[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const TRIGGER_ENTITY_LABELS: Record<TriggerEntity, string> = {
  client: 'Client',
  project: 'Project',
  opportunity: 'Opportunity',
  contact: 'Contact',
};

export const TRIGGER_EVENT_LABELS: Record<TriggerEvent, string> = {
  stage_change: 'Stage Change',
  status_change: 'Status Change',
  created: 'Created',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  create_activity: 'Create Activity',
  create_notification: 'Send Notification',
  update_entity: 'Update Entity',
  create_project: 'Create Project',
};
