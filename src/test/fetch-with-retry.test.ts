import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from '../../supabase/functions/_shared/fetchWithRetry';

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('returns immediately on first successful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    global.fetch = fetchMock as typeof fetch;

    const response = await fetchWithRetry('https://example.com/api', undefined, {
      attempts: 3,
      baseDelayMs: 1,
      timeoutMs: 50,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable status and succeeds later', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('err', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    global.fetch = fetchMock as typeof fetch;

    const response = await fetchWithRetry('https://example.com/api', undefined, {
      attempts: 3,
      baseDelayMs: 1,
      timeoutMs: 50,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry on non-retryable status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad request', { status: 400 }));
    global.fetch = fetchMock as typeof fetch;

    const response = await fetchWithRetry('https://example.com/api', undefined, {
      attempts: 4,
      baseDelayMs: 1,
      timeoutMs: 50,
    });

    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on network error and succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    global.fetch = fetchMock as typeof fetch;

    const response = await fetchWithRetry('https://example.com/api', undefined, {
      attempts: 3,
      baseDelayMs: 1,
      timeoutMs: 50,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting attempts', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('still failing'));
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchWithRetry('https://example.com/api', undefined, {
        attempts: 2,
        baseDelayMs: 1,
        timeoutMs: 50,
      }),
    ).rejects.toThrow('still failing');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aborts slow request when timeout is reached', async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted by timeout'));
        });
      });
    });
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchWithRetry('https://example.com/api', undefined, {
        attempts: 1,
        baseDelayMs: 1,
        timeoutMs: 10,
      }),
    ).rejects.toThrow('aborted by timeout');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
