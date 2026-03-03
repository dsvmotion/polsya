#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PROCESSOR_PATH = join(ROOT, 'supabase', 'functions', 'process-integration-sync-jobs', 'index.ts');
const OBS_HELPER_PATH = join(ROOT, 'supabase', 'functions', '_shared', 'observability.ts');

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

const helperSource = load(OBS_HELPER_PATH);
const processorSource = load(PROCESSOR_PATH);

if (!helperSource.includes('export function logEdgeEvent(')) {
  fail('_shared/observability.ts must export logEdgeEvent()');
}

if (!processorSource.includes("from '../_shared/observability.ts'")) {
  fail('process-integration-sync-jobs must import _shared/observability.ts');
}

if (!processorSource.includes('logEdgeEvent(')) {
  fail('process-integration-sync-jobs must emit structured observability logs');
}

const requiredEvents = [
  'integration_sync_job_claimed',
  'integration_sync_job_completed',
  'integration_sync_job_failed',
  'integration_sync_metrics_exported',
];
for (const eventName of requiredEvents) {
  if (!processorSource.includes(eventName)) {
    fail(`Missing observability event "${eventName}" in process-integration-sync-jobs`);
  }
}

const requiredContextKeys = [
  'organization_id',
  'integration_id',
  'job_id',
  'duration_ms',
  'queue_depth',
  'p95_duration_ms',
];
for (const key of requiredContextKeys) {
  if (!processorSource.includes(key)) {
    fail(`Missing key "${key}" in process-integration-sync-jobs logs`);
  }
}

if (exitCode === 0) {
  console.log('✅  Observability invariants OK — integration job processor logs lifecycle + metrics export context');
}

process.exit(exitCode);
