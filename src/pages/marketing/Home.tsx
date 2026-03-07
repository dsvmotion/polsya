import {
  Search, Sparkles, GitBranch, Zap, ArrowRight,
  Star, MapPin, Award, Clock, Globe,
  Mail, Phone, Eye, CheckCircle2, Network,
  Database, Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSection } from '@/components/marketing/HeroSection';
import { UseCaseGrid } from '@/components/marketing/UseCaseGrid';
import { CustomerLogos } from '@/components/marketing/CustomerLogos';
import { TestimonialCarousel } from '@/components/marketing/TestimonialCarousel';
import { CTASection } from '@/components/marketing/CTASection';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { PageMeta } from '@/components/marketing/PageMeta';

/* ─── Pillar 1: Discover — mock data ─── */
const discoverResults = [
  { name: 'Sarah Chen', role: 'Art Director', location: 'New York', avatar: 'SC', color: 'bg-indigo-500', match: '98%' },
  { name: 'Marcus Webb', role: 'Creative Director', location: 'London', avatar: 'MW', color: 'bg-violet-500', match: '94%' },
  { name: 'Elena Vasquez', role: '3D Artist', location: 'Barcelona', avatar: 'EV', color: 'bg-emerald-500', match: '91%' },
];

/* ─── Pillar 2: Enrich — profile mock data ─── */
const profileMockData = {
  name: 'Sarah Chen',
  role: 'Art Director',
  location: 'New York, NY',
  avatar: 'SC',
  rating: 4.9,
  enrichedSources: 12,
  awards: ['Red Dot 2024', 'D&AD Pencil', 'Awwwards SOTD'],
  skills: ['Brand Identity', 'Motion Graphics', 'Art Direction', 'Typography'],
  socialMetrics: { followers: '24.3K', engagement: '8.2%', projects: 142 },
  portfolio: [
    { title: 'Nike Brand Campaign', type: 'Brand Identity', year: '2024' },
    { title: 'Spotify Wrapped', type: 'Motion Design', year: '2023' },
    { title: 'Apple Store Visuals', type: 'Art Direction', year: '2023' },
  ],
};

