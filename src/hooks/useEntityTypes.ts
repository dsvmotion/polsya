import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EntityTypeDefinition } from '@/types/entity';

function mapEntityTypeRow(row: {
  id: string;
  organization_id: string | null;
  key: string;
  label: string;
  color: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}): EntityTypeDefinition {
  return {
    id: row.id,
    organizationId: row.organization_id,
    key: row.key,
    label: row.label,
    color: row.color,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useEntityTypes() {
  return useQuery<EntityTypeDefinition[]>({
    queryKey: ['entity-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_types')
        .select('*')
        .order('is_default', { ascending: false })
        .order('label', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map(mapEntityTypeRow);
    },
  });
}

export function resolveEntityTypeLabel(
  typeKey: string | null | undefined,
  entityTypes: readonly EntityTypeDefinition[] | undefined,
  fallback = 'Entity',
): string {
  if (!typeKey) return fallback;
  const found = entityTypes?.find((t) => t.key === typeKey);
  return found?.label ?? typeKey;
}
