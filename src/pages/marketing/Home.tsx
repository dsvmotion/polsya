import { Search, Sparkles, GitBranch, Zap, Users, BarChart3, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSection } from '@/components/marketing/HeroSection';
import { IntelligenceSources } from '@/components/marketing/IntelligenceSources';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { UseCaseGrid } from '@/components/marketing/UseCaseGrid';
import { CustomerLogos } from '@/components/marketing/CustomerLogos';
import { SecurityBadges } from '@/components/marketing/SecurityBadges';
import { TestimonialCarousel } from '@/components/marketing/TestimonialCarousel';
import { CTASection } from '@/components/marketing/CTASection';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { PageMeta } from '@/components/marketing/PageMeta';

const capabilities = [
  { icon: Search, title: 'Discover', description: 'Find designers, studios, and agencies with intelligent search, filters, and geographic mapping.' },
  { icon: Sparkles, title: 'Enrich', description: 'Automatically pull portfolio work, awards, social presence, and style signals from 50+ sources.' },
  { icon: GitBranch, title: 'Connect', description: 'Map relationships between creatives, brands, and projects to uncover hidden networks.' },
  { icon: Zap, title: 'Act', description: 'Prioritize opportunities, automate outreach, and track your entire pipeline in one place.' },
];

const productSections = [
  {
    icon: Users,
    label: 'Portfolio Intelligence',
    title: 'Understand every creative at a glance',
    description: 'AI-powered analysis turns scattered portfolio data into structured creative profiles with style classification, rate benchmarks, and availability signals.',
    gradient: 'from-indigo-600 to-violet-600',
    mockContent: {
      header: 'Creative Profile',
      metrics: [
        { label: 'Style Score', value: '94' },
        { label: 'Awards', value: '12' },
        { label: 'Projects', value: '87' },
      ],
    },
  },
  {
    icon: GitBranch,
    label: 'Relationship Graph',
    title: 'Map the creative ecosystem',
    description: 'Visualize connections between creatives, agencies, and brands. Discover warm introduction paths and hidden collaboration opportunities.',
    gradient: 'from-violet-600 to-purple-600',
    mockContent: {
      header: 'Relationship Map',
      metrics: [
        { label: 'Connections', value: '248' },
        { label: 'Clusters', value: '14' },
        { label: 'Pathways', value: '32' },
      ],
    },
  },
  {
    icon: Layers,
    label: 'Pipeline Management',
    title: 'From discovery to partnership',
    description: 'Build and manage your creative pipeline with customizable stages, automated follow-ups, and team collaboration tools.',
    gradient: 'from-purple-600 to-indigo-600',
    mockContent: {
      header: 'Pipeline',
      metrics: [
        { label: 'Active', value: '34' },
        { label: 'Won', value: '18' },
        { label: 'Value', value: '$1.2M' },
      ],
    },
  },
];

export default function Home() {
  return (
    <>
      <PageMeta title="Creative Intelligence Platform" description="Discover creative talent, analyze portfolios, map relationships, and surface opportunities — all in one intelligent platform." path="/" />
      <HeroSection />

      {/* Customer logos */}
      <CustomerLogos />

      {/* Intelligence Sources */}
      <IntelligenceSources />

      {/* Four Pillars */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <ScrollAnimation>
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Capabilities</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Four pillars of creative intelligence
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From discovery to action — everything you need in one platform.
            </p>
          </div>
        </ScrollAnimation>
        <div className="mt-12 mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          {capabilities.map((cap, i) => (
            <FeatureCard key={cap.title} {...cap} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Product Demonstration Sections */}
      {productSections.map((section, idx) => {
        const isReversed = idx % 2 === 1;
        return (
          <section key={section.label} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {idx % 2 === 0 && <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />}
            <div className="mx-auto max-w-6xl">
              <ScrollAnimation>
                <div className={`flex flex-col lg:flex-row items-center gap-12 ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Text */}
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${section.gradient} mb-5`}>
                      <section.icon className="h-3.5 w-3.5" />
                      {section.label}
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{section.title}</h2>
                    <p className="mt-4 text-lg text-gray-500 leading-relaxed">{section.description}</p>
                    <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group">
                      Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Product mock */}
                  <div className="flex-1 w-full">
                    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${section.gradient}`} />
                        <span className="text-xs font-medium text-gray-500">{section.mockContent.header}</span>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {section.mockContent.metrics.map((m) => (
                            <div key={m.label} className="rounded-xl bg-gray-50 p-3 text-center">
                              <div className="text-xl font-bold text-gray-900">{m.value}</div>
                              <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{m.label}</div>
                            </div>
                          ))}
                        </div>
                        {/* Visual mock rows */}
                        <div className="space-y-2">
                          {[65, 50, 80, 40].map((width, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.gradient} opacity-${20 + i * 15} flex items-center justify-center`}>
                                <div className="w-4 h-4 rounded bg-white/30" />
                              </div>
                              <div className="flex-1">
                                <div className="h-2 rounded bg-gray-100" style={{ width: `${width}%` }} />
                                <div className="h-1.5 rounded bg-gray-50 mt-1" style={{ width: `${width - 20}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        );
      })}

      {/* Use Cases */}
      <UseCaseGrid />

      {/* Security */}
      <SecurityBadges />

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* CTA */}
      <CTASection
        headline="Start discovering creative talent today"
        subtitle="Free 7-day trial. No credit card required."
        primaryCta={{ label: 'Start free trial →', href: '/signup' }}
        secondaryCta={{ label: 'Request a demo →', href: '/contact' }}
      />
    </>
  );
}
