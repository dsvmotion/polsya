import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminSettings from '../AdminSettings';

/* ─── Mock hooks ─── */

vi.mock('@/hooks/usePlatformOwnerEmails', () => ({
  usePlatformOwnerEmails: vi.fn(() => ({
    data: [
      { email: 'admin@polsya.com' },
      { email: 'cto@polsya.com' },
    ],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useAddPlatformOwner', () => ({
  useAddPlatformOwner: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useRemovePlatformOwner', () => ({
  useRemovePlatformOwner: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

/* ─── Tests ─── */

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(
      <TestProviders>
        <AdminSettings />
      </TestProviders>,
    );

    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    expect(screen.getByText(/Manage platform administrators/)).toBeInTheDocument();
  });

  it('renders Platform Administrators card with description', () => {
    render(
      <TestProviders>
        <AdminSettings />
      </TestProviders>,
    );

    expect(screen.getByText('Platform Administrators')).toBeInTheDocument();
    expect(screen.getByText(/Users with admin access can view all organizations/)).toBeInTheDocument();
  });

  it('renders existing admin emails', () => {
    render(
      <TestProviders>
        <AdminSettings />
      </TestProviders>,
    );

    expect(screen.getByText('admin@polsya.com')).toBeInTheDocument();
    expect(screen.getByText('cto@polsya.com')).toBeInTheDocument();
  });

  it('renders the Add button and email input', () => {
    render(
      <TestProviders>
        <AdminSettings />
      </TestProviders>,
    );

    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@company.com')).toBeInTheDocument();
  });

  it('renders Admin badge for each owner', () => {
    render(
      <TestProviders>
        <AdminSettings />
      </TestProviders>,
    );

    const badges = screen.getAllByText('Admin');
    expect(badges.length).toBe(2);
  });

  it('shows loading state when data is loading', async () => {
    const { usePlatformOwnerEmails } = await import('@/hooks/usePlatformOwnerEmails');
    vi.mocked(usePlatformOwnerEmails).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof usePlatformOwnerEmails>);

    render(
      <TestProviders>
        <AdminSettings />
      </TestProviders>,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
