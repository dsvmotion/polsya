import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeIngestion from '../CreativeIngestion';

vi.mock('@/hooks/useIngestion', () => ({
  useIngestionProviders: vi.fn(() => ({ data: [], isLoading: false })),
  useIngestionRuns: vi.fn(() => ({ data: [], isLoading: false })),
  useIngestionJobs: vi.fn(() => ({ data: [] })),
  useTriggerIngestionRun: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateIngestionProvider: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useCreateIngestionProvider: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteIngestionProvider: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeIngestion />
    </MemoryRouter>,
  );
}

describe('CreativeIngestion', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Ingestion Engine')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Connect external data sources and monitor sync runs')).toBeInTheDocument();
  });

  it('renders add provider button', () => {
    renderPage();
    expect(screen.getByText('Add Provider')).toBeInTheDocument();
  });
});
