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

const DEFAULT_ENTITY_TYPES: EntityTypeDefinition[] = [
  { id: 'default-pharmacy', organizationId: null, key: 'pharmacy', label: 'Pharmacy', color: '#334155', isDefault: true, createdAt: '', updatedAt: '' },
  { id: 'default-herbalist', organizationId: null, key: 'herbalist', label: 'Herbalist', color: '#7c3aed', isDefault: false, createdAt: '', updatedAt: '' },
];

export function useEntityTypes() {
  return useQuery<EntityTypeDefinition[]>({
    queryKey: ['entity-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_types')
        .select('*')
        .order('is_default', { ascending: false })
        .order('label', { ascending: true });

      if (error) {
        const msg = (error.message ?? '').toLowerCase();
        if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('relation') && msg.includes('exist')) {
          console.warn('entity_types table not found (run migrations: supabase db push). Using defaults.');
          return DEFAULT_ENTITY_TYPES;
        }
        throw new Error(error.message);
      }
      const rows = (data ?? []) as Parameters<typeof mapEntityTypeRow>[0][];
      return rows.length > 0 ? rows.map(mapEntityTypeRow) : DEFAULT_ENTITY_TYPES;
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
