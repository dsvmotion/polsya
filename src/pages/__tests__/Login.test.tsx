import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Login from '../Login';

/* ─── Mocks ─── */

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    signIn: mockSignIn,
    user: null,
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/lib/platform', () => ({
  isPlatformOwner: vi.fn(() => false),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } } })),
    },
  },
}));

/* ─── Tests ─── */

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form heading and fields', () => {
    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Enter your email to sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders sign in button and navigation links', () => {
    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('← Back to home')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } });

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with valid credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows sign-in error from auth provider', async () => {
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('renders email and password placeholders', () => {
    render(
      <TestProviders>
        <Login />
      </TestProviders>,
    );

    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });
});
