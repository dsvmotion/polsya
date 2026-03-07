# Polsya Marketing Website & Admin Console Design

> **Date**: 2026-03-07
> **Status**: Approved
> **Reference**: Clay marketing website (PDF analysis)

## Scope

| Layer | URL | Status | Action |
|-------|-----|--------|--------|
| Public Marketing Website | `polsya.com` (`/`) | **NEW** | Design and build from scratch |
| Product Application | `/app/*` | **EXISTS** | No changes — continue existing roadmap |
| Admin Console | `/admin/*` | **NEW** | Design and build from scratch |

**Critical constraint**: The product application (CreativeLayout, all `/creative/*` routes, sidebar architecture, modules, navigation) is **untouched**. Development continues exactly as planned. We only rename the route prefix from `/creative/*` → `/app/*` as a URL alias.

---

## Part 1: Clay Analysis Summary

### Structure (11 sections)

1. **Navigation** — Logo + 7 nav items + Login + primary CTA
2. **Hero** — Outcome headline + mechanism subtitle + dual CTA + product screenshot
3. **Data Providers** — 100+ provider logo grid (scale proof)
4. **AI/Workflows** — Table interface + AI agent demo (mechanism proof)
5. **Customer Logos** — Brand social proof bar
6. **Feature Cards** — Icon + title + description capability breakdown
7. **Use Cases** — Diagram + 6 specific use case items
8. **Platform Value** — Cost savings + 3D illustration + Enterprise/Demo CTAs
9. **Security** — SOC 2, GDPR, CCPA, ISO badges with playful visuals
10. **Testimonials** — Colorful card carousel with quotes
11. **Footer CTA + Footer** — Final conversion strip + 5-column footer

### Key Patterns

- **Conversion**: Dual CTA (free trial + demo) repeated every 2-3 sections
- **Messaging**: Outcome-first headlines, mechanism-second subtitles
- **Visual**: Light backgrounds, playful 3D illustrations, generous whitespace
- **Trust**: Numbers for credibility, enterprise security positioning
- **Incentive**: "14-day Pro trial, no credit card required"

---

## Part 2: Architecture

### Single SPA, Three Route Groups

Keep single Vite SPA build. Each layer has its own layout component, its own page directory, and its own component directory. Shared: auth context, design system tokens, UI primitives.

### Route Map

```
MARKETING — MarketingLayout (NEW, light theme)
  /                    Home
  /product             Product overview
  /how-it-works        Workflow demo
  /integrations        Data sources
  /use-cases           Use cases by persona
  /pricing             Pricing plans
  /customers           Social proof
  /resources           Hub page
  /security            Trust center
  /contact             Contact form
  /terms               Terms of service
  /privacy             Privacy policy

PRODUCT — CreativeLayout (EXISTING, unchanged)
  /app                 → renders CreativeLayout with all existing /creative/* routes
  /app/discover        CreativeDiscover
  /app/clients         CreativeClients
  /app/projects        CreativeProjects
  /app/opportunities   CreativeOpportunities
  /app/contacts        CreativeContacts
  /app/portfolios      CreativePortfolios
  /app/analytics/*     Analytics hub
  /app/inbox           CreativeInbox
  /app/calendar        CreativeCalendar
  /app/workflows       CreativeWorkflows
  /app/ingestion       CreativeIngestion
  /app/enrichment      CreativeEnrichment
  /app/resolution      CreativeResolution
  /app/knowledge-base  CreativeKnowledgeBase
  /app/signals         CreativeSignals
  /app/style           CreativeStyle
  /app/reports         CreativeReports

ADMIN — AdminLayout (NEW, sidebar layout)
  /admin               Dashboard (overview)
  /admin/users         User management
  /admin/organizations Org management
  /admin/org/:orgId    Org detail
  /admin/subscriptions Subscription management
  /admin/billing       Billing & invoices
  /admin/signals       Signals monitoring
  /admin/ingestion     Data ingestion
  /admin/ai-jobs       AI job tracking
  /admin/moderation    Content moderation
  /admin/logs          System logs
  /admin/flags         Feature flags
  /admin/analytics     Platform analytics
  /admin/settings      Admin settings

AUTH (standalone pages, unchanged)
  /login
  /signup
  /forgot-password
  /reset-password

LEGACY (redirects)
  /creative/*          → /app/*
  /platform/*          → /admin/*
  /dashboard           → /app
  /prospecting/*       → REMOVE
  /operations/*        → REMOVE
```

