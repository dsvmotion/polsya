import { describe, expect, it } from 'vitest';
import { hasBillingAccess } from '@/hooks/useBilling';

describe('hasBillingAccess', () => {
  it('allows active-like statuses', () => {
    expect(hasBillingAccess('active')).toBe(true);
    expect(hasBillingAccess('trialing')).toBe(true);
    expect(hasBillingAccess('past_due')).toBe(true);
    expect(hasBillingAccess('unpaid')).toBe(true);
  });

  it('blocks non-active statuses', () => {
    expect(hasBillingAccess('canceled')).toBe(false);
    expect(hasBillingAccess('incomplete')).toBe(false);
    expect(hasBillingAccess('incomplete_expired')).toBe(false);
    expect(hasBillingAccess(null)).toBe(false);
    expect(hasBillingAccess(undefined)).toBe(false);
  });
});
