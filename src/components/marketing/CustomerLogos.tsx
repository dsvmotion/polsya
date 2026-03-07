import { ScrollAnimation } from './ScrollAnimation';

const companies = [
  { name: 'Northlight Studios', width: 'w-28' },
  { name: 'Collective Creative', width: 'w-32' },
  { name: 'Frame & Form', width: 'w-24' },
  { name: 'Aperture Labs', width: 'w-26' },
  { name: 'Prisma Network', width: 'w-28' },
];

export function CustomerLogos() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100/80">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Trusted by creative teams worldwide
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {companies.map((company) => (
              <div key={company.name} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200">
                <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-500">{company.name.charAt(0)}</span>
                </div>
                <span className="text-base font-semibold text-gray-900 tracking-tight">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
