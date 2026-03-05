import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import {
  ViewSwitcher,
  TableViewSkeleton,
  CardsViewSkeleton,
  GraphViewSkeleton,
  MapViewSkeleton,
} from '@/components/creative/navigation/ViewSwitcher';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeOpportunities() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const viewContent: Record<ViewMode, React.ReactNode> = {
    table: <TableViewSkeleton />,
    cards: <CardsViewSkeleton />,
    graph: <GraphViewSkeleton />,
    map: <MapViewSkeleton />,
  };

  return (
    <WorkspaceContainer
      title="Opportunities"
      description="Pipeline of creative business opportunities"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher
            value={viewMode}
            onChange={setViewMode}
            availableViews={['table', 'cards']}
          />
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Opportunity</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewContent[viewMode]}
      </div>
    </WorkspaceContainer>
  );
}
