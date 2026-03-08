import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminLogs from '../AdminLogs';

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

describe('AdminLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminLogs />
      </TestProviders>,
    );

    expect(screen.getByText('System Logs')).toBeInTheDocument();
  });

  it('shows entry count in subtitle', async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        { id: 'log-1', created_at: '2025-01-10T10:00:00Z', action: 'create', resource_type: 'organization', resource_id: 'org-1', organization_id: 'org-1', actor_type: 'user', actor_id: 'uid-1', actor_email: 'admin@test.com', metadata: null },
        { id: 'log-2', created_at: '2025-01-11T11:00:00Z', action: 'update', resource_type: 'subscription', resource_id: 'sub-1', organization_id: 'org-1', actor_type: 'system', actor_id: 'system', actor_email: '', metadata: { old_status: 'trialing', new_status: 'active' } },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminLogs />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(/2 entries/)).toBeInTheDocument();
    });
  });

  it('renders the Export CSV button', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminLogs />
      </TestProviders>,
    );

    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('renders log entries in the data table', async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        { id: 'log-1', created_at: '2025-01-10T10:00:00Z', action: 'create', resource_type: 'organization', resource_id: 'org-1', organization_id: 'org-1', actor_type: 'user', actor_id: 'uid-1', actor_email: 'admin@test.com', metadata: null },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminLogs />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('create')).toBeInTheDocument();
    });

    expect(screen.getByText('organization')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('renders search placeholder', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminLogs />
      </TestProviders>,
    );

    expect(screen.getByPlaceholderText('Search logs...')).toBeInTheDocument();
  });
});
