import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SignalRule, Signal, SignalStatus } from '@/types/signal-engine';
import type { SignalRuleFormValues } from '@/lib/creative-schemas';
import { toSignalRule, toSignalRules, type SignalRuleRow, toSignal, toSignals, type SignalRow } from '@/services/signalService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const signalKeys = {
  rules: (orgId: string) => ['signal-rules', orgId] as const,
  signals: (orgId: string) => ['signals', orgId] as const,
  signalDetail: (id: string) => ['signal', id] as const,
};

// ─── Rules ───────────────────────────────────

export function useSignalRules() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<SignalRule[]>({
    queryKey: signalKeys.rules(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signal_rules')
        .select('*')
        .eq('organization_id', orgId!)
        .order('priority', { ascending: false });
      if (error) throw error;
      return toSignalRules((data ?? []) as unknown as SignalRuleRow[]);
    },
  });
}

export function useCreateSignalRule() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: SignalRuleFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');

      const conditions = values.conditions ? JSON.parse(values.conditions) : {};
      const actions = values.actions ? JSON.parse(values.actions) : [];

      const { data, error } = await supabase
        .from('signal_rules')
        .insert({
          organization_id: orgId,
          name: values.name,
          description: values.description || null,
          rule_type: values.ruleType,
          conditions,
          actions,
          priority: values.priority ?? 0,
          is_active: values.isActive ?? true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toSignalRule(data as unknown as SignalRuleRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signal-rules'] });
    },
  });
}

export function useUpdateSignalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<SignalRuleFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.name !== undefined) patch.name = values.name;
      if (values.description !== undefined) patch.description = values.description || null;
      if (values.ruleType !== undefined) patch.rule_type = values.ruleType;
      if (values.conditions !== undefined) patch.conditions = values.conditions ? JSON.parse(values.conditions) : {};
      if (values.actions !== undefined) patch.actions = values.actions ? JSON.parse(values.actions) : [];
      if (values.priority !== undefined) patch.priority = values.priority;
      if (values.isActive !== undefined) patch.is_active = values.isActive;

      const { data, error } = await supabase
        .from('signal_rules')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toSignalRule(data as unknown as SignalRuleRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signal-rules'] });
    },
  });
}

export function useDeleteSignalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('signal_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signal-rules'] });
    },
  });
}

// ─── Signals ─────────────────────────────────

export function useSignals(filters?: { status?: SignalStatus; severity?: string; entityType?: string }) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<Signal[]>({
    queryKey: [...signalKeys.signals(orgId ?? ''), filters ?? {}],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('signals')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.severity) query = query.eq('severity', filters.severity);
      if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
      const { data, error } = await query;
      if (error) throw error;
      return toSignals((data ?? []) as unknown as SignalRow[]);
    },
  });
}

export function useUpdateSignalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SignalStatus }) => {
      const patch: Record<string, unknown> = { status };
      if (status === 'seen') patch.seen_at = new Date().toISOString();
      if (status === 'actioned') patch.actioned_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('signals')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toSignal(data as unknown as SignalRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
  });
}

// ─── Recent Signals ─────────────────────────

export function useRecentSignals(limit: number = 5) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<Signal[]>({
    queryKey: [...signalKeys.signals(orgId ?? ''), 'recent', limit],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('creative_signals')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return toSignals((data ?? []) as unknown as SignalRow[]);
    },
  });
}
