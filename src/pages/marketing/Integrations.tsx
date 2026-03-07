import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

interface SourceCategory {
  title: string;
  color: string;
  sources: { name: string; initial: string; color: string }[];
}

const CATEGORIES: SourceCategory[] = [
  {
    title: 'Portfolio Platforms',
    color: 'from-indigo-600 to-blue-600',
    sources: [
      { name: 'Behance', initial: 'Be', color: 'bg-blue-600' },
      { name: 'Dribbble', initial: 'Dr', color: 'bg-pink-500' },
      { name: 'ArtStation', initial: 'As', color: 'bg-indigo-600' },
      { name: 'Cargo', initial: 'Ca', color: 'bg-gray-800' },
      { name: 'Personal sites', initial: 'Ps', color: 'bg-violet-600' },
    ],
  },
  {
    title: 'Professional Networks',
    color: 'from-violet-600 to-purple-600',
    sources: [
      { name: 'LinkedIn', initial: 'Li', color: 'bg-blue-700' },
      { name: 'Agency directories', initial: 'Ad', color: 'bg-violet-600' },
    ],
  },
  {
    title: 'Award Databases',
    color: 'from-amber-500 to-orange-500',
    sources: [
      { name: 'Awwwards', initial: 'Aw', color: 'bg-emerald-600' },
      { name: 'CSS Design Awards', initial: 'Cs', color: 'bg-amber-600' },
      { name: 'FWA', initial: 'Fw', color: 'bg-red-600' },
    ],
  },
  {
    title: 'Social Signals',
    color: 'from-pink-500 to-rose-500',
    sources: [
      { name: 'Instagram', initial: 'Ig', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
      { name: 'Pinterest', initial: 'Pi', color: 'bg-red-600' },
      { name: 'Vimeo', initial: 'Vi', color: 'bg-cyan-600' },
      { name: 'YouTube', initial: 'Yt', color: 'bg-red-500' },
    ],
  },
  {
    title: 'Agency Directories',
    color: 'from-emerald-600 to-teal-600',
    sources: [
      { name: 'WPP agencies', initial: 'Wp', color: 'bg-emerald-700' },
      { name: 'Publicis agencies', initial: 'Pu', color: 'bg-teal-600' },
      { name: 'Independent rosters', initial: 'In', color: 'bg-cyan-700' },
    ],
  },
];

export default function Integrations() {
  return (
    <>
      <PageMeta title="Integrations" description="Connect 50+ data sources including Behance, Dribbble, LinkedIn, and award databases to power your creative intelligence." path="/integrations" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] rounded-full bg-violet-100/30 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Integrations</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Connect to the platforms creatives{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">live on</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
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
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full group">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cat.color}`} />
                  <h3 className="text-lg font-semibold text-gray-900">{cat.title}</h3>
                </div>
                <ul className="space-y-3">
                  {cat.sources.map((source) => (
                    <li key={source.name} className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg ${source.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                        {source.initial}
                      </div>
                      <span className="text-sm text-gray-700">{source.name}</span>
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
