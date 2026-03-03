# REL-05A Incident Runbook

## Severity Model
- `SEV-1`: Full outage, data leak risk, billing/auth broken globally
- `SEV-2`: Major feature unavailable (integrations, operations) for many tenants
- `SEV-3`: Partial degradation with workaround

## Incident Roles
- Incident Commander (IC): decision maker
- Operator: executes commands
- Scribe: records timeline, commands, outputs
- Comms owner: customer/internal updates

## First 10 Minutes
1. Declare severity and open incident channel.
2. Freeze risky deployments and schema changes.
3. Capture failing scope:
- Which endpoints/functions
- Which organizations affected
- Start time and change correlation (last commit/migration/deploy)
4. Gather immediate signals:
- Edge function logs
- Integration dead letters
- Billing/auth failure spikes

## Triage Commands
```bash
git log --oneline -n 20
supabase migration list
npm run check:security
npm run check:observability
```

## Containment Patterns
- If integration jobs are storming errors: disable job triggering UI path and pause workers.
- If billing guard is misbehaving: force-safe mode to block premium paths, keep auth/login alive.
- If migration damage: stop writers and move to restore runbook.
- If suspect deploy regression: rollback frontend/edge function to previous stable revision.

## Recovery Criteria
- Error rate back to baseline
- No uncontrolled retry loops
- Auth + billing guards behaving as designed
- Core paths healthy:
  - Login
  - Dashboard
  - Operations
  - Integrations

## Communication Cadence
- `SEV-1`: updates every 15 minutes
- `SEV-2`: updates every 30 minutes
- Include:
  - Current impact
  - Mitigation in progress
  - ETA confidence

## Postmortem Template (Required for SEV-1/SEV-2)
- Summary
- Impact
- Timeline (UTC)
- Root cause
- What worked
- What failed
- Action items with owner + due date
