import { Star } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CustomerLogos } from '@/components/marketing/CustomerLogos';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const TESTIMONIALS = [
  {
    quote:
      'Polsya cut our talent sourcing time in half. We went from spending days manually browsing portfolios to finding the perfect creative match in minutes.',
    author: 'Sarah M.',
    role: 'Head of Production, Creative Agency',
    stars: 5,
  },
  {
    quote:
      'The enrichment engine is a game changer. We now have data-driven profiles for every creative in our network, updated automatically.',
    author: 'James K.',
    role: 'Talent Director, Global Brand',
    stars: 5,
  },
  {
    quote:
      'Finally, a CRM built for how creative teams actually work. The pipeline tracking and relationship maps give us visibility we never had before.',
    author: 'Priya R.',
    role: 'Executive Producer, Production Studio',
    stars: 5,
  },
];

export default function Customers() {
  return (
    <>
      <PageMeta title="Customers" description="See how creative teams worldwide use Polsya to discover talent and build relationships." path="/customers" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Trusted by creative teams worldwide
            </h1>
            <p className="mt-6 text-lg text-gray-600">
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
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
              What our customers say
            </h2>
          </ScrollAnimation>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <ScrollAnimation key={t.author} delay={idx * 0.08}>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="flex-1 text-gray-600 leading-relaxed italic">"{t.quote}"</p>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="font-semibold text-gray-900">{t.author}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies placeholder */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-4xl text-center">
          <ScrollAnimation>
            <h2 className="text-2xl font-bold text-gray-900">Case studies</h2>
            <p className="mt-4 text-gray-600">
              Detailed case studies with metrics and outcomes are coming soon. Want to be featured?
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Reach out to us at hello@polsya.com
            </p>
          </ScrollAnimation>
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
