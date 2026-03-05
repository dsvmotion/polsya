import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import type { CreativePortfolio } from '@/types/creative';
import type { PortfolioFormValues } from '@/lib/creative-schemas';
import { toCreativePortfolio, toCreativePortfolios, type CreativePortfolioRow } from '@/services/creativePortfolioService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const portfoliosKeys = {
  all: (orgId: string) => ['creative-portfolios', orgId] as const,
  detail: (id: string) => ['creative-portfolio', id] as const,
};

export function useCreativePortfolios(filters?: { clientId?: string; projectId?: string }) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativePortfolio[]>({
    queryKey: [...portfoliosKeys.all(orgId ?? ''), filters?.clientId ?? '', filters?.projectId ?? ''],
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('creative_portfolios')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (filters?.clientId) query = query.eq('client_id', filters.clientId);
      if (filters?.projectId) query = query.eq('project_id', filters.projectId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativePortfolios((data ?? []) as unknown as CreativePortfolioRow[]);
    },
  });
}

export function useCreativePortfolio(id: string | null) {
  return useQuery<CreativePortfolio | null>({
    queryKey: portfoliosKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await fromTable('creative_portfolios')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativePortfolio(data as unknown as CreativePortfolioRow);
    },
  });
}

export function useCreateCreativePortfolio() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: PortfolioFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const mediaUrls = values.mediaUrls
        ? values.mediaUrls.split(',').map((u) => u.trim()).filter(Boolean)
        : [];
      const { data, error } = await fromTable('creative_portfolios')
        .insert({
          organization_id: orgId,
          title: values.title,
          description: values.description || null,
          category: values.category || null,
          media_urls: mediaUrls,
          thumbnail_url: values.thumbnailUrl || null,
          is_public: values.isPublic ?? false,
          project_id: values.projectId || null,
          client_id: values.clientId || null,
          tags: values.tags ?? [],
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativePortfolio(data as unknown as CreativePortfolioRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-portfolios'] });
    },
  });
}

export function useUpdateCreativePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<PortfolioFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.title !== undefined) patch.title = values.title;
      if (values.description !== undefined) patch.description = values.description || null;
      if (values.category !== undefined) patch.category = values.category || null;
      if (values.mediaUrls !== undefined) {
        patch.media_urls = values.mediaUrls
          ? values.mediaUrls.split(',').map((u) => u.trim()).filter(Boolean)
          : [];
      }
      if (values.thumbnailUrl !== undefined) patch.thumbnail_url = values.thumbnailUrl || null;
      if (values.isPublic !== undefined) patch.is_public = values.isPublic;
      if (values.projectId !== undefined) patch.project_id = values.projectId || null;
      if (values.clientId !== undefined) patch.client_id = values.clientId || null;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await fromTable('creative_portfolios')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativePortfolio(data as unknown as CreativePortfolioRow);
    },
    onSuccess: (portfolio) => {
      queryClient.invalidateQueries({ queryKey: ['creative-portfolios'] });
      queryClient.setQueryData(portfoliosKeys.detail(portfolio.id), portfolio);
    },
  });
}

export function useDeleteCreativePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('creative_portfolios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-portfolios'] });
    },
  });
}
