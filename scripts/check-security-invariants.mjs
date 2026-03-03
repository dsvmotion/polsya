#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CONFIG_PATH = join(ROOT, 'supabase', 'config.toml');
const FUNCTIONS_DIR = join(ROOT, 'supabase', 'functions');

let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

// 1. Check config.toml for verify_jwt = false (allowlist explicit public endpoints)
const ALLOWED_PUBLIC_FUNCTIONS = new Set(['stripe-webhook']);
try {
  const config = readFileSync(CONFIG_PATH, 'utf-8');
  const lines = config.split(/\r?\n/);
  let currentFn = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const sectionMatch = line.match(/^\[functions\.([a-z0-9-]+)\]$/i);
    if (sectionMatch) {
      currentFn = sectionMatch[1];
      continue;
    }
    if (/^verify_jwt\s*=\s*false$/i.test(line)) {
      if (!currentFn || !ALLOWED_PUBLIC_FUNCTIONS.has(currentFn)) {
        fail(`${CONFIG_PATH} has verify_jwt = false in disallowed function section: ${currentFn ?? 'unknown'}`);
      }
    }
  }
} catch (err) {
  fail(`Cannot read ${CONFIG_PATH}: ${err.message}`);
}

// 2. Scan edge function index.ts files
const WILDCARD_PATTERNS = [
  /Access-Control-Allow-Origin['":\s]*['"]\*/,
  /Allow-Origin.*'\*'/,
  /Allow-Origin.*"\*"/,
];

let functionDirs;
try {
  functionDirs = readdirSync(FUNCTIONS_DIR).filter((d) => {
    if (d.startsWith('_')) return false;
    return statSync(join(FUNCTIONS_DIR, d)).isDirectory();
  });
} catch (err) {
  fail(`Cannot read functions directory: ${err.message}`);
  process.exit(1);
}

for (const dir of functionDirs) {
  const indexPath = join(FUNCTIONS_DIR, dir, 'index.ts');
  let source;
  try {
    source = readFileSync(indexPath, 'utf-8');
  } catch {
    continue;
  }

  for (const pattern of WILDCARD_PATTERNS) {
    if (pattern.test(source)) {
      fail(`Wildcard CORS in ${dir}/index.ts (matches ${pattern})`);
    }
  }

  if (!source.includes('handleCors(')) {
    fail(`${dir}/index.ts does not call handleCors()`);
  }
}

// 3. Check that sensitive functions use organization-aware authz helper
const REQUIRE_ORG_AUTHZ = [
  'google-places-pharmacies',
  'google-places-search',
  'woocommerce-orders',
  'woocommerce-orders-detailed',
  'geocode-pharmacies',
  'geocode-entities',
  'populate-geography',
  'create-checkout-session',
  'create-customer-portal-session',
  'process-integration-sync-jobs',
  'gmail-oauth-url',
  'gmail-oauth-exchange',
  'outlook-oauth-url',
  'outlook-oauth-exchange',
  'oauth-start',
  'oauth-exchange',
  'email-imap-upsert',
  'email-marketing-key-upsert',
];

const REQUIRE_BILLING_GUARD = [
  'google-places-pharmacies',
  'google-places-search',
  'woocommerce-orders',
  'woocommerce-orders-detailed',
  'geocode-pharmacies',
  'geocode-entities',
  'process-integration-sync-jobs',
  'gmail-oauth-url',
  'gmail-oauth-exchange',
  'outlook-oauth-url',
  'outlook-oauth-exchange',
  'oauth-start',
  'oauth-exchange',
  'email-imap-upsert',
  'email-marketing-key-upsert',
];

for (const dir of REQUIRE_ORG_AUTHZ) {
  const indexPath = join(FUNCTIONS_DIR, dir, 'index.ts');
  let source;
  try {
    source = readFileSync(indexPath, 'utf-8');
  } catch {
    fail(`Cannot read ${dir}/index.ts for authz check`);
    continue;
  }
  if (!source.includes('requireOrgRoleAccess(')) {
    fail(`${dir}/index.ts does not call requireOrgRoleAccess()`);
  }
}

// 4. Premium functions must enforce billing access at backend.
for (const dir of REQUIRE_BILLING_GUARD) {
  const indexPath = join(FUNCTIONS_DIR, dir, 'index.ts');
  let source;
  try {
    source = readFileSync(indexPath, 'utf-8');
  } catch {
    fail(`Cannot read ${dir}/index.ts for billing guard check`);
    continue;
  }
  if (!source.includes('requireBillingAccessForOrg(')) {
    fail(`${dir}/index.ts does not call requireBillingAccessForOrg()`);
  }
}

// 5. Stripe webhook must verify Stripe signature explicitly.
{
  const webhookPath = join(FUNCTIONS_DIR, 'stripe-webhook', 'index.ts');
  try {
    const source = readFileSync(webhookPath, 'utf-8');
    if (!source.includes('Stripe-Signature')) {
      fail('stripe-webhook/index.ts does not read Stripe-Signature header');
    }
    if (!source.includes('verifyStripeWebhookSignature(')) {
      fail('stripe-webhook/index.ts does not verify webhook signature');
    }
  } catch {
    fail('Cannot read stripe-webhook/index.ts for signature check');
  }
}

if (exitCode === 0) {
  console.log(`✅  Security invariants OK — ${functionDirs.length} edge functions checked, ${REQUIRE_ORG_AUTHZ.length} org-authz-gated, ${REQUIRE_BILLING_GUARD.length} billing-gated`);
}

process.exit(exitCode);
