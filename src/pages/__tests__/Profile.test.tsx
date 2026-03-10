import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '../Profile';

/* ─── Polyfills ─── */
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

/* ─── Stable mock return values (avoid new object refs on each render) ─── */

const mockUser = { id: 'u1', email: 'test@example.com' };
const mockSignOut = vi.fn();
const mockAuthReturn = { user: mockUser, signOut: mockSignOut, isLoading: false };

const mockOrganization = { id: 'org1', name: 'Test Org' };
const mockMembership = { role: 'owner' };
const mockOrgReturn = { organization: mockOrganization, membership: mockMembership, isLoading: false };

const mockBillingReturn = { data: null };
const mockUpdateReturn = { mutateAsync: vi.fn(), isPending: false };
const mockAiConfigReturn = { data: null, isLoading: false };
const mockUpsertReturn = { mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false };
const mockTemplate = { label: 'General B2B', key: 'general_b2b' };

/* ─── Mocks ─── */

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => mockAuthReturn),
}));

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: vi.fn(() => mockOrgReturn),
}));

vi.mock('@/hooks/useBilling', () => ({
  evaluateBillingAccess: vi.fn(() => ({ hasAccess: true, tier: 'pro' })),
  useBillingOverview: vi.fn(() => mockBillingReturn),
}));

vi.mock('@/hooks/useOrganizationSettings', () => ({
  useUpdateOrganizationSettings: vi.fn(() => mockUpdateReturn),
}));

vi.mock('@/lib/rbac', () => ({
  canManageWorkspace: vi.fn(() => true),
}));

vi.mock('@/lib/industry-templates', () => ({
  getIndustryTemplate: vi.fn(() => mockTemplate),
  getIndustryTemplateOptions: vi.fn(() => []),
  isIndustryTemplateKey: vi.fn(() => false),
}));

vi.mock('@/hooks/useAiChatConfig', () => ({
  useAiChatConfig: vi.fn(() => mockAiConfigReturn),
  OPENAI_MODELS: ['gpt-4o-mini'],
  ANTHROPIC_MODELS: ['claude-3-haiku-20240307'],
}));

vi.mock('@/hooks/useUpsertAiChatConfig', () => ({
  useUpsertAiChatConfig: vi.fn(() => mockUpsertReturn),
}));

// Mock Radix Select to avoid jsdom rendering issues
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ─── Tests ─── */

describe('Profile', () => {
  it('renders account information card', () => {
    renderPage();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
  });

  it('renders user email in input', () => {
    renderPage();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('renders workspace settings section', () => {
    renderPage();
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument();
  });
});
