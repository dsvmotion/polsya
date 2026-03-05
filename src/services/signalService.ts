import type { SignalRule, RuleType, Signal, SignalSeverity, SignalStatus } from '@/types/signal-engine';

// ─── Signal Rule Row ─────────────────────────

export interface SignalRuleRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  rule_type: string;
  conditions: Record<string, unknown>;
  actions: unknown[];
  is_active: boolean;
  priority: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toSignalRule(row: SignalRuleRow): SignalRule {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    ruleType: row.rule_type as RuleType,
    conditions: row.conditions ?? {},
    actions: (row.actions ?? []) as unknown[],
    isActive: row.is_active ?? true,
    priority: row.priority ?? 0,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSignalRules(rows: readonly SignalRuleRow[]): SignalRule[] {
  return rows.map(toSignalRule);
}

// ─── Signal Row ──────────────────────────────

export interface SignalRow {
  id: string;
  organization_id: string;
  rule_id: string | null;
  entity_type: string;
  entity_id: string;
  signal_type: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  data: Record<string, unknown>;
  seen_by: string | null;
  seen_at: string | null;
  actioned_at: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toSignal(row: SignalRow): Signal {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ruleId: row.rule_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    signalType: row.signal_type,
    title: row.title,
    description: row.description,
    severity: row.severity as SignalSeverity,
    status: row.status as SignalStatus,
    data: row.data ?? {},
    seenBy: row.seen_by,
    seenAt: row.seen_at,
    actionedAt: row.actioned_at,
    expiresAt: row.expires_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSignals(rows: readonly SignalRow[]): Signal[] {
  return rows.map(toSignal);
}
