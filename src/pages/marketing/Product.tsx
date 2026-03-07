import { Link } from 'react-router-dom';
import { Search, Sparkles, GitBranch, Zap, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const CAPABILITIES = [
  {
    icon: Search,
    title: 'Discover',
    description:
      'Surface creative talent across portfolio platforms, award databases, and social channels. Our AI-powered search indexes millions of creative profiles so you can find the perfect match for any brief.',
    bullets: ['Cross-platform search', 'AI-powered matching', 'Award-winning talent filters'],
    gradient: 'from-indigo-600 to-blue-600',
    accentBg: 'bg-indigo-50',
  },
  {
    icon: Sparkles,
    title: 'Enrich',
    description:
      'Automatically enrich profiles with portfolio analysis, style classification, availability signals, and rate benchmarks. Turn raw data into actionable creative intelligence.',
    bullets: ['Portfolio analysis', 'Style classification', 'Rate benchmarks'],
    gradient: 'from-violet-600 to-purple-600',
    accentBg: 'bg-violet-50',
  },
  {
    icon: GitBranch,
    title: 'Pipeline',
    description:
      'Build and manage your creative pipeline with customizable stages, automated follow-ups, and team collaboration. Never lose track of a relationship again.',
    bullets: ['Custom pipeline stages', 'Automated follow-ups', 'Team collaboration'],
    gradient: 'from-purple-600 to-pink-600',
    accentBg: 'bg-purple-50',
  },
  {
    icon: Zap,
    title: 'Analytics',
    description:
      'Gain insights into your creative network with real-time dashboards, trend analysis, and predictive signals. Make data-driven decisions about talent partnerships.',
    bullets: ['Real-time dashboards', 'Trend analysis', 'Predictive signals'],
    gradient: 'from-emerald-600 to-teal-600',
    accentBg: 'bg-emerald-50',
  },
  {
    icon: MessagesSquare,
    title: 'Communication',
    description:
      'Manage all creative outreach from one inbox. Track emails, schedule meetings, and maintain conversation history across your entire team.',
    bullets: ['Unified inbox', 'Meeting scheduling', 'Conversation history'],
    gradient: 'from-cyan-600 to-blue-600',
    accentBg: 'bg-cyan-50',
  },
] as const;

export default function Product() {
  return (
    <>
      <PageMeta title="Product" description="Explore Polsya's creative intelligence capabilities — discover, enrich, pipeline, analytics, and communication tools." path="/product" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] rounded-full bg-indigo-100/30 blur-3xl" />
        <div className="mx-auto max-w-4xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Product</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              The creative intelligence{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">platform</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
              Discover, enrich, and manage creative talent relationships with a single platform built for modern creative teams.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/50 px-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <Link to="/signup">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
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
          <section key={cap.title} id={cap.title.toLowerCase()} className={`py-24 px-4 sm:px-6 lg:px-8 ${isEven ? '' : 'relative overflow-hidden'}`}>
            {!isEven && <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />}
            <div className="mx-auto max-w-6xl">
              <ScrollAnimation>
                <div className={`flex flex-col lg:flex-row items-center gap-12 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Text */}
                  <div className="flex-1">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${cap.accentBg} mb-4`}>
                      <Icon className={`h-6 w-6 bg-gradient-to-r ${cap.gradient} bg-clip-text`} style={{ color: idx === 0 ? '#4f46e5' : idx === 1 ? '#7c3aed' : idx === 2 ? '#9333ea' : idx === 3 ? '#059669' : '#0891b2' }} />
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{cap.title}</h2>
                    <p className="mt-4 text-gray-500 leading-relaxed">{cap.description}</p>
                    <ul className="mt-6 space-y-2.5">
                      {cap.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                          <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${cap.gradient}`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Image placeholder with improved styling */}
                  <div className="flex-1 w-full">
                    <div className="aspect-video rounded-2xl border border-gray-200/60 bg-white shadow-lg overflow-hidden">
                      <div className="h-full flex flex-col">
                        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cap.gradient}`} />
                          <span className="text-xs text-gray-400 font-medium">{cap.title}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-6">
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${cap.accentBg} mb-3`}>
                              <Icon className="h-8 w-8" style={{ color: idx === 0 ? '#4f46e5' : idx === 1 ? '#7c3aed' : idx === 2 ? '#9333ea' : idx === 3 ? '#059669' : '#0891b2' }} />
                            </div>
                            <div className="space-y-1.5">
                              {[60, 80, 45].map((w, j) => (
                                <div key={j} className="h-2 rounded-full bg-gray-100 mx-auto" style={{ width: `${w}%`, maxWidth: '160px' }} />
                              ))}
                            </div>
                          </div>
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

      <CTASection
        headline="Ready to transform your creative workflow?"
        subtitle="Start your free trial today. No credit card required."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Talk to sales', href: '/contact' }}
      />
    </>
  );
}
