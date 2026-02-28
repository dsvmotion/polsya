import type { OpportunityStage } from '@/types/pharmacy';

export interface OpportunityInput {
  amount: number;
  probability: number;
  stage: OpportunityStage;
}

export interface PipelineSummary {
  totalPipeline: number;
  weightedForecast: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
}

const CLOSED_STAGES: ReadonlySet<OpportunityStage> = new Set(['won', 'lost']);

export function isOpenOpportunity(stage: OpportunityStage): boolean {
  return !CLOSED_STAGES.has(stage);
}

export function calculateWeightedAmount(amount: number, probability: number): number {
  return (amount * probability) / 100;
}

export function summarizePipeline(opportunities: readonly OpportunityInput[]): PipelineSummary {
  let totalPipeline = 0;
  let weightedForecast = 0;
  let openCount = 0;
  let wonCount = 0;
  let lostCount = 0;

  for (const opp of opportunities) {
    if (opp.stage === 'won') {
      wonCount++;
    } else if (opp.stage === 'lost') {
      lostCount++;
    } else {
      openCount++;
      totalPipeline += opp.amount;
      weightedForecast += calculateWeightedAmount(opp.amount, opp.probability);
    }
  }

  return { totalPipeline, weightedForecast, openCount, wonCount, lostCount };
}
