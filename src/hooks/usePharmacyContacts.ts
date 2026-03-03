import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PharmacyContact, ContactRole } from '@/types/pharmacy';
import { toAccountContact, toAccountContacts, type ContactRow } from '@/services/contactService';

function contactsKey(pharmacyId: string) {
  return ['pharmacy-contacts', pharmacyId] as const;
}

export function usePharmacyContacts(pharmacyId: string | null) {
  return useQuery<PharmacyContact[]>({
    queryKey: contactsKey(pharmacyId ?? ''),
    enabled: !!pharmacyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_contacts')
        .select('*')
        .eq('pharmacy_id', pharmacyId!)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return toAccountContacts((data ?? []) as ContactRow[]);
    },
  });
}

interface CreateContactInput {
  pharmacyId: string;
  name: string;
  role?: ContactRole | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
}

export function useCreatePharmacyContact() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data, error } = await supabase
        .from('pharmacy_contacts')
        .insert({
          pharmacy_id: input.pharmacyId,
          name: input.name,
          role: input.role ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          is_primary: input.isPrimary ?? false,
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return toAccountContact(data as ContactRow);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: contactsKey(variables.pharmacyId) });
    },
  });
}

interface UpdateContactInput {
  id: string;
  pharmacyId: string;
  updates: {
    name?: string;
    role?: ContactRole | null;
    email?: string | null;
    phone?: string | null;
    is_primary?: boolean;
    notes?: string | null;
  };
}

export function useUpdatePharmacyContact() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const { data, error } = await supabase
        .from('pharmacy_contacts')
        .update({ ...input.updates, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return toAccountContact(data as ContactRow);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: contactsKey(variables.pharmacyId) });
    },
  });
}

interface DeleteContactInput {
  id: string;
  pharmacyId: string;
}

export function useDeletePharmacyContact() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteContactInput) => {
      const { error } = await supabase
        .from('pharmacy_contacts')
        .delete()
        .eq('id', input.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: contactsKey(variables.pharmacyId) });
    },
  });
}
