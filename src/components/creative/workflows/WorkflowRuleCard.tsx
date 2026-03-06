import { GitBranch, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToggleRule, useDeleteRule } from '@/hooks/useWorkflowRules';
import { TRIGGER_ENTITY_LABELS, TRIGGER_EVENT_LABELS, ACTION_TYPE_LABELS } from '@/types/creative-workflow';
import type { WorkflowRule } from '@/types/creative-workflow';

interface WorkflowRuleCardProps {
  rule: WorkflowRule;
  onEdit: (rule: WorkflowRule) => void;
}

export function WorkflowRuleCard({ rule, onEdit }: WorkflowRuleCardProps) {
  const toggleMutation = useToggleRule();
  const deleteMutation = useDeleteRule();

  const triggerSummary = `When ${TRIGGER_ENTITY_LABELS[rule.triggerEntity]} ${TRIGGER_EVENT_LABELS[rule.triggerEvent].toLowerCase()}${
    rule.triggerCondition.to ? ` to "${rule.triggerCondition.to}"` : ''
  }`;

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-100 shrink-0">
              <GitBranch className="h-4 w-4 text-purple-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{rule.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{triggerSummary}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {rule.actions.map((action, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {ACTION_TYPE_LABELS[action.type]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={rule.isActive}
              onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(rule)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              onClick={() => deleteMutation.mutate(rule.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
