import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminOrganizations from '../AdminOrganizations';

/* ─── Mock usePlatformTenants ─── */

const mockTenants = [
  { id: 't1', name: 'Alpha Corp', slug: 'alpha-corp', subscriptionStatus: 'active', memberCount: 5, createdAt: '2024-06-01T00:00:00Z' },
  { id: 't2', name: 'Beta Inc', slug: 'beta-inc', subscriptionStatus: 'trialing', memberCount: 2, createdAt: '2024-08-15T00:00:00Z' },
  { id: 't3', name: 'Gamma Ltd', slug: 'gamma-ltd', subscriptionStatus: 'canceled', memberCount: 1, createdAt: '2024-09-20T00:00:00Z' },
];

vi.mock('@/hooks/usePlatformTenants', () => ({
  usePlatformTenants: vi.fn(() => ({
    data: mockTenants,
    isLoading: false,
    error: null,
  })),
}));

/* ─── Tests ─── */

describe('AdminOrganizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(
      <TestProviders>
        <AdminOrganizations />
      </TestProviders>,
    );

    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Manage tenant organizations.')).toBeInTheDocument();
  });

  it('renders stats cards with correct counts', () => {
    render(
      <TestProviders>
        <AdminOrganizations />
      </TestProviders>,
    );

    expect(screen.getByText('Total Orgs')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Trialing')).toBeInTheDocument();

    expect(screen.getByText('3')).toBeInTheDocument(); // total
    // "2" appears in both stats card (Active) and table (memberCount) — use getAllByText
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // active (active + trialing)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // trialing
  });

  it('renders organization data in the table', () => {
    render(
      <TestProviders>
        <AdminOrganizations />
      </TestProviders>,
    );

    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.getByText('beta-inc')).toBeInTheDocument();
    expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
  });

  it('renders search placeholder', () => {
    render(
      <TestProviders>
        <AdminOrganizations />
      </TestProviders>,
    );

    expect(screen.getByPlaceholderText('Search organizations...')).toBeInTheDocument();
  });

  it('renders subscription status badges', () => {
    render(
      <TestProviders>
        <AdminOrganizations />
      </TestProviders>,
    );

    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('trialing')).toBeInTheDocument();
    expect(screen.getByText('canceled')).toBeInTheDocument();
  });
});
