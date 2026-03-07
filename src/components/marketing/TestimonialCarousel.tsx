import { ScrollAnimation } from './ScrollAnimation';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'Polsya transformed how we discover and evaluate creative talent. What used to take weeks now takes hours.',
    author: 'Sarah Chen',
    title: 'Creative Director',
    company: 'Northlight Studios',
    metric: '3× faster talent discovery',
    gradient: 'from-indigo-600 to-violet-600',
  },
  {
    quote: 'The portfolio analysis and relationship mapping features are unlike anything else on the market.',
    author: 'Marcus Webb',
    title: 'Head of Partnerships',
    company: 'Collective Creative',
    metric: '200+ relationships mapped',
    gradient: 'from-violet-600 to-purple-600',
  },
  {
    quote: 'We use Polsya to build production rosters faster than ever. The intelligence is genuinely actionable.',
    author: 'Elena Vasquez',
    title: 'Executive Producer',
    company: 'Frame & Form',
    metric: '60% shorter roster builds',
    gradient: 'from-purple-600 to-indigo-600',
  },
];

export function TestimonialCarousel() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Testimonials</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Trusted by creative teams worldwide
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollAnimation key={i} delay={i * 0.12}>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col group">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-gray-600 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                  {/* Metric pill */}
                  <div className={`mt-5 inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${t.gradient}`}>
                    {t.metric}
                  </div>
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                        {t.author[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                        <p className="text-xs text-gray-500">{t.title}, {t.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
