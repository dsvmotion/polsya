import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Building2, Leaf, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePharmacyOperations } from '@/hooks/usePharmacyOperations';
import { OperationsFilters, SortField, SortDirection, PharmacyWithOrders, SavedSegment } from '@/types/operations';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { OperationsFiltersBar } from '@/components/operations/OperationsFiltersBar';
import { PharmacyOperationsDetail } from '@/components/operations/PharmacyOperationsDetail';
import { useQueryClient } from '@tanstack/react-query';
import { useGeographyOptions } from '@/hooks/useGeographyOptions';
import { UserMenu } from '@/components/auth/UserMenu';
import { BulkImportDialog } from '@/components/operations/BulkImportDialog';
import { PipelineSummaryCards } from '@/components/operations/PipelineSummaryCards';
import {
  useSavedSegments,
  useCreateSavedSegment,
  useDeleteSavedSegment,
  useToggleFavoriteSegment,
} from '@/hooks/useSavedSegments';
import type { ClientType } from '@/types/pharmacy';

interface Props {
  clientType?: ClientType;
}

const DERIVED_SORT_FIELDS = new Set(['totalRevenue', 'paymentStatus', 'lastOrderDate']);

const initialFilters: OperationsFilters = {
  search: '',
  country: '',
  province: '',
  city: '',
  commercialStatus: 'all',
  paymentStatus: 'all',
};

