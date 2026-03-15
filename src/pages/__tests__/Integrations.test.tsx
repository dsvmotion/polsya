import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IntegrationsPage from '../Integrations';

vi.mock('@/components/dashboard/IntegrationsCard', () => ({
  IntegrationsCard: () => <div data-testid="integrations-card" />,
}));

vi.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useIntegrations', () => ({
  useIntegrations: () => ({ data: [], isLoading: false }),
  useCreateIntegration: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useOAuth', () => ({
  useStartOAuth: () => ({ mutateAsync: vi.fn() }),
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('IntegrationsPage', () => {
  it('renders the page heading', () => {
    render(<IntegrationsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<IntegrationsPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/Connect your tools/)).toBeInTheDocument();
  });

  it('renders the integrations card and catalog section', () => {
    render(<IntegrationsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('integrations-card')).toBeInTheDocument();
    expect(screen.getByText(/Integrations \d+/)).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<IntegrationsPage />, { wrapper: createWrapper() });
    const buttons = screen.getAllByRole('button');
    const buttonLabels = buttons.map((b) => b.textContent);
    expect(buttonLabels).toContain('All');
    expect(buttonLabels).toContain('E-commerce');
    expect(buttonLabels).toContain('CRM');
    expect(buttonLabels).toContain('Email');
    expect(buttonLabels).toContain('AI');
    expect(buttonLabels).toContain('Communication');
    expect(buttonLabels).toContain('Custom');
  });

  it('renders search input', () => {
    render(<IntegrationsPage />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Search integrations...')).toBeInTheDocument();
  });
});
