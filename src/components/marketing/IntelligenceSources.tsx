import { ScrollAnimation } from './ScrollAnimation';

const sources = [
  { name: 'Behance', initial: 'Be', color: 'bg-blue-600' },
  { name: 'Dribbble', initial: 'Dr', color: 'bg-pink-500' },
  { name: 'LinkedIn', initial: 'Li', color: 'bg-blue-700' },
  { name: 'Instagram', initial: 'Ig', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { name: 'Awwwards', initial: 'Aw', color: 'bg-emerald-600' },
  { name: 'Pinterest', initial: 'Pi', color: 'bg-red-600' },
  { name: 'Vimeo', initial: 'Vi', color: 'bg-cyan-600' },
  { name: 'ArtStation', initial: 'As', color: 'bg-indigo-600' },
  { name: 'Cargo', initial: 'Ca', color: 'bg-gray-800' },
  { name: 'Agency directories', initial: 'Ad', color: 'bg-violet-600' },
  { name: 'Award databases', initial: 'Db', color: 'bg-amber-600' },
  { name: 'Social signals', initial: 'So', color: 'bg-teal-600' },
  { name: 'Portfolio sites', initial: 'Ps', color: 'bg-rose-600' },
];

export function IntelligenceSources() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Data Sources</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Enrich every creative profile with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">50+ intelligence sources</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Pull portfolio work, awards, social presence, and style signals automatically
            from the platforms creatives use every day.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {sources.map((source, i) => (
              <ScrollAnimation key={source.name} delay={i * 0.03}>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className={`w-7 h-7 rounded-lg ${source.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                    {source.initial}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{source.name}</span>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
