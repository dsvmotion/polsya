import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeStyle from '../CreativeStyle';

vi.mock('@/hooks/useStyleAnalyses', () => ({
  useStyleAnalyses: vi.fn(() => ({ data: [], isLoading: false })),
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

vi.mock('@/components/creative/style/StyleAnalysisFormSheet', () => ({
  StyleAnalysisFormSheet: () => null,
}));

vi.mock('@/components/creative/style/StyleAnalysisDetail', () => ({
  StyleAnalysisDetail: () => null,
}));

vi.mock('@/components/creative/style/StyleSimilarityResults', () => ({
  StyleSimilarityResults: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeStyle />
    </MemoryRouter>,
  );
}

describe('CreativeStyle', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Style Intelligence')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Analyze and compare visual styles across clients')).toBeInTheDocument();
  });

  it('renders tab triggers', () => {
    renderPage();
    expect(screen.getByText('Analyses')).toBeInTheDocument();
    expect(screen.getByText('Similarity')).toBeInTheDocument();
  });
});
