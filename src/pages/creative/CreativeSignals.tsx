import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { DataTable } from '@/components/creative/shared/DataTable';
import { ruleColumns } from '@/components/creative/signals/rule-columns';
import { SignalCard } from '@/components/creative/signals/SignalCard';
import { SignalRuleFormSheet } from '@/components/creative/signals/SignalRuleFormSheet';
import { useSignalRules, useSignals } from '@/hooks/useSignals';
import { SIGNAL_SEVERITIES, SIGNAL_SEVERITY_LABELS, SIGNAL_STATUSES, SIGNAL_STATUS_LABELS } from '@/types/signal-engine';
import type { SignalStatus } from '@/types/signal-engine';

export default function CreativeSignals() {
  const [formOpen, setFormOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: rules = [], isLoading: rulesLoading } = useSignalRules();
  const { data: signals = [], isLoading: signalsLoading } = useSignals({
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    status: (statusFilter !== 'all' ? statusFilter : undefined) as SignalStatus | undefined,
  });

  return (
    <WorkspaceContainer
      title="Signal Engine"
      description="Monitor rules and respond to signals"
    >
      <Tabs defaultValue="feed" className="mt-2">
        <TabsList>
          <TabsTrigger value="feed">Signal Feed</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {SIGNAL_SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>{SIGNAL_SEVERITY_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {SIGNAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{SIGNAL_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Signal list */}
          <div className="space-y-2">
            {signalsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
                  <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-3 w-1/2 bg-muted/60 rounded" />
                </div>
              ))
            ) : signals.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No signals found. Signals will appear here when rules are triggered.
              </div>
            ) : (
              signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </Button>
          </div>
          <DataTable
            columns={ruleColumns}
            data={rules}
            isLoading={rulesLoading}
            searchKey="name"
            searchPlaceholder="Search rules..."
          />
        </TabsContent>
      </Tabs>

      <SignalRuleFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
