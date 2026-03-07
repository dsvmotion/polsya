import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Search, Sparkles, GitBranch, Target, BarChart3,
  Star, MapPin, ExternalLink, TrendingUp, Award,
  Filter, ChevronDown, MoreHorizontal,
} from 'lucide-react';

const workflowSteps = [
  { icon: Search, label: 'Discover', color: 'from-indigo-500 to-indigo-600' },
  { icon: Sparkles, label: 'Analyze', color: 'from-violet-500 to-violet-600' },
  { icon: GitBranch, label: 'Map', color: 'from-purple-500 to-purple-600' },
  { icon: Target, label: 'Identify', color: 'from-fuchsia-500 to-fuchsia-600' },
  { icon: BarChart3, label: 'Track', color: 'from-pink-500 to-pink-600' },
];

/* ---------- fake data for the product mock ---------- */
const mockCreatives = [
  { name: 'Sarah Chen', role: 'Art Director', location: 'New York', rating: 4.9, tags: ['Brand Identity', 'Motion'], avatar: 'SC', color: 'bg-indigo-500', status: 'Available', enriched: true },
  { name: 'Marcus Webb', role: 'Creative Director', location: 'London', rating: 4.8, tags: ['Campaign', 'Strategy'], avatar: 'MW', color: 'bg-violet-500', status: 'In Project', enriched: true },
  { name: 'Elena Vasquez', role: '3D Artist', location: 'Barcelona', rating: 4.7, tags: ['CGI', 'Product Viz'], avatar: 'EV', color: 'bg-emerald-500', status: 'Available', enriched: false },
  { name: 'Kai Tanaka', role: 'Motion Designer', location: 'Tokyo', rating: 4.9, tags: ['Animation', 'UI/UX'], avatar: 'KT', color: 'bg-amber-500', status: 'Available', enriched: true },
  { name: 'Ava O\'Brien', role: 'Photographer', location: 'Dublin', rating: 4.6, tags: ['Editorial', 'Fashion'], avatar: 'AO', color: 'bg-pink-500', status: 'In Project', enriched: true },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28 sm:pb-28 px-4 sm:px-6 lg:px-8">
      {/* Background layers */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[900px] h-[600px] rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="absolute top-20 right-0 -z-10 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[300px] rounded-full bg-cyan-50/30 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        {/* Text content */}
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Creative Intelligence Platform
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08]">
              Discover creative talent{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                with intelligent data
              </span>
            </h1>
            <p className="mt-7 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
              Polsya maps portfolios, relationships, and opportunities across the creative
              industry — so you find the right collaborators before anyone else.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/50 px-8 text-base hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-200 hover:-translate-y-0.5">
              <Link to="/signup">Start free trial →</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 text-base border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </motion.div>
        </div>

        {/* Workflow Steps — visual pipeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-14">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-0 sm:gap-0">
              {workflowSteps.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-2 group">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">{step.label}</span>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div className="w-8 sm:w-16 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 mx-1 sm:mx-2 mt-[-20px]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Rich Product Preview */}
        <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-14 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100/40 via-violet-100/40 to-purple-100/40 rounded-3xl blur-2xl" />

          <div className="relative rounded-2xl border border-gray-200/80 shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 rounded-lg bg-gray-100/80 max-w-xs mx-auto flex items-center justify-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-[10px] text-gray-400 font-mono">app.polsya.com/creatives</span>
                </div>
              </div>
            </div>

            {/* Product UI */}
            <div className="bg-gradient-to-br from-gray-50 to-white">
              <div className="flex min-h-[420px] sm:min-h-[480px]">
                {/* Sidebar */}
                <div className="hidden sm:flex w-48 bg-gray-900 flex-col p-3 shrink-0">
                  <div className="flex items-center gap-2 px-2 mb-5">
                    <img src="/polsya-logo-white.png" alt="" className="h-5 w-auto opacity-90" />
                    <span className="text-white/80 text-xs font-semibold tracking-wide">Polsya</span>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { label: 'Dashboard', active: false },
                      { label: 'Creatives', active: true },
                      { label: 'Portfolios', active: false },
                      { label: 'Opportunities', active: false },
                      { label: 'Pipeline', active: false },
                      { label: 'Enrichment', active: false },
                      { label: 'Reports', active: false },
                    ].map((item) => (
                      <div key={item.label} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${item.active ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white/60'}`}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-[8px] font-bold text-white">D</div>
                      <span className="text-white/50 text-[10px]">Diego&apos;s Team</span>
                    </div>
                  </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-hidden">
                  {/* Top bar with search and filters */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-3">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">Search creatives, portfolios, signals...</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-3">
                      <Filter className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Filters</span>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="hidden sm:flex items-center gap-1 h-9 rounded-xl bg-white border border-gray-200 shadow-sm px-2">
                      <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center">
                        <BarChart3 className="h-3 w-3 text-indigo-500" />
                      </div>
                      <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center">
                        <MoreHorizontal className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Metric cards row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: 'Total Creatives', value: '2,847', trend: '+12%', icon: TrendingUp, accent: 'text-indigo-600 bg-indigo-50' },
                      { label: 'Enriched', value: '1,924', trend: '68%', icon: Sparkles, accent: 'text-violet-600 bg-violet-50' },
                      { label: 'Pipeline Value', value: '$1.2M', trend: '+8%', icon: Target, accent: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Win Rate', value: '67%', trend: '+3pp', icon: Award, accent: 'text-amber-600 bg-amber-50' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-white border border-gray-100 shadow-sm p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-6 h-6 rounded-lg ${m.accent} flex items-center justify-center`}>
                            <m.icon className="h-3 w-3" />
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{m.trend}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 leading-none">{m.value}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Data table */}
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">All Creatives</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">2,847</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">Sort by</span>
                        <span className="text-[10px] font-medium text-gray-600">Rating</span>
                        <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                      </div>
                    </div>

                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100">
                      <div className="col-span-3 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Creative</div>
                      <div className="col-span-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">Location</div>
                      <div className="col-span-3 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Tags</div>
                      <div className="col-span-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">Rating</div>
                      <div className="col-span-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
                      <div className="col-span-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider" />
                    </div>

                    {/* Table rows */}
                    {mockCreatives.map((creative) => (
                      <div key={creative.name} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors group">
                        <div className="col-span-3 flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${creative.color} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                            {creative.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1">
                              {creative.name}
                              {creative.enriched && <Sparkles className="h-2.5 w-2.5 text-indigo-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">{creative.role}</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 hidden sm:flex">
                          <MapPin className="h-2.5 w-2.5 text-gray-300" />
                          <span className="text-[10px] text-gray-500">{creative.location}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-1 flex-wrap">
                          {creative.tags.map((tag) => (
                            <span key={tag} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                          ))}
                        </div>
                        <div className="col-span-1 flex items-center gap-0.5 hidden sm:flex">
                          <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-semibold text-gray-700">{creative.rating}</span>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${creative.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {creative.status}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating annotation badges */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="absolute -right-4 top-32 bg-white rounded-xl border border-gray-200 shadow-lg px-3 py-2 max-w-[180px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                <span className="text-[10px] font-semibold text-gray-900">AI Enrichment</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">Auto-enriches profiles from 50+ data sources</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="absolute -left-4 bottom-40 bg-white rounded-xl border border-gray-200 shadow-lg px-3 py-2 max-w-[180px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <GitBranch className="h-3 w-3 text-violet-500" />
                <span className="text-[10px] font-semibold text-gray-900">Relationship Graph</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">Map connections between creatives &amp; brands</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
