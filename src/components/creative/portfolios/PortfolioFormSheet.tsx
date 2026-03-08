import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { portfolioSchema, type PortfolioFormValues } from '@/lib/creative-schemas';
import { useCreateCreativePortfolio, useUpdateCreativePortfolio } from '@/hooks/useCreativePortfolios';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import { useCreativeProjects } from '@/hooks/useCreativeProjects';
import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORIES } from '@/types/creative';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface PortfolioFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: CreativePortfolio;
  onSuccess?: () => void;
}

export function PortfolioFormSheet({ open, onOpenChange, portfolio, onSuccess }: PortfolioFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateCreativePortfolio();
  const updateMutation = useUpdateCreativePortfolio();
  const { data: clients = [] } = useCreativeClients();
  const { data: projects = [] } = useCreativeProjects();
  const isEditing = !!portfolio;

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: portfolio?.title ?? '',
      description: portfolio?.description ?? '',
      category: portfolio?.category ?? undefined,
      mediaUrls: portfolio?.mediaUrls?.join(', ') ?? '',
      thumbnailUrl: portfolio?.thumbnailUrl ?? '',
      isPublic: portfolio?.isPublic ?? false,
      projectId: portfolio?.projectId ?? undefined,
      clientId: portfolio?.clientId ?? undefined,
    },
  });

  async function onSubmit(values: PortfolioFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: portfolio.id, values });
        toast({ title: 'Portfolio updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Portfolio created' });
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
          <SheetTitle>{isEditing ? 'Edit Portfolio' : 'New Portfolio'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update portfolio details.' : 'Add a new portfolio piece.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input {...field} placeholder="Portfolio title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} rows={3} placeholder="Describe this work..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PORTFOLIO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{PORTFOLIO_CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail URL</FormLabel>
                <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="mediaUrls" render={({ field }) => (
              <FormItem>
                <FormLabel>Media URLs</FormLabel>
                <FormControl><Textarea {...field} rows={2} placeholder="Comma-separated URLs" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
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

              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="isPublic" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>Public</FormLabel>
                  <p className="text-xs text-muted-foreground">Make this portfolio visible publicly</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Portfolio'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
