import { Building2, Palette, Film, Users, TrendingUp, Search } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

const useCases = [
  { icon: Building2, title: 'Agencies', description: 'Talent scouting and vendor management', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Palette, title: 'Brands', description: 'Finding and vetting creative partners', color: 'bg-violet-50 text-violet-600' },
  { icon: Film, title: 'Producers', description: 'Building production rosters', color: 'bg-purple-50 text-purple-600' },
  { icon: Users, title: 'Recruiters', description: 'Creative talent acquisition', color: 'bg-blue-50 text-blue-600' },
  { icon: TrendingUp, title: 'Investors', description: 'Portfolio company analysis', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Search, title: 'Consultants', description: 'Market mapping and competitive intel', color: 'bg-cyan-50 text-cyan-600' },
];

export function UseCaseGrid() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Use Cases</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              One platform, every creative intelligence use case
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              From talent scouting to competitive analysis — Polsya adapts to how you work.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <ScrollAnimation key={uc.title} delay={i * 0.08}>
                <div className="flex items-start gap-4 rounded-2xl bg-white p-6 border border-gray-200/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${uc.color} shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                    <uc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{uc.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{uc.description}</p>
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
