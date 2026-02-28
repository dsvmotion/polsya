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

// 1. Check config.toml for verify_jwt = false
try {
  const config = readFileSync(CONFIG_PATH, 'utf-8');
  if (/verify_jwt\s*=\s*false/i.test(config)) {
    fail(`${CONFIG_PATH} contains "verify_jwt = false"`);
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
  'woocommerce-orders',
  'woocommerce-orders-detailed',
  'geocode-pharmacies',
  'populate-geography',
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

if (exitCode === 0) {
  console.log(`✅  Security invariants OK — ${functionDirs.length} edge functions checked, ${REQUIRE_ORG_AUTHZ.length} org-authz-gated`);
}

process.exit(exitCode);
