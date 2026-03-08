import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeWorkflows from '../CreativeWorkflows';

vi.mock('@/hooks/useWorkflowRules', () => ({
  useWorkflowRules: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateRule: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateRule: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteRule: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useToggleRule: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeWorkflows />
    </MemoryRouter>,
  );
}

describe('CreativeWorkflows', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Workflow Automation')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Configure rules to automate actions when entities change')).toBeInTheDocument();
  });

  it('renders create rule button', () => {
    renderPage();
    expect(screen.getByText('Create Rule')).toBeInTheDocument();
  });

  it('renders empty state when no rules', () => {
    renderPage();
    expect(screen.getByText(/No workflow rules configured yet/)).toBeInTheDocument();
  });
});