### Auth & Access

- **Marketing**: Public, no auth required
- **Product**: `ProtectedRoute` — any authenticated user
- **Admin**: `AdminRoute` — authenticated user with admin role (checked via `isPlatformOwner()` from `src/lib/platform.ts`)
- **Smart redirect**: `LandingOrRedirect` sends authenticated users to `/app`, admins get an "Admin" link in the product topbar

---

## Part 3: Public Marketing Website

### Visual Direction

| Aspect | Current | New |
|--------|---------|-----|
| Theme | Dark (forced via PublicLayout) | **Light** — white/cream backgrounds |
| Typography | Mixed sizes | Labil Grotesk headlines (4xl-6xl), Plus Jakarta Sans body |
| Animation | CSS-only ScrollFadeIn | **Framer Motion** scroll-triggered animations |
| Layout | Narrow, dense | **Generous whitespace**, max-w-7xl container |
| Navigation | 4 links, dark header | 8 links, transparent → white header on scroll |

### MarketingLayout

```
[Polsya Logo]  Product  How it works  Integrations  Use cases  Pricing  Resources  |  Log in  [Get started →]
```

- Sticky header: transparent on hero → white/blur on scroll
- Mobile: hamburger → full-screen overlay menu
- "Get started" = primary CTA with brand-clementine gradient
- MarketingFooter: 5-column layout + newsletter + social links

### Home Page Sections (`/`)

**Section 1 — Hero**
- Headline: "Discover creative talent with intelligent data"
- Subtitle: "Polsya maps portfolios, relationships, and opportunities across the creative industry — so you find the right collaborators before anyone else."
- CTA 1: "Start free trial →" (primary gradient)
- CTA 2: "See how it works" (secondary outline)
- Visual: Product screenshot of CreativeDashboard

**Section 2 — Intelligence Sources**
- Headline: "Enrich every creative profile with 50+ intelligence sources"
- Logo grid of data sources (Behance, Dribbble, LinkedIn, Instagram, award databases, agency directories)

**Section 3 — Core Capabilities (4 pillars)**
- Discover — Find designers, studios, and agencies with intelligent search and filters
- Enrich — Automatically pull portfolio work, awards, social presence, and style signals
- Connect — Map relationships between creatives, brands, and projects
- Act — Prioritize opportunities, automate outreach, track your pipeline

**Section 4 — Product Demo / Workflow**
- Animated walkthrough: Discover → Enrich → Analyze → Connect → Pipeline
- Product screenshots or interactive demo

**Section 5 — Use Cases**
- Headline: "One platform, every creative intelligence use case"
- Agencies, Brands, Producers, Recruiters, Investors, Consultants

**Section 6 — Social Proof**
- Customer/partner logos + animated metric counters

**Section 7 — Security & Compliance**
- Headline: "Enterprise-grade security for sensitive talent data"
- GDPR, encryption, row-level security badges

**Section 8 — Testimonials**
- Colorful card carousel (placeholder initially)

**Section 9 — Final CTA**
- "Start discovering creative talent today"
- "Free 7-day trial. No credit card required."

**Section 10 — Footer**
- Product, Use Cases, Resources, Company, Legal columns

### Other Marketing Pages

| Page | Route | Content |
|------|-------|---------|
| Product | `/product` | Deep dive into each capability module with screenshots |
| How It Works | `/how-it-works` | Step-by-step workflow visualization |
| Integrations | `/integrations` | Grid of data sources by category |
| Use Cases | `/use-cases` | Expanded per-persona use cases |
| Pricing | `/pricing` | Card layout: Starter, Pro, Business, Enterprise + comparison table + FAQ |
| Customers | `/customers` | Testimonials, case studies, logos |
| Resources | `/resources` | Hub linking to docs, blog, changelog |
| Security | `/security` | Trust center with compliance details |
| Contact | `/contact` | Enhanced contact form |

---

## Part 4: Admin Console

### What Already Exists (at `/platform/*`)

The current platform admin has basic functionality:
- **PlatformDashboard**: Org listing with stats cards, searchable tenant list
- **PlatformBilling**: Read-only subscription status list
- **PlatformAnalytics**: 4 KPI numbers (no charts)
- **PlatformLogs**: Last 200 audit log entries (no pagination)
- **PlatformContactMessages**: Read-only inbox (no search/filter)
- **PlatformSettings**: Admin email management + feature flag toggles
- **PlatformOrganizationDetail**: Per-org detail with members, AI config

