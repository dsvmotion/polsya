import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ResolutionCandidate, ResolutionStatus, EntitySourceMapping } from '@/types/entity-resolution';
import {
  toResolutionCandidates, type ResolutionCandidateRow,
  toEntitySourceMappings, type EntitySourceMappingRow,
} from '@/services/entityResolutionService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const resolutionKeys = {
  candidates: (orgId: string) => ['resolution-candidates', orgId] as const,
  mappings: (orgId: string) => ['entity-source-mappings', orgId] as const,
};

// ─── Candidates ──────────────────────────────

export function useResolutionCandidates(statusFilter?: ResolutionStatus) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<ResolutionCandidate[]>({
    queryKey: [...resolutionKeys.candidates(orgId ?? ''), statusFilter ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('entity_resolution_candidates')
        .select('*')
        .eq('organization_id', orgId!)
        .order('confidence_score', { ascending: false });
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return toResolutionCandidates((data ?? []) as unknown as ResolutionCandidateRow[]);
    },
  });
}

export function useResolveCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'confirmed' | 'rejected' }) => {
      const { error } = await supabase
        .from('entity_resolution_candidates')
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolution-candidates'] });
    },
  });
}

// ─── Source Mappings ─────────────────────────

export function useEntitySourceMappings(entityType?: string, entityId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<EntitySourceMapping[]>({
    queryKey: [...resolutionKeys.mappings(orgId ?? ''), entityType ?? 'all', entityId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('entity_source_mappings')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (entityType) query = query.eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);
      const { data, error } = await query;
      if (error) throw error;
      return toEntitySourceMappings((data ?? []) as unknown as EntitySourceMappingRow[]);
    },
  });
}
