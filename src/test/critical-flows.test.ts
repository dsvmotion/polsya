import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateBillingAccess } from '@/hooks/useBilling';
import { createIdempotencyKey } from '@/hooks/useAgentActions';
import { createJobIdempotencyKey } from '@/hooks/useIntegrationJobs';
import { buildDedupeKey } from '@/lib/import-utils';
import { canManageBilling, canManageWorkspace } from '@/lib/rbac';
import type { OrganizationRole } from '@/types/organization';

const { mockGetSession, mockMaybeSingle, mockFrom } = vi.hoisted(() => {
  const getSession = vi.fn();
  const maybeSingle = vi.fn();
  const from = vi.fn(() => {
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle,
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.limit.mockReturnValue(builder);
    return builder;
  });

  return {
    mockGetSession: getSession,
    mockMaybeSingle: maybeSingle,
    mockFrom: from,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
    from: mockFrom,
  },
}));

async function loadBuildHeaders() {
  const module = await import('@/lib/edge-function-headers');
  return module.buildEdgeFunctionHeaders;
}

describe('critical flow: auth + tenant isolation headers', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockMaybeSingle.mockReset();
    mockFrom.mockClear();
  });

  it('fails when there is no authenticated session', async () => {
    const buildHeaders = await loadBuildHeaders();
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(buildHeaders()).rejects.toThrow('Missing authenticated session');
  });

  it('fails when user has no active organization membership', async () => {
    const buildHeaders = await loadBuildHeaders();
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: 'token-2', user: { id: 'user-2' } },
      },
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(buildHeaders()).rejects.toThrow('No active organization membership');
  });

  it('returns auth and organization headers when membership exists', async () => {
    const buildHeaders = await loadBuildHeaders();
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: 'token-3', user: { id: 'user-3' } },
      },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { organization_id: 'org-123' },
      error: null,
    });

    const headers = await buildHeaders({ 'Content-Type': 'application/json' });

    expect(headers.Authorization).toBe('Bearer token-3');
    expect(headers['X-Organization-Id']).toBe('org-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('reuses cached organization lookup for same user within TTL', async () => {
    const buildHeaders = await loadBuildHeaders();
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: 'token-4', user: { id: 'user-4' } },
      },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { organization_id: 'org-cache' },
      error: null,
    });

    await buildHeaders();
    await buildHeaders();

    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

describe('critical flow: billing enforcement', () => {
  it('allows active and trialing subscriptions', () => {
    expect(
      evaluateBillingAccess({
        status: 'active',
        current_period_end: null,
      }).hasAccess,
    ).toBe(true);

    expect(
      evaluateBillingAccess({
        status: 'trialing',
        current_period_end: null,
      }).hasAccess,
    ).toBe(true);
  });

  it('enforces past_due grace then blocks after grace', () => {
    const now = Date.UTC(2026, 2, 3, 12, 0, 0);
    const withinGrace = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const expiredGrace = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();

    const granted = evaluateBillingAccess(
      { status: 'past_due', current_period_end: withinGrace },
      now,
    );
    const blocked = evaluateBillingAccess(
      { status: 'past_due', current_period_end: expiredGrace },
      now,
    );

    expect(granted.hasAccess).toBe(true);
    expect(granted.reason).toBe('past_due_grace');
    expect(blocked.hasAccess).toBe(false);
    expect(blocked.reason).toBe('past_due_expired');
  });

  it('blocks when no subscription is present', () => {
    const decision = evaluateBillingAccess(null);
    expect(decision.hasAccess).toBe(false);
    expect(decision.reason).toBe('no_subscription');
  });
});

describe('critical flow: idempotency and dedupe', () => {
  it('creates deterministic agent action idempotency key regardless of input key order', () => {
    const a = createIdempotencyKey({
      actionType: 'create_task',
      targetId: 'abc',
      organizationId: 'org-1',
    });
    const b = createIdempotencyKey({
      organizationId: 'org-1',
      targetId: 'abc',
      actionType: 'create_task',
    });
    expect(a).toBe(b);
  });

  it('creates minute-bucket integration job idempotency key', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T12:34:56.000Z'));

    const first = createJobIdempotencyKey('int-1', 'manual');
    vi.setSystemTime(new Date('2026-03-03T12:35:00.000Z'));
    const second = createJobIdempotencyKey('int-1', 'manual');

    expect(first).toBe('int-1:manual:2026-03-03T12:34');
    expect(second).toBe('int-1:manual:2026-03-03T12:35');
    expect(first).not.toBe(second);
    vi.useRealTimers();
  });

  it('normalizes dedupe key to avoid whitespace/case collisions', () => {
    const keyA = buildDedupeKey(' ACME   Health ', ' Madrid ', ' Calle Mayor 1 ');
    const keyB = buildDedupeKey('acme health', 'madrid', 'calle mayor 1');
    expect(keyA).toBe(keyB);
  });
});

describe('critical flow: rbac by role', () => {
  const cases: Array<{ role: OrganizationRole; expected: boolean }> = [
    { role: 'admin', expected: true },
    { role: 'manager', expected: true },
    { role: 'rep', expected: false },
    { role: 'ops', expected: false },
  ];

  it.each(cases)('applies billing/workspace permissions for $role', ({ role, expected }) => {
    expect(canManageBilling(role)).toBe(expected);
    expect(canManageWorkspace(role)).toBe(expected);
  });

  it('blocks when role is missing', () => {
    expect(canManageBilling(null)).toBe(false);
    expect(canManageWorkspace(undefined)).toBe(false);
  });
});
