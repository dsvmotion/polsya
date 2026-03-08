import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativePortfolios from '../CreativePortfolios';

vi.mock('@/hooks/useCreativePortfolios', () => ({
  useCreativePortfolios: vi.fn(() => ({ data: [], isLoading: false })),
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

vi.mock('@/components/creative/portfolios/PortfolioFormSheet', () => ({
  PortfolioFormSheet: () => null,
}));

vi.mock('@/components/creative/portfolios/PortfolioDetail', () => ({
  PortfolioDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativePortfolios />
    </MemoryRouter>,
  );
}

describe('CreativePortfolios', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Portfolios')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Showcase your creative work and visual samples')).toBeInTheDocument();
  });

  it('renders add portfolio button', () => {
    renderPage();
    expect(screen.getByText('Add Portfolio')).toBeInTheDocument();
  });
});
