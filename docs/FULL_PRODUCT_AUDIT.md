# Polsya — Full Product Functionality Audit

**Date:** 2026-03-14
**Branch:** `feat/quality-improvements`
**Method:** Deep codebase analysis (routes, hooks, services, Supabase schema, edge functions, nav configs)
**Previous audits:** `docs/PRODUCT_AUDIT.md`, `docs/THREE_LAYER_ARCHITECTURE_AUDIT.md` — findings verified and expanded.

---

## 1. Feature Audit Table

### Layer 1 — Marketing Web (Public)

| Feature / Page | Route | Status | Backend Wiring | Notes |
|----------------|-------|--------|----------------|-------|
| Home (Landing) | `/` | FULL | Static | `LandingOrRedirect` — redirects logged-in users to `/app` or `/admin` |
| Product | `/product` | FULL | Static | Marketing page |
| How It Works | `/how-it-works` | FULL | Static | Marketing page |
| Integrations | `/integrations` | FULL | Static | **ROUTE CONFLICT** — same path claimed by Layer 2 |
| Use Cases | `/use-cases` | FULL | Static | Marketing page |
| Pricing | `/pricing` | FULL | Static | Marketing page |
| Customers | `/customers` | FULL | Static | Marketing page |
| Resources | `/resources` | FULL | Static | Marketing page |
| Security | `/security` | FULL | Static | Marketing page |
| Contact | `/contact` | FULL | `submit-contact` edge fn | Contact form submits to backend |
| Terms | `/terms` | FULL | Static | Legal page |
| Privacy | `/privacy` | FULL | Static | Legal page |

### Layer 2 — User App (Product Dashboard)

| Feature / Page | Route | Status | Backend Wiring | Notes |
|----------------|-------|--------|----------------|-------|
| **Dashboard** | `/app` | FULL | `creative_clients`, `creative_projects`, `creative_opportunities`, `signals`, `signal_rules`, `entity_resolution_candidates`, `enrichment_credits`, `creative_activities` | 7 parallel Supabase queries; all data REAL |
| **Discover** | `/app/discover` | FULL | `places-search` edge fn → Google Places API; saves to `creative_clients` + `creative_opportunities` | **401 in production** — `requireOrgRoleAccess` auth issue |
| **Clients** | `/app/clients` | FULL | `creative_clients` table | Full CRUD via `useCreativeClients` |
| **Projects** | `/app/projects` | FULL | `creative_projects` table | Full CRUD via `useCreativeProjects` |
| **Opportunities** | `/app/opportunities` | FULL | `creative_opportunities` table | Full CRUD via `useCreativeOpportunities` |
| **Contacts** | `/app/contacts` | FULL | `creative_contacts` table | Full CRUD via `useCreativeContacts` |
| **Portfolios** | `/app/portfolios` | FULL | `creative_portfolios` table | Full CRUD via `useCreativePortfolios` |
| **Signals** | `/app/signals` | FULL | `signals`, `signal_rules` tables | CRUD via `useSignals` |
| **Style Engine** | `/app/style` | FULL | `style_analyses` table | CRUD via `useStyleAnalyses` |
| **Enrichment** | `/app/enrichment` | FULL | `enrichment_credits`, `enrichment_recipes`, `enrichment_runs` | Triggers `process-enrichment-run` edge fn |
| **Resolution** | `/app/resolution` | FULL | `entity_resolution_candidates`, `entity_source_mappings` | Resolve candidates, view mappings |
| **Workflows** | `/app/workflows` | FULL | `creative_workflow_rules` table | CRUD via `useWorkflowRules` |
| **Ingestion** | `/app/ingestion` | FULL | `ingestion_providers`, `ingestion_runs`, `ingestion_sync_jobs` | Create/update/delete providers, trigger runs |
| **Knowledge Base** | `/app/knowledge-base` | FULL | `ai_documents` + `ai-document-ingest` edge fn | Upload, list, delete documents |
| **Inbox** | `/app/inbox` | FULL | `creative_emails` table | Reads from DB; **requires email sync integration to populate** |
| **Calendar** | `/app/calendar` | FULL | `creative_calendar_events` table | Reads from DB; **requires calendar sync to populate** |
| **Reports** | `/app/reports` | PARTIAL | Client-side aggregation from multiple tables | No dedicated reports table; `useCreativeReports` aggregates |
| **Analytics Overview** | `/app/analytics` | FULL | Aggregates from `creative_opportunities`, `creative_activities`, etc. | Via `useAnalyticsOverview` |
| **Pipeline Analytics** | `/app/analytics/pipeline` | FULL | `pipelineService` + Supabase | Via `usePipelineAnalytics` |
| **Activity Analytics** | `/app/analytics/activity` | FULL | `activityService` + Supabase | Via `useActivityAnalytics` |
| **Communication Analytics** | `/app/analytics/communication` | FULL | `analyticsService` (emails, meetings) | Via `useCommunicationAnalytics` |
| **AI Insights** | `/app/analytics/insights` | FULL | `useAIInsights` → `analyticsService` | Via `useAIInsights` |
| **Profile** | `/profile` | FULL | `organizations`, `ai_chat_config`, `billing_*` | Workspace settings, AI config |
| **Billing** | `/billing` | FULL | `billing_plans`, `billing_subscriptions`, Stripe edge fns | Checkout, portal, usage |
| **Team** | `/team` | PARTIAL | `organization_members` | UI for invites; invite flow may be incomplete |
| **Integrations (App)** | `/integrations` | FULL | `integration_connections`, OAuth, jobs, runs | **UNREACHABLE** — route conflict with marketing |
| Companies | N/A | UI ONLY | — | `future: true` in sidebar; no route in App.tsx |
| People | N/A | UI ONLY | — | `future: true` in sidebar; no route in App.tsx |
| Leads | N/A | UI ONLY | — | `future: true` in sidebar; no route in App.tsx |

