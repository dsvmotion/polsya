# REL-05A Rollback Checklists by Change Type

## 1) Frontend-only Release
Pre-check:
- Identify last known good commit on `main`
- Confirm no pending DB migration dependency

Rollback:
1. Revert or redeploy previous frontend artifact.
2. Clear CDN cache if relevant.
3. Validate:
   - Login
   - Dashboard
   - Operations list and detail panel

Evidence:
- Commit SHA reverted/deployed
- Smoke test result

## 2) Edge Function Release
Pre-check:
- Confirm required env vars exist
- Confirm `check:security` and `check:observability` pass

Rollback:
1. Redeploy previous function bundle version.
2. Validate authz + billing guard behavior for the function.
3. Watch logs for 10 minutes for retries/errors.

Evidence:
- Function name + previous revision reference
- Post-rollback invocation result

## 3) Migration Release
Pre-check:
- Backup completed and verified
- Migration reviewed for reversibility
- Downtime risk assessed

Rollback:
1. If reversible migration exists: apply down migration.
2. If non-reversible: execute restore runbook.
3. Reconcile migration history (`supabase migration list`).

Evidence:
- Migration IDs impacted
- Restore/down commands
- Validation output

## 4) Integration Connector / Sync Pipeline
Pre-check:
- Retry limits and DLQ behavior verified
- Observability logs include `organization_id`, `integration_id`, `job_id`

Rollback:
1. Disable connector path or stop queue processor entrypoint.
2. Redeploy previous connector/processor revision.
3. Re-enable with canary organization first.

Evidence:
- Dead-letter growth before/after
- p95 duration and error rate trend

## 5) Billing/Auth/RBAC Changes
Pre-check:
- Validate role matrix and billing states in staging
- Confirm protected paths are gated from backend

Rollback:
1. Revert edge auth/billing helper changes first.
2. Revert frontend guard changes second.
3. Validate:
   - `active` users keep access
   - blocked statuses remain blocked
   - role-restricted actions denied for non-privileged members

Evidence:
- Test matrix (role x action, billing status x route)

## Mandatory Validation After Any Rollback
```bash
npm run lint
npm run typecheck
npm run check:migrations
npm run check:security
npm run check:observability
npm run test:contracts
npm run test:critical
npm run test -- --run
npm run build
```
