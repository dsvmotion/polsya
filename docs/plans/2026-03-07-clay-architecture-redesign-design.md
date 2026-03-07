# Clay-Architecture Homepage Redesign — Design Document

**Date**: 2026-03-07
**Status**: Approved
**Scope**: Marketing homepage (`/`) — visual restructuring to replicate Clay.com's homepage architecture

---

## Goal

Transform the Polsya marketing homepage from a generic SaaS template into a visually distinctive, high-density landing page that follows Clay.com's proven homepage architecture. The key differentiator is the **rounded hero container**, **mega menu navigation**, and **layered trust/logo sections**.

---

## Architectural Rules

- **Visual redesign only** — no changes to routing, state management, business logic, or API integrations
- **All existing tests must pass** — `marketing-home.test.tsx` assertions are the contract
- **Components remain functional** — same props, same exports, same data flow

### Test Constraints (immutable text)

| Test Assertion | Required Text |
|---|---|
| Hero headline | `/discover creative talent/i` |
| Hero CTA | `/start free trial/i` (≥1) |
| Core capabilities | `Discover`, `Enrich`, `Connect`, `Act` (≥1 each) |
| Intelligence section | `/intelligence sources/i` |
| Use cases | `Agencies` |
| Security | `/enterprise-grade security for/i` |
| Final CTA | `/start discovering/i` |

---

## Section Architecture (top to bottom)

### Section 1: Navigation Bar — `MarketingNav.tsx`

**Layout**: Logo (left) · Center menu · Right actions

**Logo**:
- PNG only: `polsya-logo-black.png`
- Size: `h-16` (50% increase from current `h-12`)
- Remove any text duplication — logo image is the only brand element

**Center Menu** (6 items):
- Product · Use Cases · Solutions · Resources · Company · Pricing
- Each item has a chevron indicator for mega menu items
- Pricing is a direct link (no mega menu)

**Right Actions**:
- Search icon button (magnifying glass)
- "Get a demo" button (outline style)
- "Log in" text link
- "Sign up" gradient button (indigo → violet)

**Mega Menu Panels** (hover-triggered):
- Positioned absolute below nav, full container width
- Semi-transparent backdrop overlay
- Slide-down animation (150ms ease-out)
- Auto-close on mouse leave (200ms delay)

**Product Panel** (3-column grid):
| Icon | Title | Description |
|---|---|---|
| Search | Discover | Find creative talent across 2.8M+ profiles |
| Sparkles | Creative Intelligence | AI-powered style analysis and trend detection |
| Database | Portfolio Enrichment | Auto-enrich from 50+ data sources |
| GitBranch | Relationship Mapping | Visualize creative-brand-agency connections |
| Zap | Signals | Real-time alerts on creative market movements |
| Target | Style Engine | Classify and match creative styles with AI |
| Layers | Opportunity Pipeline | Manage creative partnerships end-to-end |
| Network | Integrations | Connect with your existing creative tools |
| BarChart3 | Creative Analytics | Insights and reporting across your pipeline |

**Use Cases Panel** (2-column):
- Agencies · Brands · Studios · Recruiters · In-house Teams · Freelancers

**Solutions Panel** (2-column):
- Enterprise · Growth · Startup · Teams

**Resources Panel** (2-column):
- Blog · Documentation · API Reference · Community · Changelog · Support

**Company Panel** (single column):
- About · Careers · Press · Contact

**Mobile**: Hamburger menu with accordion-style mega menu sections

---

### Section 2: Hero — `HeroSection.tsx`

**Clay-style rounded container**:
- Large `rounded-3xl` container inside the section
- Container has warm gradient background: `from-amber-50/80 via-orange-50/40 to-rose-50/30`
- Noise texture overlay (SVG feTurbulence, very subtle)
- Dot grid pattern overlay (opacity 3%)
- Container padding: `px-8 py-20 sm:px-16 sm:py-28`

