import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRoute } from '../AdminRoute';

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock platform owner status hook
vi.mock('@/hooks/usePlatformOwnerStatus', () => ({
  usePlatformOwnerStatus: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

const mockedUseAuth = vi.mocked(useAuth);
const mockedUsePlatformOwnerStatus = vi.mocked(usePlatformOwnerStatus);

describe('AdminRoute', () => {
  it('shows loading state while checking ownership', () => {
    mockedUseAuth.mockReturnValue({ user: { id: '1' } } as unknown as ReturnType<typeof useAuth>);
    mockedUsePlatformOwnerStatus.mockReturnValue({ isOwner: false, isLoading: true });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when user is platform owner', () => {
    mockedUseAuth.mockReturnValue({ user: { id: '1' } } as unknown as ReturnType<typeof useAuth>);
    mockedUsePlatformOwnerStatus.mockReturnValue({ isOwner: true, isLoading: false });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects non-owner users', () => {
    mockedUseAuth.mockReturnValue({ user: { id: '1' } } as unknown as ReturnType<typeof useAuth>);
    mockedUsePlatformOwnerStatus.mockReturnValue({ isOwner: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
