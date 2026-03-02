import { fetchWithRetry } from './fetchWithRetry.ts';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export type StripeCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

function getStripeSecretKey(): string | null {
  return Deno.env.get('STRIPE_SECRET_KEY') ?? Deno.env.get('STRIPE_API_KEY') ?? null;
}

export async function stripeFormPost<T>(
  path: string,
  params: URLSearchParams,
  action: string,
): Promise<StripeCallResult<T>> {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    return { ok: false, status: 500, error: 'Stripe secret key is not configured' };
  }

  const url = `${STRIPE_API_BASE}${path}`;
  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
    {
      action,
      retryOnStatus: [429, 500, 502, 503, 504],
    },
  );

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const apiErr =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? (parsed as { error?: { message?: string } }).error?.message
        : null;
    const message = apiErr || `Stripe API error (${response.status})`;
    return { ok: false, status: response.status, error: message };
  }

  return { ok: true, data: (parsed ?? {}) as T };
}
