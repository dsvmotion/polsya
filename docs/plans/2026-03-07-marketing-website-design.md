# Polsya Marketing Website Design

> **Date**: 2026-03-07
> **Status**: Draft — pending approval
> **Reference**: Clay marketing website (PDF analysis)

## Goal

Redesign the Polsya public marketing website to match the quality and conversion architecture of Clay's marketing site, adapted for the creative intelligence domain. Establish clean separation between three architectural layers: marketing, product application, and admin console.

## Clay Analysis Summary

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

## Architecture Decision

### Approach B: Monolith SPA with Redesigned Marketing Layer (Recommended)

Keep single Vite SPA build. Completely redesign marketing layer with Clay-inspired patterns. Restructure routes, enforce strict import boundaries via code splitting.

**Why not separate projects?** Overkill for current team size. Auth handoff complexity. Multiple Vercel projects to manage.

**Why not multi-page Vite?** Significant config complexity, duplicated providers/layout code.

**Why this approach?** Minimal architecture disruption, shared auth/design system, single deploy pipeline, fast to implement. Can migrate to SSG/SSR later if SEO becomes critical.

## Route Architecture

### Current → New Route Map

```
MARKETING (PublicLayout → MarketingLayout)
  /                  → /                    Home (full redesign)
  /features          → /product             Product overview
  —                  → /how-it-works        New: workflow demo
  —                  → /integrations        New: data sources
  —                  → /use-cases           New: by persona
  /pricing           → /pricing             Redesigned
  —                  → /customers           New: testimonials + logos
  —                  → /resources           New: hub page
  /trust             → /security            Renamed, expanded
  /contact           → /contact             Enhanced
  /terms             → /terms               Keep
  /privacy           → /privacy             Keep

PRODUCT (CreativeLayout — rename route prefix)
  /creative/*        → /app/*               Matches 3-layer spec
  /dashboard         → REMOVE               Redirect to /app
  /prospecting/*     → REMOVE               Legacy
  /operations/*      → REMOVE               Legacy

ADMIN (PlatformLayout — rename route prefix)
  /platform/*        → /admin/*             Matches 3-layer spec

AUTH (standalone pages)
  /login             → /login               Keep
  /signup            → /signup              Keep
  /forgot-password   → /forgot-password     Keep
  /reset-password    → /reset-password      Keep
```

## Visual Direction

### Theme Switch: Dark → Light

Current marketing pages force dark mode. Clay uses light backgrounds with warm aesthetics.

**New marketing theme:**
- White/cream backgrounds with dark text
- Brand color accents (brand-clementine, brand-wine, brand-green)
- Product app and admin keep their current themes
- MarketingLayout replaces PublicLayout (light mode, new navigation structure)

### Typography
- Headlines: Labil Grotesk (already in Tailwind config as `font-display`)
- Body: Plus Jakarta Sans (already as `font-sans`)
- Generous sizing: hero at 4xl-6xl, section headers at 3xl-4xl

### Animation
- Add Framer Motion for scroll-triggered animations
- Fade-up on section entry, counter animations, smooth transitions
- Replace current CSS-only `ScrollFadeIn` with Framer Motion variants

## Navigation Bar (MarketingLayout)

```
[Polsya Logo]  Product  How it works  Integrations  Use cases  Pricing  Resources  |  Log in  [Get started →]
```

- Sticky header: transparent on hero → white/blur on scroll
- Mobile: hamburger → full-screen overlay menu
- "Get started" = primary CTA with brand-clementine gradient
- Light text on hero (transparent bg) → dark text after scroll

## Home Page Sections (`/`)

### Section 1: Hero
- **Headline**: "Discover creative talent with intelligent data"
- **Subtitle**: "Polsya maps portfolios, relationships, and opportunities across the creative industry — so you find the right collaborators before anyone else."
- **CTA 1**: "Start free trial →" (primary, filled gradient)
- **CTA 2**: "See how it works" (secondary, outline)
- **Visual**: Product screenshot of CreativeDashboard below CTAs
- **Background**: Subtle gradient or animated mesh

### Section 2: Intelligence Sources
- **Headline**: "Enrich every creative profile with 50+ intelligence sources"
- **Content**: Logo grid of data sources (Behance, Dribbble, LinkedIn, Instagram, award databases, agency directories)
- **Pattern**: Equivalent to Clay's data provider showcase

### Section 3: Core Capabilities (4 pillars)
- **Discover** — Find designers, studios, and agencies with intelligent search and filters
- **Enrich** — Automatically pull portfolio work, awards, social presence, and style signals
- **Connect** — Map relationships between creatives, brands, and projects
- **Act** — Prioritize opportunities, automate outreach, track your pipeline
- **Layout**: 2x2 grid with icons, or horizontal cards

### Section 4: Product Demo / Workflow
- Animated or screenshot walkthrough: Discover → Enrich → Analyze → Connect → Pipeline
- Equivalent to Clay's workflow/table demo

### Section 5: Use Cases
- **Headline**: "One platform, every creative intelligence use case"
- **Agencies**: Talent scouting and vendor management
- **Brands**: Finding and vetting creative partners
- **Producers**: Building production rosters
- **Recruiters**: Creative talent acquisition
- **Investors**: Portfolio company analysis
- **Consultants**: Market mapping and competitive intel

### Section 6: Social Proof
- Customer/partner logos
- Key metrics: portfolios analyzed, relationships mapped, opportunities surfaced
- Animated counters