export default function PharmacyOperations({ clientType = 'pharmacy' }: Props) {
  const [filters, setFilters] = useState<OperationsFilters>(initialFilters);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithOrders | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const { data: segments = [] } = useSavedSegments('operations');
  const createSegment = useCreateSavedSegment();
  const deleteSegment = useDeleteSavedSegment();
  const toggleFavorite = useToggleFavoriteSegment();

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const serverFilters = useMemo(
    () => ({
      country: filters.country || undefined,
      province: filters.province || undefined,
      city: filters.city || undefined,
      commercialStatus: filters.commercialStatus,
      paymentStatus: filters.paymentStatus,
      search: searchDebounced || undefined,
      clientType,
    }),
    [
      filters.country,
      filters.province,
      filters.city,
      filters.commercialStatus,
      filters.paymentStatus,
      searchDebounced,
      clientType,
    ]
  );

  // Server-side filtered pharmacies with pagination and sorting
  const { pharmacies = [], totalCount = 0, isLoading, refetch } = usePharmacyOperations(
    serverFilters,
    page,
    pageSize,
    sortField,
    sortDirection
  );
  const queryClient = useQueryClient();

  // Geography options from unified normalized tables
  const { countries, provinces, cities } = useGeographyOptions(filters.country, filters.province);

  const displayedPharmacies = useMemo(() => {
    if (!DERIVED_SORT_FIELDS.has(sortField)) return pharmacies;

    const result = [...pharmacies];
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'totalRevenue':
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case 'paymentStatus': {
          const statusA = a.lastOrder?.paymentStatus || 'zzz';
          const statusB = b.lastOrder?.paymentStatus || 'zzz';
          comparison = statusA.localeCompare(statusB);
          break;
        }
        case 'lastOrderDate': {
          const dateA = a.lastOrder?.dateCreated || '1970-01-01';
          const dateB = b.lastOrder?.dateCreated || '1970-01-01';
          comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [pharmacies, sortField, sortDirection]);

  const handleFiltersChange = useCallback((newFilters: OperationsFilters) => {
    // Enforce hierarchy
    if (newFilters.country !== filters.country) {
      setPage(0);
      setFilters({ ...newFilters, province: '', city: '' });
      return;
    }
    if (newFilters.province !== filters.province) {
      setPage(0);
      setFilters({ ...newFilters, city: '' });
      return;
    }
    setPage(0);
    setFilters(newFilters);
  }, [filters.country, filters.province]);

  const handleSort = useCallback((field: SortField) => {
    setPage(0);
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleSelectSegment = useCallback((segment: SavedSegment | null) => {
    if (segment) {
      setFilters(segment.filters);
      setSelectedSegmentId(segment.id);
      setPage(0);
    } else {
      setSelectedSegmentId(null);
    }
  }, []);

  const handleSaveSegment = useCallback(async (name: string) => {
    await createSegment.mutateAsync({
      name,
      scope: 'operations',
      filters,
    });
  }, [createSegment, filters]);

  const handleDeleteSegment = useCallback(async (id: string) => {
    await deleteSegment.mutateAsync({ id, scope: 'operations' });
    if (selectedSegmentId === id) setSelectedSegmentId(null);
  }, [deleteSegment, selectedSegmentId]);

  const handleToggleFavorite = useCallback(async (id: string, current: boolean) => {
    await toggleFavorite.mutateAsync({ id, scope: 'operations', is_favorite: !current });
  }, [toggleFavorite]);

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['pharmacy-operations'] });
    queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    queryClient.invalidateQueries({ queryKey: ['detailed-orders'] });
    queryClient.invalidateQueries({ queryKey: ['pharmacy-documents'] });
  }, [queryClient, refetch]);

  // Empty state when no saved pharmacies
  const showEmptyState = !isLoading && totalCount === 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            {clientType === 'pharmacy' ? (
              <Building2 className="h-5 w-5 text-gray-700" />
            ) : (
              <Leaf className="h-5 w-5 text-gray-700" />
            )}
            <h1 className="font-semibold text-lg">
              {clientType === 'pharmacy' ? 'Saved Pharmacies' : 'Saved Herbalists'}
            </h1>
          </div>
          {!showEmptyState && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {totalCount} {clientType === 'pharmacy' ? 'pharmacies' : 'herbalists'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <BulkImportDialog defaultClientType={clientType} onSuccess={handleRefresh} />
          <Link to={clientType === 'pharmacy' ? '/prospecting' : '/prospecting/herbalists'}>
            <Button variant="outline" size="sm" className="border-gray-300">
              <MapPin className="h-4 w-4 mr-2" />
              {clientType === 'pharmacy' ? 'Search Pharmacies' : 'Search Herbalists'}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <UserMenu />
        </div>
      </header>

      {showEmptyState ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="bg-gray-100 rounded-full p-6 mb-6">
            {clientType === 'pharmacy' ? (
              <Building2 className="h-12 w-12 text-gray-400" />
            ) : (
              <Leaf className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {clientType === 'pharmacy' ? 'No Saved Pharmacies' : 'No Saved Herbalists'}
          </h2>
          <p className="text-gray-500 text-center max-w-md mb-6">
            {clientType === 'pharmacy'
              ? "You haven't saved any pharmacies yet. Use Search Pharmacies Map to discover pharmacies and save them here for management."
              : "You haven't saved any herbalists yet. Use Search Herbalists Map to discover herbalists and save them here for management."}
          </p>
          <Link to={clientType === 'pharmacy' ? '/prospecting' : '/prospecting/herbalists'}>
            <Button className="bg-primary hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              {clientType === 'pharmacy' ? 'Go to Search Pharmacies' : 'Go to Search Herbalists'}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Pipeline Summary */}
          <PipelineSummaryCards />

          {/* Filters */}
          <OperationsFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={() => {
              setFilters(initialFilters);
              setSelectedSegmentId(null);
              setPage(0);
            }}
            countries={countries}
            provinces={provinces}
            cities={cities}
            segments={segments}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={handleSelectSegment}
            onSaveSegment={handleSaveSegment}
            onDeleteSegment={handleDeleteSegment}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Main Content */}
          <div className="flex items-start">
            {/* Table */}
            <div className={`flex-1 overflow-auto ${selectedPharmacy ? 'max-w-[calc(100%-400px)]' : ''}`}>
              <OperationsTable
                pharmacies={displayedPharmacies}
                isLoading={isLoading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectedPharmacyId={selectedPharmacy?.id || null}
                onSelectPharmacy={setSelectedPharmacy}
              />
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {totalCount > 0
                    ? `Showing ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)} of ${totalCount}`
                    : 'Showing 0 of 0'}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * pageSize >= totalCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Detail Panel */}
            {selectedPharmacy && (
              <div className="w-[400px] border-l border-gray-200 bg-gray-50 sticky top-20">
                <PharmacyOperationsDetail
                  pharmacy={selectedPharmacy}
                  onClose={() => setSelectedPharmacy(null)}
                  onStatusUpdate={handleRefresh}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
