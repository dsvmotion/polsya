import { ScrollAnimation } from './ScrollAnimation';

const sources = [
  'Behance', 'Dribbble', 'LinkedIn', 'Instagram', 'Awwwards',
  'Pinterest', 'Vimeo', 'ArtStation', 'Cargo', 'Agency directories',
  'Award databases', 'Social signals', 'Portfolio sites',
];

export function IntelligenceSources() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Enrich every creative profile with{' '}
            <span className="text-orange-500">50+ intelligence sources</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Pull portfolio work, awards, social presence, and style signals automatically
            from the platforms creatives use every day.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {sources.map((source) => (
              <span key={source} className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200">
                {source}
              </span>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
