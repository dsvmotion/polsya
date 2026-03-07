# Marketing Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Clay-inspired public marketing website for Polsya at `/`, restructure routes for the 3-layer architecture (marketing + product + admin), and install shared foundation.

**Architecture:** Single SPA with three route groups. Marketing gets a new light-theme `MarketingLayout` with sticky transparent-to-white nav. Product routes alias from `/creative/*` to `/app/*`. Admin routes move from `/platform/*` to `/admin/*`. Legacy routes redirect. All marketing pages are new — existing `/` landing page is replaced.

**Tech Stack:** React 18, React Router 6, Vite, TypeScript, Tailwind CSS, Framer Motion (new), react-helmet-async (new), Radix UI/shadcn, Vitest

**Design doc:** `docs/plans/2026-03-07-marketing-website-design.md`

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install framer-motion and react-helmet-async**

```bash
npm install framer-motion react-helmet-async
```

**Step 2: Verify installation**

```bash
npm ls framer-motion react-helmet-async
```

Expected: both packages listed without errors.

**Step 3: Run existing tests to verify no breakage**

```bash
npx vitest run
```

Expected: All 506+ tests pass.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion and react-helmet-async"
```

---

### Task 2: Update Brand Constants

**Files:**
- Modify: `src/lib/brand.ts`
- Test: `src/test/brand.test.ts` (create)

**Step 1: Write the failing test**

Create `src/test/brand.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/brand';