### Layer 2B — Legacy App (Pharmacy/Prospecting/Operations)

| Feature / Page | Route | Status | Backend Wiring | Notes |
|----------------|-------|--------|----------------|-------|
| Legacy Dashboard | `/dashboard` | PARTIAL | WooCommerce edge fn | Shows empty without WooCommerce integration; **redirect to /app intended but broken** |
| Entity Prospecting | `/prospecting/entities` | FULL | `pharmacies`, `geography_*`, `places-search` / `google-places-pharmacies` | Legacy pharmacy search |
| Entity Operations | `/operations/entities` | FULL | `pharmacies`, `pharmacy_opportunities`, `pharmacy_contacts`, `pharmacy_activities` | Full CRUD, bulk import |
| Legacy Reports | `/reports` | PARTIAL | WooCommerce + `useDashboardKpis` | Depends on WooCommerce |

### Layer 3 — Admin Console

| Feature / Page | Route | Status | Backend Wiring | Notes |
|----------------|-------|--------|----------------|-------|
| Dashboard | `/admin` | FULL | `billing_subscriptions`, `platform_audit_logs`, `contact_messages` | |
| Users | `/admin/users` | FULL | `organization_members` | Displays UUID instead of email (known issue) |
| Organizations | `/admin/organizations` | FULL | `organizations`, `billing_subscriptions` | |
| Org Detail | `/admin/org/:orgId` | FULL | Multiple tables + `ai_chat_config` | |
| Subscriptions | `/admin/subscriptions` | FULL | `billing_subscriptions` | |
| Billing | `/admin/billing` | FULL | `billing_invoices` | |
| Signals | `/admin/signals` | FULL | `signals`, `signal_rules` | |
| Ingestion | `/admin/ingestion` | FULL | `ingestion_runs`, `ingestion_providers` | |
| AI Jobs | `/admin/ai-jobs` | FULL | `ai_documents`, `ai_usage_monthly` | |
| Moderation | `/admin/moderation` | PARTIAL | UI exists; backend needs verification | |
| Logs | `/admin/logs` | FULL | `platform_audit_logs` | |
| Feature Flags | `/admin/flags` | FULL | `platform_settings` | Type-cast workaround (known) |
| Analytics | `/admin/analytics` | FULL | `billing_subscriptions`, `organization_members` | |
| Settings | `/admin/settings` | FULL | `platform_owner_emails` | |

