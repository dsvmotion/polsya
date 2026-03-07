import { Link as LinkIcon, Search, Sparkles, GitBranch, BarChart3 } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';

const STEPS = [
  {
    number: 1,
    icon: LinkIcon,
    title: 'Connect your sources',
    description:
      'Link your portfolio platforms, social accounts, and professional networks. Polsya aggregates data from Behance, Dribbble, LinkedIn, Instagram, and dozens more.',
  },
  {
    number: 2,
    icon: Search,
    title: 'Discover creative talent',
    description:
      'Use AI-powered search to find creatives by style, medium, location, availability, or past work. Surface hidden talent that traditional searches miss.',
  },
  {
    number: 3,
    icon: Sparkles,
    title: 'Enrich profiles automatically',
    description:
      'Our enrichment engine analyzes portfolios, extracts style signatures, benchmarks rates, and surfaces social proof — all without manual research.',
  },
  {
    number: 4,
    icon: GitBranch,
    title: 'Build relationship maps',
    description:
      'Visualize connections between creatives, agencies, and brands. Understand who works with whom and identify warm introduction paths.',
  },
  {
    number: 5,
    icon: BarChart3,
    title: 'Track your pipeline',
    description:
      'Manage outreach, track conversations, and move talent through customizable pipeline stages. Get analytics on response rates and engagement.',
  },
] as const;

export default function HowItWorks() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              How it works
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              From connecting your first data source to closing your next creative partnership — here is how Polsya fits into your workflow.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-16">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <ScrollAnimation key={step.number} delay={step.number * 0.05}>
                <div className="flex gap-6">
                  {/* Number badge + icon */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                    {step.number < STEPS.length && (
                      <div className="mt-2 w-px flex-1 bg-gray-200" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-8">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-orange-600" />
                      <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
                    </div>
                    <p className="mt-3 text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>
      </section>

      <CTASection
        headline="See it in action"
        subtitle="Start your free trial and connect your first data source in under two minutes."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Watch demo', href: '/contact' }}
      />
    </>
  );
}
