import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SavedSegment, SegmentScope, OperationsFilters } from '@/types/operations';

function segmentsKey(scope: SegmentScope) {
  return ['saved-segments', scope] as const;
}

export function useSavedSegments(scope: SegmentScope = 'operations') {
  return useQuery<SavedSegment[]>({
    queryKey: segmentsKey(scope),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_segments')
        .select('*')
        .eq('scope', scope)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as SavedSegment[];
    },
  });
}

interface CreateSegmentInput {
  name: string;
  scope: SegmentScope;
  filters: OperationsFilters;
  description?: string | null;
}

export function useCreateSavedSegment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSegmentInput) => {
      const { data, error } = await supabase
        .from('saved_segments')
        .insert({
          name: input.name,
          scope: input.scope,
          filters: input.filters as unknown as import('@/integrations/supabase/types').Json,
          description: input.description ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as SavedSegment;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: segmentsKey(variables.scope) });
    },
  });
}

interface UpdateSegmentInput {
  id: string;
  scope: SegmentScope;
  updates: {
    name?: string;
    description?: string | null;
    filters?: OperationsFilters;
    is_favorite?: boolean;
  };
}

export function useUpdateSavedSegment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSegmentInput) => {
      const payload: Record<string, unknown> = {};
      if (input.updates.name !== undefined) payload.name = input.updates.name;
      if (input.updates.description !== undefined) payload.description = input.updates.description;
      if (input.updates.filters !== undefined) payload.filters = input.updates.filters;
      if (input.updates.is_favorite !== undefined) payload.is_favorite = input.updates.is_favorite;

      const { data, error } = await supabase
        .from('saved_segments')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as SavedSegment;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: segmentsKey(variables.scope) });
    },
  });
}

export function useDeleteSavedSegment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scope }: { id: string; scope: SegmentScope }) => {
      const { error } = await supabase
        .from('saved_segments')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return scope;
    },
    onSuccess: (scope) => {
      qc.invalidateQueries({ queryKey: segmentsKey(scope) });
    },
  });
}

export function useToggleFavoriteSegment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scope, is_favorite }: { id: string; scope: SegmentScope; is_favorite: boolean }) => {
      const { data, error } = await supabase
        .from('saved_segments')
        .update({ is_favorite })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { data: data as unknown as SavedSegment, scope };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: segmentsKey(result.scope) });
    },
  });
}
