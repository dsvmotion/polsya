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
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-gray-900">{q}</span>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Pricing() {
  return (
    <>
      <PageMeta title="Pricing" description="Simple, transparent pricing for creative intelligence. Start free, scale as you grow." path="/pricing" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg text-gray-600">
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
                className={`relative rounded-2xl border p-8 h-full flex flex-col ${
                  plan.featured
                    ? 'border-orange-300 shadow-lg ring-1 ring-orange-200'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.featured && 'badge' in plan && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1 text-xs font-bold text-white">
                    {plan.badge}
                  </span>
                )}
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500">{plan.period}</span>}
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.ctaVariant === 'gradient' ? (
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                      <Link to={plan.ctaHref}>{plan.ctaLabel}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline" className="w-full">
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
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Frequently asked questions
            </h2>
          </ScrollAnimation>
          <div className="divide-y divide-gray-200 border-t border-gray-200">
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
