import { useState, useMemo, useCallback, useEffect } from 'react';
import { RefreshCw, Building2, Leaf, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEntityOperations } from '@/hooks/useEntityOperations';
import { OperationsFilters, SortField, SortDirection, EntityWithOrders, SavedSegment, RISK_REASON_LABELS } from '@/types/operations';
import type { RiskReason, SmartSegmentKey } from '@/types/operations';
import { filterBySmartSegment, useSmartSegmentCounts } from '@/hooks/useSmartSegments';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { OperationsFiltersBar } from '@/components/operations/OperationsFiltersBar';
import { EntityOperationsDetail } from '@/components/operations/EntityOperationsDetail';
import { useQueryClient } from '@tanstack/react-query';
import { useGeographyOptions } from '@/hooks/useGeographyOptions';
import { BulkImportDialog } from '@/components/operations/BulkImportDialog';
import { PipelineSummaryCards } from '@/components/operations/PipelineSummaryCards';
import { RiskAlertsCard } from '@/components/operations/RiskAlertsCard';
import {
  useSavedSegments,
  useCreateSavedSegment,
  useDeleteSavedSegment,
  useToggleFavoriteSegment,
} from '@/hooks/useSavedSegments';
import { useCreateEntityActivity } from '@/hooks/useEntityActivities';
import { toast } from 'sonner';
import type { EntityTypeKey } from '@/types/entity';
import { useEntityTypes, resolveEntityTypeLabel } from '@/hooks/useEntityTypes';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { getIndustrySmartSegmentLabels } from '@/lib/industry-templates';

interface Props {
  clientType?: EntityTypeKey;
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

export default function EntityOperations({ clientType = 'pharmacy' }: Props) {
  const [filters, setFilters] = useState<OperationsFilters>(initialFilters);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedPharmacy, setSelectedPharmacy] = useState<EntityWithOrders | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [pendingOpenPharmacyId, setPendingOpenPharmacyId] = useState<string | null>(null);
  const [smartSegment, setSmartSegment] = useState<SmartSegmentKey>('none');
  const { organization } = useCurrentOrganization();

