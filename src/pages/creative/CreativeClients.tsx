import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { clientColumns } from '@/components/creative/clients/client-columns';
import { ClientCard } from '@/components/creative/clients/ClientCard';
import { ClientFormSheet } from '@/components/creative/clients/ClientFormSheet';
import { ClientDetail } from '@/components/creative/clients/ClientDetail';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { CreativeClient } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeClients() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: clients = [], isLoading } = useCreativeClients();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(client: CreativeClient) {
    setContextPanelContent(
      <ClientDetail
        client={client}
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
      title="Clients"
      description="Manage your creative clients and relationships"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Client</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={clientColumns}
            data={clients}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="Search clients..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  <div className="h-4 w-full bg-muted/40 rounded" />
                </div>
              ))
            ) : clients.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No clients yet. Click "Add Client" to get started.
              </div>
            ) : (
              clients.map((client) => (
                <ClientCard key={client.id} client={client} onClick={() => handleRowClick(client)} />
              ))
            )}
          </div>
        )}
      </div>

      <ClientFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
