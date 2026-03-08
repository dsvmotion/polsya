import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminDashboard from '../AdminDashboard';

/* ─── Mock usePlatformTenants ─── */

const mockTenants = [
  { id: 't1', name: 'Alpha Corp', subscriptionStatus: 'active' },
  { id: 't2', name: 'Beta Inc', subscriptionStatus: 'trialing' },
  { id: 't3', name: 'Gamma Ltd', subscriptionStatus: 'canceled' },
];

vi.mock('@/hooks/usePlatformTenants', () => ({
  usePlatformTenants: vi.fn(() => ({
    data: mockTenants,
    isLoading: false,
    error: null,
  })),
}));

/* ─── Mock Supabase for inline queries (MRR, logs, contact count) ─── */

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

/* ─── Tests ─── */

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default resolvers: return empty/zero for inline Supabase queries
    resolvers['billing_subscriptions'] = (method) => {
      if (method === 'eq') return Promise.resolve({ data: [], error: null });
      return undefined;
    };
    resolvers['platform_audit_logs'] = (method) => {
      if (method === 'limit') return Promise.resolve({ data: [], error: null });
      return undefined;
    };
    resolvers['contact_messages'] = (method) => {
      if (method === 'select') return Promise.resolve({ count: 0, error: null });
      return undefined;
    };
  });

  it('renders the page heading', () => {
    render(
      <TestProviders>
        <AdminDashboard />
      </TestProviders>,
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Platform overview and quick actions.')).toBeInTheDocument();
  });

  it('renders stats cards with tenant counts', async () => {
    render(
      <TestProviders>
        <AdminDashboard />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Organizations')).toBeInTheDocument();
    });

    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('Contact Messages')).toBeInTheDocument();

    // Tenants: 3 total, 2 active (active+trialing), 1 trialing
    expect(screen.getByText('3')).toBeInTheDocument(); // total orgs
    expect(screen.getByText('2')).toBeInTheDocument(); // active subscriptions
    expect(screen.getByText('2 active')).toBeInTheDocument(); // subtitle
    expect(screen.getByText('1 trialing')).toBeInTheDocument(); // subtitle
  });

  it('renders Quick Actions with navigation links', () => {
    render(
      <TestProviders>
        <AdminDashboard />
      </TestProviders>,
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Manage Organizations')).toBeInTheDocument();
    expect(screen.getByText('View Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
  });

  it('renders Recent Activity section with empty state', async () => {
    render(
      <TestProviders>
        <AdminDashboard />
      </TestProviders>,
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  it('renders View all link pointing to /admin/logs', () => {
    render(
      <TestProviders>
        <AdminDashboard />
      </TestProviders>,
    );

    const viewAllLink = screen.getByText('View all');
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/admin/logs');
  });
});
