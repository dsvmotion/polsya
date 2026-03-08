import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeEnrichment from '../CreativeEnrichment';

vi.mock('@/hooks/useEnrichmentEngine', () => ({
  useEnrichmentCredits: vi.fn(() => ({ data: [], isLoading: false })),
  useEnrichmentRecipes: vi.fn(() => ({ data: [], isLoading: false })),
  useEnrichmentRuns: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateEnrichmentRecipe: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateEnrichmentRecipe: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteEnrichmentRecipe: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useTriggerEnrichmentRun: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeEnrichment />
    </MemoryRouter>,
  );
}

describe('CreativeEnrichment', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Enrichment Engine')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Enrich entity data with external providers')).toBeInTheDocument();
  });

  it('renders tab triggers', () => {
    renderPage();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Run History')).toBeInTheDocument();
  });
});
