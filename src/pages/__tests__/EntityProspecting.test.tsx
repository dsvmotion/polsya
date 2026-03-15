import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EntityProspecting from '../EntityProspecting';

/* ─── Mocks ─── */

vi.mock('@/hooks/useGeographyOptions', () => ({
  useGeographyOptions: vi.fn(() => ({
    countries: [],
    provinces: [],
    cities: [],
  })),
}));

vi.mock('@/hooks/useProspectingSearch', () => ({
  useProspectingSearch: vi.fn(() => ({
    results: [],
    isLoading: false,
    error: null,
    search: vi.fn(),
    hasSearched: false,
  })),
}));

vi.mock('@/hooks/useSavePharmacies', () => ({
  useSaveEntities: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useEntityTypes', () => ({
  useEntityTypes: vi.fn(() => ({ data: [] })),
  resolveEntityTypeLabel: vi.fn(() => 'Pharmacy'),
}));

vi.mock('@/components/prospecting/EntitySidebar', () => ({
  EntitySidebar: () => <div data-testid="entity-sidebar" />,
}));

vi.mock('@/components/prospecting/ProspectingMap', () => ({
  ProspectingMap: () => <div data-testid="prospecting-map" />,
}));

vi.mock('@/components/prospecting/EntityDetailPanel', () => ({
  EntityDetailPanel: () => null,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <EntityProspecting />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EntityProspecting', () => {
  it('renders the sidebar', () => {
    renderPage();
    expect(screen.getByTestId('entity-sidebar')).toBeInTheDocument();
  });

  it('renders the map', () => {
    renderPage();
    expect(screen.getByTestId('prospecting-map')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).toBeTruthy();
  });
});
