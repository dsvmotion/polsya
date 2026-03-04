import { Link } from 'react-router-dom';
import {
  Search,
  ClipboardList,
  Plug,
  Sparkles,
  BarChart3,
  MapPin,
  ArrowRight,
  Zap,
  Shield,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const productBlocks = [
  {
    title: 'Prospecting',
    description: 'Find and qualify leads with maps, filters, and intelligent search. Turn territory data into opportunities.',
    icon: Search,
    href: '/features#prospecting',
  },
  {
    title: 'Operations',
    description: 'Manage orders, workflows, and daily operations in one place. Stay on top of deliveries and follow-ups.',
    icon: ClipboardList,
    href: '/features#operations',
  },
  {
    title: 'Integrations',
    description: 'Connect WooCommerce, Gmail, Outlook, and more. Your data flows in and out without friction.',
    icon: Plug,
    href: '/features#integrations',
  },
  {
    title: 'AI Assistant',
    description: 'Ask questions about your pipeline, prioritize leads, and get actionable insights from your sales data.',
    icon: Sparkles,
    href: '/features#ai',
  },
];

const industrySolutions = [
  {
    industry: 'For retail & distribution',
    stat: 'Centralize your client base',
    description: 'Manage pharmacies, stores, and distributors from a single dashboard. Map territories and track performance.',
  },
  {
    industry: 'For field teams',
    stat: 'Optimize your routes and visits',
    description: 'Track prospects and customers on the map. Plan visits, log activities, and never lose a follow-up.',
  },
  {
    industry: 'For growing businesses',
    stat: 'Scale without losing visibility',
    description: 'Add entities, team members, and integrations as you grow. Your CRM adapts to your processes.',
  },
];

const differentiators = [
  {
    title: 'Unmatched flexibility',
    description: 'Custom entity types, fields, and workflows. Sales Compass adapts to your business, not the other way around.',
    icon: Layers,
  },
  {
    title: 'Built for real work',
    description: 'Designed for teams that sell to pharmacies, distributors, and B2B accounts. No generic CRM bloat.',
    icon: Zap,
  },
  {
    title: 'Faster time to value',
    description: 'Pre-built integrations, intuitive UI, and a 7-day free trial. Start working in hours, not weeks.',
    icon: TrendingUp,
  },
  {
    title: 'Simple, fair pricing',
    description: 'Predictable plans with no hidden fees. Trial the full platform before you commit.',
    icon: Shield,
  },
];

const faqItems = [
  {
    q: 'How does the 7-day free trial work?',
    a: 'Sign up and get full access to the platform for 7 days. No credit card required. You can explore all features, add your data, and connect integrations. If you decide to subscribe, your data is preserved.',
  },
  {
    q: 'What integrations are included?',
    a: 'Sales Compass includes WooCommerce (orders), Gmail and Outlook (email), and Google Maps for geocoding and territory visualization. More integrations (Notion, Slack, etc.) are on the roadmap.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There is no long-term commitment. You can cancel your subscription at any time from the Billing page. Your data remains accessible during any grace period.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Data is stored in Supabase with encryption at rest. Row-level security ensures each organization only sees its own data. We never share or sell your data.',
  },
  {
    q: 'Do you offer enterprise or custom plans?',
    a: 'Yes. For larger teams with custom needs, contact us for an Enterprise plan with dedicated support, custom integrations, and flexible terms.',
  },
];

export default function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Sales solutions for{' '}
            <span className="text-primary">modern teams</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Prospecting, operations, and AI-powered insights in one platform. Map your territory, manage your pipeline, and grow revenue.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/contact">Get a demo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            7-day free trial · No credit card required
          </p>
        </div>
      </section>

      {/* Logo strip - placeholder */}
      <section className="border-y border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6">
            Trusted by sales teams across retail and distribution
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-60">
            {['Retail', 'Pharma', 'Distribution', 'Field Sales', 'B2B'].map((label) => (
              <span key={label} className="text-lg font-semibold text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The platform - product blocks */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              The sales platform that adapts to you
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to prospect, operate, and grow—in a single workspace. No spreadsheets, no silos.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {productBlocks.map((block) => (
              <Link
                key={block.title}
                to={block.href}
                className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20">
                  <block.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary">
                  {block.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{block.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                  Learn more
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions for every industry */}
      <section className="bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Solutions for every industry
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {industrySolutions.map((sol) => (
              <div
                key={sol.industry}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground">{sol.industry}</h3>
                <p className="mt-2 text-primary font-medium">{sol.stat}</p>
                <p className="mt-2 text-sm text-muted-foreground">{sol.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-muted-foreground">
            In a data-first world, accurate pipeline data powers better decisions. Sales Compass helps teams from{' '}
            <Link to="/features" className="text-primary hover:underline">retail</Link> to{' '}
            <Link to="/features" className="text-primary hover:underline">distribution</Link> and beyond.
          </p>
        </div>
      </section>

      {/* The Sales Compass difference */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            The Sales Compass difference
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((diff) => (
              <div key={diff.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <diff.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{diff.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{diff.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maps & reports teaser */}
      <section className="bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Maps & Territory</span>
              </div>
              <h2 className="mt-4 text-3xl font-bold text-foreground">
                See your territory at a glance
              </h2>
              <p className="mt-4 text-muted-foreground">
                Plot prospects and customers on interactive maps. Cluster by status, filter by type, and plan routes. Google Maps powered with no extra setup.
              </p>
              <Button variant="outline" asChild className="mt-6">
                <Link to="/features#maps">Explore maps</Link>
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Reports</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Reports that drive action</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Pipeline metrics, conversion rates, and activity summaries. Export to Excel. Share with your team. Make decisions with data.
              </p>
              <Button variant="link" asChild className="mt-4 p-0 h-auto">
                <Link to="/features#reports">View reporting</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 sm:py-32 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-12">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Turn data into revenue
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start your 7-day free trial. No credit card required. Full access to all features.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
