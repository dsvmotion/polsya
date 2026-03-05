# Phase 2A: Contacts, Portfolios & Ingestion Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build full CRUD for Contacts and Portfolios, plus the Ingestion Engine monitoring UI, completing the CRM data layer and establishing the first engine interface.

**Architecture:** Layered, following Phase 1 patterns — types → Zod schema → service mapper → React Query hook → page (DataTable + Cards + FormSheet + Detail). Ingestion adds a provider management + run monitoring pattern on top.

**Tech Stack:** TanStack Table v8, react-hook-form + zod, shadcn/ui, React Query, Supabase JS. All tables already exist in DB with RLS.

---

## Task 1: Contact Types & Schema

**Files:**
- Modify: `src/types/creative.ts` (append after Opportunity section)
- Modify: `src/lib/creative-schemas.ts` (append contact schema)

**Step 1: Add Contact types to `src/types/creative.ts`**

Append after the `CreativeOpportunity` interface (after line 136):

```typescript
// ─── Contact ────────────────────────────────

export const CONTACT_STATUSES = ['active', 'inactive', 'archived'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
};

export const CONTACT_STATUS_COLORS: Record<ContactStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export interface CreativeContact {
  id: string;
  organizationId: string;
  clientId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  isDecisionMaker: boolean;
  status: ContactStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Add Contact schema to `src/lib/creative-schemas.ts`**

Add import for `CONTACT_STATUSES` from `@/types/creative`, then append:

```typescript
export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),
  clientId: z.string().uuid('Select a client').optional(),
  linkedinUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  isDecisionMaker: z.boolean().default(false),
  status: z.enum(CONTACT_STATUSES).default('active'),
  tags: z.array(z.string()).optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/types/creative.ts src/lib/creative-schemas.ts
git commit -m "feat(contacts): add Contact types, constants, and Zod schema"
```

---

## Task 2: Contact Service (Row Mapper)

**Files:**
- Create: `src/services/creativeContactService.ts`

**Step 1: Create the service file**

Follow the exact pattern from `src/services/creativeClientService.ts`:

```typescript
// src/services/creativeContactService.ts
import type { CreativeContact, ContactStatus } from '@/types/creative';

export interface CreativeContactRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  is_decision_maker: boolean;
  status: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeContact(row: CreativeContactRow): CreativeContact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    title: row.title,
    role: row.role,
    linkedinUrl: row.linkedin_url,
    avatarUrl: row.avatar_url,
    isDecisionMaker: row.is_decision_maker ?? false,
    status: row.status as ContactStatus,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeContacts(rows: readonly CreativeContactRow[]): CreativeContact[] {
  return rows.map(toCreativeContact);
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/services/creativeContactService.ts
git commit -m "feat(contacts): add Contact service row mapper"
```

---

## Task 3: Contact Hooks (CRUD)

**Files:**
- Create: `src/hooks/useCreativeContacts.ts`

**Step 1: Create the hooks file**

Follow the exact pattern from `src/hooks/useCreativeClients.ts`. Contacts support an optional `clientId` filter (like projects):

```typescript
// src/hooks/useCreativeContacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeContact } from '@/types/creative';
import type { ContactFormValues } from '@/lib/creative-schemas';
import { toCreativeContact, toCreativeContacts, type CreativeContactRow } from '@/services/creativeContactService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const contactsKeys = {
  all: (orgId: string) => ['creative-contacts', orgId] as const,
  detail: (id: string) => ['creative-contact', id] as const,
};

export function useCreativeContacts(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeContact[]>({
    queryKey: [...contactsKeys.all(orgId ?? ''), clientId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('creative_contacts')
        .select('*')
        .eq('organization_id', orgId!)
        .order('first_name');
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativeContacts((data ?? []) as unknown as CreativeContactRow[]);
    },
  });
}

export function useCreativeContact(id: string | null) {
  return useQuery<CreativeContact | null>({
    queryKey: contactsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_contacts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeContact(data as unknown as CreativeContactRow);
    },
  });
}

export function useCreateCreativeContact() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('creative_contacts')
        .insert({
          organization_id: orgId,
          first_name: values.firstName,
          last_name: values.lastName || null,
          email: values.email || null,
          phone: values.phone || null,
          title: values.title || null,
          role: values.role || null,
          client_id: values.clientId || null,
          linkedin_url: values.linkedinUrl || null,
          is_decision_maker: values.isDecisionMaker ?? false,
          status: values.status,
          tags: values.tags ?? [],
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeContact(data as unknown as CreativeContactRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-contacts'] });
    },
  });
}

export function useUpdateCreativeContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ContactFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.firstName !== undefined) patch.first_name = values.firstName;
      if (values.lastName !== undefined) patch.last_name = values.lastName || null;
      if (values.email !== undefined) patch.email = values.email || null;
      if (values.phone !== undefined) patch.phone = values.phone || null;
      if (values.title !== undefined) patch.title = values.title || null;
      if (values.role !== undefined) patch.role = values.role || null;
      if (values.clientId !== undefined) patch.client_id = values.clientId || null;
      if (values.linkedinUrl !== undefined) patch.linkedin_url = values.linkedinUrl || null;
      if (values.isDecisionMaker !== undefined) patch.is_decision_maker = values.isDecisionMaker;
      if (values.status !== undefined) patch.status = values.status;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await supabase
        .from('creative_contacts')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeContact(data as unknown as CreativeContactRow);
    },
    onSuccess: (contact) => {
      queryClient.invalidateQueries({ queryKey: ['creative-contacts'] });
      queryClient.setQueryData(contactsKeys.detail(contact.id), contact);
    },
  });
}