### Section 7: Security & Compliance
- **Headline**: "Enterprise-grade security for sensitive talent data"
- GDPR compliance, data encryption, row-level security
- Badge/icon display similar to Clay's playful style

### Section 8: Testimonials
- Colorful card carousel with customer quotes
- Placeholder cards initially, replace with real testimonials

### Section 9: Final CTA
- **Headline**: "Start discovering creative talent today"
- **Subtitle**: "Free 7-day trial. No credit card required."
- **CTAs**: "Start free trial →" + "Request a demo →"

### Section 10: Footer
5-column layout:
- **Product**: Discover, Enrich, Pipeline, Analytics, Integrations
- **Use Cases**: Agencies, Brands, Producers, Recruiters
- **Resources**: Documentation, Blog, Changelog, Status
- **Company**: About, Contact, Careers, Security
- **Legal**: Terms, Privacy, Cookies

Plus newsletter signup and social links.

## Other Marketing Pages

### `/product` — Product Overview
Deep dive into each capability module with screenshots:
- Discover (search, filters, map view)
- Enrich (portfolio analysis, style signals, awards)
- Pipeline (opportunity tracking, stages, automation)
- Analytics (insights, trends, performance dashboards)
- Communication (inbox, templates, scheduling)

### `/how-it-works` — Workflow Demo
Step-by-step visualization:
1. Connect your data sources
2. Discover creative entities
3. Automatic enrichment fills in the gaps
4. Build and map relationships
5. Track and act on opportunities

### `/integrations` — Data Sources
Grid of all connected platforms/data sources, organized by category.

### `/use-cases` — By Persona
Expanded use cases with sub-pages or anchor sections per persona.

### `/pricing` — Pricing Plans
Clay-style card layout with Starter, Pro, Business, Enterprise tiers. Feature comparison table. FAQ section.

### `/customers` — Social Proof
Testimonials, case studies, customer logos.

### `/resources` — Hub
Links to documentation, blog, changelog.

### `/security` — Trust Center
Compliance badges, security practices, data handling policies.

## Layer Integration

### Marketing ↔ Product
- `LandingOrRedirect` routes authenticated users to `/app`
- "Get started" CTA → `/signup?plan=starter` → auth → `/app`
- Product screenshots on marketing pages are static optimized images

### Marketing ↔ Admin
- Admin invisible from marketing (no public links)
- Access via `/admin` behind ProtectedRoute with platform owner check

### Shared Elements
- Auth context (Supabase) shared across all layers
- Design system tokens (Tailwind config) shared
- UI component library (Radix/shadcn) shared
- Each layer uses its own Layout component with appropriate theming

## Technical Requirements

| Aspect | Decision |
|--------|----------|
| Architecture | Single SPA, route-based separation |
| Marketing theme | Light (new MarketingLayout) |
| Product route prefix | `/creative/*` → `/app/*` |
| Admin route prefix | `/platform/*` → `/admin/*` |
| Legacy routes | Remove `/dashboard`, `/prospecting/*`, `/operations/*` |
| Animation library | Add Framer Motion |
| SEO | Add react-helmet-async for meta tags |
| Marketing components | New `src/components/marketing/` directory |
| Marketing pages | New `src/pages/marketing/` directory |
| Images | Optimized WebP in `/public/marketing/` |
| Fonts | Keep Plus Jakarta Sans + Labil Grotesk |

## File Structure

```
src/
├── components/
│   ├── marketing/           # NEW — marketing-specific components
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
│   ├── landing/             # DEPRECATE — replaced by marketing/
│   ├── layout/
│   │   ├── PublicLayout.tsx  # DEPRECATE — replaced by MarketingLayout
│   │   ├── AppLayout.tsx    # Legacy sales layout
│   │   └── PlatformLayout.tsx → rename to AdminLayout.tsx
│   └── creative/
│       └── layout/
│           └── CreativeLayout.tsx  # Product app layout (keep)
├── pages/
│   ├── marketing/           # NEW — marketing page components
│   │   ├── Home.tsx
│   │   ├── Product.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Integrations.tsx
│   │   ├── UseCases.tsx
│   │   ├── Pricing.tsx
│   │   ├── Customers.tsx
│   │   ├── Resources.tsx
│   │   └── Security.tsx
│   ├── creative/            # Product app pages (keep, reroute to /app/*)
│   └── Landing.tsx          # DEPRECATE — replaced by marketing/Home.tsx
```

## Messaging Framework

### Brand Voice for Marketing
- **Tone**: Confident, intelligent, approachable (not salesy)
- **Focus**: Creative intelligence, not CRM or sales automation
- **Keywords**: discover, enrich, connect, intelligence, portfolio, creative talent
- **Avoid**: prospecting, leads, operations, CRM, sales (legacy positioning)

### Headline Pattern (outcome-first)
- Hero: "Discover creative talent with intelligent data"
- Sources: "Enrich every creative profile with 50+ intelligence sources"
- Use cases: "One platform, every creative intelligence use case"
- Security: "Enterprise-grade security for sensitive talent data"
- CTA: "Start discovering creative talent today"

### Subtitle Pattern (mechanism-second)
Each headline is followed by a 1-2 sentence subtitle explaining HOW, not WHAT.

## Dependencies to Add

```json
{
  "framer-motion": "^11.x",
  "react-helmet-async": "^2.x"
}
```

## Out of Scope

- Blog system (future phase)
- CMS integration (future phase)
- Internationalization (future phase)
- Custom domain for admin (admin.polsya.com — future phase)
- Server-side rendering (can add later with Vite SSR plugin)
