import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeSignals from '../CreativeSignals';

vi.mock('@/hooks/useSignals', () => ({
  useSignalRules: vi.fn(() => ({ data: [], isLoading: false })),
  useSignals: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateSignalRule: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateSignalRule: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteSignalRule: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateSignalStatus: vi.fn(() => ({ mutate: vi.fn() })),
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

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

vi.mock('@/components/creative/signals/SignalDetail', () => ({
  SignalDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeSignals />
    </MemoryRouter>,
  );
}

describe('CreativeSignals', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Signal Engine')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Monitor rules and respond to signals')).toBeInTheDocument();
  });

  it('renders tab triggers', () => {
    renderPage();
    expect(screen.getByText('Signal Feed')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
  });
});
