import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signalRuleSchema, type SignalRuleFormValues } from '@/lib/creative-schemas';
import { useCreateSignalRule, useUpdateSignalRule } from '@/hooks/useSignals';
import { RULE_TYPES, RULE_TYPE_LABELS } from '@/types/signal-engine';
import type { SignalRule } from '@/types/signal-engine';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface SignalRuleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: SignalRule;
  onSuccess?: () => void;
}

export function SignalRuleFormSheet({ open, onOpenChange, rule, onSuccess }: SignalRuleFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateSignalRule();
  const updateMutation = useUpdateSignalRule();
  const isEditing = !!rule;

  const form = useForm<SignalRuleFormValues>({
    resolver: zodResolver(signalRuleSchema),
    defaultValues: {
      name: rule?.name ?? '',
      description: rule?.description ?? '',
      ruleType: rule?.ruleType ?? 'custom',
      conditions: rule ? JSON.stringify(rule.conditions, null, 2) : '',
      actions: rule ? JSON.stringify(rule.actions, null, 2) : '',
      priority: rule?.priority ?? 0,
      isActive: rule?.isActive ?? true,
    },
  });

  async function onSubmit(values: SignalRuleFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: rule.id, values });
        toast({ title: 'Rule updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Rule created' });
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
          <SheetTitle>{isEditing ? 'Edit Rule' : 'New Signal Rule'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update rule configuration.' : 'Define a new signal rule.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input {...field} placeholder="Rule name" /></FormControl>
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

            <FormField control={form.control} name="ruleType" render={({ field }) => (
              <FormItem>
                <FormLabel>Rule Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {RULE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{RULE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="conditions" render={({ field }) => (
              <FormItem>
                <FormLabel>Conditions (JSON) *</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder='{"field": "value"}' className="font-mono text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="actions" render={({ field }) => (
              <FormItem>
                <FormLabel>Actions (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder='[{"type": "notify"}]' className="font-mono text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Input type="number" value={field.value} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>Active</FormLabel>
                  <p className="text-xs text-muted-foreground">Enable or disable this rule</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
