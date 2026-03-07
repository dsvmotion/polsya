import {
  Search, Sparkles, GitBranch, Zap, Users, Layers, ArrowRight,
  Star, MapPin, Award, TrendingUp, BarChart3, Clock, Globe,
  Mail, Phone, Building2, Eye, CheckCircle2,
} from 'lucide-react';
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

/* ─── Rich mock data for product demo sections ─── */
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

const graphMockConnections = [
  { from: 'Sarah Chen', to: 'Wieden+Kennedy', type: 'Freelance' },
  { from: 'Sarah Chen', to: 'Marcus Webb', type: 'Collaborator' },
  { from: 'Marcus Webb', to: 'R/GA', type: 'Staff' },
  { from: 'Wieden+Kennedy', to: 'Nike', type: 'Agency' },
  { from: 'R/GA', to: 'Google', type: 'Agency' },
];

const pipelineStages = [
  { stage: 'Discovered', count: 48, color: 'bg-gray-200' },
  { stage: 'Contacted', count: 22, color: 'bg-indigo-200' },
  { stage: 'Responded', count: 15, color: 'bg-violet-300' },
  { stage: 'Evaluating', count: 8, color: 'bg-purple-400' },
  { stage: 'Engaged', count: 5, color: 'bg-indigo-500 text-white' },
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

      {/* ═══ PRODUCT DEMO 1: Portfolio Intelligence ═══ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Text */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 mb-5">
                  <Users className="h-3.5 w-3.5" />
                  Portfolio Intelligence
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Understand every creative at a glance</h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">AI-powered analysis turns scattered portfolio data into structured creative profiles with style classification, rate benchmarks, and availability signals.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { icon: Sparkles, label: 'Auto-Enrichment', value: '50+ sources' },
                    { icon: Award, label: 'Award Tracking', value: 'Real-time' },
                    { icon: Globe, label: 'Global Coverage', value: '190+ countries' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <stat.icon className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
                      <div className="text-sm font-bold text-gray-900">{stat.value}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Rich product mock: Creative Profile Card */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-xl overflow-hidden">
                  {/* Profile header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm backdrop-blur-sm border border-white/30">
                        {profileMockData.avatar}
                      </div>
                      <div>
                        <div className="text-white font-semibold flex items-center gap-1.5">
                          {profileMockData.name}
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        </div>
                        <div className="text-indigo-200 text-xs">{profileMockData.role}</div>
                      </div>
                      <div className="ml-auto flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 backdrop-blur-sm">
                        <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
                        <span className="text-white text-xs font-semibold">{profileMockData.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Quick info bar */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profileMockData.location}</span>
                      <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-indigo-400" />{profileMockData.enrichedSources} sources</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Available</span>
                    </div>

                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {profileMockData.skills.map((skill) => (
                        <span key={skill} className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{skill}</span>
                      ))}
                    </div>

                    {/* Awards */}
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <div className="flex gap-1.5">
                        {profileMockData.awards.map((award) => (
                          <span key={award} className="text-[9px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{award}</span>
                        ))}
                      </div>
                    </div>

                    {/* Social metrics */}
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

                    {/* Recent portfolio items */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recent Work</div>
                      {profileMockData.portfolio.map((item) => (
                        <div key={item.title} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                              <Eye className="h-3.5 w-3.5 text-indigo-500" />
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

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button type="button" className="flex-1 text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2 rounded-lg">
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

      {/* ═══ PRODUCT DEMO 2: Relationship Graph ═══ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              {/* Text */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 mb-5">
                  <GitBranch className="h-3.5 w-3.5" />
                  Relationship Graph
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Map the creative ecosystem</h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">Visualize connections between creatives, agencies, and brands. Discover warm introduction paths and hidden collaboration opportunities.</p>
                <div className="mt-6 space-y-3">
                  {['Auto-discover collaboration history', 'Find warm introduction paths to any creative', 'Track agency-brand relationships across campaigns'].map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                      <span className="text-sm text-gray-600">{point}</span>
                    </div>
                  ))}
                </div>
                <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors group">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Rich product mock: Relationship Graph */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
                      <span className="text-xs font-semibold text-gray-700">Relationship Map</span>
                      <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">Live</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>248 connections</span>
                      <span>14 clusters</span>
                    </div>
                  </div>

                  <div className="p-5 relative min-h-[320px]">
                    {/* SVG relationship graph visualization */}
                    <svg className="w-full h-[280px]" viewBox="0 0 400 280">
                      {/* Connection lines */}
                      <line x1="200" y1="140" x2="80" y2="60" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="200" y1="140" x2="320" y2="80" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="200" y1="140" x2="140" y2="230" stroke="#a78bfa" strokeWidth="2" />
                      <line x1="80" y1="60" x2="320" y2="80" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
                      <line x1="320" y1="80" x2="350" y2="200" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="4 4" />
                      <line x1="80" y1="60" x2="60" y2="180" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="4 4" />

                      {/* Center node: Sarah Chen */}
                      <circle cx="200" cy="140" r="28" fill="url(#grad1)" />
                      <text x="200" y="136" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">SC</text>
                      <text x="200" y="148" textAnchor="middle" fill="white" fontSize="6" opacity="0.8">Art Director</text>

                      {/* W+K node */}
                      <circle cx="80" cy="60" r="22" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="2" />
                      <text x="80" y="57" textAnchor="middle" fill="#6d28d9" fontSize="7" fontWeight="700">W+K</text>
                      <text x="80" y="67" textAnchor="middle" fill="#8b5cf6" fontSize="5">Agency</text>

                      {/* Marcus Webb node */}
                      <circle cx="320" cy="80" r="22" fill="#818cf8" />
                      <text x="320" y="77" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">MW</text>
                      <text x="320" y="87" textAnchor="middle" fill="white" fontSize="5" opacity="0.8">Creative Dir</text>

                      {/* R/GA node */}
                      <circle cx="140" cy="230" r="20" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="2" />
                      <text x="140" y="227" textAnchor="middle" fill="#6d28d9" fontSize="7" fontWeight="700">R/GA</text>
                      <text x="140" y="237" textAnchor="middle" fill="#8b5cf6" fontSize="5">Agency</text>

                      {/* Nike node */}
                      <circle cx="60" cy="180" r="18" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="60" y="178" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="600">Nike</text>
                      <text x="60" y="188" textAnchor="middle" fill="#94a3b8" fontSize="5">Brand</text>

                      {/* Google node */}
                      <circle cx="350" cy="200" r="18" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="350" y="198" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="600">Google</text>
                      <text x="350" y="208" textAnchor="middle" fill="#94a3b8" fontSize="5">Brand</text>

                      <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Connection legend */}
                    <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
                      {graphMockConnections.slice(0, 3).map((conn) => (
                        <span key={`${conn.from}-${conn.to}`} className="flex items-center gap-1 text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          {conn.from} → {conn.to}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* ═══ PRODUCT DEMO 3: Pipeline Management ═══ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
        <div className="mx-auto max-w-6xl">
          <ScrollAnimation>
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Text */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 mb-5">
                  <Layers className="h-3.5 w-3.5" />
                  Pipeline Management
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">From discovery to partnership</h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">Build and manage your creative pipeline with customizable stages, automated follow-ups, and team collaboration tools.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { icon: TrendingUp, value: '67%', label: 'Win Rate' },
                    { icon: BarChart3, value: '$1.2M', label: 'Pipeline Value' },
                    { icon: Building2, value: '142', label: 'Active Contacts' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <stat.icon className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                      <div className="text-sm font-bold text-gray-900">{stat.value}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Link to="/product" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors group">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Rich product mock: Pipeline kanban */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                      <span className="text-xs font-semibold text-gray-700">Pipeline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">+8% this month</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Pipeline funnel visualization */}
                    <div className="space-y-2 mb-5">
                      {pipelineStages.map((s) => (
                        <div key={s.stage} className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-gray-500 w-20 text-right">{s.stage}</span>
                          <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full ${s.color} rounded-lg flex items-center px-2 transition-all duration-500`}
                              style={{ width: `${(s.count / 48) * 100}%` }}
                            >
                              <span className={`text-[10px] font-bold ${s.color.includes('text-white') ? 'text-white' : 'text-gray-600'}`}>{s.count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mini kanban cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: 'Elena V.', avatar: 'EV', color: 'bg-emerald-500', stage: 'Evaluating', value: '$18K' },
                        { name: 'Kai T.', avatar: 'KT', color: 'bg-amber-500', stage: 'Contacted', value: '$12K' },
                        { name: 'Ava O.', avatar: 'AO', color: 'bg-pink-500', stage: 'Responded', value: '$24K' },
                      ].map((card) => (
                        <div key={card.name} className="rounded-xl border border-gray-100 p-2.5 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className={`w-5 h-5 rounded-full ${card.color} flex items-center justify-center text-[7px] font-bold text-white`}>{card.avatar}</div>
                            <span className="text-[10px] font-semibold text-gray-900 truncate">{card.name}</span>
                          </div>
                          <div className="text-[9px] text-gray-400">{card.stage}</div>
                          <div className="text-xs font-bold text-gray-900 mt-1">{card.value}</div>
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
