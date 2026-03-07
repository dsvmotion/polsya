# Marketing Hero Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the marketing homepage hero and top sections to match Clay.com / Attio.com quality — premium creative brand, not a generic SaaS template.

**Architecture:** Visual-only changes to 4 files. No new components, no new dependencies, no routing/logic changes. HeroSection.tsx gets a full rewrite; MarketingNav.tsx, CustomerLogos.tsx, and index.css get targeted edits.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion (already installed), Lucide icons.

---

## Important Context

- Tests exist at `src/test/marketing-home.test.tsx` — they check for text content like "discover creative talent", "start free trial", "Discover", "Enrich", "Connect", "Act", "intelligence sources"
- The words "Discover", "Enrich", "Connect", "Act" appear in the **How It Works** section and **Pillar sections** of `Home.tsx` (which we do NOT modify), so removing the icon strip from HeroSection won't break tests
- The hero H1 text and CTA labels must remain unchanged to pass tests
- Existing CSS keyframes in `src/index.css`: `fadeIn`, `float`, `slideUpFade`, `gradientShift`
- Logo assets: `/polsya-logo-black.png` (4000×4000), `/polsya-logo-white.png` (4000×4000)
- Fonts: `font-display` = Labil Grotesk (headings), default = Plus Jakarta Sans (body)

---

### Task 1: Add CSS keyframes for marquee and gentle-float animations

**Files:**
- Modify: `src/index.css` (add keyframes inside the existing `@layer utilities` block, after line 373)

**Step 1: Add the new keyframes and utility classes**

In `src/index.css`, add these inside `@layer utilities { }` (before the closing `}`), right after the existing `@keyframes gradientShift` block:

```css
  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  @keyframes float-gentle {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-12px) rotate(1deg);
    }
  }

  @keyframes float-gentle-reverse {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(12px) rotate(-1deg);
    }
  }

  .animate-marquee {
    animation: marquee 30s linear infinite;
  }

  .animate-float-gentle {
    animation: float-gentle 4s ease-in-out infinite;
  }

  .animate-float-gentle-reverse {
    animation: float-gentle-reverse 5s ease-in-out infinite;
  }
```