**Key gaps**: No sidebar layout (horizontal nav that disappears on mobile), no charts, no user management, no invoice viewer, no signal/ingestion/AI monitoring, no moderation, no pagination on logs, no mobile nav.

### New AdminLayout

Replace the current horizontal nav with a **sidebar layout** matching the product app pattern:

```
┌──────────────────────────────────────────────────┐
│  [Polsya Admin]              [Search] [UserMenu] │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Overview │  Main Content Area                    │
│  Dashboard│                                      │
│          │  Breadcrumbs: Admin > Users > Detail  │
│ Users &  │                                       │
│ Orgs     │  ┌─────────────────────────────────┐  │
│  Users   │  │                                 │  │
│  Orgs    │  │  Page content                   │  │
│          │  │                                 │  │
│ Revenue  │  │                                 │  │
│  Subs    │  │                                 │  │
│  Billing │  │                                 │  │
│          │  └─────────────────────────────────┘  │
│ Intelli- │                                       │
│ gence    │                                       │
│  Signals │                                       │
│  Ingest  │                                       │
│  AI Jobs │                                       │
│          │                                       │
│ Platform │                                       │
│  Moder.  │                                       │
│  Logs    │                                       │
│  Flags   │                                       │
│  Analyt. │                                       │
│          │                                       │
│ Settings │                                       │
│          │                                       │
│ ← App   │                                       │
└──────────┴───────────────────────────────────────┘
```

- Left sidebar with collapsible groups (reuse pattern from UX-03 sidebar redesign)
- Top bar: app name + "Admin" badge, global search, user menu
- Breadcrumb navigation in main content area
- "Back to app" link at bottom of sidebar → `/app`
- Mobile: collapsible sidebar with hamburger toggle
- Light theme (system default, not forced dark)

### Admin Navigation Groups

```
OVERVIEW
  Dashboard              /admin

USERS & ORGANIZATIONS
  Users                  /admin/users
  Organizations          /admin/organizations

REVENUE
  Subscriptions          /admin/subscriptions
  Billing                /admin/billing

INTELLIGENCE
  Signals Monitoring     /admin/signals
  Data Ingestion         /admin/ingestion
  AI Jobs                /admin/ai-jobs

PLATFORM
  Moderation             /admin/moderation
  System Logs            /admin/logs
  Feature Flags          /admin/flags
  Platform Analytics     /admin/analytics

SETTINGS
  Admin Settings         /admin/settings
```

### Admin Pages — Detailed Design

#### `/admin` — Dashboard
- **Top stats row**: Total users, active orgs, MRR, active subscriptions
- **Recent activity feed**: Last 10 audit log entries
- **Alerts panel**: Failed ingestion jobs, pending moderation items, expiring trials
- **Quick actions**: Add user, create org, view logs
- Enhancement of existing PlatformDashboard with charts (mini sparklines for trends)

#### `/admin/users` — User Management
- **NEW** — does not exist in current admin
- Paginated, searchable user table
- Columns: email, name, org, role, status (active/suspended), created date, last login
- Actions: view detail, suspend/activate, change role
- Filter by: org, role, status
- Data source: Supabase `auth.users` + `organization_members`

#### `/admin/organizations` — Organization Management
- Enhancement of existing PlatformDashboard tenant list
- Paginated, searchable org table
- Columns: name, slug, member count, subscription status, plan, MRR, created date
- Actions: view detail, suspend/activate
- Filter by: subscription status, plan tier

#### `/admin/org/:orgId` — Organization Detail
- Enhancement of existing PlatformOrganizationDetail
- Tabs: Overview, Members, Subscription, Integrations, Activity
- Overview: all current info + charts (entity growth, activity)
- Members: show email (not just user_id), role, status, last login
- Subscription: plan details, payment history, manual override capability
- Integrations: connected services, health status
- Activity: filtered audit log for this org

#### `/admin/subscriptions` — Subscription Management
- Enhancement of existing PlatformBilling (currently read-only)
- Paginated table: org, plan, status, period start/end, MRR, Stripe sub ID
- Filter by: status (active, trialing, canceled, past_due)
- Actions: view Stripe dashboard link, manual status change
- Summary cards: active subs, trialing, churned this month, MRR

