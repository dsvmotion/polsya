import { useMemo } from 'react';
import { Building2, Loader2, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BusinessEntity, EntityFilters as Filters } from '@/types/entity';
import { EntityFilters } from './EntityFilters';
import { EntityListItem } from './EntityListItem';
import { EntitySelectionBar } from './EntitySelectionBar';

interface EntitySidebarProps {
  pharmacies: BusinessEntity[];
  isLoading: boolean;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: BusinessEntity) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  hasSearched: boolean;
  countries: string[];
  provinces: string[];
  cities: string[];
  onSearch: () => void;
  isSearching: boolean;
  progress: { found: number; cached: number };
  // Selection props
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSaveSelected: () => void;
  onSaveOne?: (id: string) => void;
  savedIds?: Set<string>;
  isSaving: boolean;
  labels?: {
    singular: string;
    plural: string;
    sidebarTitle: string;
    searchButton: string;
    noFound: string;
    foundCount: (n: number) => string;
  };
}

export function EntitySidebar({
  pharmacies,
  isLoading,
  selectedPharmacyId,
  onSelectPharmacy,
  filters,
  onFiltersChange,
  onClearFilters,
  hasSearched,
  countries,
  provinces,
  cities,
  onSearch,
  isSearching,
  progress,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSaveSelected,
  onSaveOne,
  savedIds = new Set(),
  isSaving,
  labels,
}: EntitySidebarProps) {
  const sidebarTitle = labels?.sidebarTitle ?? 'Entities';
  const searchButtonLabel = labels?.searchButton ?? 'Search Entities';
  const noFoundLabel = labels?.noFound ?? 'No entities found';
  // Filter displayed pharmacies by text search and status
  const displayedPharmacies = useMemo(() => {
    return pharmacies.filter((pharmacy) => {
      // Text search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          pharmacy.name.toLowerCase().includes(searchLower) ||
          pharmacy.address?.toLowerCase().includes(searchLower) ||
          pharmacy.city?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && pharmacy.status !== filters.status) return false;

      return true;
    });
  }, [pharmacies, filters.search, filters.status]);

  // Calculate status counts
  const stats = useMemo(() => {
    const statusCounts = displayedPharmacies.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: pharmacies.length,
      displayed: displayedPharmacies.length,
      notContacted: statusCounts['not_contacted'] || 0,
      contacted: statusCounts['contacted'] || 0,
      client: statusCounts['client'] || 0,
    };
  }, [pharmacies, displayedPharmacies]);

  // Check if all displayed pharmacies are selected
  const allSelected = displayedPharmacies.length > 0 && 
    displayedPharmacies.every(p => selectedIds.has(p.id));

  // Count of selected pharmacies that are currently displayed
  const displayedSelectedCount = displayedPharmacies.filter(p => selectedIds.has(p.id)).length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">{sidebarTitle}</h2>
          {hasSearched && (
            <span className="text-xs text-muted-foreground ml-auto">{stats.displayed} shown</span>
          )}
        </div>

        <EntityFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          countries={countries}
          provinces={provinces}
          cities={cities}
          onClearFilters={onClearFilters}
          onSearch={onSearch}
          isSearching={isSearching}
          searchButtonLabel={searchButtonLabel}
        />
      </div>

      {/* Progress indicator during search */}
      {isSearching && (
        <div className="px-4 py-2 border-b border-border bg-muted">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              Found {progress.found} • Cached {progress.cached}
            </span>
          </div>
        </div>
      )}

      {/* Stats Bar - only show when we have results */}
      {hasSearched && !isSearching && pharmacies.length > 0 && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-4 text-xs bg-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">{stats.notContacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">{stats.contacted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{stats.client}</span>
          </div>
        </div>
      )}

      {/* Selection Bar - only show when we have results */}
      {hasSearched && !isSearching && pharmacies.length > 0 && (
        <EntitySelectionBar
          totalCount={displayedPharmacies.length}
          selectedCount={displayedSelectedCount}
          allSelected={allSelected}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onSave={onSaveSelected}
          isSaving={isSaving}
        />
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading || isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-foreground">Select filters and click Search</p>
              <p className="text-xs mt-1 text-muted-foreground">
                Choose Country → Province → City, then click &quot;{searchButtonLabel}&quot;
              </p>
            </div>
          ) : displayedPharmacies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">{noFoundLabel}</p>
              <p className="text-xs mt-1 text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            displayedPharmacies.map((pharmacy) => (
              <EntityListItem
                key={pharmacy.id}
                pharmacy={pharmacy}
                isSelected={selectedPharmacyId === pharmacy.id}
                isChecked={selectedIds.has(pharmacy.id)}
                onCheck={(checked) => onToggleSelect(pharmacy.id)}
                onClick={() => onSelectPharmacy(pharmacy)}
                onSaveOne={onSaveOne}
                isSavedToOperations={pharmacy.savedAt != null || savedIds.has(pharmacy.id)}
                isSaving={isSaving}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
