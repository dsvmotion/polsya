// src/types/signal-engine.ts
// Domain types for Signal Engine.
// Matches DB tables: signal_rules, signals.

// ─── Signal Rule ─────────────────────────────

export const RULE_TYPES = ['engagement', 'lifecycle', 'market', 'custom'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  engagement: 'Engagement',
  lifecycle: 'Lifecycle',
  market: 'Market',
  custom: 'Custom',
};

export const RULE_TYPE_COLORS: Record<RuleType, { bg: string; text: string }> = {
  engagement: { bg: 'bg-blue-100', text: 'text-blue-800' },
  lifecycle: { bg: 'bg-purple-100', text: 'text-purple-800' },
  market: { bg: 'bg-amber-100', text: 'text-amber-800' },
  custom: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export interface SignalRule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  ruleType: RuleType;
  conditions: Record<string, unknown>;
  actions: unknown[];
  isActive: boolean;
  priority: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Signal ──────────────────────────────────

export const SIGNAL_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number];

export const SIGNAL_SEVERITY_LABELS: Record<SignalSeverity, string> = {
  info: 'Info',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SIGNAL_SEVERITY_COLORS: Record<SignalSeverity, { bg: string; text: string }> = {
  info: { bg: 'bg-gray-100', text: 'text-gray-800' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
};

export const SIGNAL_STATUSES = ['new', 'seen', 'actioned', 'dismissed'] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

export const SIGNAL_STATUS_LABELS: Record<SignalStatus, string> = {
  new: 'New',
  seen: 'Seen',
  actioned: 'Actioned',
  dismissed: 'Dismissed',
};

export const SIGNAL_STATUS_COLORS: Record<SignalStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-800' },
  seen: { bg: 'bg-gray-100', text: 'text-gray-800' },
  actioned: { bg: 'bg-green-100', text: 'text-green-800' },
  dismissed: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export interface Signal {
  id: string;
  organizationId: string;
  ruleId: string | null;
  entityType: string;
  entityId: string;
  signalType: string;
  title: string;
  description: string | null;
  severity: SignalSeverity;
  status: SignalStatus;
  data: Record<string, unknown>;
  seenBy: string | null;
  seenAt: string | null;
  actionedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
