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
  },
  {
    icon: KeyRound,
    title: 'Access Control',
    description:
      'Role-based access control (RBAC) with granular permissions. Enterprise plans include SSO/SAML integration, IP allowlisting, and audit logging for every user action.',
  },
  {
    icon: Server,
    title: 'Infrastructure',
    description:
      'Hosted on SOC 2 Type II certified cloud infrastructure with multi-region redundancy. 99.9% uptime SLA with automatic failover and continuous monitoring.',
  },
  {
    icon: Lock,
    title: 'Compliance',
    description:
      'GDPR compliant with Data Processing Agreements available. SOC 2 Type II audit in progress. Regular penetration testing and vulnerability scanning by independent auditors.',
  },
];

export default function Security() {
  return (
    <>
      <PageMeta title="Security" description="Enterprise-grade security with GDPR compliance, AES-256 encryption, and row-level security." path="/security" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Security & compliance
            </h1>
            <p className="mt-6 text-lg text-gray-600">
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
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{detail.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{detail.description}</p>
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
