import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeResolution from '../CreativeResolution';

vi.mock('@/hooks/useEntityResolution', () => ({
  useResolutionCandidates: vi.fn(() => ({ data: [], isLoading: false })),
  useResolveCandidate: vi.fn(() => ({ mutate: vi.fn() })),
  useEntitySourceMappings: vi.fn(() => ({ data: [], isLoading: false })),
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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/creative/resolution/CandidateDetail', () => ({
  CandidateDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeResolution />
    </MemoryRouter>,
  );
}

describe('CreativeResolution', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Entity Resolution')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Resolve duplicate entities and manage source mappings')).toBeInTheDocument();
  });

  it('renders tab triggers', () => {
    renderPage();
    expect(screen.getByText('Candidates')).toBeInTheDocument();
    expect(screen.getByText('Source Mappings')).toBeInTheDocument();
  });
});
