import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminSignals from '../AdminSignals';
import { TestProviders } from './helpers';

/* ─── Supabase mock ─── */

const now = new Date();
const recent = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
const old = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // 2 days ago

const mockData: Record<string, unknown[]> = {
  signals: [
    {
      id: 's1',
      org_id: 'o1',
      rule_id: 'sr1',
      entity_type: 'business',
      entity_id: 'e1',
      signal_type: 'anomaly',
      title: 'Revenue spike detected',
      severity: 'high',
      status: 'new',
      data: null,
      created_at: recent,
    },
    {
      id: 's2',
      org_id: 'o1',
      rule_id: 'sr1',
      entity_type: 'business',
      entity_id: 'e2',
      signal_type: 'threshold',
      title: 'Low stock alert',
      severity: 'critical',
      status: 'seen',
      data: null,
      created_at: recent,
    },
    {
      id: 's3',
      org_id: 'o2',
      rule_id: null,
      entity_type: null,
      entity_id: null,
      signal_type: 'manual',
      title: 'Old signal',
      severity: 'info',
      status: 'dismissed',
      data: null,
      created_at: old,
    },
  ],
  signal_rules: [
    {
      id: 'sr1',
      org_id: 'o1',
      name: 'Revenue Monitor',
      rule_type: 'threshold',
      is_active: true,
      priority: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sr2',
      org_id: 'o2',
      name: 'Inactive rule',
      rule_type: 'pattern',
      is_active: false,
      priority: 5,
      created_at: '2024-06-01T00:00:00Z',
    },
  ],
};

vi.mock('@/integrations/supabase/client', () => {
  const createBuilder = (table: string) => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: mockData[table] ?? [], error: null }),
      ),
    };
    builder.order.mockImplementation(() => {
      const thenable = Promise.resolve({
        data: mockData[table] ?? [],
        error: null,
      });
      return Object.assign(thenable, { limit: builder.limit });
    });
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

/* ─── Tests ─── */

describe('AdminSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading and subtitle', () => {
    render(
      <TestProviders>
        <AdminSignals />
      </TestProviders>,
    );
    expect(screen.getByText('Signals Monitoring')).toBeInTheDocument();
    expect(
      screen.getByText(/Monitor creative intelligence signal pipeline/),
    ).toBeInTheDocument();
  });

  it('renders all stats cards', async () => {
    render(
      <TestProviders>
        <AdminSignals />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Rules')).toBeInTheDocument();
      expect(screen.getByText('Processed (24h)')).toBeInTheDocument();
      expect(screen.getByText('Critical (24h)')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });
  });

  it('renders tab triggers for signals and rules', () => {
    render(
      <TestProviders>
        <AdminSignals />
      </TestProviders>,
    );
    expect(screen.getByRole('tab', { name: 'Recent Signals' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Signal Rules' })).toBeInTheDocument();
  });

  it('shows rules total in subtitle', async () => {
    render(
      <TestProviders>
        <AdminSignals />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('2 total')).toBeInTheDocument();
    });
  });
});