#### `/admin/billing` — Billing & Invoices
- **NEW** — invoices not shown in current admin
- Invoice table: org, amount, status (paid/pending/failed), date, Stripe invoice ID
- Revenue charts: MRR trend, new vs churned revenue, plan distribution
- Data source: `billing_invoices`, `billing_subscriptions`, `billing_plans`

#### `/admin/signals` — Signals Monitoring
- **NEW** — creative intelligence signal pipeline monitoring
- Signal pipeline health: active signal types, processing rates, error rates
- Recent signals table: type, entity, source, status, timestamp
- Charts: signals processed over time, by type, by source
- Alert thresholds: stale signals, high error rates

#### `/admin/ingestion` — Data Ingestion
- **NEW** — monitor and manage data ingestion jobs
- Active/recent ingestion jobs table: source, type, status, records processed, errors, duration
- Source health dashboard: per-source connection status, last successful run
- Manual trigger: re-run failed jobs, schedule new ingestion
- Error log: failed records with details

#### `/admin/ai-jobs` — AI Job Tracking
- **NEW** — monitor AI processing jobs
- Job queue: type (enrichment, classification, matching), status, model, tokens used, cost, duration
- Running jobs with progress indicators
- Completed jobs with results summary
- Cost tracking: total spend by model, by job type, daily/monthly trend
- Configuration: model selection, rate limits, cost thresholds

#### `/admin/moderation` — Content Moderation
- **NEW** — review and moderate user-generated content
- Queue of flagged items: entity, type, reason, reported by, date
- Actions: approve, reject, flag for review, delete
- Moderation history: past decisions with timestamps
- Auto-moderation rules configuration

#### `/admin/logs` — System Logs
- Enhancement of existing PlatformLogs
- **Pagination** (currently limited to 200 rows)
- **Export** (CSV/JSON download)
- Better filtering: by action, resource type, user, org, date range
- Real-time log stream option
- Log level filtering: info, warning, error

#### `/admin/flags` — Feature Flags
- Enhancement of existing PlatformSettings feature flags section
- Dedicated page (currently buried in settings)
- Table: flag key, description, status (on/off), last modified, modified by
- Per-org flag overrides
- Flag groups/categories
- Audit trail for flag changes

#### `/admin/analytics` — Platform Analytics
- Enhancement of existing PlatformAnalytics (currently numbers only)
- **Add charts**: MRR trend, user growth, org growth, churn rate
- Usage metrics: active users (DAU/WAU/MAU), feature adoption
- Funnel: signup → trial → paid conversion
- Cohort analysis: retention by signup month
- Library: Recharts (already in dependencies)

#### `/admin/settings` — Admin Settings
- Enhancement of existing PlatformSettings
- Admin user management (add/remove platform admins)
- System configuration (defaults, limits)
- Email templates configuration
- API key management

---

## Part 5: Integration Between Layers

### Marketing → Product
- `LandingOrRedirect`: authenticated users skip marketing → `/app`
- "Get started" → `/signup?plan=starter` → Supabase auth → `/app`
- "Log in" → `/login` → Supabase auth → `/app`
- Product screenshots on marketing pages are static optimized images

### Product → Admin
- Admin users see an "Admin" badge/link in the product topbar
- Link navigates to `/admin` (same SPA, no page reload)
- Admin can "impersonate" org view via `?as_org=<orgId>` (existing mechanism)

### Marketing → Admin
- Admin is invisible from marketing (no public links, no sitemap)
- Direct URL access requires authentication + admin role

### Shared Infrastructure
- **Auth**: Supabase AuthProvider wraps entire app
- **Design system**: Tailwind config, Radix/shadcn primitives
- **State management**: TanStack Query for server state
- **Error handling**: Shared ErrorBoundary
- **Deployment**: Single Vercel project, SPA rewrites

---

## Part 6: File Structure

