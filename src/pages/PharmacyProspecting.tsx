import { useState, useCallback, useMemo, useEffect } from 'react';
import { XCircle, Building2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PharmacySidebar } from '@/components/prospecting/PharmacySidebar';
import { ProspectingMap } from '@/components/prospecting/ProspectingMap';
import { PharmacyDetailPanel } from '@/components/prospecting/PharmacyDetailPanel';
import { useGeographyOptions } from '@/hooks/useGeographyOptions';
import { useProspectingSearch } from '@/hooks/useProspectingSearch';
import { useSavePharmacies } from '@/hooks/useSavePharmacies';
import { Pharmacy, PharmacyFilters as Filters, type ClientType } from '@/types/pharmacy';
import { useEntityTypes, resolveEntityTypeLabel } from '@/hooks/useEntityTypes';

interface Props {
  clientType?: ClientType;
}

const initialFilters: Filters = {
  search: '',
  city: '',
  province: '',
  country: '',
  status: 'all',
};

function pluralizeEntityLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'Entities';
  if (/[^aeiou]y$/i.test(trimmed)) return `${trimmed.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(trimmed)) return `${trimmed}es`;
  return `${trimmed}s`;
}

export default function PharmacyProspecting({ clientType = 'pharmacy' }: Props) {
  const { data: entityTypes = [] } = useEntityTypes();
  const singularLabel = resolveEntityTypeLabel(
    clientType,
    entityTypes,
    clientType === 'herbalist' ? 'Herbalist' : 'Pharmacy',
  );
  const pluralLabel = pluralizeEntityLabel(singularLabel);

  const labels = useMemo(() => ({
    singular: singularLabel.toLowerCase(),
    plural: pluralLabel.toLowerCase(),
    sidebarTitle: pluralLabel,
    searchButton: `Search ${pluralLabel}`,
    noFound: `No ${pluralLabel.toLowerCase()} found`,
    foundCount: (n: number) => `Found ${n} ${pluralLabel.toLowerCase()}`,
  }), [pluralLabel, singularLabel]);

  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { countries, provinces, cities } = useGeographyOptions(filters.country, filters.province);

  // Manual search hook
  const {
    results: searchResults,
    isSearching,
    hasSearched,
    progress,
    executeSearch,
    clearResults,
    cancelSearch,
    detectedLocation,
  } = useProspectingSearch();

  // Auto-fill country/province from first Google Places result when user had not set country
  useEffect(() => {
    if (detectedLocation && !filters.country && !filters.city) {
      setFilters((prev) => ({
        ...prev,
        country: detectedLocation.country || prev.country,
        province: detectedLocation.province || prev.province,
      }));
    }
  }, [detectedLocation, filters.country, filters.city]);

  // Save pharmacies mutation
  const savePharmacies = useSavePharmacies(clientType);

  // Filter displayed results by text search and status
  const displayedPharmacies = useMemo(() => {
    return searchResults.filter((pharmacy) => {
      // Text search filter (on already fetched results)
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
  }, [searchResults, filters.search, filters.status]);

  const handleSelectPharmacy = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPharmacy(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSelectedPharmacy(null);
    setSelectedIds(new Set());
    clearResults();
  }, [clearResults]);

  const handleSearch = useCallback(() => {
    setSelectedIds(new Set()); // Clear selection on new search
    executeSearch({
      country: filters.country,
      province: filters.province,
      city: filters.city,
      clientType,
    });
  }, [executeSearch, filters.country, filters.province, filters.city, clientType]);

  const handleCancelSearch = useCallback(() => {
    cancelSearch();
  }, [cancelSearch]);

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(displayedPharmacies.map(p => p.id)));
  }, [displayedPharmacies]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSaveSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    savePharmacies.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setSavedIds((prev) => new Set([...prev, ...ids]));
      },
    });
  }, [selectedIds, savePharmacies]);

  const handleSaveOne = useCallback(
    (id: string) => {
      savePharmacies.mutate([id], {
        onSuccess: () => {
          setSavedIds((prev) => new Set(prev).add(id));
        },
      });
    },
    [savePharmacies]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {clientType === 'pharmacy' ? (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Leaf className="h-5 w-5 text-muted-foreground" />
          )}
          <h1 className="font-semibold text-sm md:text-base truncate">
            {`${labels.searchButton} Map`}
          </h1>
          {hasSearched && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded hidden sm:inline">
              {displayedPharmacies.length} {labels.plural}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSearching && (
            <Button variant="outline" size="sm" onClick={handleCancelSearch} className="hidden sm:inline-flex">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/50 overflow-auto max-h-[40vh] sm:max-h-[46vh] lg:max-h-none">
          <PharmacySidebar
            pharmacies={displayedPharmacies}
            isLoading={false}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            hasSearched={hasSearched}
            countries={countries}
            provinces={provinces}
            cities={cities}
            onSearch={handleSearch}
            isSearching={isSearching}
            progress={progress}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onSaveSelected={handleSaveSelected}
            onSaveOne={handleSaveOne}
            savedIds={savedIds}
            isSaving={savePharmacies.isPending}
            labels={labels}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[42vh] sm:min-h-[40vh]">
          <ProspectingMap
            pharmacies={displayedPharmacies}
            selectedPharmacyId={selectedPharmacy?.id || null}
            onSelectPharmacy={handleSelectPharmacy}
            hasActiveGeoFilter={hasSearched}
          />
        </div>

        {/* Detail Panel */}
        {selectedPharmacy && (
          <div className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-muted/50 overflow-auto max-h-[36vh] sm:max-h-[44vh] lg:max-h-none">
            <PharmacyDetailPanel pharmacy={selectedPharmacy} onClose={handleCloseDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
