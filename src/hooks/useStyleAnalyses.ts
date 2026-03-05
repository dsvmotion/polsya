import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rpcCall } from '@/integrations/supabase/helpers';
import type { StyleAnalysis } from '@/types/style-intelligence';
import type { StyleAnalysisFormValues } from '@/lib/creative-schemas';
import { toStyleAnalysis, toStyleAnalyses, type StyleAnalysisRow } from '@/services/styleAnalysisService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const styleKeys = {
  all: (orgId: string) => ['style-analyses', orgId] as const,
  detail: (id: string) => ['style-analysis', id] as const,
};

export function useStyleAnalyses(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<StyleAnalysis[]>({
    queryKey: [...styleKeys.all(orgId ?? ''), clientId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('creative_style_analyses')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toStyleAnalyses((data ?? []) as unknown as StyleAnalysisRow[]);
    },
  });
}

export function useStyleAnalysis(id: string | null) {
  return useQuery<StyleAnalysis | null>({
    queryKey: styleKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_style_analyses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toStyleAnalysis(data as unknown as StyleAnalysisRow);
    },
  });
}

export function useCreateStyleAnalysis() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: StyleAnalysisFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');

      const colorPalette = values.colorPalette ? JSON.parse(values.colorPalette) : [];
      const typographyProfile = values.typographyProfile ? JSON.parse(values.typographyProfile) : {};
      const brandAttributes = values.brandAttributes ? JSON.parse(values.brandAttributes) : {};

      const { data, error } = await supabase
        .from('creative_style_analyses')
        .insert({
          organization_id: orgId,
          client_id: values.clientId || null,
          portfolio_id: values.portfolioId || null,
          source_url: values.sourceUrl || null,
          color_palette: colorPalette,
          typography_profile: typographyProfile,
          brand_attributes: brandAttributes,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toStyleAnalysis(data as unknown as StyleAnalysisRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-analyses'] });
    },
  });
}

export function useUpdateStyleAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<StyleAnalysisFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.clientId !== undefined) patch.client_id = values.clientId || null;
      if (values.portfolioId !== undefined) patch.portfolio_id = values.portfolioId || null;
      if (values.sourceUrl !== undefined) patch.source_url = values.sourceUrl || null;
      if (values.colorPalette !== undefined) patch.color_palette = values.colorPalette ? JSON.parse(values.colorPalette) : [];
      if (values.typographyProfile !== undefined) patch.typography_profile = values.typographyProfile ? JSON.parse(values.typographyProfile) : {};
      if (values.brandAttributes !== undefined) patch.brand_attributes = values.brandAttributes ? JSON.parse(values.brandAttributes) : {};

      const { data, error } = await supabase
        .from('creative_style_analyses')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toStyleAnalysis(data as unknown as StyleAnalysisRow);
    },
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ['style-analyses'] });
      queryClient.setQueryData(styleKeys.detail(analysis.id), analysis);
    },
  });
}

export function useDeleteStyleAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_style_analyses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-analyses'] });
    },
  });
}

export function useStyleSimilarity(analysisId: string | null) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery({
    queryKey: ['style-similarity', orgId ?? '', analysisId ?? ''],
    enabled: !!orgId && !!analysisId,
    queryFn: async () => {
      const { data, error } = await rpcCall('match_style_analyses', {
        query_analysis_id: analysisId,
        match_count: 10,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        client_id: string | null;
        portfolio_id: string | null;
        similarity: number;
        color_palette: unknown;
        confidence_score: number | null;
      }>;
    },
  });
}
