# Moodly Plan V3 (Revenue/Field Sales OS)

## Product Positioning
Moodly is a multi-tenant Revenue/Field Sales Operating System for B2B teams that sell to physical businesses.

Primary value proposition:
- Discover target accounts.
- Plan and execute field visits.
- Track pipeline/opportunities/orders/documents.
- Automate follow-up actions with AI agents.
- Integrate commerce, email, and location data in one workflow.

Non-goal:
- Competing directly with pure location infrastructure vendors (e.g., SDK-first geolocation platforms).

## Strategic Pillars
1. Revenue Outcomes First
- Pipeline throughput, conversion, retention/churn recovery, rep productivity.

2. Location Intelligence as a Module
- Geofences, visit evidence, route planning, travel timelines.

3. Integration Layer as Product Surface
- WooCommerce/Shopify, Gmail/Outlook/IMAP-SMTP, AI providers.
- Sync jobs, retries, idempotency, auditability.

4. Enterprise Trust Baseline
- Org isolation, RBAC, billing enforcement, audit trails.

## Current Status (2026-03-03)
Completed baseline:
- Multi-tenant org foundation + RLS.
- Billing foundation + Stripe checkout/portal/webhook + access enforcement.
- Integration jobs processor + idempotent sync object persistence (INT-04A/04B).
- Gmail OAuth foundation (INT-04C part 1).

In progress:
- Multi-email channel strategy: Gmail + Outlook + custom IMAP/SMTP.

## Execution Sequence (next)
1. INT-04D-A: Provider expansion foundation
- Add `outlook` and `email_imap` providers in model/UI/validation.
- Update DB provider constraints safely.

2. INT-04D-B: Outlook OAuth
- `outlook-oauth-url` edge function.
- `outlook-oauth-exchange` edge function.
- Store tokens securely in OAuth token vault.
- Frontend callback + Connect/Reconnect flow.

3. INT-04D-C: Custom IMAP/SMTP credentials vault
- Service-role-only table for email credentials (never in metadata).
- Save/update endpoint with strict role/org checks.
- Test connection endpoint (IMAP auth ping).

4. INT-04D-D: Email timeline sync jobs
- Add connectors for Outlook and IMAP providers.
- Persist normalized email events to `integration_sync_objects`.
- Add run metrics (processed/new/updated/failed + duration).

5. LOC-01: Location provider abstraction
- Provider interface + adapters (Google now, Radar-compatible adapter optional).
- Route/matrix/geofence event contract.

6. UX-03: Console redesign (Radar-like operational UX)
- Map-first workspace.
- Event timeline + dense diagnostics table.
- Standardized nav/filters/states for desktop and mobile.

## Definition of Done per Ticket
- Security checks pass (`check:security`).
- Migration ordering valid (`check:migrations`).
- Typecheck, lint, tests, build pass.
- Rollback documented.
- Runtime logs include `organization_id`, `integration_id`, `job_id` where applicable.
