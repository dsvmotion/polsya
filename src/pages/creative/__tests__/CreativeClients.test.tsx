import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeClients from '../CreativeClients';

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

vi.mock('@/components/creative/clients/ClientFormSheet', () => ({
  ClientFormSheet: () => null,
}));

vi.mock('@/components/creative/clients/ClientDetail', () => ({
  ClientDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeClients />
    </MemoryRouter>,
  );
}

describe('CreativeClients', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Clients')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Manage your creative clients and relationships')).toBeInTheDocument();
  });

  it('renders add client button', () => {
    renderPage();
    expect(screen.getByText('Add Client')).toBeInTheDocument();
  });
});
