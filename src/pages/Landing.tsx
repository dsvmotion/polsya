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
  Users,
  Workflow,
  Database,
  Lock,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/** Product capabilities - B2B horizontal, fully customizable */
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
    description: 'Connect WooCommerce, Gmail, Outlook, Notion, Google Drive, and 15+ platforms. Your data flows without friction.',
    icon: Plug,
    href: '/features#integrations',
  },
  {
    title: 'AI Assistant',
    description: 'Ask questions about your pipeline, prioritize leads, and get actionable insights from your sales data.',
    icon: Sparkles,
    href: '/features#ai',
  },
  {
    title: 'Reports & Analytics',
    description: 'Dashboard widgets, conversion metrics, team activity. Export to Excel. Make decisions with data.',
    icon: BarChart3,
    href: '/features#reports',
  },
  {
    title: 'Maps & Territory',
    description: 'Plot prospects on interactive maps. Cluster by status, plan routes. Google Maps powered.',
    icon: MapPin,
    href: '/features#maps',
  },
  {
    title: 'Team & Roles',
    description: 'Invite members, assign admin/manager/rep/ops roles. Audit logs and organization-level access.',
    icon: Users,
    href: '/features#team',
  },
  {
    title: 'Custom Workflows',
    description: 'Define entity types, fields, and workflows. Sales Compass adapts to your processes.',
    icon: Workflow,
    href: '/features#prospecting',
  },
];

/** Solutions for every B2B vertical */
const industrySolutions = [
  {
    industry: 'Retail & distribution',
    stat: 'Centralize your client base',
    description: 'Manage accounts, stores, and distributors from a single dashboard. Map territories and track performance.',
  },
  {
    industry: 'Field teams',
    stat: 'Optimize routes and visits',
    description: 'Track prospects and customers on the map. Plan visits, log activities, and never lose a follow-up.',
  },
  {
    industry: 'Growing businesses',
    stat: 'Scale without losing visibility',
    description: 'Add entities, team members, and integrations as you grow. Your CRM adapts to your processes.',
  },
  {
    industry: 'Manufacturing & wholesale',
    stat: 'Connect sales with operations',
    description: 'Link orders, shipments, and inventory. Visibility across channels and territories.',
  },
  {
    industry: 'Professional services',
    stat: 'Manage pipeline and delivery',
    description: 'Track opportunities, proposals, and client projects. Role-based access and reporting.',
  },
  {
    industry: 'SaaS & technology',
    stat: 'B2B sales at scale',
    description: 'Custom entities for leads, accounts, and deals. Integrate with your stack via API and connectors.',
  },
];

/** Key differentiators */
const differentiators = [
  {
    title: 'Unmatched flexibility',
    description: 'Custom entity types, fields, and workflows. Adapts to your business, not the other way around.',
    icon: Layers,
  },
  {
    title: 'Pure B2B focus',
    description: 'Built for teams that sell to businesses. No generic CRM bloat. Accounts, territories, pipelines.',
    icon: Zap,
  },
  {
    title: 'Faster time to value',
    description: 'Pre-built integrations, intuitive UI, 7-day free trial. Start working in hours, not weeks.',
    icon: TrendingUp,
  },
  {
    title: 'Simple, fair pricing',
    description: 'Predictable plans with no hidden fees. Trial the full platform before you commit.',
    icon: Shield,
  },
  {
    title: 'Best-in-class security',
    description: 'Row-level security, encryption at rest. Each organization sees only its own data.',
    icon: Lock,
  },
  {
    title: 'Developer-friendly',
    description: 'REST APIs, webhooks, extensible schema. Integrate with any system.',
    icon: Cpu,
  },
  {
    title: 'Full customization',
    description: 'White-label options, custom fields, and workflows. Your brand, your rules.',
    icon: Database,
  },
  {
    title: 'Dedicated support',
    description: 'Priority support on Business+ plans. Onboarding, training, and custom integrations.',
    icon: MessageSquare,
  },
];

/** Integrations: available + roadmap */
const integrations = {
  available: [
    { name: 'WooCommerce', category: 'E-commerce' },
    { name: 'Gmail', category: 'Email' },
    { name: 'Outlook', category: 'Email' },
    { name: 'Google Maps', category: 'Maps' },
    { name: 'Notion', category: 'Productivity' },
    { name: 'Google Drive', category: 'Storage' },
    { name: 'OpenAI', category: 'AI' },
    { name: 'Claude', category: 'AI' },
  ],
  roadmap: [
    { name: 'Slack', category: 'Communication' },
    { name: 'HubSpot', category: 'CRM' },
    { name: 'Salesforce', category: 'CRM' },
    { name: 'Pipedrive', category: 'CRM' },
    { name: 'Stripe', category: 'Payments' },
  ],
};