**Step 2: Verify build**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(marketing): add marquee and float-gentle CSS animations"
```

---

### Task 2: Fix MarketingNav logo size

**Files:**
- Modify: `src/components/marketing/MarketingNav.tsx`

**Step 1: Increase logo from h-9 to h-12**

In `MarketingNav.tsx`, find line 38:
```tsx
          <img src="/polsya-logo-black.png" alt={APP_NAME} className="h-9 w-auto" onError={(e) => {
```

Change `h-9` to `h-12`:
```tsx
          <img src="/polsya-logo-black.png" alt={APP_NAME} className="h-12 w-auto" onError={(e) => {
```

**Step 2: Run tests**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vitest run src/test/marketing 2>&1 | tail -10`
Expected: All marketing tests pass.

**Step 3: Commit**

```bash
git add src/components/marketing/MarketingNav.tsx
git commit -m "feat(marketing): increase nav logo size from h-9 to h-12"
```

---

### Task 3: Rewrite HeroSection — Background, Copy, CTAs

This is the first part of the HeroSection rewrite. We replace the background layers and keep the text/CTA structure intact.

**Files:**
- Modify: `src/components/marketing/HeroSection.tsx` (full rewrite — replace entire file)

**Step 1: Replace HeroSection.tsx with the new version**

Write the complete new `HeroSection.tsx`. The file structure:

1. **Imports** — same icons as before + a few new ones
2. **Mock data** — keep `mockCreatives` exactly as-is (the product screenshot uses it)
3. **Floating illustration components** — new: small decorative UI card fragments for left/right side
4. **Main HeroSection component** with:
   - Rich gradient mesh background (multi-stop radials in indigo/violet/purple/warm)
   - Subtle noise texture overlay (CSS only, no image)
   - Geometric accent blobs (large blurred circles at low opacity)
   - Badge + H1 + subtitle (same text content as current)
   - CTAs (same as current)
   - Enhanced social proof bar (wrapped in glass container, add mini-quote)
   - Feature cards row (replaces icon strip) — 4 cards: AI Enrichment, Relationship Mapping, Smart Pipeline, Creative Intelligence
   - Enhanced product screenshot (same content + callout annotations + stronger glow)

Here is the complete replacement file content:

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Search, Sparkles, GitBranch, Target, BarChart3,
  Star, MapPin, ExternalLink, TrendingUp, Award,
  Filter, ChevronDown, MoreHorizontal, ArrowRight,
  Users, Zap, Network, Database, Layers,
} from 'lucide-react';

/* ---------- fake data for the product mock ---------- */
const mockCreatives = [
  { name: 'Sarah Chen', role: 'Art Director', location: 'New York', rating: 4.9, tags: ['Brand Identity', 'Motion'], avatar: 'SC', color: 'bg-indigo-500', status: 'Available', enriched: true },
  { name: 'Marcus Webb', role: 'Creative Director', location: 'London', rating: 4.8, tags: ['Campaign', 'Strategy'], avatar: 'MW', color: 'bg-violet-500', status: 'In Project', enriched: true },
  { name: 'Elena Vasquez', role: '3D Artist', location: 'Barcelona', rating: 4.7, tags: ['CGI', 'Product Viz'], avatar: 'EV', color: 'bg-emerald-500', status: 'Available', enriched: false },
  { name: 'Kai Tanaka', role: 'Motion Designer', location: 'Tokyo', rating: 4.9, tags: ['Animation', 'UI/UX'], avatar: 'KT', color: 'bg-amber-500', status: 'Available', enriched: true },
  { name: 'Ava O\'Brien', role: 'Photographer', location: 'Dublin', rating: 4.6, tags: ['Editorial', 'Fashion'], avatar: 'AO', color: 'bg-pink-500', status: 'In Project', enriched: true },
];

/* ---------- feature cards data ---------- */
const featureCards = [
  {
    icon: Sparkles,
    title: 'AI Enrichment',
    description: 'Auto-enrich profiles from 50+ data sources',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Network,
    title: 'Relationship Mapping',
    description: 'Discover connections between creatives & brands',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    icon: Layers,
    title: 'Smart Pipeline',
    description: 'From discovery to partnership, end-to-end',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: Database,
    title: 'Creative Intelligence',
    description: 'Portfolio analysis & style classification',
    gradient: 'from-fuchsia-500 to-fuchsia-600',
  },
];

/* ---------- floating illustration: mini profile card ---------- */
function FloatingProfileCard() {
  return (
    <div className="w-48 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-3 animate-float-gentle">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white">SC</div>
        <div>
          <div className="text-[10px] font-semibold text-gray-900">Sarah Chen</div>
          <div className="text-[8px] text-gray-400">Art Director</div>
        </div>
        <Sparkles className="h-3 w-3 text-indigo-400 ml-auto" />
      </div>
      <div className="flex gap-1">
        <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Brand Identity</span>
        <span className="text-[7px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-medium">Motion</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-2 w-2 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-[8px] font-semibold text-gray-600">4.9</span>
      </div>
    </div>
  );
}

/* ---------- floating illustration: enrichment badge ---------- */
function FloatingEnrichmentBadge() {
  return (
    <div className="w-40 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle-reverse">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
          <TrendingUp className="h-3 w-3 text-white" />
        </div>
        <span className="text-[9px] font-semibold text-gray-900">Match Score</span>
      </div>
      <div className="text-lg font-bold text-emerald-600 leading-none">98%</div>
      <div className="text-[8px] text-gray-400 mt-0.5">Based on 12 signals</div>
    </div>
  );
}

/* ---------- floating illustration: graph cluster ---------- */
function FloatingGraphCluster() {
  return (
    <div className="w-36 h-28 animate-float-gentle" style={{ animationDelay: '1s' }}>
      <svg viewBox="0 0 140 110" className="w-full h-full">
        <line x1="70" y1="55" x2="25" y2="25" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="70" y1="55" x2="115" y2="30" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="70" y1="55" x2="40" y2="90" stroke="#a78bfa" strokeWidth="1.5" opacity="0.6" />
        <line x1="70" y1="55" x2="110" y2="85" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="70" cy="55" r="12" fill="url(#fg1)" />
        <circle cx="25" cy="25" r="8" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="115" cy="30" r="9" fill="#818cf8" opacity="0.8" />
        <circle cx="40" cy="90" r="7" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="110" cy="85" r="8" fill="#c4b5fd" opacity="0.7" />
        <defs>
          <linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ---------- floating illustration: award notification ---------- */
function FloatingAwardBadge() {
  return (
    <div className="w-44 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle" style={{ animationDelay: '2s' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
          <Award className="h-3 w-3 text-white" />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-gray-900">New Award Found</div>
          <div className="text-[7px] text-gray-400">Red Dot Design 2024</div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-8 sm:pt-20 sm:pb-12 px-4 sm:px-6 lg:px-8">
      {/* ─── Rich gradient mesh background ─── */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(245_40%_97%)_0%,hsl(250_30%_98%)_25%,white_50%,hsl(245_25%_97%)_75%,hsl(260_30%_96%)_100%)]" />
        {/* Indigo radial glow — top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full bg-indigo-200/30 blur-[100px]" />
        {/* Violet radial glow — top right */}
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-violet-200/25 blur-[80px]" />
        {/* Purple glow — bottom left */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] rounded-full bg-purple-100/20 blur-[80px]" />
        {/* Warm peach accent — bottom right */}
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] rounded-full bg-orange-100/15 blur-[60px]" />
      </div>

      {/* ─── Subtle dot grid overlay ─── */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* ─── Noise texture overlay (CSS grain) ─── */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />

      {/* ─── Geometric accent shapes ─── */}
      <div className="absolute top-32 left-[8%] w-20 h-20 rounded-2xl bg-indigo-300/10 blur-xl -rotate-12 -z-10" />
      <div className="absolute top-64 right-[10%] w-16 h-16 rounded-full bg-violet-300/10 blur-lg -z-10" />
      <div className="absolute bottom-40 left-[15%] w-24 h-12 rounded-full bg-purple-200/10 blur-xl -z-10" />

      <div className="mx-auto max-w-7xl relative">
        {/* ─── Floating illustrations (LEFT) — xl only ─── */}
        <div className="hidden xl:flex flex-col gap-4 absolute -left-4 top-12 w-52">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.6 }}>
            <FloatingProfileCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.6 }}>
            <FloatingGraphCluster />
          </motion.div>
        </div>

        {/* ─── Floating illustrations (RIGHT) — xl only ─── */}
        <div className="hidden xl:flex flex-col gap-4 absolute -right-4 top-16 w-48 items-end">
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.6 }}>
            <FloatingEnrichmentBadge />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3, duration: 0.6 }}>
            <FloatingAwardBadge />
          </motion.div>
        </div>

        {/* ═══ Text content ═══ */}
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Creative Intelligence Platform
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08]">
              Discover creative talent{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                with intelligent data
              </span>
            </h1>
            <p className="mt-7 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
              Polsya maps portfolios, relationships, and opportunities across the creative
              industry — so you find the right collaborators before anyone else.
            </p>
          </motion.div>

          {/* CTA row */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/50 px-8 text-base hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-200 hover:-translate-y-0.5">
              <Link to="/signup">Start free trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 text-base border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </motion.div>

          {/* ─── Enhanced social proof bar ─── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 inline-flex flex-col sm:flex-row items-center gap-5 sm:gap-6 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm px-6 py-3.5 shadow-sm"
          >
            {/* Avatar stack */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'].map((color, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-white flex items-center justify-center text-[8px] font-bold text-white`}>
                    {['SC', 'MW', 'EV', 'KT', 'AO'][i]}
                  </div>
                ))}
              </div>
              <span className="ml-2.5 text-sm text-gray-500 font-medium">500+ teams</span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-gray-200" />

            {/* Star rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">4.9/5</span>
              <span className="text-sm text-gray-400">rating</span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-gray-200" />

            {/* Mini testimonial */}
            <p className="text-xs text-gray-500 italic max-w-[200px]">
              &ldquo;Transformed how we source creative talent&rdquo;
            </p>
          </motion.div>
        </div>

        {/* ═══ Feature cards — replaces icon strip ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="mt-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                className="group rounded-xl border border-gray-200/60 bg-white/70 backdrop-blur-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <card.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Rich Product Preview ═══ */}
        <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }} className="mt-12 relative">
          {/* Stronger gradient glow behind screenshot */}
          <div className="absolute -inset-6 bg-gradient-to-r from-indigo-200/50 via-violet-200/50 to-purple-200/50 rounded-[2rem] blur-3xl" />
          <div className="absolute -inset-3 bg-gradient-to-b from-indigo-100/30 to-transparent rounded-3xl blur-2xl" />

          <div className="relative rounded-2xl border border-gray-200/80 shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 rounded-lg bg-gray-100/80 max-w-xs mx-auto flex items-center justify-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-[10px] text-gray-400 font-mono">app.polsya.com/creatives</span>
                </div>
              </div>
            </div>

            {/* Product UI */}
            <div className="bg-gradient-to-br from-gray-50 to-white">
              <div className="flex min-h-[400px] sm:min-h-[460px]">
                {/* Sidebar */}
                <div className="hidden sm:flex w-48 bg-gray-900 flex-col p-3 shrink-0">
                  <div className="flex items-center px-2 mb-5">
                    <img src="/polsya-logo-white.png" alt="" className="h-5 w-auto opacity-90" />
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { label: 'Dashboard', active: false },
                      { label: 'Creatives', active: true },
                      { label: 'Portfolios', active: false },
                      { label: 'Opportunities', active: false },
                      { label: 'Pipeline', active: false },
                      { label: 'Enrichment', active: false },
                      { label: 'Reports', active: false },
                    ].map((item) => (
                      <div key={item.label} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${item.active ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white/60'}`}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-[8px] font-bold text-white">D</div>
                      <span className="text-white/50 text-[10px]">Diego&apos;s Team</span>
                    </div>
                  </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-hidden">
                  {/* Top bar with search and filters */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-3">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">Search creatives, portfolios, signals...</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-3">
                      <Filter className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Filters</span>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="hidden sm:flex items-center gap-1 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-2">
                      <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center">
                        <BarChart3 className="h-3 w-3 text-indigo-500" />
                      </div>
                      <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center">
                        <MoreHorizontal className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Metric cards row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: 'Total Creatives', value: '2,847', trend: '+12%', icon: TrendingUp, accent: 'text-indigo-600 bg-indigo-50' },
                      { label: 'Enriched', value: '1,924', trend: '68%', icon: Sparkles, accent: 'text-violet-600 bg-violet-50' },
                      { label: 'Pipeline Value', value: '$1.2M', trend: '+8%', icon: Target, accent: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Win Rate', value: '67%', trend: '+3pp', icon: Award, accent: 'text-amber-600 bg-amber-50' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-white border border-gray-100 shadow-sm p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-6 h-6 rounded-lg ${m.accent} flex items-center justify-center`}>
                            <m.icon className="h-3 w-3" />
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{m.trend}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 leading-none">{m.value}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Data table */}
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">All Creatives</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">2,847</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">Sort by</span>
                        <span className="text-[10px] font-medium text-gray-600">Rating</span>
                        <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                      </div>
                    </div>

                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100">
                      <div className="col-span-3 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Creative</div>
                      <div className="col-span-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">Location</div>
                      <div className="col-span-3 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Tags</div>
                      <div className="col-span-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">Rating</div>
                      <div className="col-span-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
                      <div className="col-span-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider" />
                    </div>

                    {/* Table rows */}
                    {mockCreatives.map((creative) => (
                      <div key={creative.name} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors group">
                        <div className="col-span-3 flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${creative.color} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                            {creative.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1">
                              {creative.name}
                              {creative.enriched && <Sparkles className="h-2.5 w-2.5 text-indigo-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">{creative.role}</div>
                          </div>
                        </div>
                        <div className="col-span-2 items-center gap-1 hidden sm:flex">
                          <MapPin className="h-2.5 w-2.5 text-gray-300" />
                          <span className="text-[10px] text-gray-500">{creative.location}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-1 flex-wrap">
                          {creative.tags.map((tag) => (
                            <span key={tag} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                          ))}
                        </div>
                        <div className="col-span-1 items-center gap-0.5 hidden sm:flex">
                          <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-semibold text-gray-700">{creative.rating}</span>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${creative.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {creative.status}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Floating callout annotations ─── */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="absolute -right-6 top-36 bg-white rounded-xl border border-indigo-200/60 shadow-xl px-3.5 py-2.5 max-w-[190px] ring-1 ring-indigo-100/50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-900">AI Enrichment</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">Auto-enriches profiles from 50+ data sources in real-time</p>
              {/* Connector line */}
              <div className="absolute left-0 top-1/2 -translate-x-full w-4 h-px bg-indigo-200" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="absolute -left-6 bottom-44 bg-white rounded-xl border border-violet-200/60 shadow-xl px-3.5 py-2.5 max-w-[190px] ring-1 ring-violet-100/50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <GitBranch className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-900">Relationship Graph</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">Map connections between creatives, agencies &amp; brands</p>
              <div className="absolute right-0 top-1/2 translate-x-full w-4 h-px bg-violet-200" />
            </motion.div>

            {/* New: Highlight callout for match score */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="absolute -right-6 bottom-24 bg-white rounded-xl border border-emerald-200/60 shadow-xl px-3.5 py-2.5 max-w-[190px] ring-1 ring-emerald-100/50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Target className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-900">Smart Pipeline</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">67% win rate with AI-scored creative matching</p>
              <div className="absolute left-0 top-1/2 -translate-x-full w-4 h-px bg-emerald-200" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Run type check**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors.

**Step 3: Run marketing tests**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vitest run src/test/marketing-home 2>&1 | tail -15`
Expected: All 6 tests pass. Key checks:
- "discover creative talent" ✅ (H1 unchanged)
- "start free trial" ✅ (CTA unchanged)
- "Discover", "Enrich", "Connect", "Act" ✅ (appear in Home.tsx pillar sections, not in HeroSection)

**Step 4: Run full test suite**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vitest run 2>&1 | tail -5`
Expected: 546 tests pass.

**Step 5: Build**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/components/marketing/HeroSection.tsx
git commit -m "feat(marketing): redesign hero section — rich background, floating illustrations, feature cards, enhanced social proof"
```

---

### Task 4: Enhance CustomerLogos with marquee animation and more companies

**Files:**
- Modify: `src/components/marketing/CustomerLogos.tsx`

**Step 1: Update CustomerLogos with more companies and marquee**

Replace the entire file with:

```tsx
import { ScrollAnimation } from './ScrollAnimation';
import { Star } from 'lucide-react';

const companies = [
  { name: 'Northlight Studios', initial: 'N', gradient: 'from-indigo-400 to-indigo-600' },
  { name: 'Collective Creative', initial: 'C', gradient: 'from-violet-400 to-violet-600' },
  { name: 'Frame & Form', initial: 'F', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Aperture Labs', initial: 'A', gradient: 'from-blue-400 to-blue-600' },
  { name: 'Prisma Network', initial: 'P', gradient: 'from-fuchsia-400 to-fuchsia-600' },
  { name: 'Cascade Studio', initial: 'S', gradient: 'from-emerald-400 to-emerald-600' },
  { name: 'Pixel Collective', initial: 'X', gradient: 'from-rose-400 to-rose-600' },
  { name: 'Vertex Media', initial: 'V', gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'Lumen Agency', initial: 'L', gradient: 'from-amber-400 to-amber-600' },
  { name: 'Helix Creative', initial: 'H', gradient: 'from-teal-400 to-teal-600' },
  { name: 'Mosaic Group', initial: 'M', gradient: 'from-orange-400 to-orange-600' },
  { name: 'Opal Design', initial: 'O', gradient: 'from-pink-400 to-pink-600' },
  { name: 'Zinc Works', initial: 'Z', gradient: 'from-slate-400 to-slate-600' },
  { name: 'Arc Studio', initial: 'A', gradient: 'from-sky-400 to-sky-600' },
];

const reviewPlatforms = [
  { name: 'G2', rating: '4.9', reviews: '320+', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { name: 'Capterra', rating: '4.8', reviews: '180+', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { name: 'Product Hunt', rating: '#1', reviews: 'Product of the Day', color: 'text-red-600 bg-red-50 border-red-100' },
];

function LogoItem({ company }: { company: typeof companies[number] }) {
  return (
    <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200 group shrink-0 px-4">
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${company.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
        <span className="text-[10px] sm:text-xs font-bold text-white">{company.initial}</span>
      </div>
      <span className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight whitespace-nowrap">{company.name}</span>
    </div>
  );
}

export function CustomerLogos() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-y border-gray-100/80 bg-[linear-gradient(to_bottom,hsl(245_30%_98%),white)]">
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-8 text-center">
            Trusted by leading creative teams worldwide
          </p>

          {/* Marquee logo row */}
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee hover:[animation-play-state:paused]">
              {/* Duplicate companies for seamless loop */}
              {[...companies, ...companies].map((company, i) => (
                <LogoItem key={`${company.name}-${i}`} company={company} />
              ))}
            </div>
          </div>

          {/* Review platforms bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {reviewPlatforms.map((platform) => (
              <div key={platform.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${platform.color} text-xs font-medium`}>
                <span className="font-bold">{platform.name}</span>
                <div className="flex gap-0.5">
                  {platform.rating !== '#1' ? (
                    <>
                      <Star className="h-3 w-3 fill-current" />
                      <span>{platform.rating}</span>
                    </>
                  ) : (
                    <span>{platform.rating}</span>
                  )}
                </div>
                <span className="text-[10px] opacity-70">({platform.reviews})</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

**Step 2: Run marketing tests**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vitest run src/test/marketing 2>&1 | tail -10`
Expected: All tests pass.

**Step 3: Build**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/marketing/CustomerLogos.tsx
git commit -m "feat(marketing): enhance customer logos — 14 companies, marquee animation, updated label"
```

---

### Task 5: Final verification — full test suite + build

**Step 1: Type check**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors.

**Step 2: Full test suite**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vitest run 2>&1 | tail -10`
Expected: 546 tests pass (no regressions).

**Step 3: Production build**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: ESLint check**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && npx eslint src/components/marketing/HeroSection.tsx src/components/marketing/MarketingNav.tsx src/components/marketing/CustomerLogos.tsx --max-warnings=0 2>&1 | tail -10`
Expected: 0 errors, 0 warnings.

**Step 5 (if all pass): Create summary commit**

If any earlier task was not committed individually, ensure all changes are committed:
```bash
git status
# Verify only the 4 expected files are changed
```

---

## Summary of Changes

| # | File | What Changed |
|---|------|-------------|
| 1 | `src/index.css` | Added `marquee`, `float-gentle`, `float-gentle-reverse` keyframes + utility classes |
| 2 | `src/components/marketing/MarketingNav.tsx` | Logo `h-9` → `h-12` |
| 3 | `src/components/marketing/HeroSection.tsx` | Full rewrite: rich gradient mesh bg, floating UI card illustrations (left/right), enhanced social proof with glass container + mini-testimonial, feature cards replacing icon strip, stronger product screenshot glow + 3 callout annotations |
| 4 | `src/components/marketing/CustomerLogos.tsx` | 8→14 companies, auto-scrolling marquee with fade edges, updated section label |

## What Was NOT Changed

- `src/pages/marketing/Home.tsx` — still renders the same sections in the same order
- All other marketing components (IntelligenceSources, UseCaseGrid, SecurityBadges, TestimonialCarousel, CTASection, etc.)
- No new npm dependencies
- No routing changes
- No business logic changes
