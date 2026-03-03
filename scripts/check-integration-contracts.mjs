#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INTEGRATIONS_TYPES_PATH = join(ROOT, 'src', 'types', 'integrations.ts');
const CONNECTORS_PATH = join(ROOT, 'supabase', 'functions', '_shared', 'integration-connectors.ts');

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

function extractProviderKeysFromMap(source, mapName) {
  const re = new RegExp(`const ${mapName}:\\s*Record<string,\\s*SyncTarget\\[]>\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};`);
  const match = source.match(re);
  if (!match) return [];
  return Array.from(match[1].matchAll(/^\s*([a-z0-9_]+)\s*:/gim)).map((m) => m[1]);
}

function extractConnectorProviders(source) {
  return Array.from(
    source.matchAll(/if\s*\(provider\s*===\s*'([a-z0-9_]+)'\)\s*return\s+[a-z0-9_]+Connector;/gi),
  ).map((m) => m[1]);
}

function extractSyncTargetsFromMap(source, mapName) {
  const re = new RegExp(`const ${mapName}:\\s*Record<string,\\s*SyncTarget\\[]>\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};`);
  const match = source.match(re);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'(entities|orders|products|inventory)'/g)).map((m) => m[1]);
}

let integrationsTypesSource = '';
let connectorsSource = '';
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

const providerTypeValues = new Set(
  extractQuotedLiteralsFromUnion(integrationsTypesSource, 'IntegrationProvider'),
);
const connectorProviders = new Set(extractConnectorProviders(connectorsSource));
const allowedByProviderKeys = new Set(extractProviderKeysFromMap(connectorsSource, 'allowedByProvider'));
const defaultByProviderKeys = new Set(extractProviderKeysFromMap(connectorsSource, 'defaultByProvider'));

const syncCapableProviders = ['woocommerce', 'shopify', 'gmail', 'outlook', 'email_imap', 'brevo'];

for (const provider of syncCapableProviders) {
  if (!providerTypeValues.has(provider)) {
    fail(`Sync provider "${provider}" missing in IntegrationProvider union`);
  }
  if (!connectorProviders.has(provider)) {
    fail(`Sync provider "${provider}" missing in getIntegrationConnector()`);
  }
  if (!allowedByProviderKeys.has(provider)) {
    fail(`Sync provider "${provider}" missing in allowedByProvider map`);
  }
  if (!defaultByProviderKeys.has(provider)) {
    fail(`Sync provider "${provider}" missing in defaultByProvider map`);
  }
}

for (const provider of allowedByProviderKeys) {
  if (!connectorProviders.has(provider)) {
    fail(`Provider "${provider}" exists in allowedByProvider but has no connector`);
  }
}

for (const provider of defaultByProviderKeys) {
  if (!connectorProviders.has(provider)) {
    fail(`Provider "${provider}" exists in defaultByProvider but has no connector`);
  }
}

const allowedTargets = new Set(['entities', 'orders', 'products', 'inventory']);
for (const target of extractSyncTargetsFromMap(connectorsSource, 'allowedByProvider')) {
  if (!allowedTargets.has(target)) {
    fail(`Invalid target "${target}" in allowedByProvider`);
  }
}
for (const target of extractSyncTargetsFromMap(connectorsSource, 'defaultByProvider')) {
  if (!allowedTargets.has(target)) {
    fail(`Invalid target "${target}" in defaultByProvider`);
  }
}

if (exitCode === 0) {
  console.log(
    `✅  Integration contracts OK — ${syncCapableProviders.length} sync providers aligned across types, connectors, and target maps`,
  );
}

process.exit(exitCode);
