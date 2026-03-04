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

/** Core product pillars - Vanta: 4 focused blocks */
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

/** Solutions by industry - clean 3-column */
const industrySolutions = [
  { industry: 'Retail & distribution', stat: 'Centralize your client base' },
  { industry: 'Field teams', stat: 'Optimize routes and visits' },
  { industry: 'SaaS & technology', stat: 'B2B sales at scale' },
  { industry: 'Manufacturing', stat: 'Connect sales with operations' },
  { industry: 'Professional services', stat: 'Manage pipeline and delivery' },
  { industry: 'Growing businesses', stat: 'Scale without losing visibility' },
];

/** 4 differentiators - Vanta style */
const differentiators = [
  { title: 'Unmatched flexibility', description: 'Custom entity types, fields, and workflows. Adapts to your business.', icon: Layers },
  { title: 'Faster time to value', description: 'Pre-built integrations, 7-day trial. Start in hours, not weeks.', icon: TrendingUp },
  { title: 'Best-in-class security', description: 'Row-level security, encryption at rest. GDPR compliant.', icon: Lock },
  { title: 'Simple, fair pricing', description: 'Predictable plans. No hidden fees. Trial before you commit.', icon: Shield },
];

const proofStats = [
  { value: '15+', label: 'Integrations' },
  { value: '10K+', label: 'Entities per workspace' },
  { value: '7', label: 'Day free trial' },
];

