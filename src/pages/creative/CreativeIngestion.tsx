import { useState } from 'react';
import { Plus, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { useIngestionProviders, useIngestionRuns, useIngestionJobs, useTriggerIngestionRun, useUpdateIngestionProvider, useCreateIngestionProvider, useDeleteIngestionProvider } from '@/hooks/useIngestion';
import { PROVIDER_TYPE_LABELS } from '@/types/ingestion';
import { RUN_STATUS_LABELS, RUN_STATUS_COLORS } from '@/types/ingestion';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/types/ingestion';
import type { IngestionProvider, IngestionRun } from '@/types/ingestion';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PROVIDER_TYPES } from '@/types/ingestion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

// ─── Provider Form ──────────────────────────

function ProviderFormSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('');
  const createMutation = useCreateIngestionProvider();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !providerType) return;
    try {
      await createMutation.mutateAsync({ name, providerType });
      toast({ title: 'Provider created' });
      onOpenChange(false);
      setName('');
      setProviderType('');
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Provider</SheetTitle>
          <SheetDescription>Configure a new data source for ingestion.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My LinkedIn Feed" className="mt-1" />
          </div>
          <div>
            <Label>Provider Type *</Label>
            <Select value={providerType} onValueChange={setProviderType}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>{PROVIDER_TYPE_LABELS[pt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !name || !providerType}>Create Provider</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Provider Card ──────────────────────────

function ProviderCard({ provider }: { provider: IngestionProvider }) {
  const updateMutation = useUpdateIngestionProvider();
  const deleteMutation = useDeleteIngestionProvider();
  const triggerMutation = useTriggerIngestionRun();
  const { toast } = useToast();

  async function handleToggle(checked: boolean) {
    try {
      await updateMutation.mutateAsync({ id: provider.id, values: { isActive: checked } });
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await triggerMutation.mutateAsync(provider.id);
      toast({ title: 'Sync triggered', description: `Started ingestion run for ${provider.name}` });
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(provider.id);
      toast({ title: 'Provider deleted' });
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{provider.name}</h3>
          <Badge variant="outline" className="text-xs mt-1">
            {PROVIDER_TYPE_LABELS[provider.providerType] ?? provider.providerType}
          </Badge>
        </div>
        <Switch checked={provider.isActive} onCheckedChange={handleToggle} />
      </div>
      {provider.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last sync: {new Date(provider.lastSyncAt).toLocaleString()}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1" onClick={handleSync} disabled={!provider.isActive || triggerMutation.isPending}>
          <Play className="h-3.5 w-3.5" />
          Sync Now
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete provider?</AlertDialogTitle>
              <AlertDialogDescription>This will delete "{provider.name}" and all its run history.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Run Row (expandable) ───────────────────

function RunRow({ run, providerName }: { run: IngestionRun; providerName: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: jobs = [] } = useIngestionJobs(expanded ? run.id : null);
  const statusColors = RUN_STATUS_COLORS[run.status];
  const duration = run.startedAt && run.completedAt
    ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
    : '—';

  return (
    <div className="border rounded-lg">
      <button
        className="w-full flex items-center gap-4 p-3 text-sm hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0`}>
          {RUN_STATUS_LABELS[run.status]}
        </Badge>
        <span className="font-medium truncate">{providerName}</span>
        <span className="text-muted-foreground text-xs ml-auto shrink-0">{duration}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {run.recordsProcessed} processed · {run.recordsCreated} new · {run.recordsFailed} failed
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(run.createdAt).toLocaleString()}
        </span>
      </button>
      {expanded && (
        <div className="border-t p-3 space-y-2 bg-muted/20">
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No jobs for this run.</p>
          ) : (
            jobs.map((job) => {
              const jColors = JOB_STATUS_COLORS[job.status];
              return (
                <div key={job.id} className="flex items-center gap-3 text-xs p-2 rounded bg-background border">
                  <Badge variant="secondary" className={`${jColors.bg} ${jColors.text} border-0 text-xs`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </Badge>
                  <span className="font-medium">{job.jobType}</span>
                  <span className="text-muted-foreground">Attempt {job.attempts}/{job.maxAttempts}</span>
                  {job.errorMessage && (
                    <span className="text-destructive truncate ml-auto">{job.errorMessage}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────

export default function CreativeIngestion() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: providers = [], isLoading: loadingProviders, error: providersError, refetch: refetchProviders } = useIngestionProviders();
  const { data: runs = [], isLoading: loadingRuns, error: runsError, refetch: refetchRuns } = useIngestionRuns();

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]));

  return (
    <WorkspaceContainer
      title="Ingestion Engine"
      description="Connect external data sources and monitor sync runs"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Provider</span>
        </Button>
      }
    >
      <Tabs defaultValue="providers" className="mt-2">
        <TabsList>
          <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="runs">Run History ({runs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-4">
          {providersError ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
              <AlertCircle className="h-8 w-8 opacity-60" />
              <p>Failed to load providers: {getErrorMessage(providersError)}</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetchProviders()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : loadingProviders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No providers configured. Click "Add Provider" to connect a data source.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          {runsError ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
              <AlertCircle className="h-8 w-8 opacity-60" />
              <p>Failed to load run history: {getErrorMessage(runsError)}</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetchRuns()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : loadingRuns ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No runs yet. Trigger a sync from the Providers tab.
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <RunRow key={run.id} run={run} providerName={providerMap[run.providerId] ?? 'Unknown'} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProviderFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
