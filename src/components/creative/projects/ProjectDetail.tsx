import { useState } from 'react';
import type { CreativeProject } from '@/types/creative';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/creative';
import { useDeleteCreativeProject } from '@/hooks/useCreativeProjects';
import { ProjectFormSheet } from './ProjectFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Calendar, DollarSign, Clock } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { ActivityTimeline } from '@/components/creative/shared/ActivityTimeline';
import { ActivityFormSheet } from '@/components/creative/shared/ActivityFormSheet';
import { useCreativeActivities } from '@/hooks/useCreativeActivities';
import { getErrorMessage } from '@/lib/utils';

interface ProjectDetailProps {
  project: CreativeProject;
  clientName?: string;
  onClose: () => void;
}

export function ProjectDetail({ project, clientName, onClose }: ProjectDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeProject();
  const { toast } = useToast();
  const statusColors = PROJECT_STATUS_COLORS[project.status];
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const { data: activities = [], isLoading: activitiesLoading } = useCreativeActivities('project', project.id);

  const budget = project.budgetCents != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency ?? 'USD' }).format(project.budgetCents / 100)
    : null;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(project.id);
      toast({ title: 'Project deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{project.name}</h2>
          {clientName && <p className="text-sm text-muted-foreground">{clientName}</p>}
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 mt-1`}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{project.name}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {project.projectType && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Type:</span>
            <span>{project.projectType}</span>
          </div>
        )}
        {project.startDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(project.startDate).toLocaleDateString()}
              {project.endDate ? ` — ${new Date(project.endDate).toLocaleDateString()}` : ''}
            </span>
          </div>
        )}
        {budget && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{budget}</span>
          </div>
        )}
      </div>

      {project.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {project.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Engine sections */}
      <div className="space-y-1">
        <CollapsibleEngineSection icon={Clock} label="Activities" count={activities.length} isLoading={activitiesLoading} defaultOpen>
          <ActivityTimeline entityType="project" entityId={project.id} onAddClick={() => setActivityFormOpen(true)} />
        </CollapsibleEngineSection>
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(project.createdAt).toLocaleDateString()}
      </div>

      <ProjectFormSheet open={editOpen} onOpenChange={setEditOpen} project={project} />
      <ActivityFormSheet open={activityFormOpen} onOpenChange={setActivityFormOpen} entityType="project" entityId={project.id} />
    </div>
  );
}
