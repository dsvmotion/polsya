import { Shield, Lock, Server, KeyRound } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { SecurityBadges } from '@/components/marketing/SecurityBadges';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const DETAILS = [
  {
    icon: Shield,
    title: 'Data Handling',
    description:
      'All data is encrypted at rest with AES-256 and in transit with TLS 1.3. We follow data minimization principles and never sell your data. GDPR-compliant data processing agreements are available for all customers.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: KeyRound,
    title: 'Access Control',
    description:
      'Role-based access control (RBAC) with granular permissions. Enterprise plans include SSO/SAML integration, IP allowlisting, and audit logging for every user action.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Server,
    title: 'Infrastructure',
    description:
      'Hosted on SOC 2 Type II certified cloud infrastructure with multi-region redundancy. 99.9% uptime SLA with automatic failover and continuous monitoring.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Lock,
    title: 'Compliance',
    description:
      'GDPR compliant with Data Processing Agreements available. SOC 2 Type II audit in progress. Regular penetration testing and vulnerability scanning by independent auditors.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

export default function Security() {
  return (
    <>
      <PageMeta title="Security" description="Enterprise-grade security with GDPR compliance, AES-256 encryption, and row-level security." path="/security" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[500px] h-[500px] rounded-full bg-indigo-100/20 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Security</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Security &{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">compliance</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              Your data is your most valuable asset. We protect it with enterprise-grade security at every layer.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Security badges */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <SecurityBadges />
      </section>

      {/* Detail grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-2">
          {DETAILS.map((detail, idx) => {
            const Icon = detail.icon;
            return (
              <ScrollAnimation key={detail.title} delay={idx * 0.06}>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${detail.bg} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`h-6 w-6 ${detail.color}`} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{detail.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{detail.description}</p>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>
      </section>

      <CTASection
        headline="Have security questions?"
        subtitle="Our team is happy to walk you through our security practices and provide documentation."
        primaryCta={{ label: 'Contact security team', href: '/contact?subject=security' }}
      />
    </>
  );
}
