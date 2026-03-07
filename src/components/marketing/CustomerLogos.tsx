import { ScrollAnimation } from './ScrollAnimation';
import { Star } from 'lucide-react';

const companies = [
  { name: 'Northlight Studios', initial: 'N', gradient: 'from-indigo-400 to-indigo-600' },
  { name: 'Collective Creative', initial: 'C', gradient: 'from-violet-400 to-violet-600' },
  { name: 'Frame & Form', initial: 'F', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Aperture Labs', initial: 'A', gradient: 'from-blue-400 to-blue-600' },
  { name: 'Prisma Network', initial: 'P', gradient: 'from-fuchsia-400 to-fuchsia-600' },
  { name: 'Cascade Studio', initial: 'S', gradient: 'from-emerald-400 to-emerald-600' },
  { name: 'Pixel Collective', initial: 'X', gradient: 'from-rose-400 to-rose-600' },
  { name: 'Vertex Media', initial: 'V', gradient: 'from-cyan-400 to-cyan-600' },
];

const reviewPlatforms = [
  { name: 'G2', rating: '4.9', reviews: '320+', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { name: 'Capterra', rating: '4.8', reviews: '180+', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { name: 'Product Hunt', rating: '#1', reviews: 'Product of the Day', color: 'text-red-600 bg-red-50 border-red-100' },
];

export function CustomerLogos() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-y border-gray-100/80 bg-[linear-gradient(to_bottom,hsl(245_30%_98%),white)]">
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 text-center">
            Trusted by 500+ creative teams worldwide
          </p>

          {/* Logo grid */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10 sm:gap-y-5">
            {companies.map((company) => (
              <div key={company.name} className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity duration-200 group">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${company.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <span className="text-[10px] sm:text-xs font-bold text-white">{company.initial}</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight">{company.name}</span>
              </div>
            ))}
          </div>

          {/* Review platforms bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {reviewPlatforms.map((platform) => (
              <div key={platform.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${platform.color} text-xs font-medium`}>
                <span className="font-bold">{platform.name}</span>
                <div className="flex gap-0.5">
                  {platform.rating !== '#1' ? (
                    <>
                      <Star className="h-3 w-3 fill-current" />
                      <span>{platform.rating}</span>
                    </>
                  ) : (
                    <span>{platform.rating}</span>
                  )}
                </div>
                <span className="text-[10px] opacity-70">({platform.reviews})</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
