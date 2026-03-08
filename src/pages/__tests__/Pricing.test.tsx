import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Pricing from '../Pricing';

/* ─── Mocks ─── */

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: vi.fn(() => ({
    organization: null,
    membership: null,
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useBilling', () => ({
  useBillingPlans: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateCheckoutSession: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/lib/rbac', () => ({
  canManageBilling: vi.fn(() => false),
}));

vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/* ─── Tests ─── */

describe('Pricing', () => {
  it('renders the heading', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    expect(screen.getByText('Simple, fair pricing')).toBeInTheDocument();
  });

  it('renders all plan names', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders fallback prices when no API plans loaded', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    expect(screen.getByText('€29')).toBeInTheDocument();
    expect(screen.getByText('€79')).toBeInTheDocument();
    expect(screen.getByText('€149')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders "Most popular" badge on Pro plan', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    expect(screen.getByText('Most popular')).toBeInTheDocument();
  });

  it('renders CTA buttons for unauthenticated users', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    const trialButtons = screen.getAllByText('Start free trial');
    expect(trialButtons.length).toBe(3); // starter, pro, business
    expect(screen.getByText('Contact sales')).toBeInTheDocument();
  });

  it('renders plan features', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    expect(screen.getByText('Up to 500 entities')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Unlimited users')).toBeInTheDocument();
  });

  it('renders footer text', () => {
    render(<TestProviders><Pricing /></TestProviders>);
    expect(screen.getByText(/cancel anytime/)).toBeInTheDocument();
  });
});
