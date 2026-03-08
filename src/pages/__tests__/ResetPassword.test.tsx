import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import ResetPassword from '../ResetPassword';

/* ─── Mocks ─── */

const { mockNavigate, mockUpdateUser, mockUnsubscribe } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockUnsubscribe: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })),
    },
  },
}));

/* ─── Tests ─── */

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form heading and description', () => {
    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    expect(screen.getByText('Set new password')).toBeInTheDocument();
    expect(screen.getByText('Enter your new password below.')).toBeInTheDocument();
  });

  it('renders password fields and submit button', () => {
    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update password' })).toBeInTheDocument();
  });

  it('shows error for short password', async () => {
    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: '123' } });

    const form = screen.getByRole('button', { name: 'Update password' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different' } });

    const form = screen.getByRole('button', { name: 'Update password' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls updateUser with matching passwords', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'newpassword123' } });

    const form = screen.getByRole('button', { name: 'Update password' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
    });
  });

  it('shows success view after password update', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'newpassword123' } });

    const form = screen.getByRole('button', { name: 'Update password' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Password updated')).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to dashboard/)).toBeInTheDocument();
    });
  });

  it('shows error from auth provider', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password too weak' },
    });

    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'newpassword123' } });

    const form = screen.getByRole('button', { name: 'Update password' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
    });
  });

  it('renders back to home link', () => {
    render(
      <TestProviders>
        <ResetPassword />
      </TestProviders>,
    );

    expect(screen.getByText('← Back to home')).toBeInTheDocument();
  });
});
