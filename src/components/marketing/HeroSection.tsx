import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-8 pb-4 sm:pt-12 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl relative">
        {/* Clay-style rounded hero container */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Warm gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-rose-50/30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-100/20 blur-[100px] -z-10" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-100/15 blur-[80px] -z-10" />
          {/* Dot grid overlay */}
          <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          {/* Centered text content */}
          <div className="relative px-8 py-20 sm:px-16 sm:py-28">
            <div className="text-center max-w-3xl mx-auto">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