---

## 2. Routing & Navigation Audit

### CRITICAL: Sidebar All Shows Same Page

**Root cause confirmed:** `sidebar-nav-config.ts` uses `/creative/*` paths for ALL nav items, but routes are at `/app/*`. App.tsx has a catch-all redirect:

```
Route path="creative/*" element={<Navigate to="/app" replace />}
```

This redirects ANY `/creative/*` path to `/app` — **dropping the subpath**. So:
- Clicking "Local Businesses" → navigates to `/creative/discover` → redirects to `/app` (dashboard)
- Clicking "Clients" → navigates to `/creative/clients` → redirects to `/app` (dashboard)
- Every sidebar item lands on the dashboard.

**Fix:** Change ALL paths in `sidebar-nav-config.ts` from `/creative/*` to `/app/*`.

### All Routing Issues

| # | Issue | Severity | Location | Current | Should Be |
|---|-------|----------|----------|---------|-----------|
| 1 | **Sidebar paths wrong** | BLOCKER | `sidebar-nav-config.ts` | `/creative/*` | `/app/*` |
| 2 | **`/integrations` route conflict** | BLOCKER | `App.tsx` lines 137 + 176 | Marketing wins, app unreachable | Move app to `/app/integrations` |
| 3 | **Login redirect** | HIGH | `Login.tsx` line 32, 56 | `/dashboard` | `/app` |
| 4 | **`/dashboard` redirect unreachable** | HIGH | `App.tsx` line 250 | After ProtectedRoute (shadowed by line 159) | Move before or remove |
| 5 | **OAuth: Gmail callback** | HIGH | `GmailOAuthCallback.tsx` | `redirectPath="/dashboard"` | `"/app"` or `"/app/integrations"` |
| 6 | **OAuth: Outlook callback** | HIGH | `OutlookOAuthCallback.tsx` | `redirectPath="/dashboard"` | `"/app"` or `"/app/integrations"` |
| 7 | **OAuth: Notion callback** | MEDIUM | `NotionOAuthCallback.tsx` | `redirectPath="/integrations"` | `"/app/integrations"` |
| 8 | **OAuth: Google Drive callback** | MEDIUM | `GoogleDriveOAuthCallback.tsx` | `redirectPath="/integrations"` | `"/app/integrations"` |
| 9 | **Breadcrumbs home link** | MEDIUM | `Breadcrumbs.tsx` line 25, 49 | `/dashboard` | `/app` when in `/app/*` |
| 10 | **ClientDetail cross-links** | MEDIUM | `ClientDetail.tsx` lines 144, 160, 179 | `/creative/signals`, `/creative/style`, `/creative/resolution` | `/app/signals`, `/app/style`, `/app/resolution` |
| 11 | **ContactDetail cross-links** | MEDIUM | `ContactDetail.tsx` lines 152, 168 | `/creative/signals`, `/creative/resolution` | `/app/signals`, `/app/resolution` |
| 12 | **AppSidebar dashboard link** | LOW | `AppSidebar.tsx` line 51, 94, 109 | `/dashboard` | `/app` |
| 13 | **PlatformLayout links** | LOW | `PlatformLayout.tsx` (deprecated) | `/platform/*` | `/admin/*` (or delete file) |
| 14 | **PlatformLayout non-owner redirect** | LOW | `PlatformLayout.tsx` line 28 | `Navigate to="/dashboard"` | `"/app"` |
| 15 | **CommandPalette** | LOW | `CommandPalette.tsx` line 118 | `/dashboard` | `/app` |
| 16 | **Sidebar bottom: Integrations** | BLOCKER | `sidebar-nav-config.ts` line 141 | `/integrations` (marketing) | `/app/integrations` |
| 17 | **Analytics sidebar path mismatch** | MEDIUM | `sidebar-nav-config.ts` line 120 | `/creative/analytics/ai-insights` | `/app/analytics/insights` (actual route) |

