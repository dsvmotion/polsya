import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard';
import type { BillingOverview } from '@/types/billing';

const mockUseCurrentOrganization = vi.fn();
const mockUseBillingOverview = vi.fn();

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: () => mockUseCurrentOrganization(),
}));

vi.mock('@/hooks/useBilling', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useBilling')>('@/hooks/useBilling');
  return {
    ...actual,
    useBillingOverview: () => mockUseBillingOverview(),
  };
});

function renderGuarded() {
  render(
    <MemoryRouter initialEntries={['/operations/entities']}>
      <Routes>
        <Route
          path="/operations/entities"
          element={(
            <SubscriptionGuard>
              <div>Protected Content</div>
            </SubscriptionGuard>
          )}
        />
        <Route path="/billing" element={<div>Billing Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function billingOverviewWithStatus(status: BillingOverview['subscription'] extends infer S
  ? S extends { status: infer T }
    ? T
    : never
  : never, currentPeriodEnd: string | null = null): BillingOverview {
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

describe('SubscriptionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading while organization is loading', () => {
    mockUseCurrentOrganization.mockReturnValue({
      organization: null,
      isLoading: true,
    });
    mockUseBillingOverview.mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderGuarded();
    expect(screen.getByText('Checking subscription...')).toBeInTheDocument();
  });

  it('shows loading while billing overview is loading', () => {
    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderGuarded();
    expect(screen.getByText('Checking subscription...')).toBeInTheDocument();
  });

  it('renders protected content when subscription has access', () => {
    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: billingOverviewWithStatus('active'),
      isLoading: false,
    });

    renderGuarded();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders protected content when subscription is trialing', () => {
    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: billingOverviewWithStatus('trialing'),
      isLoading: false,
    });

    renderGuarded();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders protected content when subscription is past_due within grace', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T12:00:00.000Z'));
    const periodEnd = new Date('2026-02-28T12:00:00.000Z').toISOString();

    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: billingOverviewWithStatus('past_due', periodEnd),
      isLoading: false,
    });

    renderGuarded();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('redirects to billing when subscription is past_due after grace', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T12:00:00.000Z'));
    const periodEnd = new Date('2026-01-15T12:00:00.000Z').toISOString();

    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: billingOverviewWithStatus('past_due', periodEnd),
      isLoading: false,
    });

    renderGuarded();
    expect(screen.getByText('Billing Page')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('redirects to billing when subscription is blocked', () => {
    mockUseCurrentOrganization.mockReturnValue({
      organization: { id: 'org-1' },
      isLoading: false,
    });
    mockUseBillingOverview.mockReturnValue({
      data: billingOverviewWithStatus('canceled'),
      isLoading: false,
    });

    renderGuarded();
    expect(screen.getByText('Billing Page')).toBeInTheDocument();
  });
});
