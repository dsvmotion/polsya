import { useState } from 'react';
import { DiscoverSearchForm } from '@/components/creative/discover/DiscoverSearchForm';
import { DiscoverResultsTable } from '@/components/creative/discover/DiscoverResultsTable';
import { DiscoverMap } from '@/components/creative/discover/DiscoverMap';
import { BulkActionBar } from '@/components/creative/discover/BulkActionBar';
import { useDiscoverSearch } from '@/hooks/useDiscoverSearch';
import { useSaveDiscoverResults } from '@/hooks/useSaveDiscoverResults';
import type { PlaceResult, PlacesSearchParams } from '@/services/discoverService';
import { useToast } from '@/hooks/use-toast';

export default function CreativeDiscover() {
  const { toast } = useToast();
  const searchMutation = useDiscoverSearch();
  const saveMutation = useSaveDiscoverResults();
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [alreadySavedIds, setAlreadySavedIds] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<PlaceResult[]>([]);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5000);

  const handleSearch = async (params: PlacesSearchParams) => {
    setSelectedRows([]);
    setSearchCenter({ lat: params.lat, lng: params.lng });
    setSearchRadius(params.radiusMeters);

    try {
      const data = await searchMutation.mutateAsync(params);
      setResults(data.results);
      setAlreadySavedIds(data.alreadySavedIds);
    } catch (err) {
      toast({
        title: 'Search failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (saveAs: 'client' | 'lead') => {
    try {
      const saved = await saveMutation.mutateAsync({ places: selectedRows, saveAs });
      toast({
        title: `Saved ${saved.length} ${saveAs === 'lead' ? 'leads' : 'clients'}`,
        description: saved.map((s) => s.name).join(', '),
      });
      setAlreadySavedIds((prev) => [...prev, ...saved.map((s) => s.placeId)]);
      setSelectedRows([]);
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Form */}
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-lg font-semibold mb-4">Discover</h1>
        <DiscoverSearchForm
          onSearch={handleSearch}
          isLoading={searchMutation.isPending}
        />
      </div>

      {/* Results: Table + Map split */}
      {results.length > 0 && (
        <div className="flex flex-1 min-h-0">
          <div className="w-3/5 border-r overflow-auto">
            <DiscoverResultsTable
              results={results}
              alreadySavedIds={alreadySavedIds}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              highlightedPlaceId={highlightedPlaceId}
              onRowHover={setHighlightedPlaceId}
            />
          </div>
          <div className="w-2/5">
            <DiscoverMap
              results={results}
              center={searchCenter}
              radiusMeters={searchRadius}
              highlightedPlaceId={highlightedPlaceId}
              onPinClick={(placeId) => setHighlightedPlaceId(placeId)}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !searchMutation.isPending && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">Search for businesses</p>
            <p className="text-sm mt-1">Enter a search query and location above to discover leads</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {searchMutation.isPending && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Bulk action bar */}
      {selectedRows.length > 0 && (
        <BulkActionBar
          count={selectedRows.length}
          onSaveAsClient={() => handleSave('client')}
          onSaveAsLead={() => handleSave('lead')}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}
