# Moodly SaaS Architecture V3

## 1. Context
Moodly is a multi-org SaaS application for B2B field sales and operations.

Core domain modules:
- Prospecting
- Operations
- CRM
- Integrations
- Billing
- AI Agents
- Location Intelligence

## 2. High-Level Architecture

### Frontend (React + TanStack Query)
- Thin pages and hooks.
- Domain services for business rules.
- Integration cards + jobs/runs observability.
- Route-level lazy loading.

### Backend (Supabase)
- Postgres + RLS for org data isolation.
- Edge functions as BFF layer with org-role auth.
- Background-like processing via `integration_sync_jobs` + processor function.

### Data planes
1. Transactional: CRM/accounts/orders/docs.
2. Integration state: connections/jobs/runs/sync objects.
3. Security/audit: agent actions + approvals + runs.
4. Billing: customers/subscriptions/invoices.

## 3. Integration Architecture

### Connector contract
Each provider exposes:
- `testConnection`
- `syncEntities`
- `syncOrders`
- `syncProducts`
- `syncInventory`

All sync results normalize to:
- `processed`, `failed`, `summary`, `records[]`
- `records[]` include `externalId`, `externalUpdatedAt`, `payload`

### Job processing flow
1. UI enqueues `integration_sync_jobs` row (queued).
2. Processor claims one job atomically (`queued -> running`).
3. Connector fetches provider data.
4. Upsert into `integration_sync_objects` with idempotency key:
- `(organization_id, integration_id, provider, sync_target, external_id)`
5. Update run metrics and integration health status.

## 4. Security Model

### AuthN/AuthZ
- JWT required for all sensitive edge functions.
- Organization context from header + verified membership.
- Role checks: `admin`, `manager`, `ops` (or allowlist for break-glass).

### Secrets handling
- Never store secrets in `integration_connections.metadata`.
- OAuth tokens in dedicated service-role-protected tables.
- IMAP/SMTP credentials in dedicated secure vault table.

## 5. Multi-Industry Strategy
- Neutral entity semantics in UI/API (`entity/account/client`).
- Configurable entity types per org.
- Legacy pharmacy/herbalist compatibility via adapter layer.

## 6. Billing and Access
- One active subscription per organization (v1).
- Access guard at app/module level based on subscription status.
- Grace period support for `past_due`.

## 7. Observability
- Structured logs for edge functions with IDs:
- `organization_id`, `integration_id`, `job_id`, `run_id`.
- Contract tests for CORS/auth invariants.
- CI gates enforce lint/typecheck/test/build + migration/security checks.

## 8. Next Technical Priorities
1. Outlook OAuth + sync connector.
2. IMAP/SMTP credential vault + test endpoint.
3. Location event ingestion and route intelligence.
4. Mobile-first hardening for field workflows.
