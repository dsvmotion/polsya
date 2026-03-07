import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-50/50 via-white to-white" />
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] rounded-full bg-orange-100/30 blur-3xl" />
      <div className="mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Discover creative talent{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              with intelligent data
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Polsya maps portfolios, relationships, and opportunities across the creative
            industry — so you find the right collaborators before anyone else.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-8 text-base">
            <Link to="/signup">Start free trial →</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8 text-base">
            <Link to="/how-it-works">See how it works</Link>
          </Button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-16 rounded-xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-100">
          <div className="aspect-[16/9] flex items-center justify-center text-gray-400 text-sm">
            <span>Product screenshot placeholder</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