### Routes That Work Correctly
- `/` → Marketing home (redirects logged-in users correctly)
- `/login`, `/signup`, `/forgot-password`, `/reset-password` → Auth flows
- `/admin/*` → All admin routes work (nav config uses `/admin/*` correctly)
- `/app/*` → All route definitions exist and are correct
- Admin nav "Back to App" → `/app` (correct)

---

## 3. Terminology Audit — Pharmacy/Herbalist References

**65 files** contain pharmacy/herbalist references. Here's the breakdown:

### User-Facing (MUST FIX)

| File | Reference | Replacement |
|------|-----------|-------------|
| `src/hooks/useEntityTypes.ts` line 29-30 | `key: 'pharmacy', label: 'Pharmacy'` + `key: 'herbalist', label: 'Herbalist'` as DEFAULT_ENTITY_TYPES | `key: 'business', label: 'Business'` + `key: 'agency', label: 'Agency'` |
| `src/types/pharmacy.ts` | Entire file defines pharmacy types | Rename to `entity-legacy.ts` or merge into `entity.ts` |
| `src/types/entity.ts` | References pharmacy types | Update to generic terms |
| `src/hooks/usePharmacies.ts` | `pharmacies` table queries | Legacy — keep for `/operations` but don't expose in `/app` |
| `src/hooks/useSavePharmacies.ts` | Saves to `pharmacies` table | Legacy |
| `src/hooks/useProspectingSearch.ts` | `google-places-pharmacies` edge fn | Legacy |
| `src/components/prospecting/*` (6 files) | Pharmacy references in UI labels, filters | Legacy prospecting UI |
| `src/components/operations/*` (5 files) | Pharmacy in table headers, filters, detail panel | Legacy operations UI |
| `src/components/dashboard/AgentActionsCard.tsx` | Pharmacy references | Legacy dashboard |
| `src/components/layout/CommandPalette.tsx` | Pharmacy search | Legacy |
| `src/components/layout/NotificationCenter.tsx` | Pharmacy notifications | Legacy |
| `src/services/entityService.ts` | `pharmacies` table | Legacy service |
| `src/services/dashboardKpiService.ts` | Pharmacy KPI queries | Legacy |
| `src/lib/industry-templates.ts` | Pharmacy/herbalist industry templates | Rename to generic |

### Backend/Edge Functions (LOW PRIORITY)

| File | Reference |
|------|-----------|
| `supabase/functions/google-places-pharmacies/` | Edge function for pharmacy search |
| `supabase/functions/geocode-pharmacies/` | Geocode pharmacies |

### Test Files (UPDATE WITH CODE)

| File | Reference |
|------|-----------|
| 12 test files | Reference pharmacy types in test data |

### Creative/App Layer (CLEAN)
The `/app/*` creative layer has **zero pharmacy references** — it uses generic terms (clients, contacts, entities, businesses). The pharmacy terminology only exists in the legacy `/prospecting` and `/operations` layers.

---

## 4. Real vs Fake Content — Dashboard Verification

The Creative Dashboard at `/app` displays these KPIs via `useCreativeDashboard()` hook:

| Dashboard Section | Data Source | Classification | Details |
|-------------------|------------|----------------|---------|
| **Clients** | `creative_clients` count | **REAL (EMPTY)** | Connected; shows 0 if no clients created |
| **Active Projects** | `creative_projects` count (status='active') | **REAL (EMPTY)** | Connected; shows 0 if no projects |
| **Pipeline Value** | Sum of `creative_opportunities.value_cents` (open stages) | **REAL (EMPTY)** | Connected; shows $0 if no opportunities |
| **Win Rate** | Calculated from won/lost opportunities | **REAL (EMPTY)** | Connected; shows 0% if no won/lost data |
| **New Signals** | `signals` count (status='new') | **REAL (EMPTY)** | Connected; shows 0 if no signals |
| **Active Rules** | `signal_rules` count (is_active=true) | **REAL (EMPTY)** | Connected; shows 0 if no rules |
| **Pending Merges** | `entity_resolution_candidates` count (status='pending') | **REAL (EMPTY)** | Connected; shows 0 if no candidates |
| **Enrichment Credits** | `enrichment_credits` sum(total - used) | **REAL (EMPTY)** | Connected; shows 0 if no credits allocated |
| **Stage Breakdown** | Derived from `creative_opportunities` by stage | **REAL (EMPTY)** | Connected; empty if no opportunities |
| **Recent Activity** | `creative_activities` table | **REAL (EMPTY)** | Connected via `useCreativeActivities`; shows empty state |
| **Pending Resolutions** | `entity_resolution_candidates` | **REAL (EMPTY)** | Connected; shows 0 |

