import { useState } from 'react';
import type { CreativeOpportunity } from '@/types/creative';
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import { useDeleteCreativeOpportunity } from '@/hooks/useCreativeOpportunities';
import { OpportunityFormSheet } from './OpportunityFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, DollarSign, Target, Calendar, Clock } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { ActivityTimeline } from '@/components/creative/shared/ActivityTimeline';
import { ActivityFormSheet } from '@/components/creative/shared/ActivityFormSheet';
import { useCreativeActivities } from '@/hooks/useCreativeActivities';
import { getErrorMessage } from '@/lib/utils';

interface OpportunityDetailProps {
  opportunity: CreativeOpportunity;
  clientName?: string;
  onClose: () => void;
}

export function OpportunityDetail({ opportunity, clientName, onClose }: OpportunityDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeOpportunity();
  const { toast } = useToast();
  const stageColors = OPPORTUNITY_STAGE_COLORS[opportunity.stage];
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const { data: activities = [], isLoading: activitiesLoading } = useCreativeActivities('opportunity', opportunity.id);

  const value = opportunity.valueCents != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: opportunity.currency ?? 'USD' }).format(opportunity.valueCents / 100)
    : null;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(opportunity.id);
      toast({ title: 'Opportunity deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{opportunity.title}</h2>
          {clientName && <p className="text-sm text-muted-foreground">{clientName}</p>}
          <Badge variant="secondary" className={`${stageColors.bg} ${stageColors.text} border-0 mt-1`}>
            {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
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
                <AlertDialogTitle>Delete opportunity?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{opportunity.title}" and cannot be undone.
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
        {value && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{value}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span>Probability: {opportunity.probability}%</span>
        </div>
        {opportunity.expectedCloseDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Expected close: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
          </div>
        )}
        {opportunity.source && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Source:</span>
            <span>{opportunity.source}</span>
          </div>
        )}
        {opportunity.lostReason && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Lost reason:</span>
            <span>{opportunity.lostReason}</span>
          </div>
        )}
      </div>

      {opportunity.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
        </div>
      )}

      {opportunity.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {opportunity.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Engine sections */}
      <div className="space-y-1">
        <CollapsibleEngineSection icon={Clock} label="Activities" count={activities.length} isLoading={activitiesLoading} defaultOpen>
          <ActivityTimeline entityType="opportunity" entityId={opportunity.id} onAddClick={() => setActivityFormOpen(true)} />
        </CollapsibleEngineSection>
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(opportunity.createdAt).toLocaleDateString()}
      </div>

      <OpportunityFormSheet open={editOpen} onOpenChange={setEditOpen} opportunity={opportunity} />
      <ActivityFormSheet open={activityFormOpen} onOpenChange={setActivityFormOpen} entityType="opportunity" entityId={opportunity.id} />
    </div>
  );
}
