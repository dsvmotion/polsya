import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { styleAnalysisSchema, type StyleAnalysisFormValues } from '@/lib/creative-schemas';
import { useCreateStyleAnalysis, useUpdateStyleAnalysis } from '@/hooks/useStyleAnalyses';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import type { StyleAnalysis } from '@/types/style-intelligence';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface StyleAnalysisFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis?: StyleAnalysis;
  onSuccess?: () => void;
}

export function StyleAnalysisFormSheet({ open, onOpenChange, analysis, onSuccess }: StyleAnalysisFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateStyleAnalysis();
  const updateMutation = useUpdateStyleAnalysis();
  const { data: clients = [] } = useCreativeClients();
  const isEditing = !!analysis;

  const form = useForm<StyleAnalysisFormValues>({
    resolver: zodResolver(styleAnalysisSchema),
    defaultValues: {
      clientId: analysis?.clientId ?? undefined,
      portfolioId: analysis?.portfolioId ?? undefined,
      sourceUrl: analysis?.sourceUrl ?? '',
      colorPalette: analysis ? JSON.stringify(analysis.colorPalette, null, 2) : '',
      typographyProfile: analysis ? JSON.stringify(analysis.typographyProfile, null, 2) : '',
      brandAttributes: analysis ? JSON.stringify(analysis.brandAttributes, null, 2) : '',
    },
  });

  async function onSubmit(values: StyleAnalysisFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: analysis.id, values });
        toast({ title: 'Analysis updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Analysis created' });
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
          <SheetTitle>{isEditing ? 'Edit Analysis' : 'New Style Analysis'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update style analysis details.' : 'Create a new style analysis.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="sourceUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL</FormLabel>
                <FormControl><Input {...field} placeholder="https://example.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="colorPalette" render={({ field }) => (
              <FormItem>
                <FormLabel>Color Palette (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder='[{"hex": "#FF5733", "name": "Coral"}]' className="font-mono text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="typographyProfile" render={({ field }) => (
              <FormItem>
                <FormLabel>Typography Profile (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder='{"primaryFont": "Inter", "secondaryFont": "Georgia"}' className="font-mono text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="brandAttributes" render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Attributes (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder='{"tone": "professional", "style": "minimal"}' className="font-mono text-xs" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Analysis'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
