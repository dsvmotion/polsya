# Moodly CRM – Full Platform Audit & Architecture Roadmap

**Date:** February 2026  
**Scope:** moodlycrm.com (sales-compass-95)

---

## Executive Summary

This document provides a comprehensive audit of the current Moodly platform architecture, identifies gaps against the target SaaS model, and proposes a phased improvement roadmap. The platform has a solid foundation (Supabase, Stripe, multi-tenant RLS, integrations) but lacks: (1) clear system/admin/app route separation, (2) granular RBAC beyond platform owner vs tenant, (3) contact form email delivery, (4) plugin architecture, (5) AI assistant with RAG, and (6) robust reliability tooling.

---

## 1. Current Routing & Layout

### Routes Overview

| Area | Paths | Guard | Layout |
|------|-------|-------|--------|
| **Public** | `/`, `/features`, `/pricing`, `/contact`, `/terms`, `/privacy`, `/trust` | None | `PublicLayout` |
| **Auth** | `/login`, `/signup`, `/forgot-password`, `/reset-password` | None | — |
| **App (Tenants)** | `/dashboard`, `/prospecting/*`, `/operations/*`, `/reports`, `/team`, `/integrations`, `/profile`, `/billing` | `ProtectedRoute` + `ActivateSubscriptionGate` | `AppLayout` |
| **Platform** | `/platform`, `/platform/*` | `ProtectedRoute` + `isPlatformOwner` | `PlatformLayout` |

### Target Structure (from requirements)

| Area | Path | Who | Examples |
|------|------|-----|----------|
| **/system** | Super Admin only | Owner | plugins, global integrations, API keys, tenants, infra, logs, feature flags |
| **/admin** | Internal Moodly team | Admin/Ops | clients, onboarding, alerts, support, aggregated analytics |
| **/app** | Client organizations | Tenants | dashboard, team, integrations, reports, settings |

### Gaps

- No `/system` vs `/admin` separation; `/platform` mixes super-admin and ops capabilities.
- No `/app` grouping; tenant routes are under root (`/dashboard`, `/profile`, etc.).
- Platform ownership is binary; no distinction between Super Admin and Admin/Ops.

**Recommendation:** Introduce `/system` (Super Admin), `/admin` (internal team), `/app` (tenants) with role checks. Migrate `/platform` content into `/system` and `/admin` based on capability.

---

## 2. RBAC – Roles & Permissions

### Current Roles

| Context | Source | Roles |
|---------|--------|-------|
| **Tenant (org)** | `organization_members.role` | `admin`, `manager`, `rep`, `ops` |
| **Platform** | `auth.users.app_metadata.role` | `platform_owner`, `owner`, `developer`, `platform_admin` |
| **Platform** | `platform_owner_emails` | Email-based admin |
| **Platform** | `VITE_PLATFORM_OWNER_EMAILS` | Env-based admin |

### Permission Checks (current)

| Function | Logic | Used In |
|----------|-------|---------|
| `canManageBilling(role)` | admin, manager | Billing, Team |
| `canManageWorkspace(role)` | Same as canManageBilling | Profile, Team |
| `isPlatformOwner(user)` | app_metadata role or email | PlatformLayout, subscription bypass |

### Target RBAC

| Role | Scope | Capabilities |
|------|-------|--------------|
| **Super Admin** | Platform | Plugins, API keys, infra, logs, tenants, feature flags, billing config |
| **Admin / Ops** | Platform | Clients, support, onboarding, alerts, aggregated analytics |
| **Client Admin** | Tenant | Team, integrations, org settings, billing for org |
| **Client User** | Tenant | Dashboards, reports, integrations (use only) |

### Gaps

- `rep` and `ops` have no distinct permission checks.
- No granular permissions (e.g. `canInviteMembers`, `canViewReports`, `canConfigureIntegrations`).
- Platform roles are not separated (Super Admin vs Admin/Ops).
- No permission registry; checks are scattered.

**Recommendation:** Define a permission matrix, add `platform_role` (`super_admin`, `admin_ops`) and extend `organization_members.role` with capability checks. Centralize checks in `src/lib/permissions.ts`.

---

## 3. Contact Form & Email – Critical Gap

### Current Flow

1. User submits form on `/contact`.
2. `Contact.tsx` inserts directly into `contact_messages` via Supabase client.
3. No email is sent: no confirmation to the user, no notification to the Moodly team.

**Files:** `src/pages/Contact.tsx` (lines 39–44), `supabase/migrations/20260305130000_contact_messages.sql`.

### Required Fix

1. Create `submit-contact` edge function that:
   - Validates input (name, email, message).
   - Inserts into `contact_messages`.
   - Sends transactional email via Resend (or Brevo) to the Moodly team.
   - Optionally sends confirmation to the submitter.
2. Update `Contact.tsx` to call the edge function instead of direct Supabase insert.

**Implementation:** See `submit-contact` edge function and updated Contact page.

---

## 4. Integrations & Connectors

### Current State

- **Provider registry:** 16 providers (WooCommerce, Shopify, Gmail, Outlook, Brevo, Notion, HubSpot, Salesforce, Slack, Pipedrive, PrestaShop, WhatsApp, OpenAI, Anthropic, custom_api, email_imap).
- **OAuth:** Gmail, Outlook, Notion, Google Drive.
- **API key:** WooCommerce, Shopify, Brevo, OpenAI, Anthropic.
- **IMAP/SMTP:** Custom credentials per org.
- **Sync:** `process-integration-sync-jobs` edge function; connectors vary by provider.
- **Health:** `useIntegrationHealth` calls sync processor with `?action=health`.

