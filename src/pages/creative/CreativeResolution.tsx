import { useState, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { useCreativeLayout } from '@/components/creative/layout/useCreativeLayout';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { createCandidateColumns } from '@/components/creative/resolution/candidate-columns';
import { mappingColumns } from '@/components/creative/resolution/mapping-columns';
import { CandidateCard } from '@/components/creative/resolution/CandidateCard';
import { CandidateDetail } from '@/components/creative/resolution/CandidateDetail';
import { useResolutionCandidates, useResolveCandidate, useEntitySourceMappings } from '@/hooks/useEntityResolution';
import { RESOLUTION_STATUSES, RESOLUTION_STATUS_LABELS } from '@/types/entity-resolution';
import type { ResolutionCandidate, ResolutionStatus } from '@/types/entity-resolution';
import type { ViewMode } from '@/lib/design-tokens';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

export default function CreativeResolution() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  const resolveMutation = useResolveCandidate();
  const { toast } = useToast();

  function handleCandidateClick(candidate: ResolutionCandidate) {
    setContextPanelContent(
      <CandidateDetail
        candidate={candidate}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />
    );
    setContextPanelOpen(true);
  }

  const { data: candidates = [], isLoading: candidatesLoading, error: candidatesError, refetch: refetchCandidates } = useResolutionCandidates(
    statusFilter !== 'all' ? (statusFilter as ResolutionStatus) : undefined
  );
  const { data: mappings = [], isLoading: mappingsLoading, error: mappingsError, refetch: refetchMappings } = useEntitySourceMappings();

  const candidateColumns = useMemo(
    () => createCandidateColumns((id, status) => resolveMutation.mutate(
      { id, status },
      { onError: (err) => toast({ title: 'Failed to resolve candidate', description: getErrorMessage(err), variant: 'destructive' }) },
    )),
    [resolveMutation, toast]
  );

  return (
    <WorkspaceContainer
      title="Entity Resolution"
      description="Resolve duplicate entities and manage source mappings"
    >
      <Tabs defaultValue="candidates" className="mt-2">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="mappings">Source Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {RESOLUTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{RESOLUTION_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards']} />
          </div>

          {candidatesError ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
              <AlertCircle className="h-8 w-8 opacity-60" />
              <p>Failed to load candidates: {getErrorMessage(candidatesError)}</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetchCandidates()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <DataTable
              columns={candidateColumns}
              data={candidates}
              isLoading={candidatesLoading}
              searchKey="entityAType"
              searchPlaceholder="Search candidates..."
              onRowClick={handleCandidateClick}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidatesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                    <div className="h-5 w-1/2 bg-muted rounded" />
                    <div className="h-12 w-full bg-muted/60 rounded" />
                    <div className="h-4 w-3/4 bg-muted/40 rounded" />
                  </div>
                ))
              ) : candidates.length === 0 ? (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                  No resolution candidates found.
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div key={candidate.id} className="cursor-pointer" onClick={() => handleCandidateClick(candidate)}>
                    <CandidateCard candidate={candidate} />
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mappings" className="mt-4">
          {mappingsError ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
              <AlertCircle className="h-8 w-8 opacity-60" />
              <p>Failed to load source mappings: {getErrorMessage(mappingsError)}</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetchMappings()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : (
          <DataTable
            columns={mappingColumns}
            data={mappings}
            isLoading={mappingsLoading}
            searchKey="sourceProvider"
            searchPlaceholder="Search mappings..."
          />
          )}
        </TabsContent>
      </Tabs>
    </WorkspaceContainer>
  );
}
