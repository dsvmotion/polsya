import { Link } from 'react-router-dom';
import { Shield, Lock, Database, FileCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { ScrollFadeIn } from '@/components/landing/ScrollFadeIn';

const sections = [
  {
    icon: Shield,
    title: 'GDPR compliant',
    description: 'We process personal data in accordance with GDPR and similar regulations. Data subject rights (access, rectification, erasure, portability) are supported. Our infrastructure is hosted in the EU.',
  },
  {
    icon: Lock,
    title: 'Encryption at rest',
    description: 'All data is encrypted at rest using industry-standard encryption. Data in transit uses TLS. We never store raw credentials; OAuth tokens and API keys are stored securely.',
  },
  {
    icon: Database,
    title: 'Row-level security',
    description: 'Each organization\'s data is isolated. Row-level security ensures you only access your own data. No cross-tenant data leakage. Multi-tenancy is built into the platform from the ground up.',
  },
  {
    icon: FileCheck,
    title: 'Audit and compliance',
    description: 'Platform admins can access audit logs. We retain logs for security and compliance purposes. Enterprise plans can include custom SLAs and dedicated support for compliance reviews.',
  },
];

export default function Trust() {
  return (
    <div className="py-16 sm:py-24 bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Trust Center</h1>
        <p className="mt-4 text-white/50">
          Security, compliance, and data protection at {APP_NAME}.
        </p>

        <div className="mt-12 space-y-8">
          {sections.map((section, i) => (
            <ScrollFadeIn key={section.title} delay={i * 100}>
              <section className="flex gap-4 glass-panel p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-cta">
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  <p className="mt-2 text-white/50">
                    {section.description}
                  </p>
                </div>
              </section>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn>
          <div className="mt-12 glass-panel p-6">
            <h3 className="font-semibold text-white">Related</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-white/60 hover:text-white transition-colors">Contact us</Link> <span className="text-white/40">for security or compliance questions</span></li>
            </ul>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
