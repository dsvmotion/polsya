import { describe, it, expect } from 'vitest';
import {
  toSignalRule,
  toSignalRules,
  toSignal,
  toSignals,
  type SignalRuleRow,
  type SignalRow,
} from '@/services/signalService';

/* ─── Factories ─── */

const makeRuleRow = (o: Partial<SignalRuleRow> = {}): SignalRuleRow => ({
  id: 'sr-1',
  organization_id: 'org-1',
  name: 'Large deal alert',
  description: 'Alert when deal exceeds 10k',
  rule_type: 'threshold',
  conditions: { field: 'amount', operator: '>', value: 10000 },
  actions: [{ type: 'notify', target: 'manager' }],
  is_active: true,
  priority: 5,
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

const makeSignalRow = (o: Partial<SignalRow> = {}): SignalRow => ({
  id: 's-1',
  organization_id: 'org-1',
  rule_id: 'sr-1',
  entity_type: 'client',
  entity_id: 'c-1',
  signal_type: 'deal_threshold',
  title: 'Large deal detected',
  description: 'Deal worth 15k',
  severity: 'high',
  status: 'new',
  data: { amount: 15000 },
  seen_by: null,
  seen_at: null,
  actioned_at: null,
  expires_at: '2025-12-31T00:00:00Z',
  metadata: {},
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
  ...o,
});

/* ─── Tests ─── */

describe('signalService', () => {
  describe('toSignalRule', () => {
    it('maps all fields', () => {
      const result = toSignalRule(makeRuleRow());
      expect(result.id).toBe('sr-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.name).toBe('Large deal alert');
      expect(result.ruleType).toBe('threshold');
      expect(result.conditions).toEqual({ field: 'amount', operator: '>', value: 10000 });
      expect(result.actions).toEqual([{ type: 'notify', target: 'manager' }]);
      expect(result.isActive).toBe(true);
      expect(result.priority).toBe(5);
    });

    it('defaults nullish fields', () => {
      const row = makeRuleRow();
      (row as unknown as Record<string, unknown>).conditions = null;
      (row as unknown as Record<string, unknown>).actions = null;
      (row as unknown as Record<string, unknown>).is_active = null;
      (row as unknown as Record<string, unknown>).priority = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toSignalRule(row);
      expect(result.conditions).toEqual({});
      expect(result.actions).toEqual([]);
      expect(result.isActive).toBe(true);
      expect(result.priority).toBe(0);
      expect(result.metadata).toEqual({});
    });
  });

  describe('toSignalRules', () => {
    it('maps array', () => {
      expect(toSignalRules([makeRuleRow({ id: 'a' }), makeRuleRow({ id: 'b' })])).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toSignalRules([])).toEqual([]);
    });
  });

  describe('toSignal', () => {
    it('maps all fields', () => {
      const result = toSignal(makeSignalRow());
      expect(result.id).toBe('s-1');
      expect(result.ruleId).toBe('sr-1');
      expect(result.entityType).toBe('client');
      expect(result.entityId).toBe('c-1');
      expect(result.signalType).toBe('deal_threshold');
      expect(result.title).toBe('Large deal detected');
      expect(result.severity).toBe('high');
      expect(result.status).toBe('new');
      expect(result.data).toEqual({ amount: 15000 });
      expect(result.expiresAt).toBe('2025-12-31T00:00:00Z');
    });

    it('handles actioned signal', () => {
      const result = toSignal(
        makeSignalRow({
          status: 'actioned',
          seen_by: 'user-1',
          seen_at: '2025-06-02T00:00:00Z',
          actioned_at: '2025-06-03T00:00:00Z',
        }),
      );
      expect(result.status).toBe('actioned');
      expect(result.seenBy).toBe('user-1');
      expect(result.seenAt).toBe('2025-06-02T00:00:00Z');
      expect(result.actionedAt).toBe('2025-06-03T00:00:00Z');
    });

    it('defaults nullish data/metadata to empty objects', () => {
      const row = makeSignalRow();
      (row as unknown as Record<string, unknown>).data = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toSignal(row);
      expect(result.data).toEqual({});
      expect(result.metadata).toEqual({});
    });
  });

  describe('toSignals', () => {
    it('maps array', () => {
      expect(toSignals([makeSignalRow(), makeSignalRow()])).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toSignals([])).toEqual([]);
    });
  });
});
