#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const STRIPE_WEBHOOK_PATH = join(ROOT, 'supabase', 'functions', 'stripe-webhook', 'index.ts');
const BILLING_HELPER_PATH = join(ROOT, 'supabase', 'functions', '_shared', 'billing.ts');

let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

function load(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch (err) {
    fail(`Cannot read ${path}: ${err.message}`);
    return '';
  }
}

const webhookSource = load(STRIPE_WEBHOOK_PATH);
const billingSource = load(BILLING_HELPER_PATH);

const requiredWebhookSnippets = [
  'Stripe-Signature',
  'verifyStripeWebhookSignature(',
  "case 'checkout.session.completed':",
  "case 'customer.subscription.updated':",
  "case 'customer.subscription.deleted':",
  "case 'invoice.payment_failed':",
  "subscription.status = 'canceled';",
  ".update({ status: 'past_due' })",
  'code === \'23505\'',
  'duplicate: true',
  '.from(\'billing_webhook_events\')',
];

for (const snippet of requiredWebhookSnippets) {
  if (!webhookSource.includes(snippet)) {
    fail(`stripe-webhook contract missing snippet: ${snippet}`);
  }
}

const requiredBillingSnippets = [
  "if (subscription.status === 'active')",
  "if (subscription.status === 'trialing')",
  "if (subscription.status === 'past_due')",
  "reason: 'past_due_grace'",
  "reason: 'past_due_expired'",
  "status: 402",
];

for (const snippet of requiredBillingSnippets) {
  if (!billingSource.includes(snippet)) {
    fail(`billing helper contract missing snippet: ${snippet}`);
  }
}

if (exitCode === 0) {
  console.log('✅  Billing webhook contracts OK — signature, idempotency, lifecycle events, and billing-state transitions are enforced');
}

process.exit(exitCode);