export function useDeleteCreativeContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-contacts'] });
    },
  });
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/hooks/useCreativeContacts.ts
git commit -m "feat(contacts): add Contact CRUD hooks with React Query"
```

---

## Task 4: Contact Components

**Files:**
- Create: `src/components/creative/contacts/contact-columns.tsx`
- Create: `src/components/creative/contacts/ContactCard.tsx`
- Create: `src/components/creative/contacts/ContactFormSheet.tsx`
- Create: `src/components/creative/contacts/ContactDetail.tsx`

**Step 1: Create `contact-columns.tsx`**

Follow pattern from `src/components/creative/clients/client-columns.tsx`:

```typescript
import type { ColumnDef } from '@tanstack/react-table';
import type { CreativeContact } from '@/types/creative';
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export const contactColumns: ColumnDef<CreativeContact, unknown>[] = [
  {
    accessorKey: 'firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const first = row.original.firstName;
      const last = row.original.lastName;
      return <span className="font-medium">{first}{last ? ` ${last}` : ''}</span>;
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => row.getValue('email') ?? '—',
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => row.getValue('title') ?? '—',
  },
  {
    accessorKey: 'isDecisionMaker',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Decision Maker" />,
    cell: ({ row }) =>
      row.original.isDecisionMaker ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof CONTACT_STATUS_LABELS;
      const colors = CONTACT_STATUS_COLORS[status];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {CONTACT_STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
```

**Step 2: Create `ContactCard.tsx`**

Follow pattern from `src/components/creative/clients/ClientCard.tsx`:

```typescript
import type { CreativeContact } from '@/types/creative';
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, CheckCircle2 } from 'lucide-react';

interface ContactCardProps {
  contact: CreativeContact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const statusColors = CONTACT_STATUS_COLORS[contact.status];
  const fullName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`;

  return (
    <div
      className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold truncate">{fullName}</h3>
          {contact.title && (
            <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
          )}
        </div>
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0 ml-2`}>
          {CONTACT_STATUS_LABELS[contact.status]}
        </Badge>
      </div>
      {contact.email && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}
      {contact.phone && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{contact.phone}</span>
        </div>
      )}
      {contact.isDecisionMaker && (
        <div className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Decision Maker</span>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create `ContactFormSheet.tsx`**

Follow pattern from `src/components/creative/clients/ClientFormSheet.tsx`. Include a client select dropdown using `useCreativeClients()`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormValues } from '@/lib/creative-schemas';
import { useCreateCreativeContact, useUpdateCreativeContact } from '@/hooks/useCreativeContacts';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import type { CreativeContact } from '@/types/creative';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ContactFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: CreativeContact;
  onSuccess?: () => void;
}

export function ContactFormSheet({ open, onOpenChange, contact, onSuccess }: ContactFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateCreativeContact();
  const updateMutation = useUpdateCreativeContact();
  const { data: clients = [] } = useCreativeClients();
  const isEditing = !!contact;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact?.firstName ?? '',
      lastName: contact?.lastName ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      title: contact?.title ?? '',
      role: contact?.role ?? '',
      clientId: contact?.clientId ?? undefined,
      linkedinUrl: contact?.linkedinUrl ?? '',
      isDecisionMaker: contact?.isDecisionMaker ?? false,
      status: contact?.status ?? 'active',
    },
  });

  async function onSubmit(values: ContactFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: contact.id, values });
        toast({ title: 'Contact updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Contact created' });
      }
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Contact' : 'New Contact'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update contact details.' : 'Add a new contact.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="First name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Last name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} type="email" placeholder="email@example.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input {...field} placeholder="+1 (555) 000-0000" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. CEO" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Buyer" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

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

            <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl><Input {...field} placeholder="https://linkedin.com/in/..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isDecisionMaker" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>Decision Maker</FormLabel>
                  <p className="text-xs text-muted-foreground">This contact has buying authority</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 4: Create `ContactDetail.tsx`**

Follow pattern from `src/components/creative/clients/ClientDetail.tsx`:

```typescript
import { useState } from 'react';
import type { CreativeContact } from '@/types/creative';
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/types/creative';
import { useDeleteCreativeContact } from '@/hooks/useCreativeContacts';
import { useCreativeClient } from '@/hooks/useCreativeClients';
import { ContactFormSheet } from './ContactFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Mail, Phone, Linkedin, CheckCircle2, Building2 } from 'lucide-react';

interface ContactDetailProps {
  contact: CreativeContact;
  onClose: () => void;
}

export function ContactDetail({ contact, onClose }: ContactDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeContact();
  const { data: client } = useCreativeClient(contact.clientId);
  const { toast } = useToast();
  const statusColors = CONTACT_STATUS_COLORS[contact.status];
  const fullName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(contact.id);
      toast({ title: 'Contact deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{fullName}</h2>
          {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 mt-1`}>
            {CONTACT_STATUS_LABELS[contact.status]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete contact?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{fullName}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 text-sm">
        {client && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.name}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.linkedinUrl && (
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-muted-foreground" />
            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{contact.linkedinUrl}</a>
          </div>
        )}
        {contact.role && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Role:</span>
            <span>{contact.role}</span>
          </div>
        )}
        {contact.isDecisionMaker && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Decision Maker</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(contact.createdAt).toLocaleDateString()}
      </div>

      <ContactFormSheet open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  );
}
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/components/creative/contacts/
git commit -m "feat(contacts): add Contact columns, card, form sheet, and detail components"
```

---

## Task 5: Contact Page + Route + Sidebar

**Files:**
- Create: `src/pages/creative/CreativeContacts.tsx`
- Modify: `src/App.tsx` (add route, add lazy import)
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` (add nav item)

