#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const APP_PATH = join(ROOT, 'src', 'App.tsx');

let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

let appSource = '';
try {
  appSource = readFileSync(APP_PATH, 'utf-8');
} catch (err) {
  fail(`Cannot read ${APP_PATH}: ${err.message}`);
  process.exit(1);
}

// App structure: ProtectedRoute wraps AppLayout; child routes (Index, PharmacyProspecting, etc.) are protected.
// SubscriptionBanner in AppLayout shows non-blocking warning when subscription needs attention.
const hasProtectedLayout = /ProtectedRoute[\s\S]*?AppLayout/.test(appSource);
const hasIndex = /<Index\s*\/>/.test(appSource);
const hasBilling = /path="billing"/.test(appSource);

if (!hasProtectedLayout) {
  fail('AppLayout must be wrapped in ProtectedRoute');
}
if (!hasIndex) {
  fail('Index (dashboard) route must exist');
}
if (!hasBilling) {
  fail('Billing route must exist');
}

if (exitCode === 0) {
  console.log('✅  Route guards OK — ProtectedRoute wraps layout, /billing exists');
}

process.exit(exitCode);
