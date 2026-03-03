export const WEBHOOK_TOLERANCE_SECONDS = 300;

export function parseSignatureHeader(
  signatureHeader: string,
): { timestamp: number; signatures: string[] } | null {
  const parts = signatureHeader.split(',').map((p) => p.trim());
  let timestamp = 0;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=', 2);
    if (!key || !value) continue;
    if (key === 't') {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        timestamp = parsed;
      }
    }
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function computeStripeSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signature);
}

export async function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = WEBHOOK_TOLERANCE_SECONDS,
): Promise<{ ok: boolean; reason?: string }> {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return { ok: false, reason: 'invalid_signature_header' };

  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
    return { ok: false, reason: 'signature_tolerance_exceeded' };
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expectedSignature = await computeStripeSignature(secret, signedPayload);

  const isValid = parsed.signatures.some((provided) => timingSafeEqual(expectedSignature, provided));
  return isValid ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}

export function normalizeSubscriptionStatus(status: unknown): string {
  const value = typeof status === 'string' ? status : 'incomplete';
  const allowed = new Set([
    'trialing',
    'active',
    'past_due',
    'unpaid',
    'canceled',
    'incomplete',
    'incomplete_expired',
  ]);
  return allowed.has(value) ? value : 'incomplete';
}

export function normalizeInvoiceStatus(status: unknown): string {
  const value = typeof status === 'string' ? status : 'open';
  const allowed = new Set(['draft', 'open', 'paid', 'void', 'uncollectible']);
  return allowed.has(value) ? value : 'open';
}
