import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ClipboardList,
  Plug,
  Sparkles,
  BarChart3,
  MapPin,
  ArrowRight,
  Shield,
  Layers,
  TrendingUp,
  Lock,
  Quote,
  Mail,
  Check,
} from 'lucide-react';
import {
  SiWoocommerce,
  SiGmail,
  SiNotion,
  SiGoogledrive,
  SiOpenai,
  SiClaude,
  SiGooglemaps,
} from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/brand';
import { GlowOrb } from '@/components/landing/GlowOrb';
import { ScrollFadeIn } from '@/components/landing/ScrollFadeIn';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';

/** Core product pillars */
const productBlocks = [
  {
    title: 'Prospecting',
    description: 'Find and qualify leads with maps, filters, and intelligent search.',
    icon: Search,
    href: '/features#prospecting',
  },
  {
    title: 'Operations',
    description: 'Manage orders, workflows, and daily operations in one place.',
    icon: ClipboardList,
    href: '/features#operations',
  },
  {
    title: 'Integrations',
    description: 'Connect 15+ platforms. E-commerce, email, AI, productivity.',
    icon: Plug,
    href: '/features#integrations',
  },
  {
    title: 'AI Assistant',
    description: 'Ask questions about your pipeline. Get insights and prioritization.',
    icon: Sparkles,
    href: '/features#ai',
  },
];

/** Solutions by industry */
const industrySolutions = [
  { industry: 'Retail & distribution', stat: 'Centralize your client base' },
  { industry: 'Field teams', stat: 'Optimize routes and visits' },
  { industry: 'SaaS & technology', stat: 'B2B sales at scale' },
  { industry: 'Manufacturing', stat: 'Connect sales with operations' },
  { industry: 'Professional services', stat: 'Manage pipeline and delivery' },
  { industry: 'Growing businesses', stat: 'Scale without losing visibility' },
];

/** 4 differentiators */
const differentiators = [
  { title: 'Unmatched flexibility', description: 'Custom entity types, fields, and workflows. Adapts to your business.', icon: Layers },
  { title: 'Faster time to value', description: 'Pre-built integrations, 7-day trial. Start in hours, not weeks.', icon: TrendingUp },
  { title: 'Best-in-class security', description: 'Row-level security, encryption at rest. GDPR compliant.', icon: Lock },
  { title: 'Simple, fair pricing', description: 'Predictable plans. No hidden fees. Trial before you commit.', icon: Shield },
];

const proofStats = [
  { value: 15, suffix: '+', label: 'Integrations' },
  { value: 10, suffix: 'K+', label: 'Entities per workspace' },
  { value: 7, suffix: '', label: 'Day free trial' },
];

/** Integration logos */
const integrations = [
  { name: 'WooCommerce', Icon: SiWoocommerce },
  { name: 'Gmail', Icon: SiGmail },
  { name: 'Outlook', Icon: Mail },
  { name: 'Notion', Icon: SiNotion },
  { name: 'Google Drive', Icon: SiGoogledrive },
  { name: 'OpenAI', Icon: SiOpenai },
  { name: 'Claude', Icon: SiClaude },
  { name: 'Google Maps', Icon: SiGooglemaps },
];

const testimonials = [
  { quote: 'Centralized our distribution network and cut prospecting time in half. The map view alone is worth it.', name: 'Alex R.', role: 'Sales Director' },
  { quote: 'Finally a CRM that adapts to our B2B workflows. Custom entity types changed how we work.', name: 'Maria C.', role: 'Head of Operations' },
  { quote: 'AI assistant and integrations got us up and running in days. No spreadsheets.', name: 'James O.', role: 'Field Team Lead' },
];

const faqItems = [
  { q: 'How does the 7-day free trial work?', a: 'Sign up for full access. No credit card required. Your data is preserved if you subscribe.' },
  { q: 'What integrations are included?', a: 'WooCommerce, Gmail, Outlook, Google Maps, Notion, Google Drive, OpenAI, Claude. Slack, HubSpot, Salesforce on the roadmap.' },
  { q: 'Is my data secure?', a: 'Yes. Encryption at rest, row-level security. GDPR compliant. Each organization sees only its own data.' },
  { q: 'Do you offer enterprise plans?', a: 'Yes. Unlimited entities, dedicated support, custom integrations, SLA. Contact us for a quote.' },
];

