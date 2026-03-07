# Clay-Architecture Homepage Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Polsya marketing homepage to replicate Clay.com's homepage architecture with mega menu navigation, rounded hero container, and layered trust/logo sections.

**Architecture:** Visual-only redesign of 3 marketing components (`MarketingNav`, `HeroSection`, `CustomerLogos`) plus a minor CSS keyframe addition. No routing, state management, or business logic changes. All existing test assertions in `marketing-home.test.tsx` must continue to pass.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide icons, react-router-dom

**Design doc:** `docs/plans/2026-03-07-clay-architecture-redesign-design.md`

---

### Task 1: Add mega-menu CSS keyframe

**Files:**
- Modify: `src/index.css` (add keyframe after existing `float-gentle-reverse` block, around line 400)

**Step 1: Add the keyframe**

Add inside the existing `@layer utilities` block, after the `float-gentle-reverse` keyframe:

```css
  @keyframes mega-menu-slide {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-mega-menu-slide {
    animation: mega-menu-slide 150ms ease-out forwards;
  }
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(marketing): add mega-menu-slide keyframe"
```

---

### Task 2: Rewrite MarketingNav with mega menus

**Files:**
- Modify: `src/components/marketing/MarketingNav.tsx` (full rewrite)

**Step 1: Write the complete new MarketingNav**

Replace the entire file with:

```tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, Search, ChevronDown, Sparkles, Database, GitBranch,
  Zap, Target, Layers, Network, BarChart3, Users, BookOpen,
  FileText, MessageSquare, Building2, Briefcase, Rocket, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ─── Mega menu data ─── */
type MenuItem = { icon: React.ElementType; title: string; description: string; href: string };
type MegaMenuConfig = { columns: number; items: MenuItem[] };

const megaMenuData: Record<string, MegaMenuConfig> = {
  product: {
    columns: 3,
    items: [
      { icon: Search, title: 'Discover', description: 'Find creative talent across 2.8M+ profiles', href: '/product' },
      { icon: Sparkles, title: 'Creative Intelligence', description: 'AI-powered style analysis and trend detection', href: '/product' },
      { icon: Database, title: 'Portfolio Enrichment', description: 'Auto-enrich from 50+ data sources', href: '/product' },
      { icon: GitBranch, title: 'Relationship Mapping', description: 'Visualize creative-brand-agency connections', href: '/product' },
      { icon: Zap, title: 'Signals', description: 'Real-time alerts on creative market movements', href: '/product' },
      { icon: Target, title: 'Style Engine', description: 'Classify and match creative styles with AI', href: '/product' },
      { icon: Layers, title: 'Opportunity Pipeline', description: 'Manage creative partnerships end-to-end', href: '/product' },
      { icon: Network, title: 'Integrations', description: 'Connect with your existing creative tools', href: '/integrations' },
      { icon: BarChart3, title: 'Creative Analytics', description: 'Insights and reporting across your pipeline', href: '/product' },
    ],
  },
  'use-cases': {
    columns: 2,
    items: [
      { icon: Building2, title: 'Agencies', description: 'Scale your creative sourcing', href: '/use-cases' },
      { icon: Briefcase, title: 'Brands', description: 'Find creatives that match your vision', href: '/use-cases' },
      { icon: Users, title: 'Studios', description: 'Build your talent network', href: '/use-cases' },
      { icon: Target, title: 'Recruiters', description: 'Source creative professionals faster', href: '/use-cases' },
      { icon: Layers, title: 'In-house Teams', description: 'Manage external creative relationships', href: '/use-cases' },
      { icon: Sparkles, title: 'Freelancers', description: 'Grow your client base', href: '/use-cases' },
    ],
  },
  solutions: {
    columns: 2,
    items: [
      { icon: Shield, title: 'Enterprise', description: 'Advanced security, SSO, and dedicated support', href: '/pricing' },
      { icon: Rocket, title: 'Growth', description: 'Scale your creative operations', href: '/pricing' },
      { icon: Zap, title: 'Startup', description: 'Get started with essential tools', href: '/pricing' },
      { icon: Users, title: 'Teams', description: 'Collaborate across your organization', href: '/pricing' },
    ],
  },
  resources: {
    columns: 2,
    items: [
      { icon: BookOpen, title: 'Blog', description: 'Insights on creative intelligence', href: '/resources' },
      { icon: FileText, title: 'Documentation', description: 'Technical guides and API docs', href: '/resources' },
      { icon: Network, title: 'API Reference', description: 'Build with the Polsya API', href: '/resources' },
      { icon: MessageSquare, title: 'Community', description: 'Connect with other users', href: '/resources' },
      { icon: Zap, title: 'Changelog', description: 'Latest product updates', href: '/resources' },
      { icon: Users, title: 'Support', description: 'Get help from our team', href: '/resources' },
    ],
  },
  company: {
    columns: 1,
    items: [
      { icon: Building2, title: 'About', description: 'Our mission and team', href: '/resources' },
      { icon: Users, title: 'Careers', description: 'Join our growing team', href: '/resources' },
      { icon: FileText, title: 'Press', description: 'News and media resources', href: '/resources' },
      { icon: MessageSquare, title: 'Contact', description: 'Get in touch with us', href: '/contact' },
    ],
  },
};

const navItems: { label: string; key?: string; href?: string }[] = [
  { label: 'Product', key: 'product' },
  { label: 'Use Cases', key: 'use-cases' },
  { label: 'Solutions', key: 'solutions' },
  { label: 'Resources', key: 'resources' },
  { label: 'Company', key: 'company' },
  { label: 'Pricing', href: '/pricing' },
];

/* ─── Mega Menu Panel ─── */
function MegaMenuPanel({ config, onClose }: { config: MegaMenuConfig; onClose: () => void }) {
  return (
    <div
      className="animate-mega-menu-slide"
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className={cn(
        'grid gap-1 p-4',
        config.columns === 3 && 'grid-cols-3',
        config.columns === 2 && 'grid-cols-2',
        config.columns === 1 && 'grid-cols-1 max-w-xs',
      )}>
        {config.items.map((item) => (
          <Link
            key={item.title}
            to={item.href}
            onClick={onClose}
            className="flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 flex items-center justify-center shrink-0 group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors">
              <item.icon className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Mobile Accordion Section ─── */
function MobileAccordion({ label, config, onClose }: { label: string; config: MegaMenuConfig; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pl-3 pb-2 space-y-0.5">
          {config.items.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            >
              <item.icon className="h-3.5 w-3.5 text-indigo-500" />
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Nav ─── */
export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavEnter = useCallback((key: string) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setActiveMenu(key);
  }, []);

  const handleNavLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 200);
  }, []);

  const handlePanelEnter = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  const handlePanelLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 200);
  }, []);

  const closeMega = useCallback(() => setActiveMenu(null), []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
          <img src="/polsya-logo-black.png" alt="Polsya" className="h-16 w-auto" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
        </Link>

        {/* ── Center nav (desktop) ── */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) =>
            item.key ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => handleNavEnter(item.key!)}
                onMouseLeave={handleNavLeave}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    activeMenu === item.key
                      ? 'text-gray-900 bg-gray-100/60'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn(
                    'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                    activeMenu === item.key && 'rotate-180'
                  )} />
                </button>
              </div>
            ) : (
              <Link
                key={item.label}
                to={item.href!}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* ── Right actions (desktop) ── */}
        <div className="hidden lg:flex items-center gap-2">
          <button type="button" className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-colors" aria-label="Search">
            <Search className="h-4.5 w-4.5" />
          </button>
          <Button variant="outline" asChild size="sm" className="text-gray-600 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50">
            <Link to="/contact">Get a demo</Link>
          </Button>
          <Button variant="ghost" asChild size="sm" className="text-gray-600 hover:text-gray-900">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 border-0 shadow-md shadow-indigo-200/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mega menu dropdown (desktop) ── */}
      {activeMenu && megaMenuData[activeMenu] && (
        <div
          className="hidden lg:block absolute left-0 right-0 z-40"
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/5 -z-10" onClick={closeMega} />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-xl ring-1 ring-black/5 overflow-hidden">
              <MegaMenuPanel config={megaMenuData[activeMenu]} onClose={closeMega} />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {navItems.map((item) =>
            item.key && megaMenuData[item.key] ? (
              <MobileAccordion
                key={item.label}
                label={item.label}
                config={megaMenuData[item.key]}
                onClose={() => setMobileMenuOpen(false)}
              />
            ) : (
              <Link
                key={item.label}
                to={item.href || '/'}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" asChild className="w-full">
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Get a demo</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            </Button>
            <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
```

