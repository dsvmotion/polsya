import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OpportunityStage } from '@/types/pharmacy';

interface PipelineSummary {
  totalPipeline: number;
  weightedForecast: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
}

export function usePipelineSummary() {
  return useQuery<PipelineSummary>({
    queryKey: ['pipeline-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_opportunities')
        .select('amount, probability, stage');

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as { amount: number; probability: number; stage: OpportunityStage }[];

      let totalPipeline = 0;
      let weightedForecast = 0;
      let openCount = 0;
      let wonCount = 0;
      let lostCount = 0;

      for (const r of rows) {
        if (r.stage === 'won') {
          wonCount++;
        } else if (r.stage === 'lost') {
          lostCount++;
        } else {
          openCount++;
          totalPipeline += r.amount;
          weightedForecast += (r.amount * r.probability) / 100;
        }
      }

      return { totalPipeline, weightedForecast, openCount, wonCount, lostCount };
    },
    staleTime: 30_000,
  });
}
