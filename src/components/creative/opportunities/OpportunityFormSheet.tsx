import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { opportunitySchema, type OpportunityFormValues } from '@/lib/creative-schemas';
import { useCreateCreativeOpportunity, useUpdateCreativeOpportunity } from '@/hooks/useCreativeOpportunities';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import type { CreativeOpportunity } from '@/types/creative';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface OpportunityFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: CreativeOpportunity;
  onSuccess?: () => void;
}

export function OpportunityFormSheet({ open, onOpenChange, opportunity, onSuccess }: OpportunityFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateCreativeOpportunity();
  const updateMutation = useUpdateCreativeOpportunity();
  const { data: clients = [] } = useCreativeClients();
  const isEditing = !!opportunity;

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: opportunity?.title ?? '',
      clientId: opportunity?.clientId ?? '',
      contactId: opportunity?.contactId ?? undefined,
      stage: opportunity?.stage ?? 'lead',
      valueCents: opportunity?.valueCents ?? undefined,
      currency: opportunity?.currency ?? 'USD',
      probability: opportunity?.probability ?? 0,
      expectedCloseDate: opportunity?.expectedCloseDate ?? '',
      description: opportunity?.description ?? '',
      source: opportunity?.source ?? '',
    },
  });

  async function onSubmit(values: OpportunityFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: opportunity.id, values });
        toast({ title: 'Opportunity updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Opportunity created' });
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
          <SheetTitle>{isEditing ? 'Edit Opportunity' : 'New Opportunity'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update opportunity details.' : 'Add a new pipeline opportunity.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input {...field} placeholder="Opportunity title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Client *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="stage" render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="valueCents" render={({ field }) => (
                <FormItem>
                  <FormLabel>Value (cents)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl><Input {...field} placeholder="USD" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="probability" render={({ field }) => (
                <FormItem>
                  <FormLabel>Probability (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="expectedCloseDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Close</FormLabel>
                  <FormControl><Input {...field} type="date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. Referral, Website" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} rows={3} placeholder="Opportunity details..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Opportunity'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
