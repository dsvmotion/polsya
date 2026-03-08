import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminOrganizationDetail from '../AdminOrganizationDetail';

/* ─── Mock hooks ─── */

const mockOrgData = {
  id: '12345678-abcd-efgh-ijkl-123456789abc',
  name: 'Acme Corp',
  slug: 'acme-corp',
  created_at: '2024-06-15T00:00:00Z',
  locale: 'en',
  timezone: 'America/New_York',
  currency: 'USD',
  subscriptionStatus: 'active',
  currentPeriodEnd: '2025-07-15T00:00:00Z',
  stripeSubscriptionId: 'sub_1234567890abcdefghijklmnop',
  memberCount: 5,
  entityCount: 120,
  integrationCount: 3,
  members: [
    {
      user_id: 'user-1234-5678-abcd-efghijklmnop',
      role: 'owner',
      status: 'active',
      created_at: '2024-06-15T00:00:00Z',
    },
    {
      user_id: 'user-abcd-efgh-1234-567890abcdef',
      role: 'member',
      status: 'active',
      created_at: '2024-07-01T00:00:00Z',
    },
  ],
  aiChatConfig: {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
  },
};

vi.mock('@/hooks/usePlatformOrganizationDetail', () => ({
  usePlatformOrganizationDetail: vi.fn(() => ({
    data: mockOrgData,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useUpsertAiChatConfig', () => ({
  useUpsertAiChatConfig: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

vi.mock('@/integrations/supabase/client', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

/* ─── Helpers ─── */

function renderWithRoute(orgId: string) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/admin/organizations/${orgId}`]}>
        <Routes>
          <Route
            path="/admin/organizations/:orgId"
            element={<AdminOrganizationDetail />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ─── Tests ─── */

describe('AdminOrganizationDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders organization name and slug', () => {
    renderWithRoute('12345678-abcd-efgh-ijkl-123456789abc');
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('acme-corp')).toBeInTheDocument();
  });

  it('renders summary stats cards with correct values', () => {
    renderWithRoute('12345678-abcd-efgh-ijkl-123456789abc');
    // Stats card values — unique to the stats section
    expect(screen.getByText('active')).toBeInTheDocument(); // subscription status
    expect(screen.getByText('5')).toBeInTheDocument(); // member count
    expect(screen.getByText('120')).toBeInTheDocument(); // entity count
    expect(screen.getByText('3')).toBeInTheDocument(); // integration count
  });

  it('renders tabs', () => {
    renderWithRoute('12345678-abcd-efgh-ijkl-123456789abc');
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Subscription' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'AI Config' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
  });

  it('renders overview info rows', () => {
    renderWithRoute('12345678-abcd-efgh-ijkl-123456789abc');
    expect(screen.getByText('Locale')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Timezone')).toBeInTheDocument();
    expect(screen.getByText('America/New_York')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders loading state', async () => {
    const { usePlatformOrganizationDetail } = await import(
      '@/hooks/usePlatformOrganizationDetail'
    );
    vi.mocked(usePlatformOrganizationDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof usePlatformOrganizationDetail>);

    renderWithRoute('loading-org-id');
    expect(screen.getByText(/Loading organization/)).toBeInTheDocument();
  });

  it('renders error state', async () => {
    const { usePlatformOrganizationDetail } = await import(
      '@/hooks/usePlatformOrganizationDetail'
    );
    vi.mocked(usePlatformOrganizationDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    } as ReturnType<typeof usePlatformOrganizationDetail>);

    renderWithRoute('bad-org-id');
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });
});
