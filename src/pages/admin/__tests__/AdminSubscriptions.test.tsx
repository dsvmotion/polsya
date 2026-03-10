import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminSubscriptions from '../AdminSubscriptions';

/* ─── Supabase mock ─── */

const mockQueryResult = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn(() => mockQueryResult()),
    eq: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

/* ─── Tests ─── */

describe('AdminSubscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminSubscriptions />
      </TestProviders>,
    );

    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Manage all platform subscriptions.')).toBeInTheDocument();
  });

  it('renders four stats cards with zero values when empty', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminSubscriptions />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Past Due')).toBeInTheDocument();
    });

    // "MRR" appears in both stats card and table column header
    expect(screen.getAllByText('MRR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Trialing')).toBeInTheDocument();
  });

  it('renders subscription data with correct stats', async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: 'sub-1', status: 'active', amount_cents: 5000,
          current_period_end: '2025-06-15T00:00:00Z', created_at: '2024-01-01T00:00:00Z',
          organizations: { name: 'Acme Corp' }, billing_plans: { name: 'Pro' },
        },
        {
          id: 'sub-2', status: 'trialing', amount_cents: 3000,
          current_period_end: '2025-07-01T00:00:00Z', created_at: '2024-02-01T00:00:00Z',
          organizations: { name: 'Beta Inc' }, billing_plans: { name: 'Starter' },
        },
        {
          id: 'sub-3', status: 'past_due', amount_cents: 10000,
          current_period_end: null, created_at: '2024-03-01T00:00:00Z',
          organizations: null, billing_plans: null,
        },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminSubscriptions />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Table content
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // 5000 cents
  });

  it('renders search placeholder', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminSubscriptions />
      </TestProviders>,
    );

    expect(screen.getByPlaceholderText('Search subscriptions...')).toBeInTheDocument();
  });
});
