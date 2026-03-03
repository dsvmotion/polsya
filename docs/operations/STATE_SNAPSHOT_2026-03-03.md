# State Snapshot (2026-03-03)

This document captures the repo and platform baseline after the multi-tenant, billing, integrations, and reliability waves completed up to March 3, 2026.

## 1) Platform Baseline

### Data / migrations
- Latest migration in repo:
  - `20260303160000_prod_05b_industry_templates.sql`
- Migration count checked by CI:
  - `37` files (`npm run check:migrations`)

### Edge functions currently in project
- `create-checkout-session`
- `create-customer-portal-session`
- `stripe-webhook`
- `process-integration-sync-jobs`
- `gmail-oauth-url`
- `gmail-oauth-exchange`
- `outlook-oauth-url`
- `outlook-oauth-exchange`
- `email-imap-upsert`
- `email-marketing-key-upsert`
- `google-places-pharmacies`
- `geocode-pharmacies`
- `populate-geography`
- `woocommerce-orders`
- `woocommerce-orders-detailed`

## 2) Security / Isolation Status

Implemented baseline controls:
- RLS lockdown for sensitive tables and anon policy removal (`SEC-02` class of changes).
- Role-gated edge functions with shared auth helper patterns.
- CORS centralized and invariant-checked (no wildcard origins).
- Multi-tenant org context model in DB (`ARCH-02A` foundation).
- Billing-aware access guards in app and backend checks for premium surfaces.

CI enforcement:
- `npm run check:security`
- `npm run check:migrations`
- `npm run check:observability`
- `npm run check:release-ops`
- `npm run check:design-system`

## 3) Product Capability Status

### Core app
- Prospecting + operations workflows active.
- CRM layers present: contacts, activities, opportunities, saved segments, risk alerts.
- Entity-type abstraction introduced and industry templates added (`PROD-05B`).

### Integrations
- Connections, jobs, runs, idempotent sync object foundation.
- Retry/backoff + dead-letter handling in sync job processor.
- Org-scoped integration health metrics export (`mode=metrics`) with queue depth, stuck queue, and p95/avg duration summary.
- OAuth foundation: Gmail + Outlook.
- Custom email credential path: IMAP/SMTP secure vault path via edge function.
- Email marketing key management foundation present.

### Billing
- Subscription foundation in DB.
- Checkout + customer portal edge functions.
- Stripe webhook path in place.

## 4) Quality Baseline (latest local run)

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- --run` ✅ (`256` tests)
- `npm run build` ✅
- All invariant checks listed above ✅

## 5) Known Remaining Work (next execution block)

Priority order for next delivery:
1. **INT-04D execution completion**
   - Ensure providers are not just connected but fully syncing normalized email timeline events (`integration_sync_objects`) with production-grade metrics and failure codes.
2. **BILL-01D hard enforcement review**
   - Validate grace-period and entitlement matrix for all premium screens/routes/functions end-to-end.
3. **QA-03A E2E expansion**
   - Add browser-level E2E for: subscription inactive, role denial paths, job retry/dead-letter transitions.
4. **REL-05A operational drills**
   - Execute and record one restore drill + one incident drill against staging.

## 6) Audit Entry Points

For external/internal audit walkthrough:
- Architecture baseline: `docs/architecture/SAAS_ARCHITECTURE_V3.md`
- Strategic roadmap: `docs/roadmap/PLAN_V3_REVENUE_OS.md`
- Runbooks:
  - `docs/operations/REL-05A_BACKUP_RESTORE_RUNBOOK.md`
  - `docs/operations/REL-05A_INCIDENT_RUNBOOK.md`
  - `docs/operations/REL-05A_ROLLBACK_CHECKLISTS.md`
- This snapshot:
  - `docs/operations/STATE_SNAPSHOT_2026-03-03.md`
