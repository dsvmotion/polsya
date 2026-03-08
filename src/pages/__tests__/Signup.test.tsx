import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Signup from '../Signup';

/* ─── Mocks ─── */

const mockSignUp = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    signUp: mockSignUp,
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

vi.mock('@/lib/signupPlan', () => ({
  isValidSignupPlan: vi.fn(() => false),
  setPendingSignupPlan: vi.fn(),
}));

/* ─── Tests ─── */

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form heading and description', () => {
    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Enter your information to get started')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('renders sign up button and sign in link', () => {
    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('← Back to home')).toBeInTheDocument();
  });

  it('shows validation error for short name', async () => {
    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign up' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign up' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows validation error when passwords do not match', async () => {
    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });

    const form = screen.getByRole('button', { name: 'Sign up' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp with valid inputs', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign up' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe');
    });
  });

  it('shows confirmation view after successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign up' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it('shows error from auth provider', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'Email already registered' },
    });

    render(
      <TestProviders>
        <Signup />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    const form = screen.getByRole('button', { name: 'Sign up' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });
});