**Key architecture notes for the implementer:**
- `activeMenu` state holds the key of the open mega menu (or null)
- Hover uses enter/leave with a 200ms close delay so users can move to the panel
- `closeTimeoutRef` prevents flicker when moving between nav item and panel
- Mobile uses accordion pattern for mega menu sections
- The `APP_NAME` import was removed — logo image is the sole brand element
- Logo is now `h-16` (50% larger than previous `h-12`)

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Verify tests**

Run: `npx vitest run`
Expected: All tests pass (MarketingNav is not directly tested, but Home page renders it)

**Step 4: Commit**

```bash
git add src/components/marketing/MarketingNav.tsx
git commit -m "feat(marketing): rewrite nav with Clay-style mega menus"
```

---

### Task 3: Rewrite HeroSection with Clay-style rounded container

**Files:**
- Modify: `src/components/marketing/HeroSection.tsx` (full rewrite)

**Step 1: Write the complete new HeroSection**

Replace the entire file. Key changes from current:
- Wrap content in a large `rounded-3xl` container with warm gradient background
- Keep same H1 text ("Discover creative talent with intelligent data") — test depends on it
- Keep same CTA text ("Start free trial") — test depends on it
- Keep floating illustrations but position them at container edges
- Remove the product screenshot/data table (moved to storytelling sections)
- Remove feature cards grid (capabilities shown in mega menu now)

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Star, Sparkles, TrendingUp, Award, ArrowRight,
  MapPin, Network,
} from 'lucide-react';

/* ─── Floating illustration: mini profile card ─── */
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

/* ─── Floating illustration: enrichment badge ─── */
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

/* ─── Floating illustration: graph cluster ─── */
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

/* ─── Floating illustration: award notification ─── */
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