  const { data: segments = [] } = useSavedSegments('operations');
  const { data: entityTypes = [] } = useEntityTypes();
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
  const { pharmacies = [], totalCount = 0, isLoading, refetch } = useEntityOperations(
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

  const smartFiltered = useMemo(
    () => filterBySmartSegment(displayedPharmacies, smartSegment),
    [displayedPharmacies, smartSegment],
  );

  const smartSegmentCounts = useSmartSegmentCounts(displayedPharmacies);
  const smartSegmentLabels = useMemo(
    () => getIndustrySmartSegmentLabels(organization?.industry_template_key),
    [organization?.industry_template_key],
  );
  const entityLabelSingular = resolveEntityTypeLabel(
    clientType,
    entityTypes,
    clientType === 'pharmacy' ? 'Pharmacy' : 'Herbalist',
  );
  const entityLabelPlural = entityLabelSingular.toLowerCase().endsWith('s')
    ? entityLabelSingular
    : `${entityLabelSingular}s`;

  const handleSmartSegmentChange = useCallback((key: SmartSegmentKey) => {
    setSmartSegment(key);
    setPage(0);
  }, []);

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
      setSmartSegment('none');
      setPage(0);
    } else {
      setSelectedSegmentId(null);
    }
  }, []);

  const handleSaveSegment = useCallback(async (name: string) => {
    try {
      await createSegment.mutateAsync({
        name,
        scope: 'operations',
        filters,
      });
      toast.success('Segment saved');
    } catch {
      toast.error('Failed to save segment');
    }
  }, [createSegment, filters]);

  const handleDeleteSegment = useCallback(async (id: string) => {
    try {
      await deleteSegment.mutateAsync({ id, scope: 'operations' });
      if (selectedSegmentId === id) setSelectedSegmentId(null);
    } catch {
      toast.error('Failed to delete segment');
    }
  }, [deleteSegment, selectedSegmentId]);

  const handleToggleFavorite = useCallback(async (id: string, current: boolean) => {
    try {
      await toggleFavorite.mutateAsync({ id, scope: 'operations', is_favorite: !current });
    } catch {
      toast.error('Failed to update favourite');
    }
  }, [toggleFavorite]);

  const createActivity = useCreateEntityActivity();

  const handleOpenFromAlert = useCallback((pharmacyId: string, pharmacyName: string) => {
    const found = smartFiltered.find((p) => p.id === pharmacyId)
      ?? pharmacies.find((p) => p.id === pharmacyId);
    if (found) {
      setSelectedPharmacy(found);
      setPendingOpenPharmacyId(null);
      return;
    }
    // Not in current dataset — search by name so the server returns the right page
    setPendingOpenPharmacyId(pharmacyId);
    setSmartSegment('none');
    setFilters({ ...initialFilters, search: pharmacyName });
    setPage(0);
  }, [smartFiltered, pharmacies]);

  useEffect(() => {
    if (!pendingOpenPharmacyId) return;
    const match = smartFiltered.find((p) => p.id === pendingOpenPharmacyId)
      ?? pharmacies.find((p) => p.id === pendingOpenPharmacyId);
    if (match) {
      setSelectedPharmacy(match);
      setPendingOpenPharmacyId(null);
    }
  }, [pendingOpenPharmacyId, smartFiltered, pharmacies]);

  const handleCreateFollowUpTask = useCallback(async (
    pharmacyId: string,
    pharmacyName: string,
    reasons: RiskReason[],
  ) => {
    const reasonText = reasons.map((r) => RISK_REASON_LABELS[r]).join(', ');
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 3);

    try {
      await createActivity.mutateAsync({
        pharmacyId,
        activityType: 'task',
        title: 'Follow-up: At-risk account',
        description: `Risk reasons: ${reasonText}.\nGenerated on ${new Date().toLocaleDateString()}.`,
        dueAt: dueAt.toISOString(),
      });
      toast.success(`Follow-up task created for ${pharmacyName}`);
    } catch {
      toast.error('Failed to create follow-up task');
    }
  }, [createActivity]);

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
    <div className="flex flex-col">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {clientType === 'pharmacy' ? (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Leaf className="h-5 w-5 text-muted-foreground" />
          )}
          <h1 className="font-semibold text-sm md:text-base truncate">
            {`Saved ${entityLabelPlural}`}
          </h1>
          {!showEmptyState && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded hidden sm:inline">
              {totalCount} {entityLabelPlural.toLowerCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <BulkImportDialog
            defaultClientType={clientType}
            industryTemplateKey={organization?.industry_template_key}
            onSuccess={handleRefresh}
          />
          <Link to={clientType === 'pharmacy' ? '/prospecting/entities' : '/prospecting/entities/herbalists'}>
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">{`Search ${entityLabelPlural}`}</span>
              <span className="md:hidden">Search</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="bg-muted rounded-full p-6 mb-6">
            {clientType === 'pharmacy' ? (
              <Building2 className="h-12 w-12 text-muted-foreground" />
            ) : (
              <Leaf className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {`No Saved ${entityLabelPlural}`}
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {`You haven't saved any ${entityLabelPlural.toLowerCase()} yet. Use Search ${entityLabelPlural} to discover and save them here for management.`}
          </p>
          <Link to={clientType === 'pharmacy' ? '/prospecting/entities' : '/prospecting/entities/herbalists'}>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              {`Go to Search ${entityLabelPlural}`}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Pipeline Summary + Risk Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 px-3 md:px-6 py-4 border-b border-border bg-muted/30">
            <PipelineSummaryCards />
            <RiskAlertsCard
              clientType={clientType}
              onOpenPharmacy={handleOpenFromAlert}
              onCreateFollowUpTask={handleCreateFollowUpTask}
            />
          </div>

          {/* Filters */}
          <OperationsFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={() => {
              setFilters(initialFilters);
              setSelectedSegmentId(null);
              setSmartSegment('none');
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
            smartSegment={smartSegment}
            onSmartSegmentChange={handleSmartSegmentChange}
            smartSegmentCounts={smartSegmentCounts}
            smartSegmentLabels={smartSegmentLabels}
          />

          {/* Main Content */}
          <div className="flex flex-col xl:flex-row items-start">
            {/* Table */}
            <div className="w-full flex-1 overflow-auto">
              <OperationsTable
                pharmacies={smartFiltered}
                isLoading={isLoading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectedPharmacyId={selectedPharmacy?.id || null}
                onSelectPharmacy={setSelectedPharmacy}
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 border-t border-border">
                <span className="text-xs sm:text-sm text-muted-foreground">
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
              <div className="w-full xl:w-[380px] 2xl:w-[420px] border-t xl:border-t-0 xl:border-l border-border bg-muted/50">
                <EntityOperationsDetail
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
