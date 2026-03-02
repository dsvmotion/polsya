import { describe, expect, it } from 'vitest';
import { evaluateBillingAccess, hasBillingAccess } from '@/hooks/useBilling';

describe('hasBillingAccess', () => {
  it('allows active-like statuses', () => {
    expect(hasBillingAccess('active')).toBe(true);
    expect(hasBillingAccess('trialing')).toBe(true);
    expect(hasBillingAccess('past_due')).toBe(true);
  });

  it('blocks non-active statuses', () => {
    expect(hasBillingAccess('unpaid')).toBe(false);
    expect(hasBillingAccess('canceled')).toBe(false);
    expect(hasBillingAccess('incomplete')).toBe(false);
    expect(hasBillingAccess('incomplete_expired')).toBe(false);
    expect(hasBillingAccess(null)).toBe(false);
    expect(hasBillingAccess(undefined)).toBe(false);
  });
});

describe('evaluateBillingAccess', () => {
  it('grants past_due access inside grace window', () => {
    const now = Date.UTC(2026, 2, 2, 0, 0, 0);
    const periodEnd = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const access = evaluateBillingAccess({ status: 'past_due', current_period_end: periodEnd }, now);
    expect(access.hasAccess).toBe(true);
    expect(access.reason).toBe('past_due_grace');
  });

  it('blocks past_due access after grace window', () => {
    const now = Date.UTC(2026, 2, 2, 0, 0, 0);
    const periodEnd = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const access = evaluateBillingAccess({ status: 'past_due', current_period_end: periodEnd }, now);
    expect(access.hasAccess).toBe(false);
    expect(access.reason).toBe('past_due_expired');
  });
});
