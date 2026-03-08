import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import ForgotPassword from '../ForgotPassword';

/* ─── Mocks ─── */

const { mockResetPasswordForEmail } = vi.hoisted(() => ({
  mockResetPasswordForEmail: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  },
}));

/* ─── Tests ─── */

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form heading and description', () => {
    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(
      screen.getByText("Enter your email and we'll send you a link to reset your password."),
    ).toBeInTheDocument();
  });

  it('renders email input and submit button', () => {
    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  it('shows validation error when email is empty', async () => {
    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    const form = screen.getByRole('button', { name: 'Send reset link' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('calls resetPasswordForEmail with valid email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });

    const form = screen.getByRole('button', { name: 'Send reset link' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/reset-password'),
      });
    });
  });

  it('shows confirmation view after successful submission', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });

    const form = screen.getByRole('button', { name: 'Send reset link' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it('shows error from auth provider', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });

    const form = screen.getByRole('button', { name: 'Send reset link' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('renders back to login and back to home links', () => {
    render(
      <TestProviders>
        <ForgotPassword />
      </TestProviders>,
    );

    expect(screen.getByText('Back to login')).toBeInTheDocument();
    expect(screen.getByText('← Back to home')).toBeInTheDocument();
  });
});
