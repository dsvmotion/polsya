import { describe, it, expect } from 'vitest';
import {
  isOpenOpportunity,
  calculateWeightedAmount,
  summarizePipeline,
} from '../services/pipelineService';

describe('isOpenOpportunity', () => {
  it('returns true for qualified', () => {
    expect(isOpenOpportunity('qualified')).toBe(true);
  });

  it('returns true for proposal', () => {
    expect(isOpenOpportunity('proposal')).toBe(true);
  });

  it('returns true for negotiation', () => {
    expect(isOpenOpportunity('negotiation')).toBe(true);
  });

  it('returns false for won', () => {
    expect(isOpenOpportunity('won')).toBe(false);
  });

  it('returns false for lost', () => {
    expect(isOpenOpportunity('lost')).toBe(false);
  });
});

describe('calculateWeightedAmount', () => {
  it('returns 0 when probability is 0', () => {
    expect(calculateWeightedAmount(1000, 0)).toBe(0);
  });

  it('returns full amount when probability is 100', () => {
    expect(calculateWeightedAmount(5000, 100)).toBe(5000);
  });

  it('returns half amount at 50%', () => {
    expect(calculateWeightedAmount(2000, 50)).toBe(1000);
  });

  it('handles fractional result', () => {
    expect(calculateWeightedAmount(333, 33)).toBeCloseTo(109.89, 2);
  });

  it('returns 0 when amount is 0', () => {
    expect(calculateWeightedAmount(0, 75)).toBe(0);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateWeightedAmount(0, 0)).toBe(0);
  });
});

describe('summarizePipeline', () => {
  it('returns zeros for empty array', () => {
    const result = summarizePipeline([]);
    expect(result).toEqual({
      totalPipeline: 0,
      weightedForecast: 0,
      openCount: 0,
      wonCount: 0,
      lostCount: 0,
    });
  });

  it('counts a single open opportunity', () => {
    const result = summarizePipeline([
      { amount: 1000, probability: 50, stage: 'qualified' },
    ]);
    expect(result.openCount).toBe(1);
    expect(result.wonCount).toBe(0);
    expect(result.lostCount).toBe(0);
    expect(result.totalPipeline).toBe(1000);
    expect(result.weightedForecast).toBe(500);
  });

  it('counts a single won opportunity', () => {
    const result = summarizePipeline([
      { amount: 2000, probability: 100, stage: 'won' },
    ]);
    expect(result.wonCount).toBe(1);
    expect(result.openCount).toBe(0);
    expect(result.totalPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
  });

  it('counts a single lost opportunity', () => {
    const result = summarizePipeline([
      { amount: 3000, probability: 0, stage: 'lost' },
    ]);
    expect(result.lostCount).toBe(1);
    expect(result.openCount).toBe(0);
    expect(result.totalPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
  });

  it('excludes won/lost from pipeline and forecast', () => {
    const result = summarizePipeline([
      { amount: 5000, probability: 100, stage: 'won' },
      { amount: 3000, probability: 0, stage: 'lost' },
    ]);
    expect(result.totalPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
    expect(result.wonCount).toBe(1);
    expect(result.lostCount).toBe(1);
    expect(result.openCount).toBe(0);
  });

  it('handles amount 0 in open opportunity', () => {
    const result = summarizePipeline([
      { amount: 0, probability: 80, stage: 'proposal' },
    ]);
    expect(result.openCount).toBe(1);
    expect(result.totalPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
  });

  it('handles probability 0 in open opportunity', () => {
    const result = summarizePipeline([
      { amount: 10000, probability: 0, stage: 'negotiation' },
    ]);
    expect(result.openCount).toBe(1);
    expect(result.totalPipeline).toBe(10000);
    expect(result.weightedForecast).toBe(0);
  });

  // Composite scenario 1: mixed pipeline
  it('computes correct totals for mixed opportunities', () => {
    const result = summarizePipeline([
      { amount: 1000, probability: 50, stage: 'qualified' },
      { amount: 2000, probability: 75, stage: 'proposal' },
      { amount: 3000, probability: 90, stage: 'negotiation' },
      { amount: 5000, probability: 100, stage: 'won' },
      { amount: 500, probability: 0, stage: 'lost' },
    ]);
    expect(result.openCount).toBe(3);
    expect(result.wonCount).toBe(1);
    expect(result.lostCount).toBe(1);
    expect(result.totalPipeline).toBe(1000 + 2000 + 3000);
    expect(result.weightedForecast).toBe(500 + 1500 + 2700);
  });

  // Composite scenario 2: all open
  it('computes correct totals when all opportunities are open', () => {
    const result = summarizePipeline([
      { amount: 400, probability: 25, stage: 'qualified' },
      { amount: 800, probability: 50, stage: 'proposal' },
      { amount: 1200, probability: 100, stage: 'negotiation' },
    ]);
    expect(result.openCount).toBe(3);
    expect(result.wonCount).toBe(0);
    expect(result.lostCount).toBe(0);
    expect(result.totalPipeline).toBe(400 + 800 + 1200);
    expect(result.weightedForecast).toBe(100 + 400 + 1200);
  });

  // Composite scenario 3: all closed
  it('returns zero pipeline when all are closed', () => {
    const result = summarizePipeline([
      { amount: 1000, probability: 100, stage: 'won' },
      { amount: 2000, probability: 100, stage: 'won' },
      { amount: 500, probability: 0, stage: 'lost' },
    ]);
    expect(result.openCount).toBe(0);
    expect(result.wonCount).toBe(2);
    expect(result.lostCount).toBe(1);
    expect(result.totalPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
  });
});
