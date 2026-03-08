import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateRule, useUpdateRule } from '@/hooks/useWorkflowRules';
import {
  TRIGGER_ENTITIES,
  TRIGGER_EVENTS,
  ACTION_TYPES,
  TRIGGER_ENTITY_LABELS,
  TRIGGER_EVENT_LABELS,
  ACTION_TYPE_LABELS,
} from '@/types/creative-workflow';
import type { WorkflowRule, TriggerEntity, TriggerEvent, ActionType, WorkflowAction } from '@/types/creative-workflow';
import { getErrorMessage } from '@/lib/utils';

// Entity-specific field options for condition builder
const ENTITY_FIELDS: Record<string, { label: string; options: string[] }[]> = {
  opportunity: [
    { label: 'Stage', options: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
  ],
  project: [
    { label: 'Status', options: ['draft', 'active', 'on_hold', 'completed', 'cancelled'] },
  ],
  client: [
    { label: 'Status', options: ['prospect', 'active', 'inactive', 'archived'] },
  ],
  contact: [
    { label: 'Status', options: ['active', 'inactive', 'archived'] },
  ],
};

interface FormAction {
  type: ActionType;
  title: string;
  body: string;
  activityType: string;
  field: string;
  value: string;
  titleTemplate: string;
  status: string;
  notifyRole: 'all' | 'admins';
}

interface FormValues {
  name: string;
  triggerEntity: TriggerEntity;
  triggerEvent: TriggerEvent;
  conditionField: string;
  conditionFrom: string;
  conditionTo: string;
  actions: FormAction[];
}

interface WorkflowRuleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: WorkflowRule | null;
}

function formActionToWorkflowAction(fa: FormAction): WorkflowAction {
  switch (fa.type) {
    case 'create_activity':
      return { type: 'create_activity', activityType: fa.activityType || 'task', title: fa.title, description: fa.body || undefined };
    case 'create_notification':
      return { type: 'create_notification', title: fa.title, body: fa.body || undefined, notifyRole: fa.notifyRole };
    case 'update_entity':
      return { type: 'update_entity', field: fa.field, value: fa.value };
    case 'create_project':
      return { type: 'create_project', titleTemplate: fa.titleTemplate, status: fa.status || undefined };
  }
}

const defaultAction: FormAction = {
  type: 'create_notification',
  title: '',
  body: '',
  activityType: 'task',
  field: '',
  value: '',
  titleTemplate: '',
  status: '',
  notifyRole: 'all',
};

