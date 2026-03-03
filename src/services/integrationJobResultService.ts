import type { ProcessJobResponse } from '@/hooks/useIntegrationJobs';

export type SyncToastType = 'success' | 'error' | 'info';

export interface SyncToastDecision {
  type: SyncToastType;
  message: string;
}

function fmtAttemptCount(value: number | undefined): string {
  return value === undefined ? '?' : String(value);
}

function defaultTimeFormatter(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

export function decideSyncToast(
  result: ProcessJobResponse,
  formatTime: (iso: string) => string = defaultTimeFormatter,
): SyncToastDecision {
  if (result.status === 'success') {
    return {
      type: 'success',
      message: `Sync completed (${result.recordsProcessed ?? 0} processed, ${result.recordsCreated ?? 0} new, ${result.recordsUpdated ?? 0} updated)`,
    };
  }

  if (result.status === 'queued' && result.retryScheduled) {
    const nextRetry = result.nextRetryAt ? formatTime(result.nextRetryAt) : 'soon';
    return {
      type: 'error',
      message: `Sync failed on attempt ${fmtAttemptCount(result.attemptCount)} / ${fmtAttemptCount(result.maxAttempts)}; retry scheduled at ${nextRetry}`,
    };
  }

  if (result.status === 'error') {
    if (result.deadLettered) {
      return {
        type: 'error',
        message: `Sync moved to dead-letter after ${fmtAttemptCount(result.attemptCount)} / ${fmtAttemptCount(result.maxAttempts)} attempts`,
      };
    }
    return {
      type: 'error',
      message: result.error || result.summary || 'Sync finished with errors',
    };
  }

  if (result.processed === false) {
    return {
      type: 'info',
      message: result.summary || 'No queued jobs to process',
    };
  }

  return {
    type: 'success',
    message: 'Sync job processed',
  };
}