**Verdict:** ALL dashboard sections are **REAL** — connected to Supabase with proper queries. They show "0" or empty states because the user hasn't created any data yet, NOT because they're broken or fake.

---

## 5. Integrations Audit

### Layer 1 — Marketing Integrations Page (`/integrations`)
- **Status:** FULL (static/informational)
- Lists: Behance, Dribbble, Instagram, Squarespace, Shopify, WooCommerce, WordPress, Figma, Adobe Creative Cloud, Canva, Google Drive, Dropbox, Notion, Slack, Stripe, QuickBooks, HubSpot, Mailchimp, Google Analytics, Hotjar
- **No backend** — purely marketing showcase

### Layer 2 — App Integrations Page (`/integrations` → should be `/app/integrations`)

| Integration | OAuth/Config | Data Ingestion | Edge Function | Status |
|-------------|--------------|----------------|---------------|--------|
| **Gmail** | FULL (OAuth) | `email-sync` edge fn | `gmail-oauth-url`, `gmail-oauth-exchange` | **FUNCTIONAL** |
| **Outlook** | FULL (OAuth) | `email-sync` edge fn | `outlook-oauth-url`, `outlook-oauth-exchange` | **FUNCTIONAL** |
| **Notion** | FULL (OAuth) | Partial | `oauth-start`, `oauth-exchange` | **PARTIAL** |
| **Google Drive** | FULL (OAuth) | Partial | `oauth-start`, `oauth-exchange` | **PARTIAL** |
| **WooCommerce** | FULL (API key) | FULL | `woocommerce-orders`, `woocommerce-orders-detailed` | **FUNCTIONAL** |
| **Shopify** | PARTIAL | — | In registry, no dedicated edge fn | **UI PLACEHOLDER** |
| **HubSpot** | UI ONLY | — | In registry, no OAuth callback route | **UI PLACEHOLDER** |
| **Salesforce** | UI ONLY | — | In registry, no OAuth callback route | **UI PLACEHOLDER** |
| **Slack** | UI ONLY | — | In registry, no OAuth callback route | **UI PLACEHOLDER** |
| **Brevo** | PARTIAL | — | `email-marketing-key-upsert` | **PARTIAL** |
| **IMAP** | PARTIAL | — | `email-imap-upsert` + `email-sync` | **PARTIAL** |

### Layer 3 — Admin Integration Monitoring
- **Admin Ingestion** (`/admin/ingestion`): Views `ingestion_runs`, `ingestion_providers` — FULL
- **Integration health**: `useIntegrationHealth` hook exists

### Critical Issue
**The app integrations page is unreachable** because `/integrations` is claimed by the marketing layout (defined first in App.tsx). Users clicking "Integrations" in the sidebar go to the marketing page.

---

## 6. Backend Connectivity Report

### Supabase Tables (from migrations + code references)

**Creative domain (Layer 2):**
`creative_clients`, `creative_projects`, `creative_opportunities`, `creative_contacts`, `creative_portfolios`, `creative_workflow_rules`, `creative_emails`, `creative_calendar_events`, `creative_activities`, `style_analyses`, `signals`, `signal_rules`, `enrichment_credits`, `enrichment_recipes`, `enrichment_runs`, `entity_resolution_candidates`, `entity_source_mappings`, `ai_documents`, `ai_chat_config`, `ai_chat_messages`

**Legacy (Layer 2B):**
`pharmacies`, `pharmacy_opportunities`, `pharmacy_contacts`, `pharmacy_activities`, `pharmacy_order_documents`, `entity_types`, `geography_countries`, `geography_provinces`, `geography_cities`, `saved_segments`, `bulk_import_runs`

