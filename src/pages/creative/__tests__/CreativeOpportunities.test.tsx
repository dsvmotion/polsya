import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeOpportunities from '../CreativeOpportunities';

vi.mock('@/hooks/useCreativeOpportunities', () => ({
  useCreativeOpportunities: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateCreativeOpportunity: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('@/hooks/useCreativeClients', () => ({
  useCreativeClients: vi.fn(() => ({ data: [], isLoading: false })),
}));

const mockLayoutReturn = {
  sidebarOpen: false,
  setSidebarOpen: vi.fn(),
  sidebarCollapsed: false,
  setSidebarCollapsed: vi.fn(),
  contextPanelOpen: false,
  setContextPanelOpen: vi.fn(),
  contextPanelContent: null,
  setContextPanelContent: vi.fn(),
};

vi.mock('@/components/creative/layout/useCreativeLayout', () => ({
  useCreativeLayout: vi.fn(() => mockLayoutReturn),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/creative/opportunities/OpportunityFormSheet', () => ({
  OpportunityFormSheet: () => null,
}));

vi.mock('@/components/creative/opportunities/OpportunityDetail', () => ({
  OpportunityDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeOpportunities />
    </MemoryRouter>,
  );
}

describe('CreativeOpportunities', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Pipeline of creative business opportunities')).toBeInTheDocument();
  });

  it('renders new opportunity button', () => {
    renderPage();
    expect(screen.getByText('New Opportunity')).toBeInTheDocument();
  });
});
