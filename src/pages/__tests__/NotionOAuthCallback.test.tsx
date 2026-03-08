import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotionOAuthCallback from '../NotionOAuthCallback';

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
      <MemoryRouter initialEntries={[`/oauth/notion/callback${searchParams}`]}>
        <NotionOAuthCallback />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ─── Tests ─── */

describe('NotionOAuthCallback', () => {
  it('shows error when oauth error param present', () => {
    renderWith('?error=access_denied');
    expect(screen.getByText('Notion connection cancelled')).toBeInTheDocument();
  });

  it('shows error when code/state missing', () => {
    renderWith('');
    expect(screen.getByText('Missing OAuth parameters')).toBeInTheDocument();
  });

  it('calls mutate when code and state present', () => {
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
    } as ReturnType<typeof useExchangeOAuth>);

    renderWith('?code=abc&state=xyz');
    expect(screen.getByText('Connecting Notion')).toBeInTheDocument();
  });

  it('shows success state when exchange succeeds', async () => {
    const { useExchangeOAuth } = await import('@/hooks/useOAuth');
    vi.mocked(useExchangeOAuth).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
      data: { accountEmail: 'user@notion.com' },
    } as unknown as ReturnType<typeof useExchangeOAuth>);

    renderWith('?code=abc&state=xyz');
    expect(screen.getByText('Notion connected')).toBeInTheDocument();
  });
});
