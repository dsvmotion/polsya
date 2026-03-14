import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireBillingAccessForOrg } from '../../supabase/functions/_shared/billing.ts';

type BillingRow = { status: string; current_period_end: string | null };

function makeSupabaseMock(result: { data: BillingRow[] | null; error: { message: string } | null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };

  return {
    from: vi.fn().mockReturnValue(chain),
    __chain: chain,
  };
}

describe('requireBillingAccessForOrg', () => {
  beforeEach(() => {
    (globalThis as { Deno?: unknown }).Deno = {
      env: {
        get: vi.fn((key: string) => {
          if (key === 'BILLING_PAST_DUE_GRACE_DAYS') return '7';
          return undefined;
        }),
      },
    };
  });

  it('allows active subscription', async () => {
    const supabase = makeSupabaseMock({
      data: [{ status: 'active', current_period_end: null }],
      error: null,
    });

    const result = await requireBillingAccessForOrg(supabase as never, 'org-1', {
      action: 'test_action',
      corsHeaders: {},
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.reason).toBe('active');
      expect(result.decision.hasAccess).toBe(true);
    }
  });

  it('allows trialing subscription', async () => {
    const supabase = makeSupabaseMock({
      data: [{ status: 'trialing', current_period_end: null }],
      error: null,
    });

    const result = await requireBillingAccessForOrg(supabase as never, 'org-1', {
      action: 'test_action',
      corsHeaders: {},
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.reason).toBe('trialing');
    }
  });

  it('allows past_due inside grace window', async () => {
    const now = Date.UTC(2026, 2, 3, 0, 0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const periodEnd = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = makeSupabaseMock({
      data: [{ status: 'past_due', current_period_end: periodEnd }],
      error: null,
    });

    const result = await requireBillingAccessForOrg(supabase as never, 'org-1', {
      action: 'test_action',
      corsHeaders: {},
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.reason).toBe('past_due_grace');
      expect(result.decision.graceEndsAt).not.toBeNull();
    }
  });

  it('blocks past_due after grace window with 402', async () => {
    const now = Date.UTC(2026, 2, 3, 0, 0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const periodEnd = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = makeSupabaseMock({
      data: [{ status: 'past_due', current_period_end: periodEnd }],
      error: null,
    });

    const result = await requireBillingAccessForOrg(supabase as never, 'org-1', {
      action: 'test_action',
      corsHeaders: {},
    });

    expect(result.ok).toBe(false);
    if ('response' in result) {
      expect(result.response.status).toBe(402);
      const body = await result.response.json() as { billingReason?: string };
      expect(body.billingReason).toBe('past_due_expired');
    }
  });

  it('allows access when there is no subscription (free tier)', async () => {
    const supabase = makeSupabaseMock({
      data: [],
      error: null,
    });

    const result = await requireBillingAccessForOrg(supabase as never, 'org-1', {
      action: 'test_action',
      corsHeaders: {},
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.reason).toBe('no_subscription');
      expect(result.decision.hasAccess).toBe(true);
    }
  });

  it('returns 500 when billing lookup fails', async () => {
    const supabase = makeSupabaseMock({
      data: null,
      error: { message: 'db offline' },
    });

    const result = await requireBillingAccessForOrg(supabase as never, 'org-1', {
      action: 'test_action',
      corsHeaders: {},
    });

    expect(result.ok).toBe(false);
    if ('response' in result) {
      expect(result.response.status).toBe(500);
      const body = await result.response.json() as { error?: string };
      expect(body.error).toContain('Could not verify billing access');
    }
  });
});
