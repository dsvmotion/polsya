import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enrichmentRecipeSchema, type EnrichmentRecipeFormValues } from '@/lib/creative-schemas';
import { useCreateEnrichmentRecipe, useUpdateEnrichmentRecipe } from '@/hooks/useEnrichmentEngine';
import { RECIPE_TARGET_TYPES, RECIPE_TARGET_LABELS } from '@/types/enrichment-engine';
import type { EnrichmentRecipe } from '@/types/enrichment-engine';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface RecipeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: EnrichmentRecipe;
  onSuccess?: () => void;
}

export function RecipeFormSheet({ open, onOpenChange, recipe, onSuccess }: RecipeFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateEnrichmentRecipe();
  const updateMutation = useUpdateEnrichmentRecipe();
  const isEditing = !!recipe;

  const form = useForm<EnrichmentRecipeFormValues>({
    resolver: zodResolver(enrichmentRecipeSchema),
    defaultValues: {
      name: recipe?.name ?? '',
      description: recipe?.description ?? '',
      targetEntityType: recipe?.targetEntityType ?? 'client',
      steps: recipe ? JSON.stringify(recipe.steps, null, 2) : '',
      isActive: recipe?.isActive ?? true,
    },
  });

  async function onSubmit(values: EnrichmentRecipeFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: recipe.id, values });
        toast({ title: 'Recipe updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Recipe created' });
      }
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Recipe' : 'New Enrichment Recipe'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update recipe configuration.' : 'Define a new enrichment recipe.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input {...field} placeholder="Recipe name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Input {...field} placeholder="Brief description" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="targetEntityType" render={({ field }) => (
              <FormItem>
                <FormLabel>Target Entity Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {RECIPE_TARGET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{RECIPE_TARGET_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="steps" render={({ field }) => (
              <FormItem>
                <FormLabel>Steps (JSON) *</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} placeholder='[{"provider": "clearbit", "action": "enrich"}]' className="font-mono text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>Active</FormLabel>
                  <p className="text-xs text-muted-foreground">Enable or disable this recipe</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Recipe'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