**Step 1: Create `CreativeContacts.tsx`**

Follow exact pattern from `src/pages/creative/CreativeClients.tsx`:

```typescript
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { contactColumns } from '@/components/creative/contacts/contact-columns';
import { ContactCard } from '@/components/creative/contacts/ContactCard';
import { ContactFormSheet } from '@/components/creative/contacts/ContactFormSheet';
import { ContactDetail } from '@/components/creative/contacts/ContactDetail';
import { useCreativeContacts } from '@/hooks/useCreativeContacts';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { CreativeContact } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeContacts() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: contacts = [], isLoading } = useCreativeContacts();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(contact: CreativeContact) {
    setContextPanelContent(
      <ContactDetail
        contact={contact}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />
    );
    setContextPanelOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Contacts"
      description="Manage contacts at your client organizations"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={contactColumns}
            data={contacts}
            isLoading={isLoading}
            searchKey="firstName"
            searchPlaceholder="Search contacts..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  <div className="h-4 w-full bg-muted/40 rounded" />
                </div>
              ))
            ) : contacts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No contacts yet. Click "Add Contact" to get started.
              </div>
            ) : (
              contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} onClick={() => handleRowClick(contact)} />
              ))
            )}
          </div>
        )}
      </div>

      <ContactFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
```

**Step 2: Add lazy import to `src/App.tsx`**

Find the creative lazy imports section and add:

```typescript
const CreativeContacts = lazy(() => import('@/pages/creative/CreativeContacts'));
```

**Step 3: Add route to `src/App.tsx`**

Inside the creative Route group (after `<Route path="opportunities" ...>`), add:

```typescript
<Route path="contacts" element={<CreativeContacts />} />
```

**Step 4: Add sidebar nav item to `src/components/creative/layout/CreativeSidebar.tsx`**

Import `UserRound` from lucide-react. In `mainNavItems`, insert after the Projects entry (before Opportunities):

```typescript
{ label: 'Contacts', icon: UserRound, path: '/creative/contacts' },
```

**Step 5: Verify TypeScript compiles and app builds**

Run: `npx tsc --noEmit && npx vite build`
Expected: Clean build.

**Step 6: Commit**

```bash
git add src/pages/creative/CreativeContacts.tsx src/App.tsx src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat(contacts): add Contacts page, route, and sidebar nav item"
```

---

## Task 6: Portfolio Types & Schema

**Files:**
- Modify: `src/types/creative.ts` (append after Contact section)
- Modify: `src/lib/creative-schemas.ts` (append portfolio schema)

**Step 1: Add Portfolio types to `src/types/creative.ts`**

Append after the `CreativeContact` interface:

```typescript
// ─── Portfolio ──────────────────────────────

export const PORTFOLIO_CATEGORIES = ['branding', 'web_design', 'illustration', 'photography', 'motion', 'print', 'packaging', 'other'] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  branding: 'Branding',
  web_design: 'Web Design',
  illustration: 'Illustration',
  photography: 'Photography',
  motion: 'Motion',
  print: 'Print',
  packaging: 'Packaging',
  other: 'Other',
};

export const PORTFOLIO_CATEGORY_COLORS: Record<PortfolioCategory, { bg: string; text: string }> = {
  branding: { bg: 'bg-purple-100', text: 'text-purple-800' },
  web_design: { bg: 'bg-blue-100', text: 'text-blue-800' },
  illustration: { bg: 'bg-pink-100', text: 'text-pink-800' },
  photography: { bg: 'bg-amber-100', text: 'text-amber-800' },
  motion: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  print: { bg: 'bg-orange-100', text: 'text-orange-800' },
  packaging: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export interface CreativePortfolio {
  id: string;
  organizationId: string;
  projectId: string | null;
  clientId: string | null;
  title: string;
  description: string | null;
  category: PortfolioCategory | null;
  mediaUrls: string[];
  thumbnailUrl: string | null;
  isPublic: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Add Portfolio schema to `src/lib/creative-schemas.ts`**

Add `PORTFOLIO_CATEGORIES` to the import, then append:

```typescript
export const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(PORTFOLIO_CATEGORIES).optional(),
  mediaUrls: z.string().optional(), // Comma-separated URLs for MVP
  thumbnailUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  isPublic: z.boolean().default(false),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export type PortfolioFormValues = z.infer<typeof portfolioSchema>;
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/types/creative.ts src/lib/creative-schemas.ts
git commit -m "feat(portfolios): add Portfolio types, categories, and Zod schema"
```

---

## Task 7: Portfolio Service (Row Mapper)

**Files:**
- Create: `src/services/creativePortfolioService.ts`

**Step 1: Create the service file**

```typescript
// src/services/creativePortfolioService.ts
import type { CreativePortfolio, PortfolioCategory } from '@/types/creative';

