import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BusinessEntity, EntityTypeKey } from '@/types/entity';
import { toBusinessEntity, toBusinessEntities, toLegacyPatch } from '@/services/entityService';

export function useBusinessEntities(entityTypeKey?: EntityTypeKey) {
  return useQuery<BusinessEntity[]>({
    queryKey: ['business-entities', entityTypeKey ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      if (entityTypeKey) {
        query = query.eq('client_type', entityTypeKey);
      }

      const { data, error } = await query;
      if (error) throw error;

      return toBusinessEntities(data ?? []);
    },
  });
}

export function useBusinessEntity(id: string | null) {
  return useQuery<BusinessEntity | null>({
    queryKey: ['business-entity', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return toBusinessEntity(data);
    },
  });
}

interface UpdateBusinessEntityInput {
  id: string;
  updates: Partial<Pick<BusinessEntity, 'status' | 'notes' | 'email' | 'phone' | 'website'>>;
}

export function useUpdateBusinessEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBusinessEntityInput) => {
      const { data, error } = await supabase
        .from('pharmacies')
        .update(toLegacyPatch(input.updates))
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw error;
      return toBusinessEntity(data);
    },
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ['business-entities'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.setQueryData(['business-entity', entity.id], entity);
      queryClient.invalidateQueries({ queryKey: ['pharmacy', entity.id] });
    },
  });
}
