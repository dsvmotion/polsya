import { Search, Sparkles, GitBranch, Zap } from 'lucide-react';
import { HeroSection } from '@/components/marketing/HeroSection';
import { IntelligenceSources } from '@/components/marketing/IntelligenceSources';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { UseCaseGrid } from '@/components/marketing/UseCaseGrid';
import { CustomerLogos } from '@/components/marketing/CustomerLogos';
import { SecurityBadges } from '@/components/marketing/SecurityBadges';
import { TestimonialCarousel } from '@/components/marketing/TestimonialCarousel';
import { CTASection } from '@/components/marketing/CTASection';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';

const capabilities = [
  { icon: Search, title: 'Discover', description: 'Find designers, studios, and agencies with intelligent search, filters, and geographic mapping.' },
  { icon: Sparkles, title: 'Enrich', description: 'Automatically pull portfolio work, awards, social presence, and style signals from 50+ sources.' },
  { icon: GitBranch, title: 'Connect', description: 'Map relationships between creatives, brands, and projects to uncover hidden networks.' },
  { icon: Zap, title: 'Act', description: 'Prioritize opportunities, automate outreach, and track your entire pipeline in one place.' },
];

export default function Home() {
  return (
    <>
      <HeroSection />
      <IntelligenceSources />
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <ScrollAnimation>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Four pillars of creative intelligence
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              From discovery to action — everything you need in one platform.
            </p>
          </div>
        </ScrollAnimation>
        <div className="mt-12 mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          {capabilities.map((cap, i) => (
            <FeatureCard key={cap.title} {...cap} delay={i * 0.1} />
          ))}
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <ScrollAnimation>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">See it in action</h2>
            <p className="mt-4 text-lg text-gray-600">Discover → Enrich → Analyze → Connect → Pipeline</p>
            <div className="mt-12 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="aspect-[16/9] flex items-center justify-center text-gray-400 text-sm">Product workflow demo placeholder</div>
            </div>
          </div>
        </ScrollAnimation>
      </section>
      <UseCaseGrid />
      <CustomerLogos />
      <SecurityBadges />
      <TestimonialCarousel />
      <CTASection
        headline="Start discovering creative talent today"
        subtitle="Free 7-day trial. No credit card required."
        primaryCta={{ label: 'Start free trial →', href: '/signup' }}
        secondaryCta={{ label: 'Request a demo →', href: '/contact' }}
      />
    </>
  );
}
