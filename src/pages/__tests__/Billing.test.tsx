import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Billing from '../Billing';

/* ─── Mocks ─── */

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u1', email: 'test@example.com' },
  })),
}));

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: vi.fn(() => ({
    organization: { id: 'org1', name: 'Test Org' },
    membership: { role: 'owner' },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useBilling', () => ({
  evaluateBillingAccess: vi.fn(() => ({ hasAccess: true, tier: 'pro' })),
  getBillingPastDueGraceDays: vi.fn(() => 7),
  useBillingOverview: vi.fn(() => ({
    data: {
      subscription: {
        status: 'active',
        stripe_price_id: 'price_123',
        current_period_end: new Date().toISOString(),
      },
    },
    isLoading: false,
  })),
  useBillingPlans: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateCheckoutSession: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCreateCustomerPortalSession: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  usePlanUsage: vi.fn(() => ({ data: null })),
}));

vi.mock('@/lib/rbac', () => ({
  canManageBilling: vi.fn(() => true),
}));

vi.mock('@/lib/platform', () => ({
  isPlatformOwner: vi.fn(() => false),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ─── Tests ─── */

describe('Billing', () => {
  it('renders billing page heading', () => {
    renderPage();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('renders subscription status card', () => {
    renderPage();
    expect(screen.getByText('Subscription status')).toBeInTheDocument();
  });

  it('renders subscription status badge', () => {
    renderPage();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
