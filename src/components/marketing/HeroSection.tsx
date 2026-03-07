import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Star, Sparkles, TrendingUp, Award, ArrowRight,
  MapPin, Network,
} from 'lucide-react';

/* ─── Floating illustration: mini profile card ─── */
function FloatingProfileCard() {
  return (
    <div className="w-48 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-3 animate-float-gentle">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white">SC</div>
        <div>
          <div className="text-[10px] font-semibold text-gray-900">Sarah Chen</div>
          <div className="text-[8px] text-gray-400">Art Director</div>
        </div>
        <Sparkles className="h-3 w-3 text-indigo-400 ml-auto" />
      </div>
      <div className="flex gap-1">
        <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Brand Identity</span>
        <span className="text-[7px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-medium">Motion</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-2 w-2 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-[8px] font-semibold text-gray-600">4.9</span>
      </div>
    </div>
  );
}

/* ─── Floating illustration: enrichment badge ─── */
function FloatingEnrichmentBadge() {
  return (
    <div className="w-40 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle-reverse">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
          <TrendingUp className="h-3 w-3 text-white" />
        </div>
        <span className="text-[9px] font-semibold text-gray-900">Match Score</span>
      </div>
      <div className="text-lg font-bold text-emerald-600 leading-none">98%</div>
      <div className="text-[8px] text-gray-400 mt-0.5">Based on 12 signals</div>
    </div>
  );
}

/* ─── Floating illustration: graph cluster ─── */
function FloatingGraphCluster() {
  return (
    <div className="w-36 h-28 animate-float-gentle" style={{ animationDelay: '1s' }}>
      <svg viewBox="0 0 140 110" className="w-full h-full">
        <line x1="70" y1="55" x2="25" y2="25" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="70" y1="55" x2="115" y2="30" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <line x1="70" y1="55" x2="40" y2="90" stroke="#a78bfa" strokeWidth="1.5" opacity="0.6" />
        <line x1="70" y1="55" x2="110" y2="85" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="70" cy="55" r="12" fill="url(#fg1)" />
        <circle cx="25" cy="25" r="8" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="115" cy="30" r="9" fill="#818cf8" opacity="0.8" />
        <circle cx="40" cy="90" r="7" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="110" cy="85" r="8" fill="#c4b5fd" opacity="0.7" />
        <defs>
          <linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Floating illustration: award notification ─── */
function FloatingAwardBadge() {
  return (
    <div className="w-44 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle" style={{ animationDelay: '2s' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
          <Award className="h-3 w-3 text-white" />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-gray-900">New Award Found</div>
          <div className="text-[7px] text-gray-400">Red Dot Design 2024</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Floating illustration: connection notification ─── */
function FloatingConnectionCard() {
  return (
    <div className="w-44 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle-reverse" style={{ animationDelay: '0.5s' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
          <Network className="h-3 w-3 text-white" />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-gray-900">New Connection</div>
          <div className="text-[7px] text-gray-400">Sarah Chen → W+K Portland</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Floating illustration: location signal ─── */
function FloatingLocationSignal() {
  return (
    <div className="w-40 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg p-2.5 animate-float-gentle" style={{ animationDelay: '1.5s' }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
          <MapPin className="h-3 w-3 text-white" />
        </div>
        <span className="text-[9px] font-semibold text-gray-900">Talent Cluster</span>
      </div>
      <div className="text-[8px] text-gray-500">142 creatives in Brooklyn, NY</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export function HeroSection() {
  return (
    <section className="relative pt-8 pb-4 sm:pt-12 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl relative">
        {/* ─── Clay-style rounded hero container ─── */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Warm gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-rose-50/30" />
          {/* Secondary glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-100/20 blur-[100px] -z-10" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-100/15 blur-[80px] -z-10" />
          {/* Dot grid overlay */}
          <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* Noise texture */}
          <div className="absolute inset-0 -z-10 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />

          {/* Container content */}
          <div className="relative px-8 py-20 sm:px-16 sm:py-28">
            {/* ── Floating illustrations (LEFT) — xl only ── */}
            <div className="hidden xl:flex flex-col gap-4 absolute left-6 top-12 w-52 z-10">
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.6 }}>
                <FloatingProfileCard />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.6 }}>
                <FloatingGraphCluster />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.6 }}>
                <FloatingConnectionCard />
              </motion.div>
            </div>

            {/* ── Floating illustrations (RIGHT) — xl only ── */}
            <div className="hidden xl:flex flex-col gap-4 absolute right-6 top-16 w-48 items-end z-10">
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.6 }}>
                <FloatingEnrichmentBadge />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3, duration: 0.6 }}>
                <FloatingAwardBadge />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.6 }}>
                <FloatingLocationSignal />
              </motion.div>
            </div>

            {/* ── Centered text content ── */}
            <div className="text-center max-w-3xl mx-auto relative z-20">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8 backdrop-blur-sm shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Creative Intelligence Platform
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08]">
                  Discover creative talent{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    with intelligent data
                  </span>
                </h1>
                <p className="mt-7 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  Polsya maps portfolios, relationships, and opportunities across the creative
                  industry — so you find the right collaborators before anyone else.
                </p>
              </motion.div>

              {/* CTA row */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/50 px-8 text-base hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-200 hover:-translate-y-0.5">
                  <Link to="/signup">Start free trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8 text-base border-gray-300 bg-white/60 backdrop-blur-sm hover:border-indigo-300 hover:bg-white/80 transition-all duration-200">
                  <Link to="/how-it-works">See how it works</Link>
                </Button>
              </motion.div>

              {/* Social proof bar */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-10 inline-flex flex-col sm:flex-row items-center gap-5 sm:gap-6 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm px-6 py-3.5 shadow-sm"
              >
                {/* Avatar stack */}
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'].map((color, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-white flex items-center justify-center text-[8px] font-bold text-white`}>
                        {['SC', 'MW', 'EV', 'KT', 'AO'][i]}
                      </div>
                    ))}
                  </div>
                  <span className="ml-2.5 text-sm text-gray-500 font-medium">500+ teams</span>
                </div>

                <div className="hidden sm:block w-px h-5 bg-gray-200" />

                {/* Star rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">4.9/5</span>
                  <span className="text-sm text-gray-400">rating</span>
                </div>

                <div className="hidden sm:block w-px h-5 bg-gray-200" />

                {/* Mini testimonial */}
                <p className="text-xs text-gray-500 italic max-w-[200px]">
                  &ldquo;Transformed how we source creative talent&rdquo;
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
