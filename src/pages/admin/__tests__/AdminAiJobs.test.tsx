import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminAiJobs from '../AdminAiJobs';
import { TestProviders } from './helpers';

/* ─── Supabase mock ─── */

const now = new Date();
const recent = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
const old = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

const mockData: Record<string, unknown[]> = {
  ai_documents: [
    {
      id: 'd1',
      org_id: 'o1',
      title: 'Product Catalog Q1',
      source_type: 'pdf',
      status: 'processing',
      chunk_count: 42,
      created_by: 'u1',
      created_at: recent,
      updated_at: recent,
    },
    {
      id: 'd2',
      org_id: 'o1',
      title: 'FAQ Document',
      source_type: 'text',
      status: 'ready',
      chunk_count: 18,
      created_by: 'u1',
      created_at: recent,
      updated_at: recent,
    },
    {
      id: 'd3',
      org_id: 'o2',
      title: 'Old document',
      source_type: 'url',
      status: 'error',
      chunk_count: 0,
      created_by: null,
      created_at: old,
      updated_at: old,
    },
  ],
  ai_usage_monthly: [
    {
      id: 'u1',
      org_id: 'o1',
      period: '2025-01',
      credits_used: 1500,
      credits_purchased: 5000,
      operation_breakdown: null,
      created_at: '2025-01-31T00:00:00Z',
    },
    {
      id: 'u2',
      org_id: 'o2',
      period: '2025-01',
      credits_used: 800,
      credits_purchased: 2000,
      operation_breakdown: null,
      created_at: '2025-01-31T00:00:00Z',
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

describe('AdminAiJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading', () => {
    render(
      <TestProviders>
        <AdminAiJobs />
      </TestProviders>,
    );
    expect(screen.getByText('AI Jobs')).toBeInTheDocument();
    expect(
      screen.getByText(/Track AI processing jobs/),
    ).toBeInTheDocument();
  });

  it('renders all stats cards', async () => {
    render(
      <TestProviders>
        <AdminAiJobs />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Completed (24h)')).toBeInTheDocument();
      expect(screen.getByText('Total Credits')).toBeInTheDocument();
      expect(screen.getByText('Errors')).toBeInTheDocument();
    });
  });

  it('renders tab triggers for documents and usage', () => {
    render(
      <TestProviders>
        <AdminAiJobs />
      </TestProviders>,
    );
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Usage & Credits' })).toBeInTheDocument();
  });

  it('shows correct subtitle for processing state', async () => {
    render(
      <TestProviders>
        <AdminAiJobs />
      </TestProviders>,
    );

    await waitFor(() => {
      // 1 processing doc → "In progress"
      expect(screen.getByText('In progress')).toBeInTheDocument();
      expect(screen.getByText('All time')).toBeInTheDocument();
    });
  });
});