const faqItems = [
  {
    q: 'How does the 7-day free trial work?',
    a: 'Sign up and get full access for 7 days. No credit card required. Explore all features, add your data, and connect integrations. Your data is preserved if you subscribe.',
  },
  {
    q: 'What integrations are included?',
    a: 'Sales Compass connects to WooCommerce, Gmail, Outlook, Google Maps, Notion, Google Drive, and OpenAI/Claude. Slack, HubSpot, Salesforce, and Pipedrive are on the roadmap. We offer API access for custom integrations.',
  },
  {
    q: 'Can I customize entity types and fields?',
    a: 'Yes. Define your own entity types (accounts, leads, projects, etc.), custom fields, and workflows. The platform adapts to your B2B processes.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Data is stored in Supabase with encryption at rest. Row-level security ensures each organization only sees its own data. We never share or sell your data.',
  },
  {
    q: 'Do you offer enterprise or custom plans?',
    a: 'Yes. Enterprise plans include unlimited entities, dedicated support, custom integrations, SLA, and flexible terms. Contact us for a quote.',
  },
];

export default function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Hero - Radar-style */}
      <section className="relative px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            B2B sales solutions for{' '}
            <span className="text-primary">modern enterprises</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl mx-auto">
            Prospecting, operations, and AI-powered insights in one platform. Map your territory, manage your pipeline, and grow revenue. Fully customizable for any B2B vertical.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup?plan=starter">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/contact">Get a demo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            7-day free trial · No credit card required · Full customization
          </p>
        </div>
      </section>

      {/* Logo strip - B2B horizontal */}
      <section className="border-y border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6">
            Trusted by B2B teams across industries
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12 opacity-70">
            {['Retail', 'Manufacturing', 'Distribution', 'Field Sales', 'SaaS', 'Professional Services', 'Wholesale', 'Technology'].map((label) => (
              <span key={label} className="text-base font-semibold text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The platform - 8 product blocks */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              The B2B sales platform that adapts to you
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to prospect, operate, and grow—in a single workspace. No spreadsheets, no silos. Fully customizable.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Integrations showcase */}
      <section className="bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Connect with your stack
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              15+ integrations available. E-commerce, email, AI, productivity, and more. API access for custom builds.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Plug className="h-5 w-5 text-primary" />
                Available now
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {integrations.available.map((i) => (
                  <span
                    key={i.name}
                    className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                  >
                    {i.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Coming soon
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {integrations.roadmap.map((i) => (
                  <span
                    key={i.name}
                    className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                  >
                    {i.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center">
            <Link to="/features#integrations" className="text-sm font-medium text-primary hover:underline">
              View all integrations →
            </Link>
          </p>
        </div>
      </section>

      {/* Solutions for every industry - 6 items */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Solutions for every industry
          </h2>
          <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
            In a data-first world, accurate pipeline data powers better decisions. Sales Compass serves B2B teams across verticals.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {industrySolutions.map((sol) => (
              <div
                key={sol.industry}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/20 transition-colors"
              >
                <h3 className="text-lg font-semibold text-foreground">{sol.industry}</h3>
                <p className="mt-2 text-primary font-medium">{sol.stat}</p>
                <p className="mt-2 text-sm text-muted-foreground">{sol.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Sales Compass difference - 8 items */}
      <section className="bg-muted/30 py-24 sm:py-32">
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
      <section className="py-24 sm:py-32">
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

      {/* Pricing preview - 4 plans */}
      <section id="pricing-preview" className="bg-muted/30 py-24 sm:py-32 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              7-day free trial on all plans. No credit card required.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              { name: 'Starter', price: '€29', desc: 'Individuals and small teams', features: ['500 entities', '1 user', 'Core integrations'], href: '/signup?plan=starter' },
              { name: 'Pro', price: '€79', desc: 'Growing teams', features: ['2,000 entities', '5 users', 'All integrations', 'AI Assistant'], href: '/signup?plan=pro', featured: true },
              { name: 'Business', price: '€149', desc: 'Scaling B2B teams', features: ['10,000 entities', '15 users', 'Priority support', 'Advanced workflows'], href: '/signup?plan=business' },
              { name: 'Enterprise', price: 'Custom', desc: 'Larger organizations', features: ['Unlimited', 'Dedicated support', 'Custom terms'], href: '/contact?subject=enterprise' },
            ].map((plan) => (
              <Link
                key={plan.name}
                to={plan.href}
                className={`rounded-xl border p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg ${
                  plan.featured ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card'
                }`}
              >
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold text-foreground">{plan.price}</p>
                {plan.price !== 'Custom' && <span className="text-sm text-muted-foreground">/month</span>}
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={plan.featured ? 'default' : 'outline'} size="sm">
                  {plan.price === 'Custom' ? 'Contact sales' : 'Start free trial'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link to="/pricing" className="text-sm font-medium text-primary hover:underline">
              Compare all plans →
            </Link>
          </p>
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
            Start your 7-day free trial. No credit card required. Full access to all features. Fully customizable.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup?plan=starter">
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
