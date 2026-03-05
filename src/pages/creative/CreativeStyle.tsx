import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { styleColumns } from '@/components/creative/style/style-columns';
import { StyleAnalysisCard } from '@/components/creative/style/StyleAnalysisCard';
import { StyleAnalysisFormSheet } from '@/components/creative/style/StyleAnalysisFormSheet';
import { StyleAnalysisDetail } from '@/components/creative/style/StyleAnalysisDetail';
import { useStyleAnalyses } from '@/hooks/useStyleAnalyses';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { StyleAnalysis } from '@/types/style-intelligence';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeStyle() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: analyses = [], isLoading } = useStyleAnalyses();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(analysis: StyleAnalysis) {
    setContextPanelContent(
      <StyleAnalysisDetail
        analysis={analysis}
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
      title="Style Intelligence"
      description="Analyze and compare visual styles across clients"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Analysis</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={styleColumns}
            data={analyses}
            isLoading={isLoading}
            searchKey="sourceUrl"
            searchPlaceholder="Search analyses..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                </div>
              ))
            ) : analyses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No analyses yet. Click "Add Analysis" to get started.
              </div>
            ) : (
              analyses.map((analysis) => (
                <StyleAnalysisCard key={analysis.id} analysis={analysis} onClick={() => handleRowClick(analysis)} />
              ))
            )}
          </div>
        )}
      </div>

      <StyleAnalysisFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
