import { ScrollAnimation } from './ScrollAnimation';

const companies = [
  { name: 'Northlight Studios', initial: 'N', gradient: 'from-indigo-400 to-indigo-600' },
  { name: 'Collective Creative', initial: 'C', gradient: 'from-violet-400 to-violet-600' },
  { name: 'Frame & Form', initial: 'F', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Aperture Labs', initial: 'A', gradient: 'from-blue-400 to-blue-600' },
  { name: 'Prisma Network', initial: 'P', gradient: 'from-fuchsia-400 to-fuchsia-600' },
  { name: 'Cascade Studio', initial: 'S', gradient: 'from-emerald-400 to-emerald-600' },
];

export function CustomerLogos() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100/80">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-8">
            Trusted by 500+ creative teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {companies.map((company) => (
              <div key={company.name} className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity duration-200 group">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${company.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <span className="text-xs font-bold text-white">{company.initial}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 tracking-tight">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
