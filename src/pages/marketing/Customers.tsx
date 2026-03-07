import { Star } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CustomerLogos } from '@/components/marketing/CustomerLogos';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const TESTIMONIALS = [
  {
    quote:
      'Polsya cut our talent sourcing time in half. We went from spending days manually browsing portfolios to finding the perfect creative match in minutes.',
    author: 'Sarah Chen',
    role: 'Head of Production, Northlight Studios',
    stars: 5,
    metric: '50% faster sourcing',
    initials: 'SC',
    gradient: 'from-indigo-600 to-blue-600',
  },
  {
    quote:
      'The enrichment engine is a game changer. We now have data-driven profiles for every creative in our network, updated automatically.',
    author: 'Marcus Webb',
    role: 'Talent Director, Collective Creative',
    stars: 5,
    metric: '10× more profiles enriched',
    initials: 'MW',
    gradient: 'from-violet-600 to-purple-600',
  },
  {
    quote:
      'Finally, a CRM built for how creative teams actually work. The pipeline tracking and relationship maps give us visibility we never had before.',
    author: 'Elena Vasquez',
    role: 'Executive Producer, Frame & Form',
    stars: 5,
    metric: '3× pipeline visibility',
    initials: 'EV',
    gradient: 'from-purple-600 to-pink-600',
  },
];

export default function Customers() {
  return (
    <>
      <PageMeta title="Customers" description="See how creative teams worldwide use Polsya to discover talent and build relationships." path="/customers" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] rounded-full bg-violet-100/30 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Customers</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Trusted by creative teams{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">worldwide</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              See how agencies, brands, and production studios use Polsya to transform their creative workflows.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Customer logos */}
      <CustomerLogos />

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4 text-center">Testimonials</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
              What our customers say
            </h2>
          </ScrollAnimation>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <ScrollAnimation key={t.author} delay={idx * 0.08}>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{t.metric}</span>
                  </div>
                  <p className="flex-1 text-gray-600 leading-relaxed">"{t.quote}"</p>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Join hundreds of creative teams"
        subtitle="Start your free trial and see why teams choose Polsya."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Request a demo', href: '/contact' }}
      />
    </>
  );
}