### Gaps

- Many providers in registry lack implemented connectors (HubSpot, Salesforce, Slack, Pipedrive, WhatsApp).
- OAuth reconnection handling is basic.
- No central integration status page or runbook.
- Sync and health logic are coupled.

**Recommendation:** Complete connectors for high-priority providers or remove from registry; add `integration_connection_status` and reconnection UI; document integration runbook.

---

## 5. Plugin / Extension System

### Current State

- No plugin architecture.
- Feature flags via `platform_settings` (key-value).
- Modularity via provider registry and connectors only.

### Target

- Install / activate / deactivate / update / uninstall lifecycle.
- Super Admin only for plugin management.
- Tenants see only activated plugin features for their org.

**Recommendation:** Design a v1 plugin registry (DB table `plugins` with `key`, `version`, `enabled`, `config`), lifecycle edge functions, and feature-flag integration. Phase 2: plugin SDK and sandboxing.

---

## 6. AI Assistant & Data Pipeline

### Current State

- **AI Chat:** `ai-chat-proxy` edge function; OpenAI/Anthropic via `ai_chat_config`.
- **History:** `ai_chat_messages` (org + user scoped).
- **Embeddings:** `ai-embeddings` function exists; no RAG pipeline.
- **Context:** System prompt built from basic context; no document retrieval.

### Target

- Productivity assistant with contextual access to org data, files, dashboards, reports.
- RAG: embeddings, chunking, retrieval for documents and internal data.
- Strict tenant isolation.

**Recommendation:** Phase 1: Enrich AI chat context with entity/order summaries. Phase 2: Document ingestion (storage + embeddings), chunking, retrieval. Phase 3: RAG integration in `ai-chat-proxy`.

---

## 7. Billing & Stripe

### Current State

- Tables: `billing_plans`, `billing_customers`, `billing_subscriptions`, `billing_invoices`, `billing_webhook_events`.
- Webhooks: `stripe-webhook` handles `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`.
- Plans: Starter, Pro, Business, Enterprise (contact).
- Trial: 7 days via `hasImplicitTrial`.
- Gates: `ActivateSubscriptionGate` (soft block), `requireBillingAccessForOrg` in edge functions.
- Customer portal: `create-customer-portal-session`.

### Gaps

- `billing_plans` may be missing in some environments (migration skipped).
- Plan limits not consistently enforced across all features.
- No revenue analytics dashboard for platform.

**Recommendation:** Ensure `billing_plans` seed migration runs; add plan limit checks to all sensitive edge functions; build `/platform/billing` revenue overview.

---

## 8. Platform Reliability

### Checklist

| Item | Status | Notes |
|------|--------|------|
| Contact form inserts | ✅ | Direct Supabase |
| Contact form email | ❌ | No notification |
| Demo request flow | ❌ | Same as contact; no email |
| Integrations OAuth | ⚠️ | Gmail, Outlook, Notion, Drive ok; others vary |
| Dashboards | ⚠️ | Depends on data and maps API key |
| Auth | ✅ | Supabase Auth |
| Billing checkout | ✅ | Stripe |

### Recommendations

- Fix contact form email (highest priority).
- Add health-check endpoint and status page.
- Add integration connection status indicators in UI.
- Document required env vars (e.g. `VITE_GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY`).

---

## 9. Implementation Roadmap

### Phase 1 – Critical (Weeks 1–2)

1. **Contact form email** – `submit-contact` edge function + Resend; update Contact page.
2. **Demo request** – Reuse contact flow with `subject=demo`; ensure email to team + optional confirmation.
3. **Env & docs** – Document `RESEND_API_KEY`, `CONTACT_FORM_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

### Phase 2 – RBAC & Routes (Weeks 3–4)

4. Introduce `platform_role` (`super_admin`, `admin_ops`).
5. Split `/platform` into `/system` (Super Admin) and `/admin` (Ops).
6. Add permission registry and capability checks.
7. Group tenant routes under `/app` (optional URL change or logical grouping).

### Phase 3 – Integrations & UX (Weeks 5–6)

8. Complete or trim provider registry.
9. Integration health and reconnection UI.
10. Clear integration setup flow for tenants.
11. Dashboard and error handling improvements.

### Phase 4 – AI & Plugins (Weeks 7+)

12. RAG pipeline and document ingestion.
13. Plugin registry and lifecycle (v1).
14. AI assistant context enrichment.

---

## 10. File Reference

| Area | Key Files |
|------|-----------|
| Routes | `src/App.tsx` |
| ProtectedRoute | `src/components/auth/ProtectedRoute.tsx` |
| PlatformLayout | `src/components/layout/PlatformLayout.tsx` |
| RBAC | `src/lib/rbac.ts`, `src/lib/platform.ts` |
| Contact form | `src/pages/Contact.tsx` |
| Platform contact messages | `src/pages/PlatformContactMessages.tsx` |
| Provider registry | `src/lib/provider-registry.ts` |
| Sync processor | `supabase/functions/process-integration-sync-jobs/index.ts` |
| Stripe webhook | `supabase/functions/stripe-webhook/index.ts` |
| AI chat | `supabase/functions/ai-chat-proxy/index.ts` |
