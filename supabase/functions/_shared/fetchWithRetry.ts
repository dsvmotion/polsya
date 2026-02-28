interface FetchWithRetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  retryOnStatus?: number[];
  action?: string;
}

const DEFAULTS: Required<Omit<FetchWithRetryOptions, 'action'>> = {
  attempts: 4,
  baseDelayMs: 300,
  timeoutMs: 12_000,
  retryOnStatus: [429, 500, 502, 503, 504],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  opts?: FetchWithRetryOptions,
): Promise<Response> {
  const {
    attempts = DEFAULTS.attempts,
    baseDelayMs = DEFAULTS.baseDelayMs,
    timeoutMs = DEFAULTS.timeoutMs,
    retryOnStatus = DEFAULTS.retryOnStatus,
  } = opts ?? {};
  const action = opts?.action ?? 'fetch';

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const isLast = attempt === attempts;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const mergedInit: RequestInit = {
        ...init,
        signal: controller.signal,
      };

      const response = await fetch(url, mergedInit);
      clearTimeout(timer);

      if (retryOnStatus.includes(response.status) && !isLast) {
        console.log(
          JSON.stringify({ action, attempt, status: response.status, will_retry: true }),
        );
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
        continue;
      }

      return response;
    } catch (err: unknown) {
      clearTimeout(timer);
      lastError = err;

      const errMsg = err instanceof Error ? err.message : String(err);

      if (!isLast) {
        console.log(
          JSON.stringify({ action, attempt, error: errMsg, will_retry: true }),
        );
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
        continue;
      }

      console.log(
        JSON.stringify({ action, attempt, error: errMsg, will_retry: false }),
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`fetchWithRetry failed after ${attempts} attempts`);
}
