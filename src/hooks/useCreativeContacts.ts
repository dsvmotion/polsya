import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
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
      let query = fromTable('creative_contacts')
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
      const { data, error } = await fromTable('creative_contacts')
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
      const { data, error } = await fromTable('creative_contacts')
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

      const { data, error } = await fromTable('creative_contacts')
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
      const { error } = await fromTable('creative_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-contacts'] });
    },
  });
}
