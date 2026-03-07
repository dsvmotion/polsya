# Marketing Hero Redesign — Clay/Attio-Inspired

## Problem

The current marketing homepage hero looks like a generic SaaS template — empty whitespace, small placeholder-style icons, low information density, and no visual storytelling. It needs to match the premium creative platforms Clay.com and Attio.com in quality.

## Scope

Redesign MarketingNav, HeroSection, and the first few sections of Home.tsx (CustomerLogos, transition into IntelligenceSources). The rest of the homepage sections remain unchanged.

## Design References

- **Clay.com**: Vibrant 3D illustrations flanking the hero, massive trusted-by logo grid (50+ real logos in grayscale), rich social proof inline with CTAs, playful motion, strong brand personality
- **Attio.com**: Clean product-first hero with tabbed product screenshots, strong typography hierarchy, minimal but impactful social proof

**Our direction**: Clay's visual richness + Attio's CRM clarity. Heavy on visual storytelling, creative/premium feel.

---

## Changes by Component

### 1. MarketingNav.tsx

**Problem**: Logo is `h-9` (36px), too small and unreadable. Text next to logo duplicates the wordmark.

**Solution**:
- Increase logo to `h-12` (48px)
- Remove any text labels next to the logo image — the PNG already contains the wordmark
- Keep all existing nav links, auth buttons, mobile menu, scroll behavior

### 2. HeroSection.tsx — Complete Redesign

**Problem**: Empty-feeling hero with weak decorative nodes, placeholder-quality icon strip, generic product screenshot, low social proof.

#### 2a. Background & Visual Richness

Replace the simple gradient + dot grid with:
- **Gradient mesh**: Multi-stop radial gradients (indigo, violet, purple, warm peach) creating a Clay-style lush background
- **Noise texture overlay**: Very subtle grain at 2-3% opacity for depth
- **Geometric accents**: Floating soft shapes (circles, rounded rectangles) with blur at 10-20% opacity, positioned left and right of content

#### 2b. Left/Right Visual Balance

Replace the SVG node decorations with **richer floating illustration elements**:
- Left side: A stack of 2-3 floating UI cards (miniature profile card, enrichment badge, a small graph node cluster) at slight rotations
- Right side: Complementary floating elements (notification badge, award icon, a small data visualization)
- Use framer-motion for gentle float/bob animation (3-4s loop, subtle)
- Only visible on `xl:` breakpoints (same as current)

#### 2c. Hero Copy & Badge

Keep the same copy structure but tighten:
- Badge: Keep "Creative Intelligence Platform" pill badge
- H1: Keep current gradient headline approach
- Subhead: Keep current text
- No changes to copy content

#### 2d. CTA Row

Keep existing two-button layout unchanged.

#### 2e. Social Proof Bar — Enhanced

Current: avatar stack + star rating + quick stats in a flat row.

New: Add more substance:
- Keep avatar stack with "500+ teams"
- Keep star rating
- Add inline mini-testimonial quote (one short sentence from a real user)
- Wrap in a subtle bordered container with glass effect

#### 2f. Replace Icon Strip with Feature Cards

**Remove** the Discover/Enrich/Map/Match/Track icon strip (it looks like a placeholder).

**Replace with** 3-4 compact feature cards in a horizontal row:
- Each card: icon (in gradient container), bold title, 1-line description
- `rounded-xl`, subtle border, hover lift
- Content: "AI Enrichment — Auto-enrich from 50+ sources", "Relationship Mapping — Discover connections instantly", "Smart Pipeline — From discovery to partnership", "Creative Intelligence — Portfolio & style analysis"
- Responsive: 2x2 grid on mobile, 4-col on desktop

#### 2g. Product Screenshot — Enhanced

Current: Full app mockup with sidebar + metrics + data table. It's detailed but looks generic.

Enhance with:
- **Callout annotations**: 3-4 floating tooltip-style callouts pointing to specific features (enrichment sparkle, match score, relationship graph icon area) — similar to current floating badges but more prominent and positioned more precisely
- **Gradient glow behind**: Stronger indigo-violet glow behind the screenshot for depth
- **Subtle zoom/highlight area**: A semi-transparent overlay that highlights one area of the product (e.g., the enrichment column) with a pulsing border
- Keep the existing product UI content (sidebar, metrics, table) — it's good content, just needs better presentation

### 3. CustomerLogos.tsx — Enhanced

**Problem**: Only 8 fake company names with gradient initial circles. Low density, not convincing.

**Solution**:
- Increase from 8 to 12-14 companies
- Keep the gradient initial circle approach (we don't have real logos)
- Add an auto-scrolling marquee effect (CSS animation, no JS) for the logo row — Clay-style infinite scroll
- Keep review platforms bar (G2, Capterra, Product Hunt)
- Update section label: "Trusted by leading creative teams"

### 4. Transition Polish

- Add smoother spacing transitions between Hero → CustomerLogos → IntelligenceSources
- Ensure background gradients flow naturally section-to-section

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/marketing/MarketingNav.tsx` | Logo size h-9 → h-12 |
| `src/components/marketing/HeroSection.tsx` | Complete rewrite (~400-500 lines) |
| `src/components/marketing/CustomerLogos.tsx` | More companies, marquee animation |
| `src/index.css` | Add marquee keyframes if needed |

## Files NOT Modified

- `src/pages/marketing/Home.tsx` — no structural changes (still renders HeroSection → CustomerLogos → IntelligenceSources → ...)
- All other marketing components remain unchanged
- No routing changes
- No new dependencies

## Technical Constraints

- Framer-motion already available for animations
- Lucide icons already in use
- Tailwind CSS for all styling
- Must pass: `tsc --noEmit`, `vitest run` (546 tests), `vite build`
- No new npm packages

## Verification

After implementation:
- `npx tsc --noEmit` — type check
- `npx vitest run` — all 546 tests pass
- `npx vite build` — production build succeeds
- Visual: Hero feels premium/creative, not template-like
- Visual: Logo is clearly readable at nav height
- Visual: No icon strip placeholder — replaced with feature cards
- Visual: Product screenshot has callouts and visual depth
- Responsive: Works on mobile, tablet, desktop
