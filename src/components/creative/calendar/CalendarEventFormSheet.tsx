import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCreateCalendarEvent } from '@/hooks/useCreativeCalendarEvents';
import type { CreateCalendarEventInput } from '@/hooks/useCreativeCalendarEvents';
import { useIntegrations } from '@/hooks/useIntegrations';
import { MultiEmailInput } from '@/components/creative/shared/MultiEmailInput';
import { PROVIDER_LABELS } from '@/types/integrations';
import type { IntegrationProvider } from '@/types/integrations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventFormValues {
  integrationId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
  attendees: string[];
}

interface CalendarEventFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Pure helper (exported for testing)
// ---------------------------------------------------------------------------

const CALENDAR_PROVIDERS: IntegrationProvider[] = ['gmail', 'outlook'];

export function toCreateEventInput(values: EventFormValues): CreateCalendarEventInput {
  const startAt = values.allDay
    ? `${values.date}T00:00:00`
    : `${values.date}T${values.startTime}:00`;

  const endAt = values.allDay
    ? `${values.date}T23:59:59`
    : `${values.date}T${values.endTime}:00`;

  const input: CreateCalendarEventInput = {
    integrationId: values.integrationId,
    title: values.title,
    startAt,
    endAt,
    allDay: values.allDay || undefined,
  };

  if (values.location) {
    input.location = values.location;
  }

  if (values.description) {
    input.description = values.description;
  }

  if (values.attendees.length > 0) {
    input.attendees = values.attendees.map((email) => ({ email }));
  }

  return input;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarEventFormSheet({ open, onOpenChange }: CalendarEventFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateCalendarEvent();
  const { data: integrations } = useIntegrations();

  const calendarIntegrations = (integrations ?? []).filter(
    (i) =>
      CALENDAR_PROVIDERS.includes(i.provider) &&
      i.status === 'connected' &&
      i.is_enabled,
  );

  const form = useForm<EventFormValues>({
    defaultValues: {
      integrationId: '',
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      allDay: false,
      location: '',
      description: '',
      attendees: [],
    },
  });

  const allDay = form.watch('allDay');

  // Auto-select integration when there is exactly one
  const integrationId = form.watch('integrationId');
  if (calendarIntegrations.length === 1 && !integrationId) {
    form.setValue('integrationId', calendarIntegrations[0].id);
  }

  async function onSubmit(values: EventFormValues) {
    try {
      await createMutation.mutateAsync(toCreateEventInput(values));
      toast({ title: 'Calendar event created' });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Calendar Event</SheetTitle>
          <SheetDescription>Create an event on your connected calendar.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Integration selector - only when multiple connected */}
            {calendarIntegrations.length > 1 && (
              <FormField
                control={form.control}
                name="integrationId"
                rules={{ required: 'Select a calendar' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select calendar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {calendarIntegrations.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.display_name || PROVIDER_LABELS[i.provider]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Team sync" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All Day toggle */}
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">All day</FormLabel>
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time / End Time */}
            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Office, Zoom link, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Meeting agenda, notes..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attendees */}
            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <FormControl>
                    <MultiEmailInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add attendee emails..."
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                'Creating...'
              ) : (
                <>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
