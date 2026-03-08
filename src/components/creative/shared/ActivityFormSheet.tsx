import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCreateActivity } from '@/hooks/useCreativeActivities';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '@/types/creative-activity';
import type { ActivityType } from '@/types/creative-activity';
import { getErrorMessage } from '@/lib/utils';

interface ActivityFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
}

interface FormValues {
  activityType: ActivityType;
  title: string;
  description: string;
  occurredAt: string;
  durationMinutes: string;
  outcome: string;
  dueDate: string;
  assignedTo: string;
  enableReminder: boolean;
}

export function ActivityFormSheet({ open, onOpenChange, entityType, entityId }: ActivityFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateActivity();

  const form = useForm<FormValues>({
    defaultValues: {
      activityType: 'note',
      title: '',
      description: '',
      occurredAt: new Date().toISOString().slice(0, 16),
      durationMinutes: '',
      outcome: '',
      dueDate: '',
      assignedTo: '',
      enableReminder: false,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        entityType,
        entityId,
        activityType: values.activityType,
        title: values.title,
        description: values.description || undefined,
        occurredAt: new Date(values.occurredAt).toISOString(),
        durationMinutes: values.durationMinutes ? parseInt(values.durationMinutes) : undefined,
        outcome: values.outcome || undefined,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
        assignedTo: values.assignedTo || undefined,
        reminderAt: values.enableReminder && values.dueDate
          ? new Date(new Date(values.dueDate).getTime() - 3600000).toISOString()
          : undefined,
      });
      toast({ title: 'Activity logged' });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Activity</SheetTitle>
          <SheetDescription>Record an interaction or task for this {entityType}.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Discovery call with team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occurredAt"
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Task-specific fields */}
            {form.watch('activityType') === 'task' && (
              <>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enableReminder"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Remind 1 hour before due date</FormLabel>
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="30" min={0} max={1440} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Key discussion points, decisions..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Scheduled follow-up, Sent proposal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Log Activity'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
