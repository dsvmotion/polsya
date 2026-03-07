import { ScrollAnimation } from './ScrollAnimation';

const testimonials = [
  { quote: 'Polsya transformed how we discover and evaluate creative talent. What used to take weeks now takes hours.', author: 'Creative Director', company: 'Design Agency', color: 'bg-orange-500' },
  { quote: 'The portfolio analysis and relationship mapping features are unlike anything else on the market.', author: 'Head of Partnerships', company: 'Creative Network', color: 'bg-blue-500' },
  { quote: 'We use Polsya to build production rosters faster than ever. The intelligence is genuinely actionable.', author: 'Executive Producer', company: 'Production Studio', color: 'bg-green-600' },
];

export function TestimonialCarousel() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center">
            What our customers say
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollAnimation key={i} delay={i * 0.15}>
                <div className={`${t.color} rounded-2xl p-8 text-white h-full flex flex-col`}>
                  <blockquote className="flex-1 text-lg leading-relaxed">"{t.quote}"</blockquote>
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <p className="font-semibold">{t.author}</p>
                    <p className="text-sm text-white/70">{t.company}</p>
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
