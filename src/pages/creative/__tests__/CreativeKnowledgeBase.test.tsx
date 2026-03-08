import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeKnowledgeBase from '../CreativeKnowledgeBase';

vi.mock('@/hooks/useAiDocuments', () => ({
  useAiDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useUploadDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteDocument: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDocumentStatus: vi.fn(() => ({ data: null })),
}));

vi.mock('@/hooks/useAiUsage', () => ({
  useAiUsage: vi.fn(() => ({ data: null })),
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
      <CreativeKnowledgeBase />
    </MemoryRouter>,
  );
}

describe('CreativeKnowledgeBase', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Upload and manage documents for AI-powered search')).toBeInTheDocument();
  });

  it('renders add document button', () => {
    renderPage();
    expect(screen.getByText('Add Document')).toBeInTheDocument();
  });
});
