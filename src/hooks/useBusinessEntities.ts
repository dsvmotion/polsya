import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BusinessEntity, EntityTypeKey } from '@/types/entity';
import type { ClientType, Pharmacy } from '@/types/pharmacy';
import { toBusinessEntity, toBusinessEntities, toLegacyPharmacyPatch } from '@/services/entityService';

function toLegacyClientType(typeKey?: EntityTypeKey): ClientType | undefined {
  if (typeKey === 'pharmacy' || typeKey === 'herbalist') return typeKey;
  return undefined;
}

export function useBusinessEntities(entityTypeKey?: EntityTypeKey) {
  const legacyType = toLegacyClientType(entityTypeKey);

  return useQuery<BusinessEntity[]>({
    queryKey: ['business-entities', entityTypeKey ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      if (legacyType) {
        query = query.eq('client_type', legacyType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return toBusinessEntities((data ?? []) as Pharmacy[]);
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
      return toBusinessEntity(data as Pharmacy);
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
        .update(toLegacyPharmacyPatch(input.updates))
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw error;
      return toBusinessEntity(data as Pharmacy);
    },
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ['business-entities'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.setQueryData(['business-entity', entity.id], entity);
      queryClient.invalidateQueries({ queryKey: ['pharmacy', entity.id] });
    },
  });
}
