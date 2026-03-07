import { Building2, Palette, Film, Users, TrendingUp, Search } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const PERSONAS = [
  {
    icon: Building2,
    title: 'Agencies',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    dot: 'bg-indigo-500',
    bullets: [
      'Scout freelance talent for client briefs across disciplines',
      'Build and maintain a curated roster of vetted creatives',
      'Track availability and past collaboration history',
      'Benchmark rates across markets and specialties',
    ],
  },
  {
    icon: Palette,
    title: 'Brands',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    dot: 'bg-violet-500',
    bullets: [
      'Find creatives who match your brand aesthetic',
      'Manage relationships with multiple agency partners',
      'Track campaign assignments and deliverables',
    ],
  },
  {
    icon: Film,
    title: 'Producers',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
    bullets: [
      'Assemble production crews with verified portfolios',
      'Search by location, gear, and availability windows',
      'Coordinate across multiple simultaneous projects',
      'Maintain a living database of production contacts',
    ],
  },
  {
    icon: Users,
    title: 'Recruiters',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
    bullets: [
      'Source creative candidates with portfolio-level detail',
      'Track candidate pipelines across open roles',
      'Enrich profiles with social proof and award history',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Investors',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    bullets: [
      'Map the creative economy with data-driven insights',
      'Identify emerging talent and trending studios',
      'Track agency growth signals and market movements',
    ],
  },
  {
    icon: Search,
    title: 'Consultants',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    dot: 'bg-cyan-500',
    bullets: [
      'Audit creative rosters for clients with enriched data',
      'Benchmark agency capabilities across markets',
      'Deliver talent landscape reports backed by real data',
      'Provide strategic talent recommendations',
    ],
  },
] as const;

export default function UseCases() {
  return (
    <>
      <PageMeta title="Use Cases" description="See how agencies, brands, producers, recruiters, investors, and consultants use Polsya for creative intelligence." path="/use-cases" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] rounded-full bg-violet-100/30 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Use Cases</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Built for every{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">creative team</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              Whether you are sourcing talent, managing rosters, or analyzing the creative landscape, Polsya adapts to your workflow.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Personas grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona, idx) => {
            const Icon = persona.icon;
            return (
              <ScrollAnimation key={persona.title} delay={idx * 0.05} id={persona.title.toLowerCase()}>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${persona.bg} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`h-6 w-6 ${persona.color}`} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{persona.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {persona.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-gray-500">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${persona.dot}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>
      </section>

      <CTASection
        headline="See how Polsya fits your team"
        subtitle="Book a personalized demo and learn how creative intelligence can transform your workflow."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Request a demo', href: '/contact' }}
      />
    </>
  );
}
