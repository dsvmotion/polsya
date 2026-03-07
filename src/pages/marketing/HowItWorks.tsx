import { Link as LinkIcon, Search, Sparkles, GitBranch, BarChart3 } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const STEPS = [
  {
    number: 1,
    icon: LinkIcon,
    title: 'Connect your sources',
    description:
      'Link your portfolio platforms, social accounts, and professional networks. Polsya aggregates data from Behance, Dribbble, LinkedIn, Instagram, and dozens more.',
    color: 'from-indigo-600 to-blue-600',
  },
  {
    number: 2,
    icon: Search,
    title: 'Discover creative talent',
    description:
      'Use AI-powered search to find creatives by style, medium, location, availability, or past work. Surface hidden talent that traditional searches miss.',
    color: 'from-blue-600 to-violet-600',
  },
  {
    number: 3,
    icon: Sparkles,
    title: 'Enrich profiles automatically',
    description:
      'Our enrichment engine analyzes portfolios, extracts style signatures, benchmarks rates, and surfaces social proof — all without manual research.',
    color: 'from-violet-600 to-purple-600',
  },
  {
    number: 4,
    icon: GitBranch,
    title: 'Build relationship maps',
    description:
      'Visualize connections between creatives, agencies, and brands. Understand who works with whom and identify warm introduction paths.',
    color: 'from-purple-600 to-pink-600',
  },
  {
    number: 5,
    icon: BarChart3,
    title: 'Track your pipeline',
    description:
      'Manage outreach, track conversations, and move talent through customizable pipeline stages. Get analytics on response rates and engagement.',
    color: 'from-pink-600 to-indigo-600',
  },
] as const;

export default function HowItWorks() {
  return (
    <>
      <PageMeta title="How It Works" description="Learn how Polsya connects data sources, discovers creatives, enriches profiles, and surfaces opportunities in 5 simple steps." path="/how-it-works" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[400px] rounded-full bg-indigo-100/30 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">How It Works</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Five steps to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">creative intelligence</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              From connecting your first data source to closing your next creative partnership — here is how Polsya fits into your workflow.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Visual workflow bar */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <ScrollAnimation>
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-7 right-7 h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-purple-200" />
              {STEPS.map((step) => (
                <div key={step.number} className="relative flex flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-white text-sm font-bold shadow-lg shadow-indigo-200/30 z-10`}>
                    {step.number}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500 text-center max-w-[60px] sm:max-w-none">{step.title.split(' ').slice(0, 2).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* Steps */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-0">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <ScrollAnimation key={step.number} delay={step.number * 0.05}>
                <div className="flex gap-6">
                  {/* Number badge + connector line */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white font-bold text-lg shadow-lg shadow-indigo-200/30`}>
                      {step.number}
                    </div>
                    {step.number < STEPS.length && (
                      <div className="mt-2 w-px flex-1 bg-gradient-to-b from-indigo-200 to-transparent" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-12">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-indigo-600" />
                      <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
                    </div>
                    <p className="mt-3 text-gray-500 leading-relaxed">{step.description}</p>
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
