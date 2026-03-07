import { ScrollAnimation } from './ScrollAnimation';

export function CustomerLogos() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Trusted by creative teams worldwide
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {['Agency A', 'Studio B', 'Brand C', 'Network D', 'Creative E'].map((name) => (
              <span key={name} className="text-lg font-semibold text-gray-900">{name}</span>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
