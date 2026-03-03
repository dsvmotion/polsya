#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INTEGRATIONS_TYPES_PATH = join(ROOT, 'src', 'types', 'integrations.ts');
const CONNECTORS_PATH = join(ROOT, 'supabase', 'functions', '_shared', 'integration-connectors.ts');
const REGISTRY_PATH = join(ROOT, 'supabase', 'functions', '_shared', 'provider-registry.ts');

let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

function extractQuotedLiteralsFromUnion(source, typeName) {
  const re = new RegExp(`export type ${typeName}\\s*=([\\s\\S]*?);`);
  const match = source.match(re);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

function extractTopLevelObjectKeys(source, varName) {
  const re = new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${varName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`);
  const match = source.match(re);
  if (!match) return [];
  const body = match[1];
  const keys = [];
  let depth = 0;
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (depth === 0) {
      const keyMatch = trimmed.match(/^([a-z][a-z0-9_]*)\s*:\s*\{/i);
      if (keyMatch) {
        keys.push(keyMatch[1]);
      }
    }
    for (const ch of trimmed) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
  }
  return keys;
}

function extractFlatObjectKeys(source, varName) {
  const re = new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${varName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`);
  const match = source.match(re);
  if (!match) return [];
  return Array.from(match[1].matchAll(/^\s*([a-z][a-z0-9_]*)\s*:/gim)).map((m) => m[1]);
}

function extractSyncTargetsForProvider(source, providerKey) {
  const re = new RegExp(`${providerKey}:\\s*\\{[\\s\\S]*?syncTargets:\\s*\\[([^\\]]*)\\]`, 'g');
  const match = re.exec(source);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

function extractAllSyncTargetsFromRegistry(source) {
  return Array.from(source.matchAll(/syncTargets:\s*\[([^\]]*)\]/g))
    .flatMap((m) => Array.from(m[1].matchAll(/'([^']+)'/g)).map((t) => t[1]));
}

function extractSyncTargetUnion(source) {
  const re = /export type SyncTarget\s*=([\s\S]*?);/;
  const match = source.match(re);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

let integrationsTypesSource = '';
let connectorsSource = '';
let registrySource = '';

try {
  integrationsTypesSource = readFileSync(INTEGRATIONS_TYPES_PATH, 'utf-8');
} catch (err) {
  fail(`Cannot read ${INTEGRATIONS_TYPES_PATH}: ${err.message}`);
}
try {
  connectorsSource = readFileSync(CONNECTORS_PATH, 'utf-8');
} catch (err) {
  fail(`Cannot read ${CONNECTORS_PATH}: ${err.message}`);
}
try {
  registrySource = readFileSync(REGISTRY_PATH, 'utf-8');
} catch (err) {
  fail(`Cannot read ${REGISTRY_PATH}: ${err.message}`);
}

const providerTypeValues = new Set(
  extractQuotedLiteralsFromUnion(integrationsTypesSource, 'IntegrationProvider'),
);
const connectorMapKeys = new Set(extractFlatObjectKeys(connectorsSource, 'connectorMap'));
const registryKeys = new Set(extractTopLevelObjectKeys(registrySource, 'PROVIDER_REGISTRY'));
const validSyncTargets = new Set(extractSyncTargetUnion(connectorsSource));
const allRegistrySyncTargets = extractAllSyncTargetsFromRegistry(registrySource);

// 1. PROVIDER_REGISTRY keys must match IntegrationProvider union
for (const key of registryKeys) {
  if (!providerTypeValues.has(key)) {
    fail(`PROVIDER_REGISTRY key "${key}" missing in IntegrationProvider union`);
  }
}
for (const provider of providerTypeValues) {
  if (!registryKeys.has(provider)) {
    fail(`IntegrationProvider value "${provider}" missing in PROVIDER_REGISTRY`);
  }
}

// 2. Providers with syncTargets in the registry must have a connector
for (const key of registryKeys) {
  const targets = extractSyncTargetsForProvider(registrySource, key);
  if (targets.length > 0 && !connectorMapKeys.has(key)) {
    fail(`Registry provider "${key}" has syncTargets but no connector in connectorMap`);
  }
}

// 3. All sync targets referenced in the registry must be valid SyncTarget values
for (const target of allRegistrySyncTargets) {
  if (!validSyncTargets.has(target)) {
    fail(`Invalid SyncTarget "${target}" referenced in PROVIDER_REGISTRY (valid: ${[...validSyncTargets].join(', ')})`);
  }
}

// 4. Every connectorMap key must exist in the IntegrationProvider union
for (const key of connectorMapKeys) {
  if (!providerTypeValues.has(key)) {
    fail(`connectorMap key "${key}" missing in IntegrationProvider union`);
  }
}

// 5. Every connectorMap key should exist in the registry
for (const key of connectorMapKeys) {
  if (!registryKeys.has(key)) {
    fail(`connectorMap key "${key}" missing in PROVIDER_REGISTRY`);
  }
}

if (exitCode === 0) {
  console.log(
    `✅  Integration contracts OK — ${registryKeys.size} registry providers, ${connectorMapKeys.size} connectors, ${providerTypeValues.size} type union members aligned`,
  );
}

process.exit(exitCode);
