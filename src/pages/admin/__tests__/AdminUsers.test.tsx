import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminUsers from '../AdminUsers';

/* ─── Supabase mock ─── */

const mockQueryResult = vi.fn();

const mockRpcResult = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn(() => mockQueryResult()),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
      rpc: vi.fn(() => mockRpcResult()),
    },
  };
});

/* ─── Tests ─── */

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: RPC fails (not platform owner) so fallback to from() query
    mockRpcResult.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
  });

  it('renders the page heading', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminUsers />
      </TestProviders>,
    );

    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Manage platform users and their roles.')).toBeInTheDocument();
  });

  it('renders stats cards with zero when empty', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminUsers />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Admins')).toBeInTheDocument();
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });

  it('renders user data and stats from organization_members', async () => {
    mockQueryResult.mockResolvedValue({
      data: [
        { user_id: 'uid-1', role: 'owner', created_at: '2024-01-01T00:00:00Z', organizations: { name: 'Acme Corp' } },
        { user_id: 'uid-2', role: 'admin', created_at: '2024-02-01T00:00:00Z', organizations: { name: 'Beta Inc' } },
        { user_id: 'uid-3', role: 'member', created_at: '2024-03-01T00:00:00Z', organizations: null },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminUsers />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    // Stats: 3 total, 3 active (all mapped as 'active'), 2 admins (owner + admin)
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // total & active
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // admins
  });

  it('renders search placeholder', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminUsers />
      </TestProviders>,
    );

    expect(screen.getByPlaceholderText('Search by email or name...')).toBeInTheDocument();
  });
});
