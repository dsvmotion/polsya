import { describe, expect, it } from 'vitest';
import { decideSyncToast } from '@/services/integrationJobResultService';
import type { ProcessJobResponse } from '@/hooks/useIntegrationJobs';

function decide(result: ProcessJobResponse) {
  return decideSyncToast(result, (iso) => `time(${iso})`);
}

describe('decideSyncToast', () => {
  it('returns success message for completed sync', () => {
    const decision = decide({
      processed: true,
      status: 'success',
      recordsProcessed: 12,
      recordsCreated: 7,
      recordsUpdated: 5,
    });

    expect(decision.type).toBe('success');
    expect(decision.message).toBe('Sync completed (12 processed, 7 new, 5 updated)');
  });

  it('returns retry message when queued with retry scheduled', () => {
    const decision = decide({
      processed: true,
      status: 'queued',
      retryScheduled: true,
      attemptCount: 2,
      maxAttempts: 5,
      nextRetryAt: '2026-03-03T20:30:00.000Z',
    });

    expect(decision.type).toBe('error');
    expect(decision.message).toBe(
      'Sync failed on attempt 2 / 5; retry scheduled at time(2026-03-03T20:30:00.000Z)',
    );
  });

  it('uses soon when retry timestamp is missing', () => {
    const decision = decide({
      processed: true,
      status: 'queued',
      retryScheduled: true,
    });

    expect(decision.type).toBe('error');
    expect(decision.message).toContain('retry scheduled at soon');
  });

  it('returns dead-letter message when job is exhausted', () => {
    const decision = decide({
      processed: true,
      status: 'error',
      deadLettered: true,
      attemptCount: 3,
      maxAttempts: 3,
    });

    expect(decision.type).toBe('error');
    expect(decision.message).toBe('Sync moved to dead-letter after 3 / 3 attempts');
  });

  it('returns explicit error message when available', () => {
    const decision = decide({
      processed: true,
      status: 'error',
      deadLettered: false,
      error: 'API timeout',
      summary: 'fallback summary',
    });

    expect(decision.type).toBe('error');
    expect(decision.message).toBe('API timeout');
  });

  it('returns summary when processed is false', () => {
    const decision = decide({
      processed: false,
      summary: 'No queued jobs for this organization',
    });

    expect(decision.type).toBe('info');
    expect(decision.message).toBe('No queued jobs for this organization');
  });

  it('falls back to generic success when no status branch matches', () => {
    const decision = decide({
      processed: true,
      status: 'running',
    });

    expect(decision.type).toBe('success');
    expect(decision.message).toBe('Sync job processed');
  });
});
