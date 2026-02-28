export type AgentActionType =
  | 'create_task'
  | 'update_status'
  | 'create_contact'
  | 'create_opportunity'
  | 'log_note';

export type AgentActionStatus = 'queued' | 'success' | 'error' | 'rejected';

export type AgentTargetType =
  | 'pharmacy'
  | 'contact'
  | 'opportunity'
  | 'activity'
  | 'integration';

export interface AgentActionLog {
  id: string;
  agent_name: string;
  action_type: AgentActionType;
  target_type: AgentTargetType;
  target_id: string | null;
  payload: Record<string, unknown>;
  status: AgentActionStatus;
  error_message: string | null;
  requested_by: string | null;
  created_at: string;
  completed_at: string | null;
  idempotency_key: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_note: string | null;
}

export const ACTION_TYPE_LABELS: Record<AgentActionType, string> = {
  create_task: 'Create task',
  update_status: 'Update status',
  create_contact: 'Create contact',
  create_opportunity: 'Create opportunity',
  log_note: 'Log note',
};

export const ACTION_STATUS_COLORS: Record<AgentActionStatus, string> = {
  queued: 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-600',
};

export const TARGET_TYPE_LABELS: Record<AgentTargetType, string> = {
  pharmacy: 'Pharmacy',
  contact: 'Contact',
  opportunity: 'Opportunity',
  activity: 'Activity',
  integration: 'Integration',
};