```
src/
├── components/
│   ├── marketing/              # NEW — marketing site components
│   │   ├── MarketingLayout.tsx
│   │   ├── MarketingNav.tsx
│   │   ├── MarketingFooter.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── TestimonialCarousel.tsx
│   │   ├── UseCaseGrid.tsx
│   │   ├── SecurityBadges.tsx
│   │   ├── PricingCard.tsx
│   │   ├── CustomerLogos.tsx
│   │   ├── IntelligenceSources.tsx
│   │   ├── WorkflowDemo.tsx
│   │   ├── CTASection.tsx
│   │   └── ScrollAnimation.tsx
│   │
│   ├── admin/                  # NEW — admin console components
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminTopBar.tsx
│   │   │   └── admin-nav-config.ts
│   │   ├── AdminRoute.tsx      # Auth guard (admin role check)
│   │   ├── AdminStatsCard.tsx
│   │   ├── AdminDataTable.tsx  # Reusable paginated table
│   │   ├── AdminChart.tsx      # Reusable chart wrapper
│   │   └── AdminBreadcrumbs.tsx
│   │
│   ├── landing/                # DEPRECATE — replaced by marketing/
│   ├── layout/
│   │   ├── PublicLayout.tsx    # DEPRECATE — replaced by MarketingLayout
│   │   ├── PlatformLayout.tsx  # DEPRECATE — replaced by AdminLayout
│   │   └── AppLayout.tsx       # Legacy sales layout (keep for now)
│   │
│   └── creative/               # EXISTING — product app (unchanged)
│       └── layout/
│           └── CreativeLayout.tsx
│
├── pages/
│   ├── marketing/              # NEW — marketing pages
│   │   ├── Home.tsx
│   │   ├── Product.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Integrations.tsx
│   │   ├── UseCases.tsx
│   │   ├── Pricing.tsx
│   │   ├── Customers.tsx
│   │   ├── Resources.tsx
│   │   ├── Security.tsx
│   │   └── Contact.tsx
│   │
│   ├── admin/                  # NEW — admin pages
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── AdminOrganizations.tsx
│   │   ├── AdminOrganizationDetail.tsx
│   │   ├── AdminSubscriptions.tsx
│   │   ├── AdminBilling.tsx
│   │   ├── AdminSignals.tsx
│   │   ├── AdminIngestion.tsx
│   │   ├── AdminAiJobs.tsx
│   │   ├── AdminModeration.tsx
│   │   ├── AdminLogs.tsx
│   │   ├── AdminFeatureFlags.tsx
│   │   ├── AdminAnalytics.tsx
│   │   └── AdminSettings.tsx
│   │
│   ├── creative/               # EXISTING — product pages (unchanged)
│   └── Landing.tsx             # DEPRECATE → marketing/Home.tsx
│
├── hooks/
│   ├── admin/                  # NEW — admin-specific hooks
│   │   ├── useAdminUsers.ts
│   │   ├── useAdminOrganizations.ts
│   │   ├── useAdminSubscriptions.ts
│   │   ├── useAdminBilling.ts
│   │   ├── useAdminSignals.ts
│   │   ├── useAdminIngestion.ts
│   │   ├── useAdminAiJobs.ts
│   │   ├── useAdminModeration.ts
│   │   ├── useAdminLogs.ts
│   │   └── useAdminAnalytics.ts
│   └── ... (existing hooks unchanged)
```

---

## Part 7: Technical Requirements

| Aspect | Decision |
|--------|----------|
| Architecture | Single SPA, three route groups |
| Marketing theme | Light (new MarketingLayout) |
| Admin theme | System default (light/dark toggle) |
| Product routes | `/creative/*` aliased to `/app/*` (code unchanged) |
| Admin routes | New `/admin/*` (replaces `/platform/*`) |
| Legacy routes | Redirects for `/creative/*`, `/platform/*`, `/dashboard` |
| New dependencies | framer-motion, react-helmet-async |
| Charts | Recharts (already installed) |
| Tables | Reusable AdminDataTable with pagination, sort, filter |
| Marketing images | Static WebP in `/public/marketing/` |

## Part 8: Messaging Framework

### Brand Voice
- **Tone**: Confident, intelligent, approachable
- **Focus**: Creative intelligence, portfolio analysis, relationship mapping, opportunity discovery
- **Keywords**: discover, enrich, connect, intelligence, portfolio, creative talent
- **Avoid**: prospecting, leads, operations, CRM, sales

### Headline Pattern (outcome-first)
- Hero: "Discover creative talent with intelligent data"
- Sources: "Enrich every creative profile with 50+ intelligence sources"
- Use cases: "One platform, every creative intelligence use case"
- Security: "Enterprise-grade security for sensitive talent data"
- CTA: "Start discovering creative talent today"

---

## Out of Scope

- Blog system / CMS integration
- Internationalization
- Custom admin subdomain (admin.polsya.com)
- Server-side rendering
- Product app changes (continues separately)
