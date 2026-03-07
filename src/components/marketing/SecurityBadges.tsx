import { Shield, Lock, Globe, Server } from 'lucide-react';
import { ScrollAnimation } from './ScrollAnimation';

const badges = [
  { icon: Shield, title: 'GDPR Compliant', description: 'Full European data protection compliance' },
  { icon: Lock, title: 'Encrypted', description: 'AES-256 encryption at rest and in transit' },
  { icon: Server, title: 'Row-Level Security', description: 'Supabase RLS on every table' },
  { icon: Globe, title: 'SOC 2 Ready', description: 'Enterprise-grade security practices' },
];

export function SecurityBadges() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Enterprise-grade security for sensitive talent data
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Your data is protected with the same standards trusted by the world's leading organizations.
          </p>
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {badges.map((badge, i) => (
              <ScrollAnimation key={badge.title} delay={i * 0.1}>
                <div className="rounded-xl bg-gray-50 p-6 text-center border border-gray-200">
                  <badge.icon className="h-8 w-8 mx-auto text-orange-500" />
                  <h3 className="mt-3 font-semibold text-gray-900 text-sm">{badge.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{badge.description}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
