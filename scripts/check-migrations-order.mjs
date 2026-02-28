#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MIGRATIONS_DIR = resolve(import.meta.dirname, '..', 'supabase', 'migrations');
const TIMESTAMP_RE = /^(\d{14})_.+\.sql$/;

let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

let files;
try {
  files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
} catch {
  fail(`Cannot read migrations directory: ${MIGRATIONS_DIR}`);
  process.exit(1);
}

if (files.length === 0) {
  fail('No migration files found');
  process.exit(1);
}

const timestamps = [];

for (const file of files) {
  const match = file.match(TIMESTAMP_RE);
  if (!match) {
    fail(`Bad filename (must start with 14-digit timestamp): ${file}`);
    continue;
  }
  timestamps.push({ ts: match[1], file });
}

const seen = new Set();
for (const { ts, file } of timestamps) {
  if (seen.has(ts)) {
    fail(`Duplicate timestamp ${ts}: ${file}`);
  }
  seen.add(ts);
}

if (exitCode === 0) {
  const newest = timestamps[timestamps.length - 1];
  console.log(`✅  Migrations OK — ${files.length} files, newest: ${newest.file}`);
}

process.exit(exitCode);
