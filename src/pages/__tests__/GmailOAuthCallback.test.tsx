import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GmailOAuthCallback from '../GmailOAuthCallback';

/* ─── Mocks ─── */

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock('@/hooks/useOAuth', () => ({
  useExchangeOAuth: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
  })),
}));

function renderWith(searchParams: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/oauth/gmail/callback${searchParams}`]}>
        <GmailOAuthCallback />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ─── Tests ─── */

describe('GmailOAuthCallback', () => {
  it('shows error when oauth error param present', () => {
    renderWith('?error=access_denied');
    expect(screen.getByText('Gmail connection cancelled')).toBeInTheDocument();
    expect(screen.getByText(/cancelled the authorization/)).toBeInTheDocument();
  });

  it('shows error when code/state missing', () => {
    renderWith('');
    expect(screen.getByText('Missing OAuth parameters')).toBeInTheDocument();
  });

  it('calls mutate when code and state present', async () => {
    renderWith('?code=abc123&state=xyz');
    expect(mockMutate).toHaveBeenCalledWith({ code: 'abc123', state: 'xyz' });
  });

  it('shows loading state when exchange is pending', async () => {
    const { useExchangeOAuth } = await import('@/hooks/useOAuth');
    vi.mocked(useExchangeOAuth).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    } as unknown as ReturnType<typeof useExchangeOAuth>);

    renderWith('?code=abc&state=xyz');
    expect(screen.getByText('Connecting Gmail')).toBeInTheDocument();
  });

  it('shows error state when exchange fails', async () => {
    const { useExchangeOAuth } = await import('@/hooks/useOAuth');
    vi.mocked(useExchangeOAuth).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new Error('Token exchange failed'),
      data: null,
    } as unknown as ReturnType<typeof useExchangeOAuth>);

    renderWith('?code=abc&state=xyz');
    expect(screen.getByText('Gmail connection failed')).toBeInTheDocument();
    expect(screen.getByText('Token exchange failed')).toBeInTheDocument();
  });

  it('shows success state when exchange succeeds', async () => {
    const { useExchangeOAuth } = await import('@/hooks/useOAuth');
    vi.mocked(useExchangeOAuth).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
      data: { accountEmail: 'user@gmail.com' },
    } as unknown as ReturnType<typeof useExchangeOAuth>);

    renderWith('?code=abc&state=xyz');
    expect(screen.getByText('Gmail connected')).toBeInTheDocument();
    expect(screen.getByText(/user@gmail.com/)).toBeInTheDocument();
  });
});