export interface CreativePortfolioRow {
  id: string;
  organization_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  media_urls: string[];
  thumbnail_url: string | null;
  is_public: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativePortfolio(row: CreativePortfolioRow): CreativePortfolio {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    category: (row.category as PortfolioCategory) ?? null,
    mediaUrls: row.media_urls ?? [],
    thumbnailUrl: row.thumbnail_url,
    isPublic: row.is_public ?? false,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativePortfolios(rows: readonly CreativePortfolioRow[]): CreativePortfolio[] {
  return rows.map(toCreativePortfolio);
}
```

**Step 2: Verify TypeScript compiles, commit**

```bash
git add src/services/creativePortfolioService.ts
git commit -m "feat(portfolios): add Portfolio service row mapper"
```

---

## Task 8: Portfolio Hooks (CRUD)

**Files:**
- Create: `src/hooks/useCreativePortfolios.ts`

**Step 1: Create the hooks file**

Follow useCreativeClients pattern. Portfolios support optional `clientId` and `projectId` filters:

```typescript
// src/hooks/useCreativePortfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreativePortfolio } from '@/types/creative';
import type { PortfolioFormValues } from '@/lib/creative-schemas';
import { toCreativePortfolio, toCreativePortfolios, type CreativePortfolioRow } from '@/services/creativePortfolioService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const portfoliosKeys = {
  all: (orgId: string) => ['creative-portfolios', orgId] as const,
  detail: (id: string) => ['creative-portfolio', id] as const,
};

export function useCreativePortfolios(filters?: { clientId?: string; projectId?: string }) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativePortfolio[]>({
    queryKey: [...portfoliosKeys.all(orgId ?? ''), filters?.clientId ?? '', filters?.projectId ?? ''],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('creative_portfolios')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (filters?.clientId) query = query.eq('client_id', filters.clientId);
      if (filters?.projectId) query = query.eq('project_id', filters.projectId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativePortfolios((data ?? []) as unknown as CreativePortfolioRow[]);
    },
  });
}

export function useCreativePortfolio(id: string | null) {
  return useQuery<CreativePortfolio | null>({
    queryKey: portfoliosKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_portfolios')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativePortfolio(data as unknown as CreativePortfolioRow);
    },
  });
}

export function useCreateCreativePortfolio() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: PortfolioFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const mediaUrls = values.mediaUrls
        ? values.mediaUrls.split(',').map((u) => u.trim()).filter(Boolean)
        : [];
      const { data, error } = await supabase
        .from('creative_portfolios')
        .insert({
          organization_id: orgId,
          title: values.title,
          description: values.description || null,
          category: values.category || null,
          media_urls: mediaUrls,
          thumbnail_url: values.thumbnailUrl || null,
          is_public: values.isPublic ?? false,
          project_id: values.projectId || null,
          client_id: values.clientId || null,
          tags: values.tags ?? [],
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativePortfolio(data as unknown as CreativePortfolioRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-portfolios'] });
    },
  });
}

export function useUpdateCreativePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<PortfolioFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.title !== undefined) patch.title = values.title;
      if (values.description !== undefined) patch.description = values.description || null;
      if (values.category !== undefined) patch.category = values.category || null;
      if (values.mediaUrls !== undefined) {
        patch.media_urls = values.mediaUrls
          ? values.mediaUrls.split(',').map((u) => u.trim()).filter(Boolean)
          : [];
      }
      if (values.thumbnailUrl !== undefined) patch.thumbnail_url = values.thumbnailUrl || null;
      if (values.isPublic !== undefined) patch.is_public = values.isPublic;
      if (values.projectId !== undefined) patch.project_id = values.projectId || null;
      if (values.clientId !== undefined) patch.client_id = values.clientId || null;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await supabase
        .from('creative_portfolios')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativePortfolio(data as unknown as CreativePortfolioRow);
    },
    onSuccess: (portfolio) => {
      queryClient.invalidateQueries({ queryKey: ['creative-portfolios'] });
      queryClient.setQueryData(portfoliosKeys.detail(portfolio.id), portfolio);
    },
  });
}

export function useDeleteCreativePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_portfolios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-portfolios'] });
    },
  });
}
```

**Step 2: Verify TypeScript compiles, commit**

```bash
git add src/hooks/useCreativePortfolios.ts
git commit -m "feat(portfolios): add Portfolio CRUD hooks with React Query"
```

---

## Task 9: Portfolio Components

**Files:**
- Create: `src/components/creative/portfolios/portfolio-columns.tsx`
- Create: `src/components/creative/portfolios/PortfolioCard.tsx`
- Create: `src/components/creative/portfolios/PortfolioFormSheet.tsx`
- Create: `src/components/creative/portfolios/PortfolioDetail.tsx`

**Step 1: Create `portfolio-columns.tsx`**

```typescript
import type { ColumnDef } from '@tanstack/react-table';
import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORY_COLORS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock } from 'lucide-react';

