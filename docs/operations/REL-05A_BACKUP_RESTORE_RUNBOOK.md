# REL-05A Backup & Restore Runbook

## Scope
- Project: `sales-compass-95`
- Data plane: Supabase Postgres + Storage + Edge Functions config
- Goal: Recover service safely after data corruption, destructive migration, or operator error.

## Prerequisites
- Supabase CLI installed (`supabase --version`)
- Authenticated CLI session for target project
- Confirmed target project ref (never run restore commands on wrong project)
- Maintenance window approved
- Incident ticket opened with owner + scribe

## Critical Rules
- Freeze writes before restore (disable scheduler/webhooks/workers where possible).
- Always take a fresh backup snapshot before any restore attempt.
- Restore in staging first when incident severity allows it.
- Keep an audit trail: who ran what command and when.

## Backup Procedure (Routine)
1. Verify current migration state:
```bash
supabase migration list
```
2. Export schema:
```bash
pg_dump "$SUPABASE_DB_URL" --schema-only --no-owner --file backup-schema-$(date +%Y%m%d-%H%M).sql
```
3. Export data:
```bash
pg_dump "$SUPABASE_DB_URL" --data-only --no-owner --file backup-data-$(date +%Y%m%d-%H%M).sql
```
4. Export roles/grants (if managed externally, document source of truth):
```bash
pg_dumpall --globals-only --file backup-globals-$(date +%Y%m%d-%H%M).sql
```
5. Store backups in encrypted storage and log checksum:
```bash
shasum -a 256 backup-*.sql
```

## Restore Drill (Staging)
1. Provision clean staging database.
2. Apply schema restore.
3. Apply data restore.
4. Run:
```bash
npm run check:migrations
npm run check:security
npm run check:observability
npm run test -- --run
```
5. Validate app smoke flows:
- Login
- Dashboard load
- Integrations card load
- Operations table load
- Billing page load

## Production Restore Procedure
1. Announce maintenance mode.
2. Disable non-critical writers (integration job processor, scheduled jobs).
3. Take emergency pre-restore backup.
4. Restore schema/data from approved backup set.
5. Reconcile migrations:
```bash
supabase migration list
```
6. Deploy edge functions required by the restored state.
7. Re-enable writers progressively.
8. Monitor error rate + queue depth for 30 minutes.

## Post-Restore Validation Checklist
- `npm run check:migrations` passes
- `npm run check:security` passes
- `npm run check:observability` passes
- Login + core pages accessible
- Integration processing stable (no rapid dead-letter growth)
- Billing guard behavior correct (`active` access, blocked non-active)

## Evidence Required for Incident Closure
- Backup artifact IDs and checksums used
- Exact restore command transcript
- Validation outputs
- Data loss window estimate (RPO) and downtime (RTO)
- Corrective actions to avoid recurrence