/* ─── Floating illustration: connection notification ─── */
function FloatingConnectionCard() {
  return (
    <div className="w-44 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle-reverse" style={{ animationDelay: '0.5s' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
          <Network className="h-3 w-3 text-white" />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-gray-900">New Connection</div>
          <div className="text-[7px] text-gray-400">Sarah Chen → W+K Portland</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Floating illustration: location signal ─── */
function FloatingLocationSignal() {
  return (
    <div className="w-40 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle" style={{ animationDelay: '1.5s' }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
          <MapPin className="h-3 w-3 text-white" />
        </div>
        <span className="text-[9px] font-semibold text-gray-900">Talent Cluster</span>
      </div>
      <div className="text-[8px] text-gray-500">142 creatives in Brooklyn, NY</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export function HeroSection() {
  return (
    <section className="relative pt-8 pb-4 sm:pt-12 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl relative">
        {/* ─── Clay-style rounded hero container ─── */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Warm gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-rose-50/30" />
          {/* Secondary glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-100/20 blur-[100px] -z-10" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-100/15 blur-[80px] -z-10" />
          {/* Dot grid overlay */}
          <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* Noise texture */}
          <div className="absolute inset-0 -z-10 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />

          {/* Container content */}
          <div className="relative px-8 py-20 sm:px-16 sm:py-28">
            {/* ── Floating illustrations (LEFT) — xl only ── */}
            <div className="hidden xl:flex flex-col gap-4 absolute left-6 top-12 w-52 z-10">
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.6 }}>
                <FloatingProfileCard />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.6 }}>
                <FloatingGraphCluster />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.6 }}>
                <FloatingConnectionCard />
              </motion.div>
            </div>

            {/* ── Floating illustrations (RIGHT) — xl only ── */}
            <div className="hidden xl:flex flex-col gap-4 absolute right-6 top-16 w-48 items-end z-10">
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.6 }}>
                <FloatingEnrichmentBadge />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3, duration: 0.6 }}>
                <FloatingAwardBadge />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.6 }}>
                <FloatingLocationSignal />
              </motion.div>
            </div>

            {/* ── Centered text content ── */}
            <div className="text-center max-w-3xl mx-auto relative z-20">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8 backdrop-blur-sm shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Creative Intelligence Platform
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08]">
                  Discover creative talent{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    with intelligent data
                  </span>
                </h1>
                <p className="mt-7 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  Polsya maps portfolios, relationships, and opportunities across the creative
                  industry — so you find the right collaborators before anyone else.
                </p>
              </motion.div>

              {/* CTA row */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/50 px-8 text-base hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-200 hover:-translate-y-0.5">
                  <Link to="/signup">Start free trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8 text-base border-gray-300 bg-white/60 backdrop-blur-sm hover:border-indigo-300 hover:bg-white/80 transition-all duration-200">
                  <Link to="/how-it-works">See how it works</Link>
                </Button>
              </motion.div>

              {/* Social proof bar */}
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
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Key changes from current:**
- Hero content is inside a `rounded-3xl` container with warm gradient bg (Clay-style)
- Removed the full product screenshot / data table (stays in storytelling pillars)
- Removed the feature cards grid (capabilities now in mega menu Product panel)
- Added 2 more floating illustrations (ConnectionCard, LocationSignal) for denser visual composition
- Floating illustrations positioned at container edges, not page edges
- Background changed from cool indigo mesh to warm amber/orange (Clay-like warmth)
- Badge background changed from `bg-indigo-50/80` to `bg-white/80` for contrast on warm bg

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Verify tests**

Run: `npx vitest run`
Expected: All tests pass — H1 text and CTA text unchanged

**Step 4: Commit**

```bash
git add src/components/marketing/HeroSection.tsx
git commit -m "feat(marketing): Clay-style rounded hero container with warm gradient"
```

---

### Task 4: Rewrite CustomerLogos with trust section + logo ecosystem

**Files:**
- Modify: `src/components/marketing/CustomerLogos.tsx` (full rewrite)

**Step 1: Write the complete new CustomerLogos**

Replace the entire file. Key changes:
- Remove fake company names and marquee animation
- Add trust section (rating badges: G2, Capterra, Product Hunt)
- Add 2-row grid of real brand logos (inline SVG, monochrome)
- 12 logos: Behance, Dribbble, Figma, Adobe, Webflow, Framer, Canva, Notion, Stripe, Vercel, GitHub, Miro

```tsx
import { ScrollAnimation } from './ScrollAnimation';
import { Star } from 'lucide-react';

/* ─── Inline SVG brand logos (monochrome) ─── */
function BehanceLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.803 5.731c.589 0 1.119.051 1.605.155.483.103.895.273 1.243.508.343.235.611.547.804.939.187.39.28.863.28 1.412 0 .601-.126 1.101-.381 1.506-.256.401-.643.735-1.16 1.001.736.229 1.289.605 1.655 1.126.369.521.548 1.148.548 1.882 0 .601-.111 1.121-.334 1.555a3.16 3.16 0 01-.907 1.098c-.384.292-.831.505-1.35.645-.516.14-1.063.213-1.643.213H2V5.731h5.803zm-.351 4.972c.48 0 .878-.114 1.192-.345.313-.228.47-.591.47-1.084 0-.27-.05-.489-.151-.66a1.093 1.093 0 00-.403-.412 1.68 1.68 0 00-.588-.215 3.33 3.33 0 00-.697-.068H4.71v2.784h2.742zm.138 5.211c.268 0 .52-.029.754-.089.234-.058.437-.152.612-.282.173-.129.312-.297.414-.502.1-.204.152-.457.152-.762 0-.604-.163-1.04-.49-1.312-.326-.271-.762-.406-1.308-.406H4.71v3.353h2.88zm8.014-5.903c.853 0 1.594.16 2.223.484.627.323 1.145.761 1.551 1.317.404.554.7 1.192.883 1.915.184.722.254 1.486.208 2.289H15.37c.035.832.195 1.241.584 1.626.39.384.975.575 1.756.575.559 0 1.042-.141 1.451-.424.408-.283.66-.582.754-.899h2.466c-.413 1.276-.998 2.19-1.755 2.742-.759.553-1.676.829-2.754.829-.748 0-1.43-.121-2.042-.365a4.369 4.369 0 01-1.58-1.053c-.44-.46-.78-1.01-1.019-1.653-.241-.641-.363-1.352-.363-2.132 0-.756.118-1.454.354-2.094.236-.641.575-1.196 1.015-1.66.441-.466.969-.831 1.588-1.098.617-.266 1.313-.399 2.089-.399zm1.46 3.561c-.318-.338-.787-.506-1.408-.506-.403 0-.741.072-1.014.219-.272.146-.489.329-.653.547a2.143 2.143 0 00-.354.637 3.174 3.174 0 00-.128.519h4.678c-.09-.696-.803-1.079-1.121-1.416zM14.4 6.607h5.186v1.377H14.4V6.607z" />
    </svg>
  );
}

function DribbbleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.424 25.424 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.903 53.903 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.245.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" />
    </svg>
  );
}

function FigmaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 8.943h-4.588c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM4.147 11.963c0 1.665 1.354 3.019 3.019 3.019h3.117V8.943H7.166c-1.665 0-3.019 1.355-3.019 3.02zm4.49 7.379c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v4.49c0 2.476-2.014 4.49-4.588 4.49zm-.471-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02 3.118-1.355 3.118-3.02-1.354-3.019-3.118-3.019zm7.686-1.472c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49-2.014 4.49-4.49 4.49zm0-7.51c-1.665 0-3.019 1.355-3.019 3.02s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.02c0-1.664-1.354-3.019-3.019-3.019z" />
    </svg>
  );
}

function AdobeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm6.232 0H24v21.248z" />
    </svg>
  );
}

function WebflowLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.802 8.56s-1.946 6.094-2.048 6.399c-.052-.304-1.022-4.903-1.022-4.903A4.373 4.373 0 0010.618 7.1S8.497 13.234 8.4 13.537c-.005-.254-.316-5.932-.316-5.932A4.213 4.213 0 003.89 3.604L0 20.396h4.94s1.965-6.168 2.07-6.49c.045.279 1.017 4.946 1.017 4.946a4.357 4.357 0 004.086 2.958s2.262-6.675 2.368-6.992c-.003.244.373 5.579.373 5.579h4.945L24 8.614a4.31 4.31 0 00-6.198-.054z" />
    </svg>
  );
}

function FramerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
    </svg>
  );
}

function CanvaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.486 14.095c-.457 1.761-2.072 3.36-4.37 3.36-2.81 0-4.553-2.06-4.553-4.657 0-3.127 2.135-5.735 5.16-5.735 1.377 0 2.31.578 2.81 1.1.189.198.254.438.115.694l-.508.929c-.14.254-.373.312-.635.164-.41-.23-.852-.395-1.488-.395-1.702 0-3.003 1.529-3.003 3.404 0 1.382.83 2.544 2.397 2.544.862 0 1.57-.362 2.101-.927.205-.222.458-.272.693-.09l.795.58c.246.18.28.397.086.63z" />
    </svg>
  );
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.12 2.14c-.42-.326-.98-.7-2.054-.607l-12.78.794c-.467.047-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM1.936 1.035l13.31-.84c1.635-.14 2.054-.046 3.082.7l4.25 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.632-1.68 1.726l-15.458.933c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.933V2.715c0-.793.373-1.54 1.446-1.68z" />
    </svg>
  );
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19l-.89 5.549c1.953 1.089 5.555 1.962 8.333 1.962 2.602 0 4.735-.635 6.29-1.866C19.55 20.57 20.4 18.6 20.4 16.28c.001-4.407-2.593-5.862-6.424-7.13z" />
    </svg>
  );
}

function VercelLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L24 22H0z" />
    </svg>
  );
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function MiroLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.392 0H13.9l4 6.667L8.2 0H4.725l4 10L0 0v24l4.725-10L4.725 24h3.5l9.692-17.333L13.9 24h3.5L24 6.667z" />
    </svg>
  );
}

/* ─── Logo row data ─── */
const logoRow1 = [
  { name: 'Behance', Logo: BehanceLogo },
  { name: 'Dribbble', Logo: DribbbleLogo },
  { name: 'Figma', Logo: FigmaLogo },
  { name: 'Adobe', Logo: AdobeLogo },
  { name: 'Webflow', Logo: WebflowLogo },
  { name: 'Framer', Logo: FramerLogo },
];

const logoRow2 = [
  { name: 'Canva', Logo: CanvaLogo },
  { name: 'Notion', Logo: NotionLogo },
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'Vercel', Logo: VercelLogo },
  { name: 'GitHub', Logo: GitHubLogo },
  { name: 'Miro', Logo: MiroLogo },
];

/* ─── Review platforms ─── */
const reviewPlatforms = [
  { name: 'G2', rating: '4.9', reviews: '320+', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { name: 'Capterra', rating: '4.8', reviews: '180+', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { name: 'Product Hunt', rating: '#1', reviews: 'Product of the Day', color: 'text-red-600 bg-red-50 border-red-100' },
];

/* ═══════════════════════════════════════════════════════ */
export function CustomerLogos() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-y border-gray-100/80 bg-[linear-gradient(to_bottom,hsl(245_30%_98%),white)]">
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          {/* ── Trust label ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-8 text-center">
            Trusted by leading creative teams worldwide
          </p>

          {/* ── Review platform badges ── */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
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

          {/* ── Logo ecosystem: 2-row grid ── */}
          <div className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-8 items-center justify-items-center">
              {logoRow1.map(({ name, Logo }) => (
                <div key={name} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200 group">
                  <Logo className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">{name}</span>
                </div>
              ))}
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-8 items-center justify-items-center">
              {logoRow2.map(({ name, Logo }) => (
                <div key={name} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200 group">
                  <Logo className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

**Key changes from current:**
- Removed fake company names array and marquee animation
- Added 12 inline SVG logo components for real brands
- 2-row static grid layout (6 columns desktop, 3 mobile)
- Review platforms moved above logos (trust → logos layering)
- Logos are monochrome gray-600 at 40% opacity, hover to 70%
- Logo names shown on sm+ screens next to SVG icons

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Verify tests**

Run: `npx vitest run`
Expected: All tests pass — CustomerLogos has no direct text assertions in tests

**Step 4: Commit**

```bash
git add src/components/marketing/CustomerLogos.tsx
git commit -m "feat(marketing): Clay-style trust section with 2-row brand logo ecosystem"
```

---

### Task 5: Final verification

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 2: Full test suite**

Run: `npx vitest run`
Expected: All tests pass. Critical assertions:
- `/discover creative talent/i` — in HeroSection H1 ✓
- `/start free trial/i` — in HeroSection CTA ✓
- `Discover`, `Enrich`, `Connect`, `Act` — in Home.tsx pillar sections ✓
- `/intelligence sources/i` — in IntelligenceSources component (unchanged) ✓
- `Agencies` — in UseCaseGrid component (unchanged) ✓
- `/enterprise-grade security for/i` — in SecurityBadges (unchanged) ✓
- `/start discovering/i` — in CTASection (unchanged) ✓

**Step 3: Production build**

Run: `npx vite build`
Expected: Clean build with 0 errors

**Step 4: ESLint**

Run: `npx eslint src/components/marketing/MarketingNav.tsx src/components/marketing/HeroSection.tsx src/components/marketing/CustomerLogos.tsx --max-warnings=0`
Expected: 0 errors, 0 warnings (fix any issues if found)

---

### Task 6: Final commit (if not already committed per-task)

```bash
git add -A
git commit -m "feat(marketing): Clay-architecture homepage redesign

- Mega menu navigation with hover-triggered panels
- Clay-style rounded hero container with warm gradient
- 2-row brand logo ecosystem (Behance, Dribbble, Figma, etc.)
- Trust section with G2/Capterra/Product Hunt ratings
- Floating UI illustrations at hero container edges
- All existing tests passing"
```
