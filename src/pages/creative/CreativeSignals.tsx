import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { useCreativeLayout } from '@/components/creative/layout/creative-layout-context';
import { DataTable } from '@/components/creative/shared/DataTable';
import { ruleColumns } from '@/components/creative/signals/rule-columns';
import { SignalCard } from '@/components/creative/signals/SignalCard';
import { SignalDetail } from '@/components/creative/signals/SignalDetail';
import { SignalRuleFormSheet } from '@/components/creative/signals/SignalRuleFormSheet';
import { useSignalRules, useSignals } from '@/hooks/useSignals';
import { SIGNAL_SEVERITIES, SIGNAL_SEVERITY_LABELS, SIGNAL_STATUSES, SIGNAL_STATUS_LABELS } from '@/types/signal-engine';
import type { Signal, SignalStatus } from '@/types/signal-engine';

export default function CreativeSignals() {
  const [formOpen, setFormOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  const { data: rules = [], isLoading: rulesLoading } = useSignalRules();
  const { data: signals = [], isLoading: signalsLoading } = useSignals({
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    status: (statusFilter !== 'all' ? statusFilter : undefined) as SignalStatus | undefined,
  });

  function handleSignalClick(signal: Signal) {
    setContextPanelContent(
      <SignalDetail
        signal={signal}
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
      title="Signal Engine"
      description="Monitor rules and respond to signals"
    >
      <Tabs defaultValue="feed" className="mt-2">
        <TabsList className="rounded-full bg-muted/60 p-1">
          <TabsTrigger value="feed" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Signal Feed</TabsTrigger>
          <TabsTrigger value="rules" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
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
          <div className="space-y-4">
            {signalsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 shadow-sm animate-pulse">
                  <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-3 w-1/2 bg-muted/60 rounded" />
                </div>
              ))
            ) : signals.length === 0 ? (
              <div className="rounded-xl bg-muted/30 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No signals found. Signals will appear here when rules are triggered.
              </div>
            ) : (
              signals.map((signal) => (
                <div key={signal.id} className="cursor-pointer" onClick={() => handleSignalClick(signal)}>
                  <SignalCard signal={signal} />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <div className="flex justify-end mb-6">
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
