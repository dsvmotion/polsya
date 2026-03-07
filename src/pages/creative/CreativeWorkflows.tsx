import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { WorkflowRuleCard } from '@/components/creative/workflows/WorkflowRuleCard';
import { WorkflowRuleFormSheet } from '@/components/creative/workflows/WorkflowRuleFormSheet';
import { useWorkflowRules } from '@/hooks/useWorkflowRules';
import type { WorkflowRule } from '@/types/creative-workflow';

export default function CreativeWorkflows() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<WorkflowRule | null>(null);
  const { data: rules = [], isLoading } = useWorkflowRules();

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
      <div className="flex justify-end mb-6 mt-2">
        <Button size="sm" className="gap-1.5" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          <span>Create Rule</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-sm animate-pulse">
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl bg-muted/30 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
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
