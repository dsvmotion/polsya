import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/integrations/supabase/helpers';
import type { EnrichmentCredit, EnrichmentRecipe, EnrichmentRun } from '@/types/enrichment-engine';
import type { EnrichmentRecipeFormValues } from '@/lib/creative-schemas';
import {
  toEnrichmentCredits, type EnrichmentCreditRow,
  toEnrichmentRecipe, toEnrichmentRecipes, type EnrichmentRecipeRow,
  toEnrichmentRun, toEnrichmentRuns, type EnrichmentRunRow,
} from '@/services/enrichmentService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const enrichmentKeys = {
  credits: (orgId: string) => ['enrichment-credits', orgId] as const,
  recipes: (orgId: string) => ['enrichment-recipes', orgId] as const,
  runs: (orgId: string) => ['enrichment-runs', orgId] as const,
};

// ─── Credits ─────────────────────────────────

export function useEnrichmentCredits() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<EnrichmentCredit[]>({
    queryKey: enrichmentKeys.credits(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await fromTable('enrichment_credits')
        .select('*')
        .eq('organization_id', orgId!)
        .order('provider');
      if (error) throw error;
      return toEnrichmentCredits((data ?? []) as unknown as EnrichmentCreditRow[]);
    },
  });
}

// ─── Recipes ─────────────────────────────────

export function useEnrichmentRecipes() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<EnrichmentRecipe[]>({
    queryKey: enrichmentKeys.recipes(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await fromTable('enrichment_recipes')
        .select('*')
        .eq('organization_id', orgId!)
        .order('name');
      if (error) throw error;
      return toEnrichmentRecipes((data ?? []) as unknown as EnrichmentRecipeRow[]);
    },
  });
}

export function useCreateEnrichmentRecipe() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: EnrichmentRecipeFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');

      const steps = values.steps ? JSON.parse(values.steps) : [];

      const { data, error } = await fromTable('enrichment_recipes')
        .insert({
          organization_id: orgId,
          name: values.name,
          description: values.description || null,
          target_entity_type: values.targetEntityType,
          steps,
          is_active: values.isActive ?? true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toEnrichmentRecipe(data as unknown as EnrichmentRecipeRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-recipes'] });
    },
  });
}

export function useUpdateEnrichmentRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<EnrichmentRecipeFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.name !== undefined) patch.name = values.name;
      if (values.description !== undefined) patch.description = values.description || null;
      if (values.targetEntityType !== undefined) patch.target_entity_type = values.targetEntityType;
      if (values.steps !== undefined) patch.steps = values.steps ? JSON.parse(values.steps) : [];
      if (values.isActive !== undefined) patch.is_active = values.isActive;

      const { data, error } = await fromTable('enrichment_recipes')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toEnrichmentRecipe(data as unknown as EnrichmentRecipeRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-recipes'] });
    },
  });
}

export function useDeleteEnrichmentRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('enrichment_recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-recipes'] });
    },
  });
}

// ─── Runs ────────────────────────────────────

export function useEnrichmentRuns(recipeId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<EnrichmentRun[]>({
    queryKey: [...enrichmentKeys.runs(orgId ?? ''), recipeId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('enrichment_runs')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (recipeId) query = query.eq('recipe_id', recipeId);
      const { data, error } = await query;
      if (error) throw error;
      return toEnrichmentRuns((data ?? []) as unknown as EnrichmentRunRow[]);
    },
  });
}

export function useTriggerEnrichmentRun() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ recipeId, entityType, entityIds }: { recipeId: string; entityType: string; entityIds: string[] }) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');

      const { data, error } = await fromTable('enrichment_runs')
        .insert({
          organization_id: orgId,
          recipe_id: recipeId,
          entity_type: entityType,
          entity_ids: entityIds,
          status: 'pending',
        })
        .select('*')
        .single();
      if (error) throw error;

      const run = toEnrichmentRun(data as unknown as EnrichmentRunRow);

      // Fire-and-forget: invoke Edge Function to process the run
      supabase.functions.invoke('process-enrichment-run', {
        body: { runId: run.id },
      }).catch((err: Error) => {
        console.error('Edge Function invocation failed:', err.message);
      });

      return run;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-runs'] });
    },
  });
}
