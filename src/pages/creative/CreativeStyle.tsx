import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { styleColumns } from '@/components/creative/style/style-columns';
import { StyleAnalysisCard } from '@/components/creative/style/StyleAnalysisCard';
import { StyleAnalysisFormSheet } from '@/components/creative/style/StyleAnalysisFormSheet';
import { StyleAnalysisDetail } from '@/components/creative/style/StyleAnalysisDetail';
import { StyleSimilarityResults } from '@/components/creative/style/StyleSimilarityResults';
import { useStyleAnalyses } from '@/hooks/useStyleAnalyses';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { StyleAnalysis } from '@/types/style-intelligence';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeStyle() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analyses');
  const [similarityAnalysisId, setSimilarityAnalysisId] = useState<string | null>(null);
  const { data: analyses = [], isLoading } = useStyleAnalyses();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleFindSimilar(id: string) {
    setSimilarityAnalysisId(id);
    setActiveTab('similarity');
  }

  function handleRowClick(analysis: StyleAnalysis) {
    setContextPanelContent(
      <StyleAnalysisDetail
        analysis={analysis}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
        onFindSimilar={handleFindSimilar}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="rounded-full bg-muted/60 p-1">
          <TabsTrigger value="analyses" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Analyses</TabsTrigger>
          <TabsTrigger value="similarity" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Similarity</TabsTrigger>
        </TabsList>

        <TabsContent value="analyses">
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
                  <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-pulse">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  </div>
                ))
              ) : analyses.length === 0 ? (
                <div className="col-span-full rounded-xl bg-muted/30 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No analyses yet. Click "Add Analysis" to get started.
                </div>
              ) : (
                analyses.map((analysis) => (
                  <StyleAnalysisCard key={analysis.id} analysis={analysis} onClick={() => handleRowClick(analysis)} />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="similarity">
          <StyleSimilarityResults analysisId={similarityAnalysisId} />
        </TabsContent>
      </Tabs>

      <StyleAnalysisFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