export function WorkflowRuleFormSheet({ open, onOpenChange, editRule }: WorkflowRuleFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule();

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      triggerEntity: 'opportunity',
      triggerEvent: 'stage_change',
      conditionField: 'stage',
      conditionFrom: '',
      conditionTo: '',
      actions: [{ ...defaultAction }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'actions' });

  // Populate form when editing
  useEffect(() => {
    if (editRule) {
      form.reset({
        name: editRule.name,
        triggerEntity: editRule.triggerEntity,
        triggerEvent: editRule.triggerEvent,
        conditionField: editRule.triggerCondition.field,
        conditionFrom: editRule.triggerCondition.from ?? '',
        conditionTo: editRule.triggerCondition.to,
        actions: editRule.actions.map((a) => {
          const rec = a as Record<string, unknown>;
          return {
            type: a.type,
            title: 'title' in a ? (rec.title as string) ?? '' : '',
            body: 'body' in a ? (rec.body as string) ?? '' : '',
            activityType: 'activityType' in a ? (rec.activityType as string) ?? 'task' : 'task',
            field: 'field' in a ? (rec.field as string) ?? '' : '',
            value: 'value' in a ? String(rec.value ?? '') : '',
            titleTemplate: 'titleTemplate' in a ? (rec.titleTemplate as string) ?? '' : '',
            status: 'status' in a ? (rec.status as string) ?? '' : '',
            notifyRole: 'notifyRole' in a ? (rec.notifyRole as 'all' | 'admins') ?? 'all' : 'all',
          };
        }),
      });
    } else {
      form.reset({
        name: '',
        triggerEntity: 'opportunity',
        triggerEvent: 'stage_change',
        conditionField: 'stage',
        conditionFrom: '',
        conditionTo: '',
        actions: [{ ...defaultAction }],
      });
    }
  }, [editRule, form]);

  async function onSubmit(values: FormValues) {
    try {
      const actions = values.actions.map(formActionToWorkflowAction);
      if (editRule) {
        await updateMutation.mutateAsync({
          id: editRule.id,
          name: values.name,
          triggerEntity: values.triggerEntity,
          triggerEvent: values.triggerEvent,
          triggerCondition: {
            field: values.conditionField,
            from: values.conditionFrom || undefined,
            to: values.conditionTo,
          },
          actions,
        });
        toast({ title: 'Rule updated' });
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          triggerEntity: values.triggerEntity,
          triggerEvent: values.triggerEvent,
          triggerCondition: {
            field: values.conditionField,
            from: values.conditionFrom || undefined,
            to: values.conditionTo,
          },
          actions,
        });
        toast({ title: 'Rule created' });
      }
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  const entityFields = ENTITY_FIELDS[form.watch('triggerEntity')] ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editRule ? 'Edit Rule' : 'Create Workflow Rule'}</SheetTitle>
          <SheetDescription>Configure a trigger and actions for automatic workflows.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
            {/* Name */}
            <FormField control={form.control} name="name" rules={{ required: 'Name is required' }} render={({ field }) => (
              <FormItem>
                <FormLabel>Rule Name</FormLabel>
                <FormControl><Input placeholder="e.g. Won Opportunity → Create Project" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Trigger section */}
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">Trigger</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="triggerEntity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TRIGGER_ENTITIES.map((e) => <SelectItem key={e} value={e}>{TRIGGER_ENTITY_LABELS[e]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="triggerEvent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TRIGGER_EVENTS.map((e) => <SelectItem key={e} value={e}>{TRIGGER_EVENT_LABELS[e]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              {/* Condition - show "to" value selector based on entity fields */}
              {entityFields.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="conditionFrom" render={({ field }) => (
                    <FormItem>
                      <FormLabel>From (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          {entityFields[0].options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="conditionTo" rules={{ required: 'Target value is required' }} render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {entityFields[0].options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            {/* Actions section */}
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Actions</p>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => append({ ...defaultAction })}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="space-y-2 rounded border p-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <FormField control={form.control} name={`actions.${index}.type`} render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {ACTION_TYPES.map((t) => <SelectItem key={t} value={t}>{ACTION_TYPE_LABELS[t]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-2 text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {/* Type-specific fields */}
                  {form.watch(`actions.${index}.type`) === 'create_notification' && (
                    <>
                      <FormField control={form.control} name={`actions.${index}.title`} rules={{ required: 'Title required' }} render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Notification title" className="h-8 text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`actions.${index}.body`} render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Body (optional)" className="h-8 text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </>
                  )}
                  {form.watch(`actions.${index}.type`) === 'create_activity' && (
                    <>
                      <FormField control={form.control} name={`actions.${index}.title`} rules={{ required: 'Title required' }} render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Activity title" className="h-8 text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`actions.${index}.activityType`} render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="task">Task</SelectItem>
                              <SelectItem value="note">Note</SelectItem>
                              <SelectItem value="call">Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </>
                  )}
                  {form.watch(`actions.${index}.type`) === 'create_project' && (
                    <FormField control={form.control} name={`actions.${index}.titleTemplate`} rules={{ required: 'Title template required' }} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder="Project title template" className="h-8 text-sm" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                  {form.watch(`actions.${index}.type`) === 'update_entity' && (
                    <div className="grid grid-cols-2 gap-2">
                      <FormField control={form.control} name={`actions.${index}.field`} rules={{ required: 'Field required' }} render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Field name" className="h-8 text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`actions.${index}.value`} rules={{ required: 'Value required' }} render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="New value" className="h-8 text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
