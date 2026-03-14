import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EntityOperations from '../EntityOperations';

/* ─── Mocks ─── */

vi.mock('@/hooks/useEntityOperations', () => ({
  useEntityOperations: vi.fn(() => ({
    pharmacies: [{ id: 'p1', name: 'Test Account', totalRevenue: 0 }],
    totalCount: 1,
    isLoading: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSmartSegments', () => ({
  filterBySmartSegment: vi.fn((_key: string, data: unknown[]) => data),
  useSmartSegmentCounts: vi.fn(() => ({})),
}));

vi.mock('@/hooks/useGeographyOptions', () => ({
  useGeographyOptions: vi.fn(() => ({
    countries: [],
    provinces: [],
    cities: [],
  })),
}));

vi.mock('@/hooks/useSavedSegments', () => ({
  useSavedSegments: vi.fn(() => ({ data: [] })),
  useCreateSavedSegment: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteSavedSegment: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useToggleFavoriteSegment: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/useEntityActivities', () => ({
  useCreateEntityActivity: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/useEntityTypes', () => ({
  useEntityTypes: vi.fn(() => ({ data: [] })),
  resolveEntityTypeLabel: vi.fn(() => 'Pharmacy'),
}));

vi.mock('@/hooks/useOrganizationContext', () => ({
  useCurrentOrganization: vi.fn(() => ({
    organization: { id: 'org1', settings: {} },
  })),
}));

vi.mock('@/lib/industry-templates', () => ({
  getIndustrySmartSegmentLabels: vi.fn(() => ({})),
}));

vi.mock('@/components/operations/OperationsTable', () => ({
  OperationsTable: () => <div data-testid="operations-table" />,
}));

vi.mock('@/components/operations/OperationsFiltersBar', () => ({
  OperationsFiltersBar: () => <div data-testid="filters-bar" />,
}));

vi.mock('@/components/operations/EntityOperationsDetail', () => ({
  EntityOperationsDetail: () => null,
}));

vi.mock('@/components/operations/BulkImportDialog', () => ({
  BulkImportDialog: () => null,
}));

vi.mock('@/components/operations/PipelineSummaryCards', () => ({
  PipelineSummaryCards: () => <div data-testid="pipeline-cards" />,
}));

vi.mock('@/components/operations/RiskAlertsCard', () => ({
  RiskAlertsCard: () => <div data-testid="risk-alerts" />,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <EntityOperations />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EntityOperations', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('Saved Pharmacys')).toBeInTheDocument();
  });

  it('renders the operations table', () => {
    renderPage();
    expect(screen.getByTestId('operations-table')).toBeInTheDocument();
  });

  it('renders pipeline summary cards', () => {
    renderPage();
    expect(screen.getByTestId('pipeline-cards')).toBeInTheDocument();
  });

  it('renders risk alerts card', () => {
    renderPage();
    expect(screen.getByTestId('risk-alerts')).toBeInTheDocument();
  });
});
