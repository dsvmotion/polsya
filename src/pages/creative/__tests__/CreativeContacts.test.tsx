import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeContacts from '../CreativeContacts';

vi.mock('@/hooks/useCreativeContacts', () => ({
  useCreativeContacts: vi.fn(() => ({ data: [], isLoading: false })),
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

vi.mock('@/components/creative/contacts/ContactFormSheet', () => ({
  ContactFormSheet: () => null,
}));

vi.mock('@/components/creative/contacts/ContactDetail', () => ({
  ContactDetail: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeContacts />
    </MemoryRouter>,
  );
}

describe('CreativeContacts', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Manage contacts at your client organizations')).toBeInTheDocument();
  });

  it('renders add contact button', () => {
    renderPage();
    expect(screen.getByText('Add Contact')).toBeInTheDocument();
  });
});
