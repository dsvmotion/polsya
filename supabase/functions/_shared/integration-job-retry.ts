import { computeRetryBackoffMs } from './integration-job-metrics.ts';

export type RetryTransitionPlan = {
  status: 'queued' | 'error';
  retryScheduled: boolean;
  deadLettered: boolean;
  nextRetryAt: string | null;
  attemptCount: number;
  maxAttempts: number;
};

export function planRetryTransition(input: {
  attemptCountRaw: number | null | undefined;
  maxAttemptsRaw: number | null | undefined;
  nowMs: number;
  baseDelayMs: number;
  maxDelayMs: number;
}): RetryTransitionPlan {
  const attemptCount = Math.max(1, Number(input.attemptCountRaw ?? 1));
  const maxAttempts = Math.max(1, Number(input.maxAttemptsRaw ?? 3));

  if (attemptCount >= maxAttempts) {
    return {
      status: 'error',
      retryScheduled: false,
      deadLettered: true,
      nextRetryAt: null,
      attemptCount,
      maxAttempts,
    };
  }

  const delayMs = computeRetryBackoffMs(
    attemptCount,
    input.baseDelayMs,
    input.maxDelayMs,
  );
  const nextRetryAt = new Date(input.nowMs + delayMs).toISOString();

  return {
    status: 'queued',
    retryScheduled: true,
    deadLettered: false,
    nextRetryAt,
    attemptCount,
    maxAttempts,
  };
}
