import { useState } from 'react';
import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { useDeleteCreativeClient } from '@/hooks/useCreativeClients';
import { ClientFormSheet } from './ClientFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Globe, Building2, Zap, Palette, GitMerge, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useSignals } from '@/hooks/useSignals';
import { useStyleAnalyses } from '@/hooks/useStyleAnalyses';
import { useResolutionCandidatesForEntity } from '@/hooks/useEntityResolution';
import { SIGNAL_SEVERITY_COLORS } from '@/types/signal-engine';
import { ActivityTimeline } from '@/components/creative/shared/ActivityTimeline';
import { ActivityFormSheet } from '@/components/creative/shared/ActivityFormSheet';
import { useCreativeActivities } from '@/hooks/useCreativeActivities';
import { getErrorMessage } from '@/lib/utils';

interface ClientDetailProps {
  client: CreativeClient;
  onClose: () => void;
}

export function ClientDetail({ client, onClose }: ClientDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeClient();
  const { toast } = useToast();
  const statusColors = CLIENT_STATUS_COLORS[client.status];
  const { data: signals = [], isLoading: signalsLoading } = useSignals({ entityType: 'client', entityId: client.id });
  const { data: analyses = [], isLoading: analysesLoading } = useStyleAnalyses(client.id);
  const { data: candidates = [], isLoading: candidatesLoading } = useResolutionCandidatesForEntity('client', client.id);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const { data: activities = [], isLoading: activitiesLoading } = useCreativeActivities('client', client.id);

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(client.id);
      toast({ title: 'Client deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{client.name}</h2>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 mt-1`}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)} aria-label="Edit client">
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Delete client">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{client.name}" and cannot be undone.
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

      {/* Info */}
      <div className="space-y-3 text-sm">
        {client.industry && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.industry}{client.subIndustry ? ` · ${client.subIndustry}` : ''}</span>
          </div>
        )}
        {client.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{client.website}</a>
          </div>
        )}
        {client.sizeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Size:</span>
            <span>{CLIENT_SIZE_LABELS[client.sizeCategory]}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {client.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.description}</p>
        </div>
      )}

      {/* Tags */}
      {client.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Engine sections */}
      <div className="space-y-1">
        <CollapsibleEngineSection icon={Clock} label="Activities" count={activities.length} isLoading={activitiesLoading} defaultOpen>
          <ActivityTimeline
            entityType="client"
            entityId={client.id}
            onAddClick={() => setActivityFormOpen(true)}
          />
        </CollapsibleEngineSection>

        <CollapsibleEngineSection icon={Zap} label="Signals" count={signals.length} isLoading={signalsLoading}>
          {signals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No signals for this client.</p>
          ) : (
            <div className="space-y-1">
              {signals.slice(0, 5).map((s) => {
                const sevColors = SIGNAL_SEVERITY_COLORS[s.severity];
                return (
                  <Link key={s.id} to="/creative/signals" className="flex items-center gap-2 py-1 text-sm hover:text-foreground text-muted-foreground">
                    <div className={`h-2 w-2 rounded-full ${sevColors.bg}`} />
                    <span className="truncate flex-1">{s.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </CollapsibleEngineSection>

        <CollapsibleEngineSection icon={Palette} label="Style Analyses" count={analyses.length} isLoading={analysesLoading}>
          {analyses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No style analyses for this client.</p>
          ) : (
            <div className="space-y-2">
              {analyses.slice(0, 3).map((a) => (
                <Link key={a.id} to="/creative/style" className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-1">
                  <div className="flex gap-0.5">
                    {(a.colorPalette ?? []).slice(0, 4).map((swatch) => (
                      <div key={swatch.hex} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: swatch.hex }} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{a.confidenceScore ? `${a.confidenceScore}%` : '--'}</span>
                </Link>
              ))}
            </div>
          )}
        </CollapsibleEngineSection>

        <CollapsibleEngineSection icon={GitMerge} label="Resolution Candidates" count={candidates.length} isLoading={candidatesLoading}>
          {candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No resolution candidates.</p>
          ) : (
            <div className="space-y-1">
              {candidates.slice(0, 3).map((c) => (
                <Link key={c.id} to="/creative/resolution" className="flex items-center justify-between py-1 text-sm hover:text-foreground text-muted-foreground">
                  <span className="capitalize">{c.entityAType} vs {c.entityBType}</span>
                  <span className="text-xs">{Math.round(c.confidenceScore * 100)}%</span>
                </Link>
              ))}
            </div>
          )}
        </CollapsibleEngineSection>
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(client.createdAt).toLocaleDateString()}
      </div>

      <ClientFormSheet open={editOpen} onOpenChange={setEditOpen} client={client} />
      <ActivityFormSheet open={activityFormOpen} onOpenChange={setActivityFormOpen} entityType="client" entityId={client.id} />
    </div>
  );
}
