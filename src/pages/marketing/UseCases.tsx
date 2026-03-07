import { Building2, Palette, Film, Users, TrendingUp, Search } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';

const PERSONAS = [
  {
    icon: Building2,
    title: 'Agencies',
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
    bullets: [
      'Find creatives who match your brand aesthetic',
      'Manage relationships with multiple agency partners',
      'Track campaign assignments and deliverables',
    ],
  },
  {
    icon: Film,
    title: 'Producers',
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
    bullets: [
      'Source creative candidates with portfolio-level detail',
      'Track candidate pipelines across open roles',
      'Enrich profiles with social proof and award history',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Investors',
    bullets: [
      'Map the creative economy with data-driven insights',
      'Identify emerging talent and trending studios',
      'Track agency growth signals and market movements',
    ],
  },
  {
    icon: Search,
    title: 'Consultants',
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
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Built for every creative team
            </h1>
            <p className="mt-6 text-lg text-gray-600">
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
              <ScrollAnimation key={persona.title} delay={idx * 0.05}>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{persona.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {persona.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
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
        secondaryCta={{ label: 'Book a demo', href: '/contact' }}
      />
    </>
  );
}
