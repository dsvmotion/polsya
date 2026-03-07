import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { getOpportunityColumns } from '@/components/creative/opportunities/opportunity-columns';
import { OpportunityCard } from '@/components/creative/opportunities/OpportunityCard';
import { OpportunityFormSheet } from '@/components/creative/opportunities/OpportunityFormSheet';
import { OpportunityDetail } from '@/components/creative/opportunities/OpportunityDetail';
import { useCreativeOpportunities } from '@/hooks/useCreativeOpportunities';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { CreativeOpportunity } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';
import { KanbanBoard } from '@/components/creative/shared/KanbanBoard';
import type { KanbanColumn } from '@/components/creative/shared/KanbanBoard';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';
import { useUpdateCreativeOpportunity } from '@/hooks/useCreativeOpportunities';

export default function CreativeOpportunities() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: opportunities = [], isLoading } = useCreativeOpportunities();
  const { data: clients = [] } = useCreativeClients();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const columns = useMemo(() => getOpportunityColumns(clients), [clients]);

  const updateMutation = useUpdateCreativeOpportunity();

  const opportunityColumns: KanbanColumn[] = OPPORTUNITY_STAGES.map((stage) => ({
    key: stage,
    label: OPPORTUNITY_STAGE_LABELS[stage],
    color: OPPORTUNITY_STAGE_COLORS[stage],
  }));

  function handleRowClick(opportunity: CreativeOpportunity) {
    setContextPanelContent(
      <OpportunityDetail
        opportunity={opportunity}
        clientName={opportunity.clientId ? clientMap.get(opportunity.clientId) : undefined}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />
    );
    setContextPanelOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Opportunities"
      description="Pipeline of creative business opportunities"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards', 'board']} />
          <Button size="sm" className="gap-1.5 transition-all duration-150" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Opportunity</span>
          </Button>
        </div>
      }
    >
      <div className="mt-4">
        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={opportunities}
            isLoading={isLoading}
            searchKey="title"
            searchPlaceholder="Search opportunities..."
            onRowClick={handleRowClick}
          />
        ) : viewMode === 'board' ? (
          <KanbanBoard
            columns={opportunityColumns}
            items={opportunities}
            getColumnKey={(opp) => opp.stage}
            onMove={(id, newStage) => updateMutation.mutate({ id, values: { stage: newStage as OpportunityStage } })}
            isLoading={isLoading}
            renderCard={(opp) => (
              <div className="space-y-1.5" onClick={() => handleRowClick(opp)}>
                <p className="text-sm font-medium truncate">{opp.title}</p>
                {opp.clientId && clientMap.get(opp.clientId) && (
                  <p className="text-xs text-muted-foreground truncate">{clientMap.get(opp.clientId)}</p>
                )}
                <div className="flex items-center justify-between">
                  {opp.valueCents != null && (
                    <span className="text-xs font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: opp.currency ?? 'USD' }).format(opp.valueCents / 100)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                </div>
              </div>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse shadow-elevation-card">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  <div className="h-4 w-full bg-muted/40 rounded" />
                </div>
              ))
            ) : opportunities.length === 0 ? (
              <div className="col-span-full rounded-xl bg-muted/30 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No opportunities yet. Click "New Opportunity" to get started.
              </div>
            ) : (
              opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  clientName={opp.clientId ? clientMap.get(opp.clientId) : undefined}
                  onClick={() => handleRowClick(opp)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <OpportunityFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
