import { useState } from 'react';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { WorkflowRuleCard } from '@/components/creative/workflows/WorkflowRuleCard';
import { WorkflowRuleFormSheet } from '@/components/creative/workflows/WorkflowRuleFormSheet';
import { useWorkflowRules } from '@/hooks/useWorkflowRules';
import type { WorkflowRule } from '@/types/creative-workflow';
import { getErrorMessage } from '@/lib/utils';

export default function CreativeWorkflows() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<WorkflowRule | null>(null);
  const { data: rules = [], isLoading, error, refetch } = useWorkflowRules();

  function handleEdit(rule: WorkflowRule) {
    setEditRule(rule);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditRule(null);
    setFormOpen(true);
  }

  function handleSheetClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditRule(null);
  }

  return (
    <WorkspaceContainer
      title="Workflow Automation"
      description="Configure rules to automate actions when entities change"
    >
      <div className="flex justify-end mb-4 mt-2">
        <Button size="sm" className="gap-1.5" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          <span>Create Rule</span>
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
          <AlertCircle className="h-8 w-8 opacity-60" />
          <p>Failed to load workflow rules: {getErrorMessage(error)}</p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No workflow rules configured yet. Create your first rule to automate actions.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <WorkflowRuleCard key={rule.id} rule={rule} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <WorkflowRuleFormSheet open={formOpen} onOpenChange={handleSheetClose} editRule={editRule} />
    </WorkspaceContainer>
  );
}
