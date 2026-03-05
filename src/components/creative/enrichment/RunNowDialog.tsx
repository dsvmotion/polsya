import { useState } from 'react';
import { useTriggerEnrichmentRun } from '@/hooks/useEnrichmentEngine';
import { RECIPE_TARGET_TYPES, RECIPE_TARGET_LABELS } from '@/types/enrichment-engine';
import type { EnrichmentRecipe, RecipeTargetType } from '@/types/enrichment-engine';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface RunNowDialogProps {
  recipe: EnrichmentRecipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunNowDialog({ recipe, open, onOpenChange }: RunNowDialogProps) {
  const [entityType, setEntityType] = useState<RecipeTargetType>(recipe.targetEntityType);
  const [entityIdsInput, setEntityIdsInput] = useState('');
  const triggerRun = useTriggerEnrichmentRun();
  const { toast } = useToast();

  async function handleSubmit() {
    const entityIds = entityIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (entityIds.length === 0) {
      toast({ title: 'Validation error', description: 'Enter at least one entity ID.', variant: 'destructive' });
      return;
    }

    try {
      await triggerRun.mutateAsync({ recipeId: recipe.id, entityType, entityIds });
      toast({ title: 'Run triggered', description: `Processing ${entityIds.length} entities.` });
      onOpenChange(false);
      setEntityIdsInput('');
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run "{recipe.name}"</DialogTitle>
          <DialogDescription>Trigger an enrichment run for specific entities.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity Type</Label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as RecipeTargetType)}>
              <SelectTrigger id="entity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECIPE_TARGET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {RECIPE_TARGET_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-ids">Entity IDs (comma-separated)</Label>
            <Input
              id="entity-ids"
              placeholder="uuid-1, uuid-2, uuid-3"
              value={entityIdsInput}
              onChange={(e) => setEntityIdsInput(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={triggerRun.isPending}>
            {triggerRun.isPending ? 'Triggering...' : 'Run Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
