import { useState, useMemo } from 'react';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { getProjectColumns } from '@/components/creative/projects/project-columns';
import { ProjectCard } from '@/components/creative/projects/ProjectCard';
import { ProjectFormSheet } from '@/components/creative/projects/ProjectFormSheet';
import { ProjectDetail } from '@/components/creative/projects/ProjectDetail';
import { useCreativeProjects } from '@/hooks/useCreativeProjects';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import { useCreativeLayout } from '@/components/creative/layout/useCreativeLayout';
import type { CreativeProject } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';
import { KanbanBoard } from '@/components/creative/shared/KanbanBoard';
import type { KanbanColumn } from '@/components/creative/shared/KanbanBoard';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/creative';
import type { ProjectStatus } from '@/types/creative';
import { useUpdateCreativeProject } from '@/hooks/useCreativeProjects';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';

export default function CreativeProjects() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: projects = [], isLoading, error, refetch } = useCreativeProjects();
  const { toast } = useToast();
  const { data: clients = [] } = useCreativeClients();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const columns = useMemo(() => getProjectColumns(clients), [clients]);

  const updateMutation = useUpdateCreativeProject();

  const projectColumns: KanbanColumn[] = PROJECT_STATUSES.map((status) => ({
    key: status,
    label: PROJECT_STATUS_LABELS[status],
    color: PROJECT_STATUS_COLORS[status],
  }));

  function handleRowClick(project: CreativeProject) {
    setContextPanelContent(
      <ProjectDetail
        project={project}
        clientName={project.clientId ? clientMap.get(project.clientId) : undefined}
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
      title="Projects"
      description="Track creative projects and deliverables"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards', 'board']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
          <AlertCircle className="h-8 w-8 opacity-60" />
          <p>Failed to load projects: {getErrorMessage(error)}</p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : (
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={projects}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="Search projects..."
            onRowClick={handleRowClick}
          />
        ) : viewMode === 'board' ? (
          <KanbanBoard
            columns={projectColumns}
            items={projects}
            getColumnKey={(p) => p.status}
            onMove={(id, newStatus) => updateMutation.mutate(
              { id, values: { status: newStatus as ProjectStatus } },
              { onError: (err) => toast({ title: 'Failed to move project', description: getErrorMessage(err), variant: 'destructive' }) },
            )}
            isLoading={isLoading}
            renderCard={(project) => (
              <div className="space-y-1.5" role="button" tabIndex={0} onClick={() => handleRowClick(project)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(project); } }}>
                <p className="text-sm font-medium truncate">{project.name}</p>
                {project.clientId && clientMap.get(project.clientId) && (
                  <p className="text-xs text-muted-foreground truncate">{clientMap.get(project.clientId)}</p>
                )}
                <div className="flex items-center justify-between">
                  {project.projectType && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{project.projectType}</span>
                  )}
                  {project.budgetCents != null && (
                    <span className="text-xs font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency ?? 'USD' }).format(project.budgetCents / 100)}
                    </span>
                  )}
                </div>
              </div>
            )}
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
            ) : projects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No projects yet. Click "New Project" to get started.
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  clientName={project.clientId ? clientMap.get(project.clientId) : undefined}
                  onClick={() => handleRowClick(project)}
                />
              ))
            )}
          </div>
        )}
      </div>
      )}

      <ProjectFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
