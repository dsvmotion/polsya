import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollAnimation } from './ScrollAnimation';

interface CTAProps {
  label: string;
  href: string;
}

interface CTASectionProps {
  headline: string;
  subtitle?: string;
  primaryCta: CTAProps;
  secondaryCta?: CTAProps;
}

export function CTASection({ headline, subtitle, primaryCta, secondaryCta }: CTASectionProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-violet-50/50 to-white" />
      <div className="absolute top-0 right-0 -z-10 w-[400px] h-[400px] rounded-full bg-indigo-100/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] rounded-full bg-violet-100/20 blur-3xl" />
      <ScrollAnimation>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            {headline}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-500">{subtitle}</p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200/50 px-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <Link to={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            {secondaryCta && (
              <Button asChild size="lg" variant="outline" className="px-8 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
                <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
