import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { portfolioColumns } from '@/components/creative/portfolios/portfolio-columns';
import { PortfolioCard } from '@/components/creative/portfolios/PortfolioCard';
import { PortfolioFormSheet } from '@/components/creative/portfolios/PortfolioFormSheet';
import { PortfolioDetail } from '@/components/creative/portfolios/PortfolioDetail';
import { useCreativePortfolios } from '@/hooks/useCreativePortfolios';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { CreativePortfolio } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativePortfolios() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [formOpen, setFormOpen] = useState(false);
  const { data: portfolios = [], isLoading } = useCreativePortfolios();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(portfolio: CreativePortfolio) {
    setContextPanelContent(
      <PortfolioDetail
        portfolio={portfolio}
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
      title="Portfolios"
      description="Showcase your creative work and visual samples"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['cards', 'table']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Portfolio</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={portfolioColumns}
            data={portfolios}
            isLoading={isLoading}
            searchKey="title"
            searchPlaceholder="Search portfolios..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted/60 rounded" />
                  </div>
                </div>
              ))
            ) : portfolios.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No portfolios yet. Click "Add Portfolio" to get started.
              </div>
            ) : (
              portfolios.map((portfolio) => (
                <PortfolioCard key={portfolio.id} portfolio={portfolio} onClick={() => handleRowClick(portfolio)} />
              ))
            )}
          </div>
        )}
      </div>

      <PortfolioFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
