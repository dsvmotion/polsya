import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Index from '../Index';

/* ─── Mock hooks & heavy components ─── */

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u1', user_metadata: { onboarding_completed: true } },
  })),
}));

vi.mock('@/hooks/usePlatformOwnerStatus', () => ({
  usePlatformOwnerStatus: vi.fn(() => ({ isOwner: false })),
}));

vi.mock('@/lib/signupPlan', () => ({
  getPendingSignupPlan: vi.fn(() => null),
  clearPendingSignupPlan: vi.fn(),
}));

const mockRefetch = vi.fn();

vi.mock('@/hooks/useWooCommerceOrders', () => ({
  useWooCommerceOrders: vi.fn(() => ({
    data: [
      {
        id: 'o1', orderId: 'WC-001', customerName: 'Alice Pharmacy', customerType: 'pharmacy',
        address: '123 Main St', city: 'Madrid', province: 'M', country: 'ES',
        lat: 40.4, lng: -3.7, amount: 150, date: '2024-06-01', products: ['Product A'],
        commercialStatus: 'not_contacted',
      },
      {
        id: 'o2', orderId: 'WC-002', customerName: 'Bob Client', customerType: 'client',
        address: '456 Oak Ave', city: 'Barcelona', province: 'B', country: 'ES',
        lat: 41.4, lng: 2.2, amount: 200, date: '2024-06-02', products: ['Product B', 'Product C', 'Product D'],
        commercialStatus: 'contacted',
      },
    ],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })),
}));

vi.mock('@/hooks/useEntityOperations', () => ({
  useEntitiesWithOrders: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/hooks/useEntityTypes', () => ({
  useEntityTypes: vi.fn(() => ({
    data: [
      { key: 'pharmacy', label: 'Pharmacies', color: '#22c55e' },
      { key: 'herbalist', label: 'Herbalists', color: '#eab308' },
    ],
  })),
  resolveEntityTypeLabel: vi.fn((_key: string, _types: unknown[], fallback: string) => fallback),
}));

// Mock heavy components that depend on browser APIs or external services
vi.mock('@/components/SalesMap', () => ({
  SalesMap: () => <div data-testid="sales-map">Map</div>,
}));

vi.mock('@/components/dashboard/KpiStrip', () => ({
  KpiStrip: () => <div data-testid="kpi-strip">KPI Strip</div>,
}));

vi.mock('@/components/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: () => null,
}));

vi.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/* ─── Tests ─── */

describe('Index (Dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading and subheading', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Global overview of sales and revenue')).toBeInTheDocument();
  });

  it('renders the KPI strip', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByTestId('kpi-strip')).toBeInTheDocument();
  });

  it('renders the sales map', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByTestId('sales-map')).toBeInTheDocument();
    expect(screen.getByText('Sales Locations')).toBeInTheDocument();
  });

  it('renders the recent sales panel with sale entries', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByText('Recent Sales')).toBeInTheDocument();
    expect(screen.getByText('Alice Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Bob Client')).toBeInTheDocument();
  });

  it('renders stats cards with computed values', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    // WooCommerce orders count
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);

    // Stats descriptions
    expect(screen.getByText(/WooCommerce Orders/)).toBeInTheDocument();
    expect(screen.getByText(/Client Sales/)).toBeInTheDocument();
  });

  it('renders filter section with entity type selects', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByText('Filters:')).toBeInTheDocument();
    // Shows order count in filter bar
    expect(screen.getByText(/Showing 2 of 2 orders/)).toBeInTheDocument();
  });

  it('renders the status bar with order count', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByText(/2 orders loaded/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).toBeInTheDocument();
  });

  it('renders entity type navigation buttons', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    // Each entity type gets "Saved" and "Search" buttons
    const savedButtons = screen.getAllByText(/Saved/);
    expect(savedButtons.length).toBeGreaterThanOrEqual(2);

    const searchButtons = screen.getAllByText(/Search/);
    expect(searchButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders product tags on sale entries', () => {
    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    // 3rd product is shown but 4th would show "+N more"
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('renders loading state when data is loading', async () => {
    const { useWooCommerceOrders } = await import('@/hooks/useWooCommerceOrders');
    vi.mocked(useWooCommerceOrders).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as ReturnType<typeof useWooCommerceOrders>);

    render(
      <TestProviders>
        <Index />
      </TestProviders>,
    );

    expect(screen.getByText('Loading sales data...')).toBeInTheDocument();
  });
});
