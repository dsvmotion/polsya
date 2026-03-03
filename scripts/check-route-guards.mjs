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

const premiumPaths = [
  '/',
  '/prospecting/entities',
  '/prospecting/entities/:typeKey',
  '/operations/entities',
  '/operations/entities/:typeKey',
];

function hasSubscriptionGuard(path) {
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const routeRe = new RegExp(
    `<Route\\s+path=\\"${escapedPath}\\"[\\s\\S]*?<ProtectedRoute>[\\s\\S]*?<SubscriptionGuard>[\\s\\S]*?<\\/SubscriptionGuard>[\\s\\S]*?<\\/ProtectedRoute>`,
    'm',
  );
  return routeRe.test(appSource);
}

for (const path of premiumPaths) {
  if (!hasSubscriptionGuard(path)) {
    fail(`Premium route "${path}" is missing SubscriptionGuard inside ProtectedRoute`);
  }
}

const billingRouteProtected = /<Route\s+path="\/billing"[\s\S]*?<ProtectedRoute>[\s\S]*?<Billing\s*\/>[\s\S]*?<\/ProtectedRoute>/m
  .test(appSource);
if (!billingRouteProtected) {
  fail('Billing route "/billing" must remain inside ProtectedRoute');
}

if (exitCode === 0) {
  console.log(
    `✅  Route guards OK — ${premiumPaths.length} premium routes use SubscriptionGuard and /billing remains protected`,
  );
}

process.exit(exitCode);
