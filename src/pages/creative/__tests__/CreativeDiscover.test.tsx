import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeDiscover from '../CreativeDiscover';

vi.mock('@/hooks/useDiscoverSearch', () => ({
  useDiscoverSearch: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/useSaveDiscoverResults', () => ({
  useSaveDiscoverResults: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

vi.mock('@/components/creative/discover/DiscoverSearchForm', () => ({
  DiscoverSearchForm: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="discover-search-form">Search Form {isLoading ? 'loading' : ''}</div>
  ),
}));

vi.mock('@/components/creative/discover/DiscoverResultsTable', () => ({
  DiscoverResultsTable: () => <div data-testid="discover-results-table" />,
}));

vi.mock('@/components/creative/discover/DiscoverMap', () => ({
  DiscoverMap: () => <div data-testid="discover-map" />,
}));

vi.mock('@/components/creative/discover/BulkActionBar', () => ({
  BulkActionBar: () => <div data-testid="bulk-action-bar" />,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeDiscover />
    </MemoryRouter>,
  );
}

describe('CreativeDiscover', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders search form', () => {
    renderPage();
    expect(screen.getByTestId('discover-search-form')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderPage();
    expect(screen.getByText('Search for businesses')).toBeInTheDocument();
  });
});
