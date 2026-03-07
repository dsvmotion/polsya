import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminIngestion from '../AdminIngestion';
import { TestProviders } from './helpers';

/* ─── Supabase mock ─── */

const mockData: Record<string, unknown[]> = {
  ingestion_runs: [
    {
      id: 'r1',
      org_id: 'o1',
      provider_id: 'p1',
      status: 'running',
      started_at: '2025-01-01T10:00:00Z',
      completed_at: null,
      records_processed: 500,
      records_created: 400,
      records_updated: 90,
      records_failed: 10,
      error_log: null,
      created_at: '2025-01-01T10:00:00Z',
    },
    {
      id: 'r2',
      org_id: 'o1',
      provider_id: 'p1',
      status: 'completed',
      started_at: '2025-01-01T08:00:00Z',
      completed_at: '2025-01-01T08:05:00Z',
      records_processed: 1200,
      records_created: 1000,
      records_updated: 200,
      records_failed: 0,
      error_log: null,
      created_at: '2025-01-01T08:00:00Z',
    },
    {
      id: 'r3',
      org_id: 'o2',
      provider_id: 'p2',
      status: 'failed',
      started_at: '2025-01-01T06:00:00Z',
      completed_at: '2025-01-01T06:01:00Z',
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      error_log: 'Connection timeout',
      created_at: '2025-01-01T06:00:00Z',
    },
  ],
  ingestion_providers: [
    {
      id: 'p1',
      org_id: 'o1',
      provider_type: 'woocommerce',
      name: 'Main WooCommerce',
      is_active: true,
      last_sync_at: '2025-01-01T10:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'p2',
      org_id: 'o2',
      provider_type: 'csv',
      name: 'CSV Importer',
      is_active: false,
      last_sync_at: null,
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
    // For queries without explicit limit (ingestion_providers)
    builder.order.mockImplementation(() => {
      // Return a thenable that also has .limit
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

describe('AdminIngestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading', async () => {
    render(
      <TestProviders>
        <AdminIngestion />
      </TestProviders>,
    );
    expect(screen.getByText('Data Ingestion')).toBeInTheDocument();
  });

  it('renders stats cards with computed values', async () => {
    render(
      <TestProviders>
        <AdminIngestion />
      </TestProviders>,
    );

    await waitFor(() => {
      // 1 running job
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      // 1 active provider
      expect(screen.getByText('Sources Connected')).toBeInTheDocument();
      // Total processed = 500 + 1200 + 0 = 1700
      expect(screen.getByText('Records Processed')).toBeInTheDocument();
      // 1 failed run
      expect(screen.getByText('Failed Runs')).toBeInTheDocument();
    });
  });

  it('renders subtitle text on stats cards', async () => {
    render(
      <TestProviders>
        <AdminIngestion />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Last 100 runs')).toBeInTheDocument();
      expect(screen.getByText('2 total')).toBeInTheDocument();
      expect(screen.getByText('Needs attention')).toBeInTheDocument();
    });
  });
});
