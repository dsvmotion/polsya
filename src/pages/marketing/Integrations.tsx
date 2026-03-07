import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

interface SourceCategory {
  title: string;
  sources: string[];
}

const CATEGORIES: SourceCategory[] = [
  {
    title: 'Portfolio Platforms',
    sources: ['Behance', 'Dribbble', 'ArtStation', 'Cargo', 'Personal sites'],
  },
  {
    title: 'Professional Networks',
    sources: ['LinkedIn', 'Agency directories'],
  },
  {
    title: 'Award Databases',
    sources: ['Awwwards', 'CSS Design Awards', 'FWA'],
  },
  {
    title: 'Social Signals',
    sources: ['Instagram', 'Pinterest', 'Vimeo', 'YouTube'],
  },
  {
    title: 'Agency Directories',
    sources: ['WPP agencies', 'Publicis agencies', 'Independent rosters'],
  },
];

export default function Integrations() {
  return (
    <>
      <PageMeta title="Integrations" description="Connect 50+ data sources including Behance, Dribbble, LinkedIn, and award databases to power your creative intelligence." path="/integrations" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Integrations
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Polsya connects to the platforms where creative talent lives. Aggregate data from dozens of sources into a single, searchable database.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Categories grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat, idx) => (
            <ScrollAnimation key={cat.title} delay={idx * 0.05}>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
                <h3 className="text-lg font-semibold text-gray-900">{cat.title}</h3>
                <ul className="mt-4 space-y-3">
                  {cat.sources.map((source) => (
                    <li key={source} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                        {source.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700">{source}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </section>

      <CTASection
        headline="Connect your stack"
        subtitle="New integrations added every month. Don't see yours? Let us know."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Request integration', href: '/contact' }}
      />
    </>
  );
}
