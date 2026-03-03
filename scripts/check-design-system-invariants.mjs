#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

function load(relPath) {
  const absPath = join(ROOT, relPath);
  try {
    return readFileSync(absPath, 'utf-8');
  } catch (err) {
    fail(`Cannot read ${relPath}: ${err.message}`);
    return '';
  }
}

const cssSource = load('src/index.css');
for (const token of ['.surface-card', '.surface-card-header', '.surface-card-body', '.metric-card', '.state-panel']) {
  if (!cssSource.includes(token)) {
    fail(`Missing design token/class "${token}" in src/index.css`);
  }
}

const surfaceCardFiles = [
  'src/components/dashboard/AgentActionsCard.tsx',
  'src/components/dashboard/IntegrationsCard.tsx',
  'src/components/operations/RiskAlertsCard.tsx',
];
for (const relPath of surfaceCardFiles) {
  const source = load(relPath);
  if (!source.includes('surface-card')) {
    fail(`${relPath} must use "surface-card"`);
  }
  if (!source.includes('surface-card-header')) {
    fail(`${relPath} must use "surface-card-header"`);
  }
  if (!source.includes('surface-card-body')) {
    fail(`${relPath} must use "surface-card-body"`);
  }
}

const metricCardFiles = [
  'src/components/dashboard/KpiStrip.tsx',
  'src/components/operations/PipelineSummaryCards.tsx',
];
for (const relPath of metricCardFiles) {
  const source = load(relPath);
  if (!source.includes('metric-card')) {
    fail(`${relPath} must use "metric-card"`);
  }
}

const stateComponentSource = load('src/components/ui/view-states.tsx');
for (const exportName of ['export function LoadingState', 'export function EmptyState', 'export function ErrorState']) {
  if (!stateComponentSource.includes(exportName)) {
    fail(`src/components/ui/view-states.tsx must export ${exportName.replace('export function ', '')}`);
  }
}

if (exitCode === 0) {
  console.log('✅  Design system invariants OK — critical cards and state components use shared UX-02A patterns');
}

process.exit(exitCode);