export const portfolioColumns: ColumnDef<CreativePortfolio, unknown>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => {
      const cat = row.getValue('category') as keyof typeof PORTFOLIO_CATEGORY_LABELS | null;
      if (!cat) return '—';
      const colors = PORTFOLIO_CATEGORY_COLORS[cat];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {PORTFOLIO_CATEGORY_LABELS[cat]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isPublic',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Visibility" />,
    cell: ({ row }) =>
      row.original.isPublic ? (
        <div className="flex items-center gap-1 text-green-600"><Globe className="h-3.5 w-3.5" /><span className="text-xs">Public</span></div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span className="text-xs">Private</span></div>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
```

**Step 2: Create `PortfolioCard.tsx`**

Portfolio cards show a thumbnail image, title, category badge, and public/private indicator:

```typescript
import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORY_COLORS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, ImageOff } from 'lucide-react';

interface PortfolioCardProps {
  portfolio: CreativePortfolio;
  onClick?: () => void;
}

export function PortfolioCard({ portfolio, onClick }: PortfolioCardProps) {
  return (
    <div
      className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {portfolio.thumbnailUrl ? (
          <img
            src={portfolio.thumbnailUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>
      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{portfolio.title}</h3>
          {portfolio.isPublic ? (
            <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
        {portfolio.category && (
          <Badge
            variant="secondary"
            className={`text-xs ${PORTFOLIO_CATEGORY_COLORS[portfolio.category].bg} ${PORTFOLIO_CATEGORY_COLORS[portfolio.category].text} border-0`}
          >
            {PORTFOLIO_CATEGORY_LABELS[portfolio.category]}
          </Badge>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create `PortfolioFormSheet.tsx`**

Include client and project select dropdowns:

```typescript
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
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
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
```

**Step 4: Create `PortfolioDetail.tsx`**

```typescript
import { useState } from 'react';
import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORY_COLORS } from '@/types/creative';
import { useDeleteCreativePortfolio } from '@/hooks/useCreativePortfolios';
import { useCreativeClient } from '@/hooks/useCreativeClients';
import { PortfolioFormSheet } from './PortfolioFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Globe, Lock, Building2, ExternalLink } from 'lucide-react';

interface PortfolioDetailProps {
  portfolio: CreativePortfolio;
  onClose: () => void;
}

export function PortfolioDetail({ portfolio, onClose }: PortfolioDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativePortfolio();
  const { data: client } = useCreativeClient(portfolio.clientId);
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(portfolio.id);
      toast({ title: 'Portfolio deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Thumbnail */}
      {portfolio.thumbnailUrl && (
        <div className="rounded-lg overflow-hidden bg-muted">
          <img src={portfolio.thumbnailUrl} alt={portfolio.title} className="w-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{portfolio.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            {portfolio.category && (
              <Badge variant="secondary" className={`${PORTFOLIO_CATEGORY_COLORS[portfolio.category].bg} ${PORTFOLIO_CATEGORY_COLORS[portfolio.category].text} border-0`}>
                {PORTFOLIO_CATEGORY_LABELS[portfolio.category]}
              </Badge>
            )}
            {portfolio.isPublic ? (
              <Badge variant="outline" className="text-green-600 border-green-200"><Globe className="h-3 w-3 mr-1" />Public</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground"><Lock className="h-3 w-3 mr-1" />Private</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{portfolio.title}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Description */}
      {portfolio.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{portfolio.description}</p>
        </div>
      )}

      {/* Info */}
      <div className="space-y-3 text-sm">
        {client && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.name}</span>
          </div>
        )}
      </div>

      {/* Media URLs */}
      {portfolio.mediaUrls.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Media</h3>
          <div className="space-y-1">
            {portfolio.mediaUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {portfolio.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {portfolio.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(portfolio.createdAt).toLocaleDateString()}
      </div>

      <PortfolioFormSheet open={editOpen} onOpenChange={setEditOpen} portfolio={portfolio} />
    </div>
  );
}
```

**Step 5: Verify TypeScript compiles, commit**

```bash
git add src/components/creative/portfolios/
git commit -m "feat(portfolios): add Portfolio columns, card, form sheet, and detail components"
```

---

## Task 10: Portfolio Page + Route

**Files:**
- Create: `src/pages/creative/CreativePortfolios.tsx`
- Modify: `src/App.tsx` (add route + lazy import)

**Step 1: Create `CreativePortfolios.tsx`**

Default to card view (since portfolios are visual) — swap order vs Clients page:

```typescript
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { portfolioColumns } from '@/components/creative/portfolios/portfolio-columns';
import { PortfolioCard } from '@/components/creative/portfolios/PortfolioCard';
import { PortfolioFormSheet } from '@/components/creative/portfolios/PortfolioFormSheet';
import { PortfolioDetail } from '@/components/creative/portfolios/PortfolioDetail';
import { useCreativePortfolios } from '@/hooks/useCreativePortfolios';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { CreativePortfolio } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativePortfolios() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [formOpen, setFormOpen] = useState(false);
  const { data: portfolios = [], isLoading } = useCreativePortfolios();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(portfolio: CreativePortfolio) {
    setContextPanelContent(
      <PortfolioDetail
        portfolio={portfolio}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />
    );
    setContextPanelOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Portfolios"
      description="Showcase your creative work and visual samples"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['cards', 'table']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Portfolio</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={portfolioColumns}
            data={portfolios}
            isLoading={isLoading}
            searchKey="title"
            searchPlaceholder="Search portfolios..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted/60 rounded" />
                  </div>
                </div>
              ))
            ) : portfolios.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No portfolios yet. Click "Add Portfolio" to get started.
              </div>
            ) : (
              portfolios.map((portfolio) => (
                <PortfolioCard key={portfolio.id} portfolio={portfolio} onClick={() => handleRowClick(portfolio)} />
              ))
            )}
          </div>
        )}
      </div>

      <PortfolioFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
```

**Step 2: Add lazy import and route to `src/App.tsx`**

Add lazy import:
```typescript
const CreativePortfolios = lazy(() => import('@/pages/creative/CreativePortfolios'));
```

Add route inside the creative group (after contacts):
```typescript
<Route path="portfolios" element={<CreativePortfolios />} />
```

**Step 3: Verify build**

Run: `npx tsc --noEmit && npx vite build`

**Step 4: Commit**

```bash
git add src/pages/creative/CreativePortfolios.tsx src/App.tsx
git commit -m "feat(portfolios): add Portfolios page and route"
```

---

## Task 11: Ingestion Types & Service

**Files:**
- Create: `src/types/ingestion.ts`
- Create: `src/services/ingestionService.ts`

**Step 1: Create `src/types/ingestion.ts`**

Based on DB schema in `supabase/migrations/20260309120000_ingestion_engine_tables.sql`:

```typescript
// src/types/ingestion.ts
// Domain types for the Ingestion Engine.
// Matches DB tables: ingestion_providers, ingestion_runs, ingestion_jobs.

// ─── Provider ───────────────────────────────

export const PROVIDER_TYPES = ['linkedin', 'behance', 'dribbble', 'csv_import', 'api', 'webhook', 'manual'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  linkedin: 'LinkedIn',
  behance: 'Behance',
  dribbble: 'Dribbble',
  csv_import: 'CSV Import',
  api: 'API',
  webhook: 'Webhook',
  manual: 'Manual',
};

export interface IngestionProvider {
  id: string;
  organizationId: string;
  providerType: ProviderType;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt: string | null;
  syncFrequencyMinutes: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Run ────────────────────────────────────

export const RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const RUN_STATUS_COLORS: Record<RunStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-amber-100', text: 'text-amber-800' },
};

export interface IngestionRun {
  id: string;
  organizationId: string;
  providerId: string;
  status: RunStatus;
  startedAt: string | null;
  completedAt: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorLog: unknown[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Job ────────────────────────────────────

export const JOB_STATUSES = ['pending', 'running', 'completed', 'failed', 'skipped'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const JOB_STATUS_COLORS: Record<JobStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  skipped: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export interface IngestionJob {
  id: string;
  runId: string;
  organizationId: string;
  jobType: string;
  status: JobStatus;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Create `src/services/ingestionService.ts`**

```typescript
// src/services/ingestionService.ts
import type { IngestionProvider, IngestionRun, IngestionJob, ProviderType, RunStatus, JobStatus } from '@/types/ingestion';

// ─── Provider Row ───────────────────────────

export interface IngestionProviderRow {
  id: string;
  organization_id: string;
  provider_type: string;
  name: string;
  config: Record<string, unknown>;
  credentials_encrypted: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toIngestionProvider(row: IngestionProviderRow): IngestionProvider {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerType: row.provider_type as ProviderType,
    name: row.name,
    config: row.config ?? {},
    isActive: row.is_active ?? true,
    lastSyncAt: row.last_sync_at,
    syncFrequencyMinutes: row.sync_frequency_minutes ?? 60,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIngestionProviders(rows: readonly IngestionProviderRow[]): IngestionProvider[] {
  return rows.map(toIngestionProvider);
}

// ─── Run Row ────────────────────────────────

export interface IngestionRunRow {
  id: string;
  organization_id: string;
  provider_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_log: unknown[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toIngestionRun(row: IngestionRunRow): IngestionRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerId: row.provider_id,
    status: row.status as RunStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    recordsProcessed: row.records_processed ?? 0,
    recordsCreated: row.records_created ?? 0,
    recordsUpdated: row.records_updated ?? 0,
    recordsFailed: row.records_failed ?? 0,
    errorLog: row.error_log ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIngestionRuns(rows: readonly IngestionRunRow[]): IngestionRun[] {
  return rows.map(toIngestionRun);
}

// ─── Job Row ────────────────────────────────

export interface IngestionJobRow {
  id: string;
  run_id: string;
  organization_id: string;
  job_type: string;
  status: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toIngestionJob(row: IngestionJobRow): IngestionJob {
  return {
    id: row.id,
    runId: row.run_id,
    organizationId: row.organization_id,
    jobType: row.job_type,
    status: row.status as JobStatus,
    inputData: row.input_data ?? {},
    outputData: row.output_data ?? {},
    errorMessage: row.error_message,
    attempts: row.attempts ?? 0,
    maxAttempts: row.max_attempts ?? 3,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIngestionJobs(rows: readonly IngestionJobRow[]): IngestionJob[] {
  return rows.map(toIngestionJob);
}
```

**Step 3: Verify TypeScript compiles, commit**

```bash
git add src/types/ingestion.ts src/services/ingestionService.ts
git commit -m "feat(ingestion): add Ingestion types and service row mappers"
```

---

## Task 12: Ingestion Hooks

**Files:**
- Create: `src/hooks/useIngestion.ts`

**Step 1: Create the hooks file**

Providers get full CRUD. Runs get list + create (trigger). Jobs get list by runId:

```typescript
// src/hooks/useIngestion.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { IngestionProvider, IngestionRun, IngestionJob } from '@/types/ingestion';
import {
  toIngestionProvider, toIngestionProviders, type IngestionProviderRow,
  toIngestionRun, toIngestionRuns, type IngestionRunRow,
  toIngestionJobs, type IngestionJobRow,
} from '@/services/ingestionService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const ingestionKeys = {
  providers: (orgId: string) => ['ingestion-providers', orgId] as const,
  runs: (orgId: string) => ['ingestion-runs', orgId] as const,
  jobs: (runId: string) => ['ingestion-jobs', runId] as const,
};

// ─── Providers ──────────────────────────────

export function useIngestionProviders() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<IngestionProvider[]>({
    queryKey: ingestionKeys.providers(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingestion_providers')
        .select('*')
        .eq('organization_id', orgId!)
        .order('name');
      if (error) throw error;
      return toIngestionProviders((data ?? []) as unknown as IngestionProviderRow[]);
    },
  });
}

export function useCreateIngestionProvider() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: { name: string; providerType: string; config?: Record<string, unknown> }) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('ingestion_providers')
        .insert({
          organization_id: orgId,
          name: values.name,
          provider_type: values.providerType,
          config: values.config ?? {},
        })
        .select('*')
        .single();
      if (error) throw error;
      return toIngestionProvider(data as unknown as IngestionProviderRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-providers'] });
    },
  });
}

export function useUpdateIngestionProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: { name?: string; providerType?: string; isActive?: boolean; config?: Record<string, unknown> } }) => {
      const patch: Record<string, unknown> = {};
      if (values.name !== undefined) patch.name = values.name;
      if (values.providerType !== undefined) patch.provider_type = values.providerType;
      if (values.isActive !== undefined) patch.is_active = values.isActive;
      if (values.config !== undefined) patch.config = values.config;

      const { data, error } = await supabase
        .from('ingestion_providers')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toIngestionProvider(data as unknown as IngestionProviderRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-providers'] });
    },
  });
}

export function useDeleteIngestionProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingestion_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-providers'] });
    },
  });
}

// ─── Runs ───────────────────────────────────

export function useIngestionRuns(providerId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<IngestionRun[]>({
    queryKey: [...ingestionKeys.runs(orgId ?? ''), providerId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('ingestion_runs')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (providerId) query = query.eq('provider_id', providerId);
      const { data, error } = await query;
      if (error) throw error;
      return toIngestionRuns((data ?? []) as unknown as IngestionRunRow[]);
    },
  });
}

export function useTriggerIngestionRun() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (providerId: string) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('ingestion_runs')
        .insert({
          organization_id: orgId,
          provider_id: providerId,
          status: 'pending',
        })
        .select('*')
        .single();
      if (error) throw error;
      return toIngestionRun(data as unknown as IngestionRunRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-runs'] });
    },
  });
}

// ─── Jobs ───────────────────────────────────

export function useIngestionJobs(runId: string | null) {
  return useQuery<IngestionJob[]>({
    queryKey: ingestionKeys.jobs(runId ?? ''),
    enabled: !!runId,
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from('ingestion_jobs')
        .select('*')
        .eq('run_id', runId)
        .order('created_at');
      if (error) throw error;
      return toIngestionJobs((data ?? []) as unknown as IngestionJobRow[]);
    },
  });
}
```

**Step 2: Verify TypeScript compiles, commit**

```bash
git add src/hooks/useIngestion.ts
git commit -m "feat(ingestion): add Ingestion hooks for providers, runs, and jobs"
```

---

## Task 13: Ingestion Engine Page

**Files:**
- Create: `src/pages/creative/CreativeIngestion.tsx`
- Modify: `src/App.tsx` (add lazy import + route)
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` (add nav item)