export default function Home() {
  return (
    <>
      <PageMeta title="Creative Intelligence Platform" description="Discover creative talent, analyze portfolios, map relationships, and surface opportunities — all in one intelligent platform." path="/" />

      {/* ═══ HERO ═══ */}
      <HeroSection />

      {/* ═══ TRUSTED BY ═══ */}
      <CustomerLogos />

      {/* ═══ SECTION: How It Works (Workflow) ═══ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gray-900" />
        <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <ScrollAnimation>
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">How It Works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              From raw data to actionable intelligence
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Four steps that transform scattered creative data into your competitive advantage.
            </p>

            {/* Workflow steps — horizontal on desktop */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { icon: Search, title: 'Discover', desc: 'Search millions of creative profiles with intelligent filters', num: '01', gradient: 'from-indigo-500 to-indigo-600' },
                { icon: Sparkles, title: 'Enrich', desc: 'Auto-pull portfolios, awards, and social signals from 50+ sources', num: '02', gradient: 'from-violet-500 to-violet-600' },
                { icon: GitBranch, title: 'Connect', desc: 'Map relationships between creatives, brands, and agencies', num: '03', gradient: 'from-purple-500 to-purple-600' },
                { icon: Zap, title: 'Act', desc: 'Prioritize opportunities and manage your pipeline end-to-end', num: '04', gradient: 'from-fuchsia-500 to-fuchsia-600' },
              ].map((step, i) => (
                <ScrollAnimation key={step.title} delay={i * 0.1}>
                  <div className="relative group">
                    <div className="text-left p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                          <step.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white/30">{step.num}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                    </div>
                    {/* Connector line */}
                    {i < 3 && (
                      <div className="hidden sm:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                    )}
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* ═══ PILLAR 1: Discover — with product UI fragment ═══ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Text */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 mb-5">
                  <Search className="h-3.5 w-3.5" />
                  Discover
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Find the perfect creative in seconds</h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">Intelligent search across 2.8M+ profiles with style matching, geographic filters, availability signals, and rate benchmarks.</p>
                <div className="mt-6 space-y-3">
                  {['AI-powered semantic search across portfolios', 'Filter by style, medium, budget, and availability', 'Smart match scoring based on past project success'].map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-sm text-gray-600">{point}</span>
                    </div>
                  ))}
                </div>
                <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Product UI fragment: Search results */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-xl overflow-hidden">
                  {/* Search bar */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-3">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-900 font-medium">art director brand identity motion</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Filter className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">NYC</span>
                        <span className="text-[10px] text-violet-600 font-medium bg-violet-50 px-1.5 py-0.5 rounded">Available</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      <span>2,847 results</span>
                      <span>•</span>
                      <span>Sorted by match score</span>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="divide-y divide-gray-50">
                    {discoverResults.map((r) => (
                      <div key={r.name} className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/30 transition-colors">
                        <div className={`w-9 h-9 rounded-full ${r.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {r.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            {r.name}
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span>{r.role}</span>
                            <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{r.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-indigo-600">{r.match}</div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider">Match</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ═══ PILLAR 2: Enrich — with profile card ═══ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              {/* Text */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 mb-5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Enrich
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Understand every creative at a glance</h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">AI-powered enrichment pulls from 50+ intelligence sources to turn scattered portfolio data into structured profiles with style classification, rate benchmarks, and availability signals.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { icon: Database, label: 'Auto-Enrichment', value: '50+ sources' },
                    { icon: Award, label: 'Award Tracking', value: 'Real-time' },
                    { icon: Globe, label: 'Global Coverage', value: '190+ countries' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <stat.icon className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                      <div className="text-sm font-bold text-gray-900">{stat.value}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors group">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Product UI fragment: Profile card */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm backdrop-blur-sm border border-white/30">
                        {profileMockData.avatar}
                      </div>
                      <div>
                        <div className="text-white font-semibold flex items-center gap-1.5">
                          {profileMockData.name}
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        </div>
                        <div className="text-violet-200 text-xs">{profileMockData.role}</div>
                      </div>
                      <div className="ml-auto flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 backdrop-blur-sm">
                        <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
                        <span className="text-white text-xs font-semibold">{profileMockData.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profileMockData.location}</span>
                      <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-violet-400" />{profileMockData.enrichedSources} sources</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Available</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileMockData.skills.map((skill) => (
                        <span key={skill} className="text-[10px] font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md">{skill}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <div className="flex gap-1.5">
                        {profileMockData.awards.map((award) => (
                          <span key={award} className="text-[9px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{award}</span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{profileMockData.socialMetrics.followers}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">Followers</div>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <div className="text-sm font-bold text-gray-900">{profileMockData.socialMetrics.engagement}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{profileMockData.socialMetrics.projects}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">Projects</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recent Work</div>
                      {profileMockData.portfolio.map((item) => (
                        <div key={item.title} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                              <Eye className="h-3.5 w-3.5 text-violet-500" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{item.title}</div>
                              <div className="text-[10px] text-gray-400">{item.type}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400">{item.year}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" className="flex-1 text-[11px] font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2 rounded-lg">
                        <Mail className="h-3 w-3 inline mr-1" />Contact
                      </button>
                      <button type="button" className="flex-1 text-[11px] font-semibold border border-gray-200 text-gray-700 py-2 rounded-lg">
                        <Phone className="h-3 w-3 inline mr-1" />Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ═══ PILLAR 3: Connect — Relationship Graph ═══ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white,hsl(245_30%_97%))]" />
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Text */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 mb-5">
                  <Network className="h-3.5 w-3.5" />
                  Connect
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Map the creative ecosystem</h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">Visualize connections between creatives, agencies, and brands. Discover warm introduction paths and hidden collaboration opportunities.</p>
                <div className="mt-6 space-y-3">
                  {['Auto-discover collaboration history', 'Find warm introduction paths to any creative', 'Track agency-brand relationships across campaigns'].map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="text-sm text-gray-600">{point}</span>
                    </div>
                  ))}
                </div>
                <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors group">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Product UI fragment: Relationship Graph */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                      <span className="text-xs font-semibold text-gray-700">Relationship Map</span>
                      <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">Live</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>248 connections</span>
                      <span>14 clusters</span>
                    </div>
                  </div>
                  <div className="p-5 relative min-h-[300px]">
                    <svg className="w-full h-[260px]" viewBox="0 0 400 260">
                      <line x1="200" y1="130" x2="80" y2="55" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="200" y1="130" x2="320" y2="70" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="200" y1="130" x2="140" y2="215" stroke="#a78bfa" strokeWidth="2" />
                      <line x1="80" y1="55" x2="320" y2="70" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
                      <line x1="320" y1="70" x2="350" y2="190" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="4 4" />
                      <line x1="80" y1="55" x2="60" y2="170" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="4 4" />

                      <circle cx="200" cy="130" r="26" fill="url(#graphGrad)" />
                      <text x="200" y="126" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">SC</text>
                      <text x="200" y="138" textAnchor="middle" fill="white" fontSize="6" opacity="0.8">Art Director</text>

                      <circle cx="80" cy="55" r="20" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="2" />
                      <text x="80" y="52" textAnchor="middle" fill="#6d28d9" fontSize="7" fontWeight="700">W+K</text>
                      <text x="80" y="62" textAnchor="middle" fill="#8b5cf6" fontSize="5">Agency</text>

                      <circle cx="320" cy="70" r="20" fill="#818cf8" />
                      <text x="320" y="67" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">MW</text>
                      <text x="320" y="77" textAnchor="middle" fill="white" fontSize="5" opacity="0.8">Creative Dir</text>

                      <circle cx="140" cy="215" r="18" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="2" />
                      <text x="140" y="212" textAnchor="middle" fill="#6d28d9" fontSize="7" fontWeight="700">R/GA</text>
                      <text x="140" y="222" textAnchor="middle" fill="#8b5cf6" fontSize="5">Agency</text>

                      <circle cx="60" cy="170" r="16" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="60" y="168" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="600">Nike</text>
                      <text x="60" y="178" textAnchor="middle" fill="#94a3b8" fontSize="5">Brand</text>

                      <circle cx="350" cy="190" r="16" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="350" y="188" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="600">Google</text>
                      <text x="350" y="198" textAnchor="middle" fill="#94a3b8" fontSize="5">Brand</text>

                      <defs>
                        <linearGradient id="graphGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="flex items-center justify-center gap-4 mt-1 text-[10px]">
                      <span className="flex items-center gap-1 text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Sarah Chen → W+K
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Sarah Chen → Marcus Webb
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Marcus Webb → R/GA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <UseCaseGrid />

      {/* ═══ TESTIMONIALS ═══ */}
      <TestimonialCarousel />

      {/* ═══ FINAL CTA ═══ */}
      <CTASection
        headline="Start discovering creative talent today"
        subtitle="Free 7-day trial. No credit card required."
        primaryCta={{ label: 'Start free trial →', href: '/signup' }}
        secondaryCta={{ label: 'Request a demo →', href: '/contact' }}
      />
    </>
  );
}
