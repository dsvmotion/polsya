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

export default function CreativeClients() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const viewContent: Record<ViewMode, React.ReactNode> = {
    table: <TableViewSkeleton />,
    cards: <CardsViewSkeleton />,
    graph: <GraphViewSkeleton />,
    map: <MapViewSkeleton />,
  };

  return (
    <WorkspaceContainer
      title="Clients"
      description="Manage your creative clients and relationships"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} />
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Client</span>
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
