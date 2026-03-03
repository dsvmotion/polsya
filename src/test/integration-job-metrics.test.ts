import { describe, expect, it } from 'vitest';
import {
  buildIntegrationHealthSummary,
  computeRetryBackoffMs,
  parseIntegrationMetricsSampleLimit,
  parseLookbackHours,
  parseStuckThresholdMinutes,
  type IntegrationHealthJobRow,
  type IntegrationHealthRunRow,
} from '../../supabase/functions/_shared/integration-job-metrics.ts';

describe('integration-job-metrics parse helpers', () => {
  it('parses lookback hours with bounds', () => {
    expect(parseLookbackHours(undefined)).toBe(24);
    expect(parseLookbackHours('0')).toBe(1);
    expect(parseLookbackHours('999')).toBe(168);
    expect(parseLookbackHours('48')).toBe(48);
  });

  it('parses stuck threshold minutes with bounds', () => {
    expect(parseStuckThresholdMinutes(undefined)).toBe(15);
    expect(parseStuckThresholdMinutes('-1')).toBe(1);
    expect(parseStuckThresholdMinutes('999')).toBe(240);
    expect(parseStuckThresholdMinutes('45')).toBe(45);
  });

  it('parses metrics sample limit with bounds', () => {
    expect(parseIntegrationMetricsSampleLimit(undefined)).toBe(2000);
    expect(parseIntegrationMetricsSampleLimit('20')).toBe(100);
    expect(parseIntegrationMetricsSampleLimit('25000')).toBe(10000);
    expect(parseIntegrationMetricsSampleLimit('500')).toBe(500);
  });
});

describe('integration-job-metrics retry backoff', () => {
  it('computes exponential delay and caps at max', () => {
    expect(computeRetryBackoffMs(1, 100, 500)).toBe(100);
    expect(computeRetryBackoffMs(2, 100, 500)).toBe(200);
    expect(computeRetryBackoffMs(3, 100, 500)).toBe(400);
    expect(computeRetryBackoffMs(4, 100, 500)).toBe(500);
    expect(computeRetryBackoffMs(10, 100, 500)).toBe(500);
  });
});

describe('integration-job-metrics health summary', () => {
  const nowMs = Date.parse('2026-03-03T12:00:00.000Z');

  it('returns zeroed summary for empty samples', () => {
    const summary = buildIntegrationHealthSummary({
      jobs: [],
      runs: [],
      lookbackHours: 24,
      stuckThresholdMinutes: 15,
      nowMs,
    });

    expect(summary.totalJobs).toBe(0);
    expect(summary.queueDepth).toBe(0);
    expect(summary.p95DurationMs).toBe(0);
    expect(summary.errorRatePct).toBe(0);
    expect(summary.level).toBe('ok');
  });

  it('computes queue-ready and stuck queued jobs', () => {
    const jobs: IntegrationHealthJobRow[] = [
      {
        provider: 'gmail',
        status: 'queued',
        created_at: '2026-03-03T11:00:00.000Z',
        next_retry_at: null,
        dead_lettered_at: null,
      },
      {
        provider: 'gmail',
        status: 'queued',
        created_at: '2026-03-03T11:00:00.000Z',
        next_retry_at: '2026-03-03T12:30:00.000Z',
        dead_lettered_at: null,
      },
      {
        provider: 'outlook',
        status: 'queued',
        created_at: '2026-03-03T11:20:00.000Z',
        next_retry_at: '2026-03-03T11:30:00.000Z',
        dead_lettered_at: null,
      },
    ];

    const summary = buildIntegrationHealthSummary({
      jobs,
      runs: [],
      lookbackHours: 24,
      stuckThresholdMinutes: 15,
      nowMs,
    });

    expect(summary.queuedJobs).toBe(3);
    expect(summary.queuedReadyJobs).toBe(2);
    expect(summary.retryScheduledJobs).toBe(2);
    expect(summary.stuckQueuedJobs).toBe(2);
    expect(summary.level).toBe('warning');
  });

  it('computes p95/error-rate and provider breakdown', () => {
    const runs: IntegrationHealthRunRow[] = [
      { provider: 'gmail', status: 'success', duration_ms: 1000, created_at: '2026-03-03T10:00:00.000Z' },
      { provider: 'gmail', status: 'error', duration_ms: 5000, created_at: '2026-03-03T10:10:00.000Z' },
      { provider: 'outlook', status: 'success', duration_ms: 2000, created_at: '2026-03-03T10:20:00.000Z' },
    ];
    const jobs: IntegrationHealthJobRow[] = [
      {
        provider: 'gmail',
        status: 'success',
        created_at: '2026-03-03T10:00:00.000Z',
        next_retry_at: null,
        dead_lettered_at: null,
      },
      {
        provider: 'outlook',
        status: 'queued',
        created_at: '2026-03-03T11:50:00.000Z',
        next_retry_at: null,
        dead_lettered_at: null,
      },
    ];

    const summary = buildIntegrationHealthSummary({
      jobs,
      runs,
      lookbackHours: 24,
      stuckThresholdMinutes: 15,
      nowMs,
    });

    expect(summary.completedRuns).toBe(3);
    expect(summary.p95DurationMs).toBe(5000);
    expect(summary.avgDurationMs).toBe(2667);
    expect(summary.errorRatePct).toBe(33.3);
    expect(summary.lastRunAt).toBe('2026-03-03T10:20:00.000Z');
    expect(summary.level).toBe('critical');
    expect(summary.byProvider.gmail.completedRuns).toBe(2);
    expect(summary.byProvider.outlook.queueDepth).toBe(1);
  });

  it('marks critical when dead-lettered jobs exist', () => {
    const summary = buildIntegrationHealthSummary({
      jobs: [
        {
          provider: 'gmail',
          status: 'error',
          created_at: '2026-03-03T10:00:00.000Z',
          next_retry_at: null,
          dead_lettered_at: '2026-03-03T10:05:00.000Z',
        },
      ],
      runs: [],
      lookbackHours: 24,
      stuckThresholdMinutes: 15,
      nowMs,
    });

    expect(summary.deadLetteredJobs).toBe(1);
    expect(summary.level).toBe('critical');
  });
});
