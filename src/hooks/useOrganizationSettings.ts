import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Organization } from '@/types/organization';

export interface UpdateOrganizationSettingsInput {
  organizationId: string;
  updates: {
    name?: string;
    logo_url?: string | null;
    primary_color?: string;
    locale?: string;
    timezone?: string;
    currency?: string;
    entity_label_singular?: string;
    entity_label_plural?: string;
  };
}

export function useUpdateOrganizationSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrganizationSettingsInput) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(input.updates)
        .eq('id', input.organizationId)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data as Organization;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['organization', data.id] });
      qc.invalidateQueries({ queryKey: ['organization-membership', 'current'] });
    },
  });
}
