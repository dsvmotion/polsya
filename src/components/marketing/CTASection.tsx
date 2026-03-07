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
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ScrollAnimation>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            {headline}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-8">
              <Link to={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            {secondaryCta && (
              <Button asChild size="lg" variant="outline" className="px-8">
                <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
