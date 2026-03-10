import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntegrationsPage from '../Integrations';

vi.mock('@/components/dashboard/IntegrationsCard', () => ({
  IntegrationsCard: () => <div data-testid="integrations-card" />,
}));

vi.mock('@/components/dashboard/IntegrationHealthCard', () => ({
  IntegrationHealthCard: () => <div data-testid="health-card" />,
}));

vi.mock('@/components/dashboard/AgentActionsCard', () => ({
  AgentActionsCard: () => <div data-testid="agent-card" />,
}));

vi.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('IntegrationsPage', () => {
  it('renders the page heading', () => {
    render(<IntegrationsPage />);
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<IntegrationsPage />);
    expect(screen.getByText(/Connect your tools/)).toBeInTheDocument();
  });

  it('renders all three dashboard cards', () => {
    render(<IntegrationsPage />);
    expect(screen.getByTestId('integrations-card')).toBeInTheDocument();
    expect(screen.getByTestId('health-card')).toBeInTheDocument();
    expect(screen.getByTestId('agent-card')).toBeInTheDocument();
  });
});
