import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminBilling from '../AdminBilling';

/* ─── Supabase mock ─── */

const mockQueryResult = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(() => mockQueryResult()),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

/* ─── Tests ─── */

describe('AdminBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminBilling />
      </TestProviders>,
    );

    expect(screen.getByText('Billing & Invoices')).toBeInTheDocument();
    expect(screen.getByText('View invoices and revenue data.')).toBeInTheDocument();
  });

  it('renders stats cards with zero when empty', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminBilling />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    });

    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    // All values should be 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });

  it('renders invoice data and correct stats', async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        {
          id: 'inv-1',
          amount_cents: 5000,
          status: 'paid',
          created_at: '2025-01-15T00:00:00Z',
          stripe_invoice_id: 'in_abc123456789012345',
          organizations: { name: 'Acme Corp' },
        },
        {
          id: 'inv-2',
          amount_cents: 3000,
          status: 'failed',
          created_at: '2025-02-10T00:00:00Z',
          stripe_invoice_id: 'in_xyz987654321098765',
          organizations: { name: 'Beta Inc' },
        },
        {
          id: 'inv-3',
          amount_cents: 7500,
          status: 'paid',
          created_at: '2025-03-01T00:00:00Z',
          stripe_invoice_id: null,
          organizations: null,
        },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminBilling />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Stats: 3 total, 2 paid, 1 failed
    expect(screen.getByText('3')).toBeInTheDocument(); // total
    expect(screen.getByText('2')).toBeInTheDocument(); // paid
    expect(screen.getByText('1')).toBeInTheDocument(); // failed

    // Table data
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
  });

  it('gracefully handles table-not-found error', async () => {
    mockQueryResult.mockResolvedValue({
      data: null,
      error: { message: 'relation "billing_invoices" does not exist', code: '42P01' },
    });

    render(
      <TestProviders>
        <AdminBilling />
      </TestProviders>,
    );

    // Should render with empty state (the queryFn returns [] on error)
    await waitFor(() => {
      expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    });

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });

  it('renders search placeholder', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminBilling />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search invoices...')).toBeInTheDocument();
    });
  });
});