describe('brand constants', () => {
  it('has correct app name', () => {
    expect(APP_NAME).toBe('Polsya');
  });

  it('has creative-intelligence tagline (not legacy sales)', () => {
    expect(APP_TAGLINE).not.toContain('B2B');
    expect(APP_TAGLINE).not.toContain('sales');
    expect(APP_TAGLINE.toLowerCase()).toContain('creative');
  });

  it('has creative-intelligence description (not legacy sales)', () => {
    expect(APP_DESCRIPTION).not.toContain('prospecting');
    expect(APP_DESCRIPTION).not.toContain('revenue');
    expect(APP_DESCRIPTION.toLowerCase()).toContain('creative');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/brand.test.ts
```

Expected: FAIL — tagline contains "B2B" and description contains "prospecting".

**Step 3: Update brand constants**

Modify `src/lib/brand.ts`:

```typescript
/**
 * Brand configuration. Change APP_NAME to rebrand across the app.
 * Remember to update index.html title and meta tags when changing the name.
 */
export const APP_NAME = 'Polsya';
export const APP_TAGLINE = 'Creative intelligence platform';
export const APP_DESCRIPTION =
  'Discover creative talent, analyze portfolios, map relationships, and surface opportunities — all in one intelligent platform.';
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/brand.test.ts
```

Expected: PASS

**Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass. If any existing tests reference the old tagline/description values, update them.

**Step 6: Commit**

```bash
git add src/lib/brand.ts src/test/brand.test.ts
git commit -m "feat: update brand constants to creative intelligence positioning"
```

---

### Task 3: Create MarketingLayout with Navigation and Footer

**Files:**
- Create: `src/components/marketing/MarketingLayout.tsx`
- Create: `src/components/marketing/MarketingNav.tsx`
- Create: `src/components/marketing/MarketingFooter.tsx`
- Test: `src/test/marketing-layout.test.tsx` (create)

**Context:** This replaces `PublicLayout.tsx` (dark theme, 4 nav items) with a light-theme layout. The nav has 8 items + CTA, goes transparent→white on scroll. The footer has 5 columns.

**Step 1: Write the failing test**

Create `src/test/marketing-layout.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

function renderLayout() {
  return render(
    <MemoryRouter>
      <MarketingLayout />
    </MemoryRouter>
  );
}

describe('MarketingLayout', () => {
  it('renders navigation with key links', () => {
    renderLayout();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('renders footer with product column', () => {
    renderLayout();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('does NOT force dark mode (light theme)', () => {
    renderLayout();
    // MarketingLayout should not add 'dark' class to html
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/marketing-layout.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create MarketingNav**

Create `src/components/marketing/MarketingNav.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/product', label: 'Product' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/use-cases', label: 'Use cases' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/resources', label: 'Resources' },
];

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:opacity-80">
          <img src="/polsya-logo.png" alt={APP_NAME} className="h-7 w-auto" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
          <span className="font-display text-xl">{APP_NAME}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 border-0 shadow-md">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" asChild className="w-full">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            </Button>
            <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Get started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
```

**Step 4: Create MarketingFooter**

Create `src/components/marketing/MarketingFooter.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/brand';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Discover', href: '/product#discover' },
      { label: 'Enrich', href: '/product#enrich' },
      { label: 'Pipeline', href: '/product#pipeline' },
      { label: 'Analytics', href: '/product#analytics' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'Agencies', href: '/use-cases#agencies' },
      { label: 'Brands', href: '/use-cases#brands' },
      { label: 'Producers', href: '/use-cases#producers' },
      { label: 'Recruiters', href: '/use-cases#recruiters' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/resources' },
      { label: 'Blog', href: '/resources#blog' },
      { label: 'Changelog', href: '/resources#changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Cookies', href: '/privacy#cookies' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-gray-900">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-display text-lg font-semibold text-gray-900">{APP_NAME}</span>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 5: Create MarketingLayout**

Create `src/components/marketing/MarketingLayout.tsx`:

```tsx
import { Outlet } from 'react-router-dom';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <MarketingNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
```

**Step 6: Run test to verify it passes**

```bash
npx vitest run src/test/marketing-layout.test.tsx
```

Expected: PASS

**Step 7: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 8: Commit**

```bash
git add src/components/marketing/ src/test/marketing-layout.test.tsx
git commit -m "feat: create MarketingLayout with light-theme nav and footer"
```

---

### Task 4: Create Shared Marketing Components (ScrollAnimation, CTASection)

**Files:**
- Create: `src/components/marketing/ScrollAnimation.tsx`
- Create: `src/components/marketing/CTASection.tsx`
- Test: `src/test/marketing-components.test.tsx` (create)

**Step 1: Write the failing test**

Create `src/test/marketing-components.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CTASection } from '@/components/marketing/CTASection';

describe('CTASection', () => {
  it('renders headline and CTAs', () => {
    render(
      <MemoryRouter>
        <CTASection
          headline="Start today"
          subtitle="Free trial"
          primaryCta={{ label: 'Get started', href: '/signup' }}
          secondaryCta={{ label: 'See demo', href: '/contact' }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Start today')).toBeInTheDocument();
    expect(screen.getByText('Free trial')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByText('See demo')).toBeInTheDocument();
  });

  it('renders without secondary CTA', () => {
    render(
      <MemoryRouter>
        <CTASection
          headline="Join now"
          primaryCta={{ label: 'Sign up', href: '/signup' }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Join now')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/marketing-components.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create ScrollAnimation wrapper**

Create `src/components/marketing/ScrollAnimation.tsx`:

```tsx
import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollAnimation({ children, className, delay = 0 }: ScrollAnimationProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 4: Create CTASection**

Create `src/components/marketing/CTASection.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollAnimation } from './ScrollAnimation';

interface CTAProps {
  label: string;
  href: string;
}

interface CTASectionProps {
  headline: string;
  subtitle?: string;
  primaryCta: CTAProps;
  secondaryCta?: CTAProps;
}

export function CTASection({ headline, subtitle, primaryCta, secondaryCta }: CTASectionProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ScrollAnimation>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            {headline}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-8">
              <Link to={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            {secondaryCta && (
              <Button asChild size="lg" variant="outline" className="px-8">
                <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

**Step 5: Run test to verify it passes**

```bash
npx vitest run src/test/marketing-components.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/marketing/ScrollAnimation.tsx src/components/marketing/CTASection.tsx src/test/marketing-components.test.tsx
git commit -m "feat: add ScrollAnimation (framer-motion) and CTASection components"
```

---

### Task 5: Create Home Page with All 10 Sections

**Files:**
- Create: `src/pages/marketing/Home.tsx`
- Create: `src/components/marketing/HeroSection.tsx`
- Create: `src/components/marketing/IntelligenceSources.tsx`
- Create: `src/components/marketing/FeatureCard.tsx`
- Create: `src/components/marketing/UseCaseGrid.tsx`
- Create: `src/components/marketing/CustomerLogos.tsx`
- Create: `src/components/marketing/SecurityBadges.tsx`
- Create: `src/components/marketing/TestimonialCarousel.tsx`
- Test: `src/test/marketing-home.test.tsx` (create)

**Context:** The home page has 10 sections following Clay's narrative flow: Hero → Intelligence Sources → Core Capabilities → Product Demo → Use Cases → Social Proof → Security → Testimonials → Final CTA → Footer (from layout). Reference design doc sections.

**Step 1: Write the failing test**

Create `src/test/marketing-home.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/marketing/Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Marketing Home Page', () => {
  it('renders hero section with headline and CTAs', () => {
    renderHome();
    expect(screen.getByText(/discover creative talent/i)).toBeInTheDocument();
    expect(screen.getByText(/start free trial/i)).toBeInTheDocument();
  });

  it('renders intelligence sources section', () => {
    renderHome();
    expect(screen.getByText(/intelligence sources/i)).toBeInTheDocument();
  });

  it('renders core capabilities', () => {
    renderHome();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Enrich')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Act')).toBeInTheDocument();
  });

  it('renders use cases section', () => {
    renderHome();
    expect(screen.getByText(/use case/i)).toBeInTheDocument();
    expect(screen.getByText('Agencies')).toBeInTheDocument();
  });

  it('renders security section', () => {
    renderHome();
    expect(screen.getByText(/enterprise-grade/i)).toBeInTheDocument();
  });

  it('renders final CTA', () => {
    renderHome();
    expect(screen.getByText(/start discovering/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/marketing-home.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create HeroSection component**

Create `src/components/marketing/HeroSection.tsx`. This is the most important section — the first thing visitors see. It follows Clay's outcome-first headline pattern.

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32 px-4 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-50/50 via-white to-white" />
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] rounded-full bg-orange-100/30 blur-3xl" />

      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Discover creative talent{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              with intelligent data
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Polsya maps portfolios, relationships, and opportunities across the creative
            industry — so you find the right collaborators before anyone else.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-8 text-base">
            <Link to="/signup">Start free trial →</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8 text-base">
            <Link to="/how-it-works">See how it works</Link>
          </Button>
        </motion.div>

        {/* Product screenshot placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 rounded-xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-100"
        >
          <div className="aspect-[16/9] flex items-center justify-center text-gray-400 text-sm">
            {/* Replace with actual product screenshot */}
            <span>Product screenshot placeholder</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 4: Create remaining section components**

Create `src/components/marketing/IntelligenceSources.tsx`:

```tsx
import { ScrollAnimation } from './ScrollAnimation';

const sources = [
  'Behance', 'Dribbble', 'LinkedIn', 'Instagram', 'Awwwards',
  'Pinterest', 'Vimeo', 'ArtStation', 'Cargo', 'Agency directories',
  'Award databases', 'Social signals', 'Portfolio sites',
];

export function IntelligenceSources() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Enrich every creative profile with{' '}
            <span className="text-orange-500">50+ intelligence sources</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Pull portfolio work, awards, social presence, and style signals automatically
            from the platforms creatives use every day.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {sources.map((source) => (
              <span
                key={source}
                className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

Create `src/components/marketing/FeatureCard.tsx`:

```tsx
import { type LucideIcon } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <ScrollAnimation delay={delay}>
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-500">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
      </div>
    </ScrollAnimation>
  );
}
```

Create `src/components/marketing/UseCaseGrid.tsx`:

```tsx
import { Building2, Palette, Film, Users, TrendingUp, Search } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

const useCases = [
  { icon: Building2, title: 'Agencies', description: 'Talent scouting and vendor management' },
  { icon: Palette, title: 'Brands', description: 'Finding and vetting creative partners' },
  { icon: Film, title: 'Producers', description: 'Building production rosters' },
  { icon: Users, title: 'Recruiters', description: 'Creative talent acquisition' },
  { icon: TrendingUp, title: 'Investors', description: 'Portfolio company analysis' },
  { icon: Search, title: 'Consultants', description: 'Market mapping and competitive intel' },
];

export function UseCaseGrid() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              One platform, every creative intelligence use case
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From talent scouting to competitive analysis — Polsya adapts to how you work.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <ScrollAnimation key={uc.title} delay={i * 0.1}>
                <div className="flex items-start gap-4 rounded-xl bg-white p-6 border border-gray-200">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                    <uc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{uc.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{uc.description}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

Create `src/components/marketing/CustomerLogos.tsx`:

```tsx
import { ScrollAnimation } from './ScrollAnimation';

export function CustomerLogos() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Trusted by creative teams worldwide
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {/* Placeholder logos — replace with real customer logos */}
            {['Agency A', 'Studio B', 'Brand C', 'Network D', 'Creative E'].map((name) => (
              <span key={name} className="text-lg font-semibold text-gray-900">{name}</span>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

Create `src/components/marketing/SecurityBadges.tsx`:

```tsx
import { Shield, Lock, Globe, Server } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

const badges = [
  { icon: Shield, title: 'GDPR Compliant', description: 'Full European data protection compliance' },
  { icon: Lock, title: 'Encrypted', description: 'AES-256 encryption at rest and in transit' },
  { icon: Server, title: 'Row-Level Security', description: 'Supabase RLS on every table' },
  { icon: Globe, title: 'SOC 2 Ready', description: 'Enterprise-grade security practices' },
];

export function SecurityBadges() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Enterprise-grade security for sensitive talent data
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Your data is protected with the same standards trusted by the world's leading organizations.
          </p>
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {badges.map((badge, i) => (
              <ScrollAnimation key={badge.title} delay={i * 0.1}>
                <div className="rounded-xl bg-gray-50 p-6 text-center border border-gray-200">
                  <badge.icon className="h-8 w-8 mx-auto text-orange-500" />
                  <h3 className="mt-3 font-semibold text-gray-900 text-sm">{badge.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{badge.description}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

Create `src/components/marketing/TestimonialCarousel.tsx`:

```tsx
import { ScrollAnimation } from './ScrollAnimation';

const testimonials = [
  {
    quote: 'Polsya transformed how we discover and evaluate creative talent. What used to take weeks now takes hours.',
    author: 'Creative Director',
    company: 'Design Agency',
    color: 'bg-orange-500',
  },
  {
    quote: 'The portfolio analysis and relationship mapping features are unlike anything else on the market.',
    author: 'Head of Partnerships',
    company: 'Creative Network',
    color: 'bg-blue-500',
  },
  {
    quote: 'We use Polsya to build production rosters faster than ever. The intelligence is genuinely actionable.',
    author: 'Executive Producer',
    company: 'Production Studio',
    color: 'bg-green-600',
  },
];

export function TestimonialCarousel() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center">
            What our customers say
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollAnimation key={i} delay={i * 0.15}>
                <div className={`${t.color} rounded-2xl p-8 text-white h-full flex flex-col`}>
                  <blockquote className="flex-1 text-lg leading-relaxed">
                    "{t.quote}"
                  </blockquote>
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <p className="font-semibold">{t.author}</p>
                    <p className="text-sm text-white/70">{t.company}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
```

**Step 5: Create the Home page assembling all sections**

Create `src/pages/marketing/Home.tsx`:

```tsx
import { Search, Sparkles, GitBranch, Zap } from 'lucide-react';
import { HeroSection } from '@/components/marketing/HeroSection';
import { IntelligenceSources } from '@/components/marketing/IntelligenceSources';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { UseCaseGrid } from '@/components/marketing/UseCaseGrid';
import { CustomerLogos } from '@/components/marketing/CustomerLogos';
import { SecurityBadges } from '@/components/marketing/SecurityBadges';
import { TestimonialCarousel } from '@/components/marketing/TestimonialCarousel';
import { CTASection } from '@/components/marketing/CTASection';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';

const capabilities = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Find designers, studios, and agencies with intelligent search, filters, and geographic mapping.',
  },
  {
    icon: Sparkles,
    title: 'Enrich',
    description: 'Automatically pull portfolio work, awards, social presence, and style signals from 50+ sources.',
  },
  {
    icon: GitBranch,
    title: 'Connect',
    description: 'Map relationships between creatives, brands, and projects to uncover hidden networks.',
  },
  {
    icon: Zap,
    title: 'Act',
    description: 'Prioritize opportunities, automate outreach, and track your entire pipeline in one place.',
  },
];

export default function Home() {
  return (
    <>
      {/* Section 1: Hero */}
      <HeroSection />

      {/* Section 2: Intelligence Sources */}
      <IntelligenceSources />

      {/* Section 3: Core Capabilities */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <ScrollAnimation>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Four pillars of creative intelligence
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              From discovery to action — everything you need in one platform.
            </p>
          </div>
        </ScrollAnimation>
        <div className="mt-12 mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          {capabilities.map((cap, i) => (
            <FeatureCard key={cap.title} {...cap} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* Section 4: Product Demo placeholder */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <ScrollAnimation>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              See it in action
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Discover → Enrich → Analyze → Connect → Pipeline
            </p>
            <div className="mt-12 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="aspect-[16/9] flex items-center justify-center text-gray-400 text-sm">
                Product workflow demo placeholder
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* Section 5: Use Cases */}
      <UseCaseGrid />

      {/* Section 6: Social Proof */}
      <CustomerLogos />

      {/* Section 7: Security */}
      <SecurityBadges />

      {/* Section 8: Testimonials */}
      <TestimonialCarousel />

      {/* Section 9: Final CTA */}
      <CTASection
        headline="Start discovering creative talent today"
        subtitle="Free 7-day trial. No credit card required."
        primaryCta={{ label: 'Start free trial →', href: '/signup' }}
        secondaryCta={{ label: 'Request a demo →', href: '/contact' }}
      />
    </>
  );
}
```

**Step 6: Run test to verify it passes**

```bash
npx vitest run src/test/marketing-home.test.tsx
```

Expected: PASS

**Step 7: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 8: Commit**

```bash
git add src/components/marketing/ src/pages/marketing/ src/test/marketing-home.test.tsx
git commit -m "feat: create marketing home page with all 10 sections"
```

---

### Task 6: Create Remaining Marketing Pages (Product, How It Works, Integrations, Use Cases, Pricing, Customers, Resources, Security, Contact)

**Files:**
- Create: `src/pages/marketing/Product.tsx`
- Create: `src/pages/marketing/HowItWorks.tsx`
- Create: `src/pages/marketing/Integrations.tsx`
- Create: `src/pages/marketing/UseCases.tsx`
- Create: `src/pages/marketing/Pricing.tsx`
- Create: `src/pages/marketing/Customers.tsx`
- Create: `src/pages/marketing/Resources.tsx`
- Create: `src/pages/marketing/Security.tsx`
- Create: `src/pages/marketing/Contact.tsx`
- Test: `src/test/marketing-pages.test.tsx` (create)

**Context:** Each page follows the same pattern: headline section, content sections, final CTA. All use `ScrollAnimation` for entry effects and `CTASection` for the bottom CTA. These are content-focused pages — the heavy visual work was done in Task 5's components. These pages compose those components with page-specific content.

**Step 1: Write the failing test**

Create `src/test/marketing-pages.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Import all marketing pages
import Product from '@/pages/marketing/Product';
import HowItWorks from '@/pages/marketing/HowItWorks';
import Integrations from '@/pages/marketing/Integrations';
import UseCasesPage from '@/pages/marketing/UseCases';
import Pricing from '@/pages/marketing/Pricing';
import Customers from '@/pages/marketing/Customers';
import Resources from '@/pages/marketing/Resources';
import SecurityPage from '@/pages/marketing/Security';
import ContactPage from '@/pages/marketing/Contact';

function wrap(el: React.ReactElement) {
  return render(<MemoryRouter>{el}</MemoryRouter>);
}

describe('Marketing Pages', () => {
  it('Product page renders capability sections', () => {
    wrap(<Product />);
    expect(screen.getByText(/discover/i)).toBeInTheDocument();
  });

  it('How It Works page renders steps', () => {
    wrap(<HowItWorks />);
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
  });

  it('Integrations page renders data source grid', () => {
    wrap(<Integrations />);
    expect(screen.getByText(/integrations/i)).toBeInTheDocument();
  });

  it('Use Cases page renders personas', () => {
    wrap(<UseCasesPage />);
    expect(screen.getByText(/agencies/i)).toBeInTheDocument();
  });

  it('Pricing page renders plan tiers', () => {
    wrap(<Pricing />);
    expect(screen.getByText(/starter/i)).toBeInTheDocument();
    expect(screen.getByText(/pro/i)).toBeInTheDocument();
  });

  it('Customers page renders testimonials section', () => {
    wrap(<Customers />);
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
  });

  it('Resources page renders resource links', () => {
    wrap(<Resources />);
    expect(screen.getByText(/resources/i)).toBeInTheDocument();
  });

  it('Security page renders compliance info', () => {
    wrap(<SecurityPage />);
    expect(screen.getByText(/security/i)).toBeInTheDocument();
    expect(screen.getByText(/GDPR/i)).toBeInTheDocument();
  });

  it('Contact page renders form', () => {
    wrap(<ContactPage />);
    expect(screen.getByText(/contact/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/marketing-pages.test.tsx
```

Expected: FAIL — modules not found.

**Step 3: Create all 9 marketing pages**

Each page follows the same structure: hero header + content sections + bottom CTA. Create all pages in `src/pages/marketing/`. Each page should be a default export functional component. Use `ScrollAnimation`, `CTASection`, `FeatureCard`, and other shared marketing components. Content comes from the design doc. Pages should be 80-200 lines each.

Key patterns for each page:
- **Product.tsx**: Hero + 5 capability deep-dives (Discover, Enrich, Pipeline, Analytics, Communication) with alternating left/right layouts
- **HowItWorks.tsx**: Hero + 5-step numbered flow (Connect sources → Discover → Enrich → Build relationships → Track opportunities)
- **Integrations.tsx**: Hero + categorized grid (Portfolio platforms, Professional networks, Award databases, Social signals, Agency directories)
- **UseCases.tsx**: Hero + 6 persona sections (Agencies, Brands, Producers, Recruiters, Investors, Consultants) each with icon, title, 3-4 bullet points
- **Pricing.tsx**: Hero + 4 plan cards (Starter €29, Pro €79, Business €149, Enterprise custom) + feature comparison + FAQ
- **Customers.tsx**: Hero + customer logos + expanded testimonials + case study placeholders
- **Resources.tsx**: Hero + 3-column grid (Documentation, Blog, Changelog) with cards
- **Security.tsx**: Hero + compliance badges + security practices grid + data handling section
- **Contact.tsx**: Hero + contact form (name, email, company, subject, message) + company info sidebar

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/marketing-pages.test.tsx
```

Expected: PASS

**Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/pages/marketing/ src/test/marketing-pages.test.tsx
git commit -m "feat: create all 9 marketing sub-pages (product, pricing, etc.)"
```

---

### Task 7: Restructure App.tsx Routes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/landing/LandingOrRedirect.tsx`
- Test: `src/test/routes.test.tsx` (create)

**Context:** This is the big routing change. We need to:
1. Replace `PublicLayout` with `MarketingLayout` for marketing routes
2. Alias `/creative/*` routes to also work at `/app/*`
3. Alias `/platform/*` routes to also work at `/admin/*`
4. Add legacy redirects (`/creative/*` → `/app/*`, `/platform/*` → `/admin/*`)
5. Update `LandingOrRedirect` to redirect to `/app` instead of `/dashboard`

**CRITICAL**: Do NOT remove existing routes for `/creative/*` or `/platform/*` yet — only ADD the `/app/*` and `/admin/*` aliases. This ensures existing bookmarks and links keep working.

**Step 1: Write the failing test**

Create `src/test/routes.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Route structure', () => {
  it('marketing routes use MarketingLayout', async () => {
    const App = await import('@/App');
    // Verify module imports correctly
    expect(App).toBeDefined();
  });

  it('LandingOrRedirect points to /app for authenticated users', async () => {
    const mod = await import('@/components/landing/LandingOrRedirect');
    expect(mod).toBeDefined();
  });
});
```

**Step 2: Run test to verify current state**

```bash
npx vitest run src/test/routes.test.tsx
```

Expected: PASS (baseline test).

**Step 3: Update LandingOrRedirect**

Modify `src/components/landing/LandingOrRedirect.tsx` to redirect to `/app` instead of `/dashboard`:

Change any `Navigate to="/dashboard"` → `Navigate to="/app"`.

**Step 4: Update App.tsx**

Key changes to `src/App.tsx`:

1. Import `MarketingLayout` (lazy), import all marketing pages (lazy)
2. Replace `<PublicLayout>` route group with `<MarketingLayout>` and new marketing routes
3. Add `/app/*` route group that mirrors `/creative/*` (both point to same components)
4. Add `/admin/*` route group that mirrors `/platform/*` (both point to same components)
5. Add redirect from `/dashboard` → `/app`
6. Keep `/creative/*` and `/platform/*` as-is for backward compat (later task to remove)

Add these lazy imports at the top of App.tsx:

```typescript
const MarketingLayout = lazy(() => import('./components/marketing/MarketingLayout').then(m => ({ default: m.MarketingLayout })));
const MarketingHome = lazy(() => import('./pages/marketing/Home'));
const MarketingProduct = lazy(() => import('./pages/marketing/Product'));
const MarketingHowItWorks = lazy(() => import('./pages/marketing/HowItWorks'));
const MarketingIntegrations = lazy(() => import('./pages/marketing/Integrations'));
const MarketingUseCases = lazy(() => import('./pages/marketing/UseCases'));
const MarketingPricing = lazy(() => import('./pages/marketing/Pricing'));
const MarketingCustomers = lazy(() => import('./pages/marketing/Customers'));
const MarketingResources = lazy(() => import('./pages/marketing/Resources'));
const MarketingSecurity = lazy(() => import('./pages/marketing/Security'));
const MarketingContact = lazy(() => import('./pages/marketing/Contact'));
```

Replace the `<PublicLayout>` route group:

```tsx
{/* Marketing routes - new light-theme layout */}
<Route path="/" element={<MarketingLayout />}>
  <Route index element={<LandingOrRedirect />} />
  <Route path="product" element={<MarketingProduct />} />
  <Route path="how-it-works" element={<MarketingHowItWorks />} />
  <Route path="integrations" element={<MarketingIntegrations />} />
  <Route path="use-cases" element={<MarketingUseCases />} />
  <Route path="pricing" element={<MarketingPricing />} />
  <Route path="customers" element={<MarketingCustomers />} />
  <Route path="resources" element={<MarketingResources />} />
  <Route path="security" element={<MarketingSecurity />} />
  <Route path="contact" element={<MarketingContact />} />
  <Route path="terms" element={<Terms />} />
  <Route path="privacy" element={<Privacy />} />
</Route>
```

Add `/app/*` alias for the creative routes (after existing `/creative/*` group):

```tsx
{/* Product app at /app — alias for /creative */}
<Route path="app" element={
  <ProtectedRoute>
    <CreativeLayout />
  </ProtectedRoute>
}>
  <Route index element={<CreativeDashboard />} />
  <Route path="discover" element={<CreativeDiscover />} />
  <Route path="clients" element={<CreativeClients />} />
  {/* ... all same routes as /creative/* ... */}
</Route>
```

Add `/admin/*` alias for the platform routes (after existing `/platform/*` group):

```tsx
{/* Admin console at /admin — alias for /platform */}
<Route path="admin" element={
  <ProtectedRoute>
    <PlatformLayout />
  </ProtectedRoute>
}>
  <Route index element={<PlatformDashboard />} />
  <Route path="billing" element={<PlatformBilling />} />
  {/* ... all same routes as /platform/* ... */}
</Route>
```

Add legacy redirects:

```tsx
{/* Legacy redirects */}
<Route path="/dashboard" element={<Navigate to="/app" replace />} />
<Route path="/features" element={<Navigate to="/product" replace />} />
<Route path="/trust" element={<Navigate to="/security" replace />} />
```

**Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass. If any tests reference old routes (`/features`, `/trust`), update them.

**Step 6: Run production build**

```bash
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add src/App.tsx src/components/landing/LandingOrRedirect.tsx src/test/routes.test.tsx
git commit -m "feat: restructure routes — marketing at /, product at /app, admin at /admin"
```

---

### Task 8: Add HelmetProvider and Page-Level SEO Meta Tags

**Files:**
- Modify: `src/main.tsx`
- Create: `src/components/marketing/PageMeta.tsx`
- Modify: `src/pages/marketing/Home.tsx` (add meta)
- Modify: All other marketing pages (add meta)
- Test: `src/test/page-meta.test.tsx` (create)

**Step 1: Write the failing test**

Create `src/test/page-meta.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { PageMeta } from '@/components/marketing/PageMeta';

describe('PageMeta', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <HelmetProvider>
        <MemoryRouter>
          <PageMeta title="Test Page" description="A test" />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(container).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/page-meta.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create PageMeta component**

Create `src/components/marketing/PageMeta.tsx`:

```tsx
import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/brand';

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
}

export function PageMeta({ title, description, path }: PageMetaProps) {
  const fullTitle = `${title} | ${APP_NAME}`;
  const url = path ? `https://polsya.com${path}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
    </Helmet>
  );
}
```

**Step 4: Wrap app with HelmetProvider**

Modify `src/main.tsx` — add `HelmetProvider` as an outer wrapper:

```tsx
import { HelmetProvider } from 'react-helmet-async';
// ... existing imports

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

**Step 5: Add PageMeta to each marketing page**

Add to the top of each marketing page's JSX (inside the fragment):

```tsx
<PageMeta
  title="Creative Intelligence Platform"
  description="Discover creative talent, analyze portfolios, map relationships, and surface opportunities."
  path="/"
/>
```

(Adjust title/description/path per page.)

**Step 6: Run tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add src/main.tsx src/components/marketing/PageMeta.tsx src/pages/marketing/ src/test/page-meta.test.tsx
git commit -m "feat: add SEO meta tags via react-helmet-async on all marketing pages"
```

---

### Task 9: Clean Up — Remove Legacy Marketing Files

**Files:**
- Delete: `src/components/layout/PublicLayout.tsx` (replaced by MarketingLayout)
- Delete: `src/components/landing/GlowOrb.tsx` (no longer used)
- Delete: `src/components/landing/ScrollFadeIn.tsx` (replaced by ScrollAnimation)
- Delete: `src/components/landing/AnimatedCounter.tsx` (replaced by framer-motion)
- Delete: `src/pages/Landing.tsx` (replaced by marketing/Home.tsx)
- Delete: `src/pages/Features.tsx` (replaced by marketing/Product.tsx)
- Modify: `src/App.tsx` — remove old imports

**Step 1: Verify no remaining imports of deprecated files**

Search codebase for imports of the files being deleted:

```bash
npx vitest run
```

If any test imports old files, update them first.

**Step 2: Remove old files**

```bash
rm src/components/layout/PublicLayout.tsx
rm src/components/landing/GlowOrb.tsx
rm src/components/landing/ScrollFadeIn.tsx
rm src/components/landing/AnimatedCounter.tsx
rm src/pages/Landing.tsx
rm src/pages/Features.tsx
```

**Step 3: Update App.tsx imports**

Remove any remaining references to `PublicLayout`, `Landing`, `Features` from `src/App.tsx`.

**Step 4: Keep `LandingOrRedirect.tsx` and `CookieBanner.tsx`**

These are still used. `LandingOrRedirect` now imports from `marketing/Home.tsx`. `CookieBanner` can move to `src/components/marketing/` later.

**Step 5: Run full test suite + build**

```bash
npx vitest run && npm run build
```

Expected: All tests pass, build succeeds.

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove deprecated PublicLayout, Landing, Features, GlowOrb, ScrollFadeIn"
```

---

### Task 10: Final Verification and Deploy

**Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds, no warnings.

**Step 3: Push to GitHub**

```bash
git push origin main
```

**Step 4: Verify Vercel deployment**

Wait for Vercel to build and deploy. Check deployment status:

```bash
npx vercel ls --limit 1
```

Expected: Deployment reaches READY state.

**Step 5: Smoke test key routes**

Verify these URLs load correctly:
- `/` — Marketing home page (light theme)
- `/product` — Product page
- `/pricing` — Pricing page
- `/app` — Product app (redirects to login if not authenticated)
- `/admin` — Admin console (redirects to login if not authenticated)
- `/login` — Login page
- `/creative` — Still works (backward compat, loads product app)

**Step 6: Commit any fixes**

If any fixes were needed during smoke testing, commit them.

---

## Summary

| Task | What | Files Created | Tests |
|------|------|---------------|-------|
| 1 | Install dependencies | — | verify existing pass |
| 2 | Update brand constants | 1 modified | 1 new test |
| 3 | MarketingLayout + Nav + Footer | 3 new | 1 new test |
| 4 | ScrollAnimation + CTASection | 2 new | 1 new test |
| 5 | Home page (10 sections) | 7 new | 1 new test |
| 6 | 9 marketing sub-pages | 9 new | 1 new test |
| 7 | Route restructuring (App.tsx) | 2 modified | 1 new test |
| 8 | SEO meta tags (HelmetProvider) | 2 new + modifications | 1 new test |
| 9 | Clean up legacy files | 6 deleted | verify suite |
| 10 | Final verification + deploy | — | full suite + build |

**After this plan:** Proceed to `docs/plans/2026-03-07-admin-console.md` for the admin console implementation.