const pricingPlans = [
  { name: 'Starter', price: '€29', desc: 'Individuals & small teams', features: ['500 entities', '1 user', 'Core integrations'], href: '/signup?plan=starter' },
  { name: 'Pro', price: '€79', desc: 'Growing teams', features: ['2,000 entities', '5 users', 'AI assistant', 'All integrations'], href: '/signup?plan=pro', featured: true },
  { name: 'Business', price: '€149', desc: 'Scaling teams', features: ['10,000 entities', '15 users', 'Priority support'], href: '/signup?plan=business' },
  { name: 'Enterprise', price: 'Custom', desc: 'Larger orgs', features: ['Unlimited entities', 'Dedicated support', 'Custom SLA'], href: '/contact?subject=enterprise' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [demoEmail, setDemoEmail] = useState('');

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = demoEmail.trim();
    navigate(email ? `/contact?subject=demo&email=${encodeURIComponent(email)}` : '/contact?subject=demo');
  };

  return (
    <div className="overflow-hidden bg-[#0a0a0a] text-white">

      {/* ─── HERO ─── */}
      <section className="relative px-4 pt-24 pb-24 sm:px-6 sm:pt-32 sm:pb-32 lg:px-8 overflow-hidden">
        {/* Glow orbs */}
        <GlowOrb color="hsl(var(--brand-red-wine))" size="w-[600px] h-[600px]" position="top-[-200px] left-[-150px]" opacity="opacity-15" />
        <GlowOrb color="hsl(var(--brand-clementine))" size="w-[500px] h-[500px]" position="top-[-100px] right-[-100px]" delay="2s" opacity="opacity-10" />
        <GlowOrb color="hsl(var(--brand-deep-green))" size="w-[400px] h-[400px]" position="bottom-[-150px] left-[30%]" delay="4s" opacity="opacity-10" />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-7xl leading-tight">
            Automate prospecting, manage pipelines, and{' '}
            <span className="bg-gradient-hero gradient-text">accelerate revenue</span>
            {' '}with AI
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto">
            {APP_DESCRIPTION}
          </p>
          <form onSubmit={handleDemoSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="work@company.com"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              className="h-12 px-4 text-base flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
            />
            <Button type="submit" size="lg" className="h-12 px-8 shrink-0 bg-gradient-cta text-white hover:opacity-90 transition-opacity border-0">
              Get a demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <p className="mt-4 text-sm text-white/40">
            No credit card required · 7-day free trial · GDPR compliant
          </p>
        </div>
      </section>

      {/* ─── LOGO STRIP ─── */}
      <section className="border-y border-white/5 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/30 mb-6">
            Trusted by B2B teams
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-medium text-white/40">
            {['Retail', 'Manufacturing', 'Distribution', 'SaaS', 'Field Sales', 'Professional Services'].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROOF IN NUMBERS ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {proofStats.map((s) => (
                <div key={s.label} className="glass-panel p-8 relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-hero opacity-40" />
                  <p className="text-4xl font-black text-white">
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── PLATFORM ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-28 bg-[#111]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-bold sm:text-3xl">
                The AI sales platform that adapts to you
              </h2>
              <p className="mt-3 text-white/50">
                One workspace. No spreadsheets. Fully customizable.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {productBlocks.map((b, i) => (
                <ScrollFadeIn key={b.title} delay={i * 100}>
                  <Link to={b.href} className="group block glass-panel p-6 hover:border-white/20 transition-all duration-300 h-full">
                    <div className="rounded-lg bg-gradient-warm w-fit p-2.5 opacity-80">
                      <b.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 font-semibold text-white group-hover:text-white transition-colors">{b.title}</h3>
                    <p className="mt-2 text-sm text-white/50">{b.description}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                      Explore {b.title}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </Link>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── INTEGRATIONS ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-28 bg-[#0a0a0a]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl">Connect with your stack</h2>
              <p className="mt-3 text-white/50">15+ integrations. API access for custom builds.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {integrations.map(({ name, Icon }) => (
                <span
                  key={name}
                  className="flex items-center gap-2.5 glass-panel px-5 py-3 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all duration-200"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {name}
                </span>
              ))}
            </div>
            <p className="mt-8 text-center">
              <Link to="/features#integrations" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                View all integrations →
              </Link>
            </p>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── SOLUTIONS ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-28 bg-[#111]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">Solutions for every industry</h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {industrySolutions.map((s, i) => (
                <ScrollFadeIn key={s.industry} delay={i * 80}>
                  <div className="glass-panel p-5 relative overflow-hidden group hover:border-white/15 transition-all">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-cta opacity-0 group-hover:opacity-60 transition-opacity" />
                    <h3 className="font-semibold text-white">{s.industry}</h3>
                    <p className="mt-1 text-sm text-white/50">{s.stat}</p>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── DIFFERENTIATORS ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-28 bg-[#0a0a0a]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">The {APP_NAME} difference</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {differentiators.map((d, i) => (
                <ScrollFadeIn key={d.title} delay={i * 100}>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-cta">
                      <d.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 font-semibold text-white">{d.title}</h3>
                    <p className="mt-2 text-sm text-white/50">{d.description}</p>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── TESTIMONIALS ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-28 bg-[#111]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">Trusted by sales teams</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <ScrollFadeIn key={t.name} delay={i * 120}>
                  <div className="glass-panel p-6 group hover:border-white/15 transition-all h-full">
                    <Quote className="h-5 w-5 text-white/20" />
                    <p className="mt-4 text-sm text-white/60">{t.quote}</p>
                    <p className="mt-4 font-medium text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── MAPS & REPORTS ─── */}
      <ScrollFadeIn>
        <section className="py-20 sm:py-28 bg-[#0a0a0a]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-start">
              <div className="glass-panel p-8">
                <div className="rounded-lg bg-gradient-warm w-fit p-2.5 opacity-80">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-white">See your territory at a glance</h2>
                <p className="mt-3 text-white/50">
                  Interactive maps, clustering, filters. Google Maps powered.
                </p>
                <Button variant="outline" asChild className="mt-6 border-white/10 text-white hover:bg-white/5">
                  <Link to="/features#maps">Explore maps</Link>
                </Button>
              </div>
              <div className="glass-panel p-8">
                <div className="rounded-lg bg-gradient-cta w-fit p-2.5 opacity-80">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-white">Reports that drive action</h2>
                <p className="mt-3 text-white/50">
                  Pipeline metrics, conversion rates. Export to Excel.
                </p>
                <Button variant="outline" asChild className="mt-6 border-white/10 text-white hover:bg-white/5">
                  <Link to="/features#reports">View reporting</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── PRICING ─── */}
      <ScrollFadeIn>
        <section id="pricing-preview" className="py-20 sm:py-28 bg-[#111] scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl">Simple, transparent pricing</h2>
              <p className="mt-3 text-white/50">7-day free trial on all plans.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pricingPlans.map((p) => (
                <Link
                  key={p.name}
                  to={p.href}
                  className={`relative rounded-xl p-6 text-center transition-all duration-300 hover:scale-[1.02] ${
                    p.featured
                      ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/20'
                      : 'glass-panel'
                  }`}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gradient-hero text-white rounded-full">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <p className="mt-2 text-3xl font-black text-white">
                    {p.price}
                    {p.price !== 'Custom' && <span className="text-sm font-normal text-white/40">/mo</span>}
                  </p>
                  <p className="mt-1 text-sm text-white/40">{p.desc}</p>
                  <ul className="mt-5 space-y-2 text-sm text-white/60 text-left">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-brand-sage shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-6 w-full border-0 ${
                      p.featured
                        ? 'bg-gradient-cta text-white hover:opacity-90'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                    size="sm"
                  >
                    {p.price === 'Custom' ? 'Contact sales' : 'Start free trial'}
                  </Button>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-center">
              <Link to="/pricing" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                Compare plans →
              </Link>
            </p>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── FAQ ─── */}
      <ScrollFadeIn>
        <section id="faq" className="py-20 sm:py-28 bg-[#0a0a0a] scroll-mt-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold">FAQ</h2>
            <Accordion type="single" collapsible className="mt-10">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-white/80 hover:text-white">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-white/50">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <GlowOrb color="hsl(var(--brand-coral))" size="w-[500px] h-[500px]" position="top-[-100px] right-[-100px]" opacity="opacity-10" delay="1s" />
        <GlowOrb color="hsl(var(--brand-deep-green))" size="w-[400px] h-[400px]" position="bottom-[-100px] left-[-50px]" opacity="opacity-10" delay="3s" />

        <div className="relative mx-auto max-w-2xl text-center px-4">
          <h2 className="text-3xl font-black sm:text-4xl">Ready to accelerate your sales?</h2>
          <p className="mt-4 text-white/50">Start your 7-day free trial. No credit card required.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-cta text-white hover:opacity-90 transition-opacity border-0 h-12 px-8">
              <Link to="/signup?plan=starter">Get started free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/15 text-white hover:bg-white/5 h-12 px-8">
              <Link to="/contact?subject=demo">Request a demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
