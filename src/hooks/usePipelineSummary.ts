import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { summarizePipeline, type PipelineSummary, type OpportunityInput } from '@/services/pipelineService';

export function usePipelineSummary() {
  return useQuery<PipelineSummary>({
    queryKey: ['pipeline-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_opportunities')
        .select('amount, probability, stage');

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as OpportunityInput[];

      return summarizePipeline(rows);
    },
    staleTime: 30_000,
  });
}
