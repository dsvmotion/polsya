import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PharmacyActivity, ActivityType } from '@/types/pharmacy';
import { toAccountActivity, toAccountActivities, type ActivityRow } from '@/services/activityService';

function activitiesKey(pharmacyId: string) {
  return ['pharmacy-activities', pharmacyId] as const;
}

export function usePharmacyActivities(pharmacyId: string | null) {
  return useQuery<PharmacyActivity[]>({
    queryKey: activitiesKey(pharmacyId ?? ''),
    enabled: !!pharmacyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_activities')
        .select('*')
        .eq('pharmacy_id', pharmacyId!)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return toAccountActivities((data ?? []) as ActivityRow[]);
    },
  });
}

interface CreateActivityInput {
  pharmacyId: string;
  activityType: ActivityType;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  owner?: string | null;
}

export function useCreatePharmacyActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data, error } = await supabase
        .from('pharmacy_activities')
        .insert({
          pharmacy_id: input.pharmacyId,
          activity_type: input.activityType,
          title: input.title,
          description: input.description ?? null,
          due_at: input.dueAt ?? null,
          owner: input.owner ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return toAccountActivity(data as ActivityRow);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: activitiesKey(variables.pharmacyId) });
    },
  });
}

interface UpdateActivityInput {
  id: string;
  pharmacyId: string;
  updates: {
    activity_type?: ActivityType;
    title?: string;
    description?: string | null;
    due_at?: string | null;
    completed_at?: string | null;
    owner?: string | null;
  };
}

export function useUpdatePharmacyActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateActivityInput) => {
      const { data, error } = await supabase
        .from('pharmacy_activities')
        .update(input.updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return toAccountActivity(data as ActivityRow);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: activitiesKey(variables.pharmacyId) });
    },
  });
}

interface DeleteActivityInput {
  id: string;
  pharmacyId: string;
}

export function useDeletePharmacyActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteActivityInput) => {
      const { error } = await supabase
        .from('pharmacy_activities')
        .delete()
        .eq('id', input.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: activitiesKey(variables.pharmacyId) });
    },
  });
}

interface CompleteActivityInput {
  id: string;
  pharmacyId: string;
}

export function useCompletePharmacyActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteActivityInput) => {
      const { data, error } = await supabase
        .from('pharmacy_activities')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return toAccountActivity(data as ActivityRow);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: activitiesKey(variables.pharmacyId) });
    },
  });
}
