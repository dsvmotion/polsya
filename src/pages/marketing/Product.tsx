import { Link } from 'react-router-dom';
import { Search, Sparkles, GitBranch, Zap, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';

const CAPABILITIES = [
  {
    icon: Search,
    title: 'Discover',
    description:
      'Surface creative talent across portfolio platforms, award databases, and social channels. Our AI-powered search indexes millions of creative profiles so you can find the perfect match for any brief.',
    bullets: ['Cross-platform search', 'AI-powered matching', 'Award-winning talent filters'],
  },
  {
    icon: Sparkles,
    title: 'Enrich',
    description:
      'Automatically enrich profiles with portfolio analysis, style classification, availability signals, and rate benchmarks. Turn raw data into actionable creative intelligence.',
    bullets: ['Portfolio analysis', 'Style classification', 'Rate benchmarks'],
  },
  {
    icon: GitBranch,
    title: 'Pipeline',
    description:
      'Build and manage your creative pipeline with customizable stages, automated follow-ups, and team collaboration. Never lose track of a relationship again.',
    bullets: ['Custom pipeline stages', 'Automated follow-ups', 'Team collaboration'],
  },
  {
    icon: Zap,
    title: 'Analytics',
    description:
      'Gain insights into your creative network with real-time dashboards, trend analysis, and predictive signals. Make data-driven decisions about talent partnerships.',
    bullets: ['Real-time dashboards', 'Trend analysis', 'Predictive signals'],
  },
  {
    icon: MessagesSquare,
    title: 'Communication',
    description:
      'Manage all creative outreach from one inbox. Track emails, schedule meetings, and maintain conversation history across your entire team.',
    bullets: ['Unified inbox', 'Meeting scheduling', 'Conversation history'],
  },
] as const;

export default function Product() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              The creative intelligence platform
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Discover, enrich, and manage creative talent relationships with a single platform built for modern creative teams.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-8">
                <Link to="/signup">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Request a demo</Link>
              </Button>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Capability deep-dives */}
      {CAPABILITIES.map((cap, idx) => {
        const Icon = cap.icon;
        const isEven = idx % 2 === 1;
        return (
          <section key={cap.title} className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <ScrollAnimation>
                <div className={`flex flex-col lg:flex-row items-center gap-12 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Text */}
                  <div className="flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 mb-4">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{cap.title}</h2>
                    <p className="mt-4 text-gray-600 leading-relaxed">{cap.description}</p>
                    <ul className="mt-6 space-y-2">
                      {cap.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Image placeholder */}
                  <div className="flex-1 w-full">
                    <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Icon className="h-16 w-16 text-gray-300" />
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        );
      })}

      <CTASection
        headline="Ready to transform your creative workflow?"
        subtitle="Start your free trial today. No credit card required."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Talk to sales', href: '/contact' }}
      />
    </>
  );
}
