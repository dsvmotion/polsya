import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubscriptionBanner } from '@/components/auth/SubscriptionBanner';
import type { BillingOverview, BillingSubscriptionStatus } from '@/types/billing';

const mockUseAuth = vi.fn();
const mockUseCurrentOrganization = vi.fn();
const mockUseBillingOverview = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: () => mockUseCurrentOrganization(),
}));

vi.mock('@/hooks/useBilling', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useBilling')>();
  return {
    ...actual,
    useBillingOverview: () => mockUseBillingOverview(),
  };
});

vi.mock('@/lib/platform', () => ({
  isPlatformOwner: (user: { app_metadata?: { role?: string } } | null) =>
    user?.app_metadata?.role === 'platform_owner',
}));

function overviewWithStatus(status: BillingSubscriptionStatus, currentPeriodEnd: string | null = null): BillingOverview {
  return {
    customer: null,
    invoices: [],
    subscription: {
      id: 'sub-1',
      organization_id: 'org-1',
      stripe_subscription_id: 'stripe-sub',
      stripe_price_id: 'price-1',
      status,
      current_period_start: null,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
      canceled_at: null,
      trial_end: null,
      created_at: '2026-03-03T00:00:00.000Z',
      updated_at: '2026-03-03T00:00:00.000Z',
    },
  };
}

describe('SubscriptionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'u1', app_metadata: {} } });
    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: overviewWithStatus('active'),
      isLoading: false,
    });
  });

  it('does not render for platform owners', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', app_metadata: { role: 'platform_owner' } } });
    mockUseBillingOverview.mockReturnValue({
      data: overviewWithStatus('canceled'),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <SubscriptionBanner />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when subscription is active', () => {
    render(
      <MemoryRouter>
        <SubscriptionBanner />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when no subscription', () => {
    mockUseBillingOverview.mockReturnValue({
      data: { customer: null, subscription: null, invoices: [] },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <SubscriptionBanner />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows banner when subscription is past_due after grace', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T12:00:00.000Z'));
    const periodEnd = new Date('2026-01-15T12:00:00.000Z').toISOString();

    mockUseBillingOverview.mockReturnValue({
      data: overviewWithStatus('past_due', periodEnd),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <SubscriptionBanner />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/periodo de cortesía/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a Billing/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows banner when subscription is canceled', () => {
    mockUseBillingOverview.mockReturnValue({
      data: overviewWithStatus('canceled'),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <SubscriptionBanner />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/necesita atención/)).toBeInTheDocument();
  });

  it('can be dismissed', () => {
    mockUseBillingOverview.mockReturnValue({
      data: overviewWithStatus('canceled'),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <SubscriptionBanner />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar aviso/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
