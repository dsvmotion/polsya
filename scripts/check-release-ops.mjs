#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const REQUIRED_DOCS = [
  {
    path: join(ROOT, 'docs', 'operations', 'REL-05A_BACKUP_RESTORE_RUNBOOK.md'),
    requiredSnippets: ['## Backup Procedure (Routine)', '## Production Restore Procedure'],
  },
  {
    path: join(ROOT, 'docs', 'operations', 'REL-05A_INCIDENT_RUNBOOK.md'),
    requiredSnippets: ['## First 10 Minutes', '## Containment Patterns'],
  },
  {
    path: join(ROOT, 'docs', 'operations', 'REL-05A_ROLLBACK_CHECKLISTS.md'),
    requiredSnippets: ['## 1) Frontend-only Release', '## Mandatory Validation After Any Rollback'],
  },
];

let exitCode = 0;

function fail(msg) {
  console.error(`❌  ${msg}`);
  exitCode = 1;
}

for (const doc of REQUIRED_DOCS) {
  let source = '';
  try {
    source = readFileSync(doc.path, 'utf-8');
  } catch (err) {
    fail(`Missing required runbook: ${doc.path} (${err.message})`);
    continue;
  }

  for (const snippet of doc.requiredSnippets) {
    if (!source.includes(snippet)) {
      fail(`Runbook missing required section "${snippet}": ${doc.path}`);
    }
  }
}

if (exitCode === 0) {
  console.log(`✅  Release ops runbooks OK — ${REQUIRED_DOCS.length} required documents present`);
}

process.exit(exitCode);
