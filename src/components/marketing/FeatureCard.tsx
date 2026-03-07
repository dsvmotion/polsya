import { type LucideIcon } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <ScrollAnimation delay={delay}>
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-500">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
      </div>
    </ScrollAnimation>
  );
}
