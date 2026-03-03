import { describe, expect, it } from 'vitest';
import {
  planRetryTransition,
  type RetryTransitionPlan,
} from '../../supabase/functions/_shared/integration-job-retry.ts';

function expectQueued(plan: RetryTransitionPlan) {
  expect(plan.status).toBe('queued');
  expect(plan.retryScheduled).toBe(true);
  expect(plan.deadLettered).toBe(false);
  expect(plan.nextRetryAt).not.toBeNull();
}

describe('planRetryTransition', () => {
  it('schedules retry when attempts are below max', () => {
    const plan = planRetryTransition({
      attemptCountRaw: 1,
      maxAttemptsRaw: 3,
      nowMs: Date.parse('2026-03-03T20:00:00.000Z'),
      baseDelayMs: 60_000,
      maxDelayMs: 300_000,
    });

    expectQueued(plan);
    expect(plan.attemptCount).toBe(1);
    expect(plan.maxAttempts).toBe(3);
    expect(plan.nextRetryAt).toBe('2026-03-03T20:01:00.000Z');
  });

  it('uses exponential backoff and caps at max delay', () => {
    const plan = planRetryTransition({
      attemptCountRaw: 5,
      maxAttemptsRaw: 10,
      nowMs: Date.parse('2026-03-03T20:00:00.000Z'),
      baseDelayMs: 60_000,
      maxDelayMs: 300_000,
    });

    expectQueued(plan);
    expect(plan.nextRetryAt).toBe('2026-03-03T20:05:00.000Z');
  });

  it('dead-letters when attempt count reaches max', () => {
    const plan = planRetryTransition({
      attemptCountRaw: 3,
      maxAttemptsRaw: 3,
      nowMs: Date.parse('2026-03-03T20:00:00.000Z'),
      baseDelayMs: 60_000,
      maxDelayMs: 300_000,
    });

    expect(plan.status).toBe('error');
    expect(plan.retryScheduled).toBe(false);
    expect(plan.deadLettered).toBe(true);
    expect(plan.nextRetryAt).toBeNull();
  });

  it('normalizes invalid attempt/max values safely', () => {
    const plan = planRetryTransition({
      attemptCountRaw: 0,
      maxAttemptsRaw: 0,
      nowMs: Date.parse('2026-03-03T20:00:00.000Z'),
      baseDelayMs: 60_000,
      maxDelayMs: 300_000,
    });

    expect(plan.attemptCount).toBe(1);
    expect(plan.maxAttempts).toBe(1);
    expect(plan.deadLettered).toBe(true);
  });

  it('handles null input values with defaults', () => {
    const plan = planRetryTransition({
      attemptCountRaw: null,
      maxAttemptsRaw: null,
      nowMs: Date.parse('2026-03-03T20:00:00.000Z'),
      baseDelayMs: 60_000,
      maxDelayMs: 300_000,
    });

    expectQueued(plan);
    expect(plan.attemptCount).toBe(1);
    expect(plan.maxAttempts).toBe(3);
  });
});
