import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const PLANS = [
  {
    name: 'Starter',
    price: '\u20ac29',
    period: '/mo',
    featured: false,
    features: [
      '500 profiles',
      '5 enrichments/day',
      '1 seat',
      'Basic search',
      'Email support',
    ],
    ctaLabel: 'Start free trial',
    ctaHref: '/signup?plan=starter',
    ctaVariant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: '\u20ac79',
    period: '/mo',
    featured: true,
    badge: 'Most popular',
    features: [
      '5,000 profiles',
      '50 enrichments/day',
      '5 seats',
      'Advanced filters',
      'API access',
      'Priority support',
    ],
    ctaLabel: 'Start free trial',
    ctaHref: '/signup?plan=pro',
    ctaVariant: 'gradient' as const,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    featured: false,
    features: [
      'Unlimited profiles',
      'Unlimited enrichments',
      'Unlimited seats',
      'Dedicated CSM',
      'Custom integrations',
      'SSO / SAML',
      'SLA guarantee',
    ],
    ctaLabel: 'Contact sales',
    ctaHref: '/contact?subject=enterprise',
    ctaVariant: 'outline' as const,
  },
] as const;

const FAQS = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Every plan includes a 7-day free trial. No credit card required to get started.',
  },
  {
    q: 'What happens when I exceed my profile limit?',
    a: 'You will receive a notification when you approach your limit. You can upgrade your plan or remove inactive profiles to stay within your quota.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes. Annual billing is available with a 20% discount on all plans. Contact us for details on Enterprise annual agreements.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left group"
      >
        <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{q}</span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Pricing() {
  return (
    <>
      <PageMeta title="Pricing" description="Simple, transparent pricing for creative intelligence. Start free, scale as you grow." path="/pricing" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 right-0 -z-10 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Pricing</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">pricing</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              Start free for 7 days. No credit card required. Upgrade when you are ready.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-3">
          {PLANS.map((plan, idx) => (
            <ScrollAnimation key={plan.name} delay={idx * 0.08}>
              <div
                className={`relative rounded-2xl border p-8 h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  plan.featured
                    ? 'border-indigo-200 shadow-lg ring-1 ring-indigo-100 bg-white'
                    : 'border-gray-200/60 shadow-sm bg-white'
                }`}
              >
                {plan.featured && 'badge' in plan && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-md shadow-indigo-200/40">
                    {plan.badge}
                  </span>
                )}
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-400">{plan.period}</span>}
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-indigo-500 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.ctaVariant === 'gradient' ? (
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                      <Link to={plan.ctaHref}>{plan.ctaLabel}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline" className="w-full border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
                      <Link to={plan.ctaHref}>{plan.ctaLabel}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <ScrollAnimation>
            <h2 className="font-display text-2xl font-bold text-gray-900 text-center mb-8">
              Frequently asked questions
            </h2>
          </ScrollAnimation>
          <div className="divide-y divide-gray-200/60 border-t border-gray-200/60">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Start your free trial"
        subtitle="No credit card required. Cancel anytime."
        primaryCta={{ label: 'Get started', href: '/signup' }}
        secondaryCta={{ label: 'Contact sales', href: '/contact' }}
      />
    </>
  );
}
