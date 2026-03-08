import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Team from '../Team';

/* ─── Mocks ─── */

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'u1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      created_at: '2024-01-15T00:00:00Z',
    },
  })),
}));

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: vi.fn(() => ({
    organization: { id: 'org-123', name: 'Acme Corp' },
    membership: { role: 'admin' },
  })),
}));

vi.mock('@/lib/rbac', () => ({
  canManageWorkspace: vi.fn((role: string | null) => role === 'admin' || role === 'manager'),
}));

/* ─── Tests ─── */

describe('Team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading and description', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your workspace members and their roles.'),
    ).toBeInTheDocument();
  });

  it('renders invite member button for managers', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.getByRole('button', { name: /Invite Member/ })).toBeInTheDocument();
  });

  it('renders workspace info', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText(/org-123/)).toBeInTheDocument();
  });

  it('renders current member info', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders role permissions table', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.getByText('Role Permissions')).toBeInTheDocument();
    expect(screen.getByText('View dashboard & reports')).toBeInTheDocument();
    expect(screen.getByText('Manage entities')).toBeInTheDocument();
    expect(screen.getByText('Manage billing')).toBeInTheDocument();
    expect(screen.getByText('Workspace settings')).toBeInTheDocument();
  });

  it('renders copy invite link button', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.getByRole('button', { name: /Copy invite link/ })).toBeInTheDocument();
  });

  it('hides invite button for non-managers', async () => {
    const { canManageWorkspace } = await import('@/lib/rbac');
    vi.mocked(canManageWorkspace).mockReturnValue(false);

    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    expect(screen.queryByRole('button', { name: /Invite Member/ })).not.toBeInTheDocument();
    expect(
      screen.getByText('Contact your workspace admin to manage team members.'),
    ).toBeInTheDocument();
  });

  it('renders role column headers', () => {
    render(
      <TestProviders>
        <Team />
      </TestProviders>,
    );

    // Table headers in role permissions
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });
});
