import { Building2, Palette, Film, Users, TrendingUp, Search } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

const useCases = [
  { icon: Building2, title: 'Agencies', description: 'Talent scouting and vendor management' },
  { icon: Palette, title: 'Brands', description: 'Finding and vetting creative partners' },
  { icon: Film, title: 'Producers', description: 'Building production rosters' },
  { icon: Users, title: 'Recruiters', description: 'Creative talent acquisition' },
  { icon: TrendingUp, title: 'Investors', description: 'Portfolio company analysis' },
  { icon: Search, title: 'Consultants', description: 'Market mapping and competitive intel' },
];

export function UseCaseGrid() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              One platform, every creative intelligence use case
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From talent scouting to competitive analysis — Polsya adapts to how you work.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <ScrollAnimation key={uc.title} delay={i * 0.1}>
                <div className="flex items-start gap-4 rounded-xl bg-white p-6 border border-gray-200">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                    <uc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{uc.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{uc.description}</p>
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