**Content (centered)**:
1. Badge: "Creative Intelligence Platform" (indigo pill with pulse dot)
2. H1: "Discover creative talent with intelligent data" (font-display, 5xl→7xl)
3. Subtitle: "Polsya maps portfolios, relationships, and opportunities across the creative industry — so you find the right collaborators before anyone else."
4. CTA row: "Start free trial →" (gradient button) + "See how it works" (outline)

**Floating Illustrations** (xl breakpoint only):
- Left side: FloatingProfileCard (top), FloatingGraphCluster (bottom)
- Right side: FloatingEnrichmentBadge (top), FloatingAwardBadge (bottom)
- Positioned at edges of the rounded container, slightly overlapping
- Framer Motion fade + slide animations with staggered delays

---

### Section 3: Trust Section — part of `CustomerLogos.tsx`

**Layout**: Centered, compact

**Elements**:
1. "Trusted by creative teams worldwide" (uppercase label, gray-400)
2. Avatar stack (5 avatars + "500+ teams")
3. Rating badges row: G2 (4.9 ★), Capterra (4.8 ★), Product Hunt (#1)

---

### Section 4: Logo Ecosystem — part of `CustomerLogos.tsx`

**Layout**: 2-row CSS grid, 6 columns on desktop, 3 on mobile

**Row 1**: Behance · Dribbble · Figma · Adobe · Webflow · Framer
**Row 2**: Canva · Notion · Stripe · Vercel · GitHub · Miro

**Logo Style**:
- Inline SVG components (text-based for simplicity, like current IntelligenceSources logos)
- Default opacity: 40%
- Hover opacity: 70%
- Transition: 200ms
- Size: `h-6 w-auto` (small, tasteful)
- Gray-600 monochrome (no color)

---

### Section 5: Product Storytelling — `Home.tsx` pillars

**Keep existing structure** with refinements:
- "How It Works" dark section remains
- 4 pillar sections (Discover, Enrich, Connect, Act) remain with product UI fragments
- Warm background alternation between pillars
- The existing `IntelligenceSources`, `UseCaseGrid`, `SecurityBadges`, `TestimonialCarousel`, and `CTASection` components remain unchanged

**Section order** (matches current, which already works):
1. HeroSection (new rounded container)
2. CustomerLogos (trust + logo ecosystem combined)
3. IntelligenceSources
4. How It Works (dark section, inline)
5. Pillar: Discover
6. Pillar: Enrich
7. Pillar: Connect
8. Pillar: Act
9. Capabilities strip
10. UseCaseGrid
11. SecurityBadges
12. TestimonialCarousel
13. CTASection

---

## Files Modified

| File | Change Scope |
|---|---|
| `src/components/marketing/MarketingNav.tsx` | Major rewrite — mega menus, restructured nav |
| `src/components/marketing/HeroSection.tsx` | Major rewrite — rounded container, warm bg |
| `src/components/marketing/CustomerLogos.tsx` | Major rewrite — trust section + 2-row logo grid |
| `src/index.css` | Minor — add mega-menu animation keyframe if needed |

**No new files** — mega menu logic lives inside MarketingNav.tsx.

---

## Implementation Strategy

### Wave 1: Foundation (sequential)
1. Add any new CSS keyframes to `index.css` (mega menu slide)
2. Rewrite `MarketingNav.tsx` with mega menus
3. Rewrite `HeroSection.tsx` with rounded container
4. Rewrite `CustomerLogos.tsx` with trust + logo grid

### Wave 2: Verification
5. Run `npx tsc --noEmit` — zero errors
6. Run `npx vitest run` — all tests pass
7. Run `npx vite build` — clean build

---

## Motion Principles

- Mega menu: slide down 150ms ease-out, fade backdrop 200ms
- Hero floating illustrations: staggered fade + slide (0.8s–1.6s delays)
- Logo hover: 200ms opacity transition
- All animations respect `prefers-reduced-motion`