/** Integration logos with brand colors */
const integrations = [
  { name: 'WooCommerce', Icon: SiWoocommerce, color: '#96588A' },
  { name: 'Gmail', Icon: SiGmail, color: '#EA4335' },
  { name: 'Outlook', Icon: Mail, color: '#0078D4' },
  { name: 'Notion', Icon: SiNotion, color: '#000000' },
  { name: 'Google Drive', Icon: SiGoogledrive, color: '#4285F4' },
  { name: 'OpenAI', Icon: SiOpenai, color: '#412991' },
  { name: 'Claude', Icon: SiClaude, color: '#CC785C' },
  { name: 'Google Maps', Icon: SiGooglemaps, color: '#4285F4' },
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

export default function Landing() {
  const navigate = useNavigate();
  const [demoEmail, setDemoEmail] = useState('');

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = demoEmail.trim();
    navigate(email ? `/contact?subject=demo&email=${encodeURIComponent(email)}` : '/contact?subject=demo');
  };

  return (
    <div className="overflow-hidden bg-background">
      {/* Hero - Vanta: gradient fades, one CTA focus */}
      <section className="relative px-4 pt-20 pb-20 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-linen/60 via-rock-blue/10 to-rock-blue/5 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rock-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rock-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Automate prospecting, manage pipelines, and{' '}
            <span className="text-primary">accelerate revenue</span>
            {' '}with AI
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {APP_DESCRIPTION}
          </p>
          <form onSubmit={handleDemoSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="work@company.com"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              className="h-12 px-4 text-base flex-1 border-border focus-visible:ring-primary/30"
            />
            <Button type="submit" size="lg" className="h-12 px-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              Get a demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · 7-day free trial · GDPR compliant
          </p>
        </div>
      </section>

      {/* Logo strip - minimal */}
      <section className="border-y border-border py-10 bg-linen/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-6">
            Trusted by B2B teams
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-medium text-muted-foreground/70">
            {['Retail', 'Manufacturing', 'Distribution', 'SaaS', 'Field Sales', 'Professional Services'].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Proof in numbers - subtle gradient cards */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            {proofStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-6">
                <p className="text-3xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform - 4 product blocks */}
      <section className="py-20 sm:py-28 bg-linen/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              The AI sales platform that adapts to you
            </h2>
            <p className="mt-3 text-muted-foreground">
              One workspace. No spreadsheets. Fully customizable.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productBlocks.map((b) => (
              <Link key={b.title} to={b.href} className="group block rounded-xl border-2 border-rock-blue/20 bg-card p-6 hover:border-primary hover:shadow-lg hover:bg-rock-blue/5 transition-all duration-300">
                <div className="rounded-lg bg-rock-blue/20 w-fit p-2.5">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                  Explore {b.title}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations - single row */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Connect with your stack</h2>
            <p className="mt-3 text-muted-foreground">15+ integrations. API access for custom builds.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map(({ name, Icon, color }) => (
              <span
                key={name}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary hover:bg-rock-blue/5 transition-colors"
              >
                <Icon className="h-5 w-5 shrink-0" style={{ color }} />
                {name}
              </span>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link to="/features#integrations" className="text-sm font-medium text-primary hover:underline">
              View all integrations →
            </Link>
          </p>
        </div>
      </section>

      {/* Solutions - 6 clean cards */}
      <section className="py-20 sm:py-28 bg-linen/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Solutions for every industry</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industrySolutions.map((s) => (
              <div key={s.industry} className="rounded-xl border border-border bg-card p-5 hover:border-rock-blue/30 transition-colors">
                <h3 className="font-semibold text-foreground">{s.industry}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.stat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The difference - 4 pillars */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">The {APP_NAME} difference</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((d) => (
              <div key={d.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rock-blue/10">
                  <d.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - compact */}
      <section className="py-20 sm:py-28 bg-linen/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Trusted by sales teams</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-rock-blue/30 transition-all">
                <Quote className="h-6 w-6 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">{t.quote}</p>
                <p className="mt-4 font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maps & Reports - compact */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <MapPin className="h-8 w-8 text-foreground" />
              <h2 className="mt-4 text-xl font-bold text-foreground">See your territory at a glance</h2>
              <p className="mt-3 text-muted-foreground">
                Interactive maps, clustering, filters. Google Maps powered.
              </p>
              <Button variant="outline" asChild className="mt-4">
                <Link to="/features#maps">Explore maps</Link>
              </Button>
            </div>
            <div>
              <BarChart3 className="h-8 w-8 text-foreground" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Reports that drive action</h2>
              <p className="mt-3 text-muted-foreground">
                Pipeline metrics, conversion rates. Export to Excel.
              </p>
              <Button variant="link" asChild className="mt-4 p-0 h-auto">
                <Link to="/features#reports">View reporting</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing-preview" className="py-20 sm:py-28 bg-linen/50 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">7-day free trial on all plans.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Starter', price: '€29', desc: 'Individuals & small teams', features: ['500 entities', '1 user'], href: '/signup?plan=starter' },
              { name: 'Pro', price: '€79', desc: 'Growing teams', features: ['2,000 entities', '5 users', 'AI'], href: '/signup?plan=pro', featured: true },
              { name: 'Business', price: '€149', desc: 'Scaling teams', features: ['10,000 entities', '15 users'], href: '/signup?plan=business' },
              { name: 'Enterprise', price: 'Custom', desc: 'Larger orgs', features: ['Unlimited'], href: '/contact?subject=enterprise' },
            ].map((p) => (
              <Link key={p.name} to={p.href} className={`rounded-lg border p-6 text-center transition-colors hover:border-foreground/20 ${p.featured ? 'border-foreground/30 bg-background' : 'border-border bg-background'}`}>
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                <p className="mt-2 text-2xl font-bold">{p.price}{p.price !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Button className="mt-4 w-full" variant={p.featured ? 'default' : 'outline'} size="sm">
                  {p.price === 'Custom' ? 'Contact sales' : 'Start free trial'}
                </Button>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link to="/pricing" className="text-sm font-medium text-foreground hover:underline">Compare plans →</Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground">FAQ</h2>
          <Accordion type="single" collapsible className="mt-10">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`q-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28 border-t border-border overflow-hidden">
        <div className="absolute inset-0 bg-rock-blue/5 pointer-events-none" />
        <div className="relative mx-auto max-w-2xl text-center px-4">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Ready to accelerate your sales?</h2>
          <p className="mt-4 text-muted-foreground">Start your 7-day free trial. No credit card required.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/signup?plan=starter">Get started free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact?subject=demo">Request a demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
