import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Contact from '../Contact';

/* ─── Mocks ─── */

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

/* ─── Tests ─── */

describe('Contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading and description', () => {
    render(
      <TestProviders>
        <Contact />
      </TestProviders>,
    );

    expect(screen.getByText('Get in touch')).toBeInTheDocument();
    expect(
      screen.getByText(/Need a demo, custom pricing, or have questions/),
    ).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <TestProviders>
        <Contact />
      </TestProviders>,
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(
      <TestProviders>
        <Contact />
      </TestProviders>,
    );

    expect(screen.getByRole('button', { name: /Send message/ })).toBeInTheDocument();
  });

  it('submits form and shows confirmation', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    render(
      <TestProviders>
        <Contact />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there' } });

    const form = screen.getByRole('button', { name: /Send message/ }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Message sent')).toBeInTheDocument();
    });

    expect(mockInvoke).toHaveBeenCalledWith('submit-contact', {
      body: expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello there',
      }),
    });
  });

  it('shows error when submission fails', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    render(
      <TestProviders>
        <Contact />
      </TestProviders>,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test message' } });

    const form = screen.getByRole('button', { name: /Send message/ }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('renders form placeholders', () => {
    render(
      <TestProviders>
        <Contact />
      </TestProviders>,
    );

    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your company')).toBeInTheDocument();
  });
});