**Step 1: Create `CreativeIngestion.tsx`**

This is a dashboard-style page with two tabs: Providers and Run History. Provider cards show name, type, active status, and a sync trigger button. The run history shows a table of recent runs with status badges, record counts, duration, and expandable job drill-down.

```typescript
import { useState } from 'react';
import { Plus, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { useIngestionProviders, useIngestionRuns, useIngestionJobs, useTriggerIngestionRun, useUpdateIngestionProvider, useCreateIngestionProvider, useDeleteIngestionProvider } from '@/hooks/useIngestion';
import { PROVIDER_TYPE_LABELS } from '@/types/ingestion';
import { RUN_STATUS_LABELS, RUN_STATUS_COLORS } from '@/types/ingestion';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/types/ingestion';
import type { IngestionProvider, IngestionRun } from '@/types/ingestion';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PROVIDER_TYPES } from '@/types/ingestion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

// ─── Provider Form ──────────────────────────

function ProviderFormSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('');
  const createMutation = useCreateIngestionProvider();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !providerType) return;
    try {
      await createMutation.mutateAsync({ name, providerType });
      toast({ title: 'Provider created' });
      onOpenChange(false);
      setName('');
      setProviderType('');
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Provider</SheetTitle>
          <SheetDescription>Configure a new data source for ingestion.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My LinkedIn Feed" className="mt-1" />
          </div>
          <div>
            <Label>Provider Type *</Label>
            <Select value={providerType} onValueChange={setProviderType}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>{PROVIDER_TYPE_LABELS[pt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !name || !providerType}>Create Provider</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Provider Card ──────────────────────────

function ProviderCard({ provider }: { provider: IngestionProvider }) {
  const updateMutation = useUpdateIngestionProvider();
  const deleteMutation = useDeleteIngestionProvider();
  const triggerMutation = useTriggerIngestionRun();
  const { toast } = useToast();

  async function handleToggle(checked: boolean) {
    try {
      await updateMutation.mutateAsync({ id: provider.id, values: { isActive: checked } });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await triggerMutation.mutateAsync(provider.id);
      toast({ title: 'Sync triggered', description: `Started ingestion run for ${provider.name}` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(provider.id);
      toast({ title: 'Provider deleted' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{provider.name}</h3>
          <Badge variant="outline" className="text-xs mt-1">
            {PROVIDER_TYPE_LABELS[provider.providerType] ?? provider.providerType}
          </Badge>
        </div>
        <Switch checked={provider.isActive} onCheckedChange={handleToggle} />
      </div>
      {provider.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last sync: {new Date(provider.lastSyncAt).toLocaleString()}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1" onClick={handleSync} disabled={!provider.isActive || triggerMutation.isPending}>
          <Play className="h-3.5 w-3.5" />
          Sync Now
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete provider?</AlertDialogTitle>
              <AlertDialogDescription>This will delete "{provider.name}" and all its run history.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Run Row (expandable) ───────────────────

function RunRow({ run, providerName }: { run: IngestionRun; providerName: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: jobs = [] } = useIngestionJobs(expanded ? run.id : null);
  const statusColors = RUN_STATUS_COLORS[run.status];
  const duration = run.startedAt && run.completedAt
    ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
    : '—';

  return (
    <div className="border rounded-lg">
      <button
        className="w-full flex items-center gap-4 p-3 text-sm hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0`}>
          {RUN_STATUS_LABELS[run.status]}
        </Badge>
        <span className="font-medium truncate">{providerName}</span>
        <span className="text-muted-foreground text-xs ml-auto shrink-0">{duration}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {run.recordsProcessed} processed · {run.recordsCreated} new · {run.recordsFailed} failed
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(run.createdAt).toLocaleString()}
        </span>
      </button>
      {expanded && (
        <div className="border-t p-3 space-y-2 bg-muted/20">
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No jobs for this run.</p>
          ) : (
            jobs.map((job) => {
              const jColors = JOB_STATUS_COLORS[job.status];
              return (
                <div key={job.id} className="flex items-center gap-3 text-xs p-2 rounded bg-background border">
                  <Badge variant="secondary" className={`${jColors.bg} ${jColors.text} border-0 text-xs`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </Badge>
                  <span className="font-medium">{job.jobType}</span>
                  <span className="text-muted-foreground">Attempt {job.attempts}/{job.maxAttempts}</span>
                  {job.errorMessage && (
                    <span className="text-destructive truncate ml-auto">{job.errorMessage}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────

export default function CreativeIngestion() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: providers = [], isLoading: loadingProviders } = useIngestionProviders();
  const { data: runs = [], isLoading: loadingRuns } = useIngestionRuns();

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]));

  return (
    <WorkspaceContainer
      title="Ingestion Engine"
      description="Connect external data sources and monitor sync runs"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Provider</span>
        </Button>
      }
    >
      <Tabs defaultValue="providers" className="mt-2">
        <TabsList>
          <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="runs">Run History ({runs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-4">
          {loadingProviders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No providers configured. Click "Add Provider" to connect a data source.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          {loadingRuns ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No runs yet. Trigger a sync from the Providers tab.
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <RunRow key={run.id} run={run} providerName={providerMap[run.providerId] ?? 'Unknown'} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProviderFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
```

**Step 2: Add lazy import and route to `src/App.tsx`**

Add lazy import:
```typescript
const CreativeIngestion = lazy(() => import('@/pages/creative/CreativeIngestion'));
```

Add route in creative group:
```typescript
<Route path="ingestion" element={<CreativeIngestion />} />
```

**Step 3: Add sidebar nav item to `src/components/creative/layout/CreativeSidebar.tsx`**

Import `Download` from lucide-react. Add after Style Intelligence in `mainNavItems`:

```typescript
{ label: 'Ingestion', icon: Download, path: '/creative/ingestion' },
```

**Step 4: Verify full build**

Run: `npx tsc --noEmit && npx vite build`

**Step 5: Commit and push**

```bash
git add src/pages/creative/CreativeIngestion.tsx src/App.tsx src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat(ingestion): add Ingestion Engine page with providers, runs, and job drill-down"
git push origin main
```

---

## Summary of all files created/modified

### New files (16):
- `src/services/creativeContactService.ts`
- `src/services/creativePortfolioService.ts`
- `src/services/ingestionService.ts`
- `src/hooks/useCreativeContacts.ts`
- `src/hooks/useCreativePortfolios.ts`
- `src/hooks/useIngestion.ts`
- `src/types/ingestion.ts`
- `src/components/creative/contacts/contact-columns.tsx`
- `src/components/creative/contacts/ContactCard.tsx`
- `src/components/creative/contacts/ContactFormSheet.tsx`
- `src/components/creative/contacts/ContactDetail.tsx`
- `src/components/creative/portfolios/portfolio-columns.tsx`
- `src/components/creative/portfolios/PortfolioCard.tsx`
- `src/components/creative/portfolios/PortfolioFormSheet.tsx`
- `src/components/creative/portfolios/PortfolioDetail.tsx`
- `src/pages/creative/CreativeContacts.tsx`
- `src/pages/creative/CreativePortfolios.tsx`
- `src/pages/creative/CreativeIngestion.tsx`

### Modified files (4):
- `src/types/creative.ts` — Contact + Portfolio types added
- `src/lib/creative-schemas.ts` — Contact + Portfolio Zod schemas added
- `src/App.tsx` — 3 new lazy imports + 3 new routes
- `src/components/creative/layout/CreativeSidebar.tsx` — 2 new nav items (Contacts, Ingestion)