**Integrations:**
`integration_connections`, `integration_oauth_states`, `integration_oauth_tokens`, `integration_sync_jobs`, `integration_sync_runs`

**Billing:**
`billing_plans`, `billing_subscriptions`, `billing_customers`, `billing_invoices`, `contact_messages`

**Platform (Layer 3):**
`organizations`, `organization_members`, `platform_settings`, `platform_owner_emails`, `platform_audit_logs`

### Edge Functions (34 total)

| Function | Status | Used By |
|----------|--------|---------|
| `places-search` | DEPLOYED (401 in prod) | Discover |
| `google-places-pharmacies` | DEPLOYED | Legacy Prospecting |
| `google-places-search` | DEPLOYED | Discover/Prospecting |
| `oauth-start` | DEPLOYED | Integrations |
| `oauth-exchange` | DEPLOYED | OAuth callbacks |
| `gmail-oauth-url` | DEPLOYED | Gmail integration |
| `gmail-oauth-exchange` | DEPLOYED | Gmail callback |
| `outlook-oauth-url` | DEPLOYED | Outlook integration |
| `outlook-oauth-exchange` | DEPLOYED | Outlook callback |
| `email-sync` | DEPLOYED | Inbox (via sync jobs) |
| `email-send` | DEPLOYED | Email compose |
| `email-imap-upsert` | DEPLOYED | IMAP config |
| `email-marketing-key-upsert` | DEPLOYED | Brevo config |
| `calendar-sync` | DEPLOYED | Calendar |
| `calendar-event-create` | DEPLOYED | Calendar |
| `woocommerce-orders` | DEPLOYED | Legacy Dashboard |
| `woocommerce-orders-detailed` | DEPLOYED (errors reported) | Legacy Dashboard |
| `submit-contact` | DEPLOYED | Marketing Contact |
| `process-enrichment-run` | DEPLOYED | Enrichment |
| `process-integration-sync-jobs` | DEPLOYED (errors reported) | Sync scheduler |
| `ai-document-ingest` | DEPLOYED | Knowledge Base |
| `ai-chat-proxy` | DEPLOYED | AI Chat |
| `ai-chat-config` | DEPLOYED | AI Config |
| `ai-embeddings` | DEPLOYED | AI features |
| `ai-weekly-digest` | DEPLOYED | Digest emails |
| `activity-reminders` | DEPLOYED | Activity reminders |
| `workflow-engine` | DEPLOYED | Workflows |
| `create-checkout-session` | DEPLOYED | Billing |
| `create-customer-portal-session` | DEPLOYED | Billing |
| `stripe-webhook` | DEPLOYED | Stripe |
| `resend` | DEPLOYED | Transactional email |
| `geocode-entities` | DEPLOYED | Geocoding |
| `geocode-pharmacies` | DEPLOYED | Legacy geocoding |
| `populate-geography` | DEPLOYED | Geography data |

### Known Backend Errors
1. `places-search` → 401 in production (org role access check)
2. `get_org_ai_budget` → RPC fails (may be missing from migrations)
3. `process-integration-sync-jobs` → errors (sync scheduling issue)
4. `woocommerce-orders-detailed` → errors (WooCommerce config issue)

### UI Features Without Backend
- Companies, People, Leads (`future: true`) — no routes, no tables
- Some integration providers (HubSpot, Salesforce, Slack) — in registry but no OAuth flows

---

## 7. System Readiness Estimate

### Overall

| Category | % | Count |
|----------|---|-------|
| **Fully working** | ~75% | Most creative pages, auth, billing, admin, discover (when auth fixed), signals, enrichment, workflows, knowledge base |
| **Partially implemented** | ~15% | Reports (client-side), Team (invites), Inbox/Calendar (need sync), some integrations |
| **UI only** | ~5% | Future nav items (Companies, People, Leads) |
| **Broken/Unreachable** | ~5% | Sidebar navigation, app integrations page, discover 401 |

### Per Layer

