import { describe, expect, it } from 'vitest';
import {
  computeStripeSignature,
  normalizeInvoiceStatus,
  normalizeSubscriptionStatus,
  parseSignatureHeader,
  timingSafeEqual,
  verifyStripeWebhookSignature,
} from '../../supabase/functions/_shared/stripe-billing.ts';

describe('stripe-billing helpers', () => {
  it('parses Stripe signature header', () => {
    const parsed = parseSignatureHeader('t=1700000000,v1=abc,v1=def');
    expect(parsed).not.toBeNull();
    expect(parsed?.timestamp).toBe(1700000000);
    expect(parsed?.signatures).toEqual(['abc', 'def']);
  });

  it('rejects invalid signature header', () => {
    expect(parseSignatureHeader('v1=abc')).toBeNull();
    expect(parseSignatureHeader('t=not-a-number,v1=abc')).toBeNull();
  });

  it('timingSafeEqual compares strings with same length only', () => {
    expect(timingSafeEqual('abcd', 'abcd')).toBe(true);
    expect(timingSafeEqual('abcd', 'abce')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('verifies valid webhook signature', async () => {
    const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
    const secret = 'whsec_test_secret';
    const timestamp = 1_700_000_000;
    const expected = await computeStripeSignature(secret, `${timestamp}.${payload}`);
    const header = `t=${timestamp},v1=${expected}`;

    const result = await verifyStripeWebhookSignature(payload, header, secret, timestamp + 10);
    expect(result).toEqual({ ok: true });
  });

  it('rejects signature mismatch', async () => {
    const payload = '{"id":"evt_1"}';
    const secret = 'whsec_test_secret';
    const header = 't=1700000000,v1=bad';

    const result = await verifyStripeWebhookSignature(payload, header, secret, 1_700_000_005);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('signature_mismatch');
  });

  it('rejects signatures outside tolerance', async () => {
    const payload = '{"id":"evt_1"}';
    const secret = 'whsec_test_secret';
    const timestamp = 1_700_000_000;
    const expected = await computeStripeSignature(secret, `${timestamp}.${payload}`);
    const header = `t=${timestamp},v1=${expected}`;

    const result = await verifyStripeWebhookSignature(payload, header, secret, timestamp + 10_000, 300);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('signature_tolerance_exceeded');
  });

  it('normalizes subscription statuses', () => {
    expect(normalizeSubscriptionStatus('active')).toBe('active');
    expect(normalizeSubscriptionStatus('past_due')).toBe('past_due');
    expect(normalizeSubscriptionStatus('random')).toBe('incomplete');
    expect(normalizeSubscriptionStatus(null)).toBe('incomplete');
  });

  it('normalizes invoice statuses', () => {
    expect(normalizeInvoiceStatus('paid')).toBe('paid');
    expect(normalizeInvoiceStatus('open')).toBe('open');
    expect(normalizeInvoiceStatus('weird')).toBe('open');
    expect(normalizeInvoiceStatus(undefined)).toBe('open');
  });
});
