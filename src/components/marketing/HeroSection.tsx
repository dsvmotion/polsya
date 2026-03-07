import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Search, Sparkles, GitBranch, Target, BarChart3 } from 'lucide-react';

const workflowSteps = [
  { icon: Search, label: 'Discover' },
  { icon: Sparkles, label: 'Enrich' },
  { icon: GitBranch, label: 'Connect' },
  { icon: Target, label: 'Identify' },
  { icon: BarChart3, label: 'Track' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-28 sm:pt-32 sm:pb-36 px-4 sm:px-6 lg:px-8">
      {/* Background layers */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[900px] h-[600px] rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="absolute top-20 right-0 -z-10 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[300px] rounded-full bg-cyan-50/30 blur-3xl" />

      <div className="mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          {/* Badge */}
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

        {/* Workflow Steps */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-14 flex items-center justify-center gap-2 sm:gap-3">
          {workflowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/80 border border-gray-200/60 shadow-sm backdrop-blur-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group">
                <step.icon className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{step.label}</span>
              </div>
              {i < workflowSteps.length - 1 && (
                <svg className="h-4 w-4 text-gray-300 shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </motion.div>

        {/* Product Preview */}
        <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-16 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100/40 via-violet-100/40 to-purple-100/40 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl border border-gray-200/80 shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
            {/* Mock browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 rounded-md bg-gray-100 max-w-xs mx-auto flex items-center justify-center">
                  <span className="text-[10px] text-gray-400 font-mono">app.polsya.com</span>
                </div>
              </div>
            </div>

            {/* Mock product UI */}
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
              <div className="h-full grid grid-cols-12 gap-3 sm:gap-4">
                {/* Sidebar mock */}
                <div className="col-span-2 rounded-xl bg-gray-900/95 p-2 sm:p-3 space-y-2 sm:space-y-3 hidden sm:block">
                  <div className="h-3 w-12 rounded bg-white/20" />
                  <div className="space-y-1.5">
                    {[70, 55, 45, 60, 50].map((w, i) => (
                      <div key={i} className="h-2 rounded" style={{ width: `${w}%`, background: i === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>

                {/* Main content mock */}
                <div className="col-span-12 sm:col-span-10 space-y-3 sm:space-y-4">
                  {/* Search bar */}
                  <div className="h-8 sm:h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center px-3">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />
                    <div className="ml-2 h-2 w-24 sm:w-32 rounded bg-gray-100" />
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { accent: 'bg-indigo-500', metric: '$1.2M', label: 'Pipeline' },
                      { accent: 'bg-emerald-500', metric: '68%', label: 'Win Rate' },
                      { accent: 'bg-violet-500', metric: '142', label: 'Contacts' },
                    ].map((card) => (
                      <div key={card.label} className="rounded-lg sm:rounded-xl bg-white border border-gray-100 shadow-sm p-2 sm:p-3">
                        <div className={`h-1 w-6 sm:w-8 rounded-full ${card.accent} mb-2`} />
                        <div className="text-sm sm:text-lg font-bold text-gray-900">{card.metric}</div>
                        <div className="text-[9px] sm:text-xs text-gray-400 mt-0.5">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table mock */}
                  <div className="rounded-lg sm:rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-gray-50/50 border-b border-gray-100">
                      {['Name', 'Type', 'Location', 'Rating', 'Status'].map((h) => (
                        <div key={h} className="text-[8px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider">{h}</div>
                      ))}
                    </div>
                    {[1, 2, 3, 4].map((row) => (
                      <div key={row} className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
                        {[60, 40, 50, 30, 35].map((w, j) => (
                          <div key={j} className="h-2 rounded" style={{ width: `${w}%`, background: j === 0 ? '#e5e7eb' : '#f3f4f6' }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