| Layer | Readiness | Notes |
|-------|-----------|-------|
| **Layer 1 (Marketing)** | **95%** | Fully functional. Only issue: route conflict with `/integrations`. |
| **Layer 2 (User App)** | **70%** | All pages have real backend wiring. **BLOCKED by sidebar navigation bug** — users can't reach any page. After fix: ~85%. Remaining gaps: Inbox/Calendar need sync setup, Discover 401, integrations page unreachable. |
| **Layer 2B (Legacy)** | **80%** | Prospecting and Operations work. Dashboard/Reports need WooCommerce. Pharmacy terminology needs cleanup. |
| **Layer 3 (Admin)** | **90%** | Nearly everything works. Users page shows UUID instead of email. Moderation needs verification. |

### Key Insight
**The product is more functional than it appears.** The primary problem is NOT missing backend wiring — it's that **navigation is broken**. Users can't reach any page because the sidebar sends everyone to the dashboard. Once the sidebar paths are fixed, ~75% of the product becomes immediately usable.

---

## 8. Recommended Development Roadmap

### Phase 1 — Fix Navigation (CRITICAL — makes product usable) ⏱️ ~2 hours

| # | Task | File(s) | Change |
|---|------|---------|--------|
| 1.1 | **Fix sidebar nav paths** | `src/components/creative/layout/sidebar-nav-config.ts` | Change ALL `/creative/*` → `/app/*` (dashboard: `/app`, discover: `/app/discover`, clients: `/app/clients`, etc.) |
| 1.2 | **Fix `/integrations` route conflict** | `src/App.tsx` | Add `/app/integrations` route under CreativeLayout; update sidebar bottom nav to `/app/integrations` |
| 1.3 | **Fix login redirect** | `src/pages/Login.tsx` lines 32, 56 | Change `/dashboard` → `/app` |
| 1.4 | **Fix OAuth callback redirects** | `GmailOAuthCallback.tsx`, `OutlookOAuthCallback.tsx` | `redirectPath="/app"` |
| 1.5 | **Fix OAuth callback redirects** | `NotionOAuthCallback.tsx`, `GoogleDriveOAuthCallback.tsx` | `redirectPath="/app/integrations"` |
| 1.6 | **Fix breadcrumbs** | `src/components/layout/Breadcrumbs.tsx` | Use `/app` when pathname starts with `/app` |
| 1.7 | **Fix ClientDetail links** | `src/components/creative/clients/ClientDetail.tsx` | `/creative/signals` → `/app/signals`, `/creative/style` → `/app/style`, `/creative/resolution` → `/app/resolution` |
| 1.8 | **Fix ContactDetail links** | `src/components/creative/contacts/ContactDetail.tsx` | Same pattern |
| 1.9 | **Fix `/dashboard` redirect** | `src/App.tsx` | Remove `Route path="dashboard"` from ProtectedRoute block; keep only the redirect `<Navigate to="/app">` |
| 1.10 | **Fix CommandPalette** | `src/components/layout/CommandPalette.tsx` | `/dashboard` → `/app` |
| 1.11 | **Fix AppSidebar** | `src/components/layout/AppSidebar.tsx` | `/dashboard` → `/app` |
| 1.12 | **Fix sidebar analytics path** | `sidebar-nav-config.ts` line 120 | `/creative/analytics/ai-insights` → `/app/analytics/insights` |
| 1.13 | **Delete or update PlatformLayout** | `src/components/layout/PlatformLayout.tsx` | Deprecated; either delete or update links to `/admin/*` |

### Phase 2 — Fix Terminology (aligns with Clay.com positioning) ⏱️ ~1 hour

| # | Task | File(s) | Change |
|---|------|---------|--------|
| 2.1 | **Default entity types** | `src/hooks/useEntityTypes.ts` | `pharmacy` → `business`, `herbalist` → `agency` |
| 2.2 | **Industry templates** | `src/lib/industry-templates.ts` | Rename pharmacy/herbalist templates |
| 2.3 | **Entity types** | `src/types/entity.ts`, `src/types/pharmacy.ts` | Generic naming |
| 2.4 | **DiscoverSearchForm** | `src/components/creative/discover/DiscoverSearchForm.tsx` | `pharmacy` in PLACE_TYPES is a Google API type — keep, but review labels |

