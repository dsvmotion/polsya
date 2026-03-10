import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminAnalytics from '../AdminAnalytics';

/* ─── Mock usePlatformTenants ─── */

const mockTenants = [
  { id: 't1', name: 'Alpha Corp', subscriptionStatus: 'active' },
  { id: 't2', name: 'Beta Inc', subscriptionStatus: 'trialing' },
];

vi.mock('@/hooks/usePlatformTenants', () => ({
  usePlatformTenants: vi.fn(() => ({
    data: mockTenants,
    isLoading: false,
    error: null,
  })),
}));

/* ─── Mock Supabase for inline queries (MRR, member count) ─── */

const resolvers: Record<string, (method: string) => unknown> = {};

vi.mock('@/integrations/supabase/client', () => {
  const createBuilder = (table: string) => {
    const builder: Record<string, unknown> = {};
    const self = new Proxy(builder, {
      get(_target, prop) {
        if (typeof prop === 'string') {
          return (..._args: unknown[]) => {
            if (resolvers[table]) {
              const result = resolvers[table](prop as string);
              if (result !== undefined) return result;
            }
            return self;
          };
        }
        return undefined;
      },
    });
    return self;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

/* ─── Mock Recharts to avoid SVG rendering issues in jsdom ─── */

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

/* ─── Tests ─── */

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolvers['billing_subscriptions'] = (method) => {
      if (method === 'eq') return Promise.resolve({ data: [{ amount_cents: 5000, status: 'active' }], error: null });
      return undefined;
    };
    resolvers['organization_members'] = (method) => {
      if (method === 'select') return Promise.resolve({ count: 12, error: null });
      return undefined;
    };
  });

  it('renders the page heading', () => {
    render(
      <TestProviders>
        <AdminAnalytics />
      </TestProviders>,
    );

    expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    expect(screen.getByText('Key metrics and growth trends.')).toBeInTheDocument();
  });

  it('renders four stats cards', async () => {
    render(
      <TestProviders>
        <AdminAnalytics />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Active Subs')).toBeInTheDocument();
    expect(screen.getByText('MRR')).toBeInTheDocument();

    // Tenant count: 2 orgs, 2 active subs — both show "2"
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(2);
  });

  it('renders chart cards', () => {
    render(
      <TestProviders>
        <AdminAnalytics />
      </TestProviders>,
    );

    expect(screen.getByText('Organization Growth')).toBeInTheDocument();
    expect(screen.getByText('MRR Trend')).toBeInTheDocument();
  });

  it('renders chart containers', () => {
    render(
      <TestProviders>
        <AdminAnalytics />
      </TestProviders>,
    );

    const chartContainers = screen.getAllByTestId('chart-container');
    expect(chartContainers.length).toBe(2);
  });
});
