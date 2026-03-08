import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeProjects from '../CreativeProjects';

vi.mock('@/hooks/useCreativeProjects', () => ({
  useCreativeProjects: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateCreativeProject: vi.fn(() => ({ mutate: vi.fn() })),
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

vi.mock('@/components/creative/projects/ProjectFormSheet', () => ({
  ProjectFormSheet: () => null,
}));

vi.mock('@/components/creative/projects/ProjectDetail', () => ({
  ProjectDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeProjects />
    </MemoryRouter>,
  );
}

describe('CreativeProjects', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Track creative projects and deliverables')).toBeInTheDocument();
  });

  it('renders new project button', () => {
    renderPage();
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });
});