### Phase 3 — Fix Production Errors ⏱️ ~4 hours

| # | Task | Details |
|---|------|---------|
| 3.1 | **Discover 401** | Debug `requireOrgRoleAccess` in `places-search` edge fn — verify user has org membership, role includes 'member' |
| 3.2 | **`get_org_ai_budget` RPC** | Check if RPC exists in migrations; add if missing |
| 3.3 | **`process-integration-sync-jobs`** | Debug sync job processing errors |
| 3.4 | **`woocommerce-orders-detailed`** | Debug WooCommerce edge fn errors |
| 3.5 | **AdminUsers UUID display** | Show user email instead of UUID |

### Phase 4 — Enable Data Population ⏱️ ~1 week

| # | Task | Details |
|---|------|---------|
| 4.1 | **Email sync** | Ensure `email-sync` edge fn is triggered by `process-integration-sync-jobs`; verify Gmail/Outlook OAuth env vars |
| 4.2 | **Calendar sync** | Ensure `calendar-sync` is triggered; verify calendar permissions |
| 4.3 | **Sync scheduling** | Set up cron trigger for `process-integration-sync-jobs` |
| 4.4 | **Onboarding flow** | Guide users to create first client, opportunity, etc. so dashboard isn't empty |

### Phase 5 — Complete Integrations ⏱️ ~2-3 weeks

| # | Task | Details |
|---|------|---------|
| 5.1 | **Shopify** | Edge fn for orders, wire to UI |
| 5.2 | **HubSpot, Salesforce, Slack** | OAuth callback routes, exchange logic, sync targets |
| 5.3 | **Data mapping** | Map integration data to creative tables |

### Phase 6 — UI Redesign ⏱️ Defer

Defer until Phases 1-4 are stable. The Clay/Attio redesign plan exists at `/Users/diegosanjuanvillanueva/.claude/plans/radiant-herding-wombat.md`.

---

## 9. Files to Modify (Phase 1 — Quick Reference)

```
src/components/creative/layout/sidebar-nav-config.ts   ← ALL paths /creative/* → /app/*
src/App.tsx                                             ← Add /app/integrations route, fix /dashboard
src/pages/Login.tsx                                     ← /dashboard → /app
src/pages/GmailOAuthCallback.tsx                        ← redirectPath="/app"
src/pages/OutlookOAuthCallback.tsx                      ← redirectPath="/app"
src/pages/NotionOAuthCallback.tsx                       ← redirectPath="/app/integrations"
src/pages/GoogleDriveOAuthCallback.tsx                  ← redirectPath="/app/integrations"
src/components/layout/Breadcrumbs.tsx                   ← Layer-aware home link
src/components/creative/clients/ClientDetail.tsx        ← /creative/* → /app/*
src/components/creative/contacts/ContactDetail.tsx      ← /creative/* → /app/*
src/components/layout/CommandPalette.tsx                 ← /dashboard → /app
src/components/layout/AppSidebar.tsx                    ← /dashboard → /app
src/components/layout/PlatformLayout.tsx                ← Delete or fix
```

---

## 10. Verification Checklist (Post Phase 1)

- [ ] Sidebar "Discover" → `/app/discover` (shows Discover page, NOT dashboard)
- [ ] Sidebar "Clients" → `/app/clients` (shows Clients page)
- [ ] Sidebar "Signals" → `/app/signals` (shows Signals page)
- [ ] Sidebar "Integrations" → `/app/integrations` (shows app integrations, NOT marketing)
- [ ] Login as regular user → lands on `/app` (not `/dashboard`)
- [ ] Gmail OAuth → returns to `/app`
- [ ] Breadcrumbs home from `/app/clients` → `/app` (not `/dashboard`)
- [ ] ClientDetail "Signals" link → `/app/signals`
- [ ] Admin "Back to App" → `/app`
- [ ] Guest at `/` → marketing home
- [ ] Logged-in user at `/` → redirects to `/app`
