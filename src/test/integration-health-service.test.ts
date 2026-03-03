import { describe, expect, it } from 'vitest';
import { summarizeIntegrationHealth } from '@/services/integrationHealthService';

const now = Date.UTC(2026, 2, 3, 18, 0, 0);

describe('summarizeIntegrationHealth', () => {
  it('returns zeros for empty inputs', () => {
    const summary = summarizeIntegrationHealth({ jobs: [], runs: [], nowMs: now });
    expect(summary.totalJobs).toBe(0);
    expect(summary.p95DurationMs).toBe(0);
    expect(summary.errorRatePct).toBe(0);
    expect(summary.level).toBe('ok');
  });

  it('computes p95 and average duration from completed runs', () => {
    const summary = summarizeIntegrationHealth({
      jobs: [],
      runs: [
        { status: 'success', duration_ms: 1000, created_at: '2026-03-03T10:00:00.000Z' },
        { status: 'success', duration_ms: 2000, created_at: '2026-03-03T10:10:00.000Z' },
        { status: 'error', duration_ms: 5000, created_at: '2026-03-03T10:20:00.000Z' },
        { status: 'running', duration_ms: 0, created_at: '2026-03-03T10:30:00.000Z' },
      ],
      nowMs: now,
    });

    expect(summary.completedRuns).toBe(3);
    expect(summary.p95DurationMs).toBe(5000);
    expect(summary.avgDurationMs).toBe(2667);
  });

  it('computes error rate from completed runs only', () => {
    const summary = summarizeIntegrationHealth({
      jobs: [],
      runs: [
        { status: 'success', duration_ms: 500, created_at: '2026-03-03T10:00:00.000Z' },
        { status: 'error', duration_ms: 700, created_at: '2026-03-03T10:05:00.000Z' },
        { status: 'running', duration_ms: 0, created_at: '2026-03-03T10:10:00.000Z' },
      ],
      nowMs: now,
    });

    expect(summary.errorRatePct).toBe(50);
  });

  it('counts stuck queued jobs only when retry is due or absent', () => {
    const summary = summarizeIntegrationHealth({
      jobs: [
        {
          status: 'queued',
          created_at: '2026-03-03T17:00:00.000Z',
          next_retry_at: null,
          dead_lettered_at: null,
        },
        {
          status: 'queued',
          created_at: '2026-03-03T17:00:00.000Z',
          next_retry_at: '2026-03-03T19:00:00.000Z',
          dead_lettered_at: null,
        },
        {
          status: 'queued',
          created_at: '2026-03-03T17:30:00.000Z',
          next_retry_at: '2026-03-03T17:45:00.000Z',
          dead_lettered_at: null,
        },
      ],
      runs: [],
      nowMs: now,
      stuckThresholdMinutes: 15,
    });

    expect(summary.queuedJobs).toBe(3);
    expect(summary.stuckQueuedJobs).toBe(2);
    expect(summary.retryScheduledJobs).toBe(2);
  });

  it('marks critical when dead letters exist', () => {
    const summary = summarizeIntegrationHealth({
      jobs: [
        {
          status: 'error',
          created_at: '2026-03-03T17:00:00.000Z',
          next_retry_at: null,
          dead_lettered_at: '2026-03-03T17:10:00.000Z',
        },
      ],
      runs: [],
      nowMs: now,
    });
    expect(summary.level).toBe('critical');
  });

  it('marks warning on moderate error rate', () => {
    const summary = summarizeIntegrationHealth({
      jobs: [],
      runs: [
        { status: 'success', duration_ms: 900, created_at: '2026-03-03T11:00:00.000Z' },
        { status: 'success', duration_ms: 800, created_at: '2026-03-03T11:10:00.000Z' },
        { status: 'error', duration_ms: 700, created_at: '2026-03-03T11:20:00.000Z' },
        { status: 'success', duration_ms: 650, created_at: '2026-03-03T11:30:00.000Z' },
        { status: 'success', duration_ms: 620, created_at: '2026-03-03T11:40:00.000Z' },
        { status: 'success', duration_ms: 610, created_at: '2026-03-03T11:50:00.000Z' },
        { status: 'success', duration_ms: 600, created_at: '2026-03-03T12:00:00.000Z' },
        { status: 'success', duration_ms: 590, created_at: '2026-03-03T12:10:00.000Z' },
        { status: 'success', duration_ms: 580, created_at: '2026-03-03T12:20:00.000Z' },
        { status: 'success', duration_ms: 570, created_at: '2026-03-03T12:30:00.000Z' },
      ],
      nowMs: now,
    });
    expect(summary.errorRatePct).toBe(10);
    expect(summary.level).toBe('warning');
  });

  it('tracks lastRunAt from newest run', () => {
    const summary = summarizeIntegrationHealth({
      jobs: [],
      runs: [
        { status: 'success', duration_ms: 1000, created_at: '2026-03-03T08:00:00.000Z' },
        { status: 'success', duration_ms: 1000, created_at: '2026-03-03T12:00:00.000Z' },
      ],
      nowMs: now,
    });
    expect(summary.lastRunAt).toBe('2026-03-03T12:00:00.000Z');
  });
});
