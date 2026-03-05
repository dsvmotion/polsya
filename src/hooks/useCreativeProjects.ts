// src/hooks/useCreativeProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import type { CreativeProject } from '@/types/creative';
import type { ProjectFormValues } from '@/lib/creative-schemas';
import { toCreativeProject, toCreativeProjects, type CreativeProjectRow } from '@/services/creativeProjectService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const projectsKeys = {
  all: (orgId: string) => ['creative-projects', orgId] as const,
  byClient: (clientId: string) => ['creative-projects', 'client', clientId] as const,
  detail: (id: string) => ['creative-project', id] as const,
};

export function useCreativeProjects(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeProject[]>({
    queryKey: clientId ? projectsKeys.byClient(clientId) : projectsKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('creative_projects')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativeProjects((data ?? []) as unknown as CreativeProjectRow[]);
    },
  });
}

export function useCreativeProject(id: string | null) {
  return useQuery<CreativeProject | null>({
    queryKey: projectsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await fromTable('creative_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeProject(data as unknown as CreativeProjectRow);
    },
  });
}

export function useCreateCreativeProject() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await fromTable('creative_projects')
        .insert({
          organization_id: orgId,
          name: values.name,
          client_id: values.clientId,
          project_type: values.projectType,
          status: values.status,
          budget_cents: values.budgetCents,
          currency: values.currency,
          start_date: values.startDate,
          end_date: values.endDate,
          description: values.description,
          tags: values.tags,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeProject(data as unknown as CreativeProjectRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
    },
  });
}

export function useUpdateCreativeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ProjectFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.name !== undefined) patch.name = values.name;
      if (values.clientId !== undefined) patch.client_id = values.clientId;
      if (values.projectType !== undefined) patch.project_type = values.projectType;
      if (values.status !== undefined) patch.status = values.status;
      if (values.budgetCents !== undefined) patch.budget_cents = values.budgetCents;
      if (values.currency !== undefined) patch.currency = values.currency;
      if (values.startDate !== undefined) patch.start_date = values.startDate;
      if (values.endDate !== undefined) patch.end_date = values.endDate;
      if (values.description !== undefined) patch.description = values.description;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await fromTable('creative_projects')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeProject(data as unknown as CreativeProjectRow);
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
      queryClient.setQueryData(projectsKeys.detail(project.id), project);
    },
  });
}

export function useDeleteCreativeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('creative_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
    },
  });
}
