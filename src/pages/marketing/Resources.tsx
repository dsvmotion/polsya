import { BookOpen, FileText, GitCommit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'API docs, integration guides, and step-by-step tutorials to get the most out of Polsya.',
    link: '#',
    linkLabel: 'Browse docs',
  },
  {
    icon: FileText,
    title: 'Blog',
    description: 'Industry insights, product updates, and best practices for creative intelligence.',
    link: '#',
    linkLabel: 'Read blog',
  },
  {
    icon: GitCommit,
    title: 'Changelog',
    description: 'Release notes, feature announcements, and platform improvements.',
    link: '#',
    linkLabel: 'View changelog',
  },
];

export default function Resources() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Resources
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Everything you need to get started, stay informed, and get the most out of Polsya.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Resource cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((resource, idx) => {
            const Icon = resource.icon;
            return (
              <ScrollAnimation key={resource.title} delay={idx * 0.08}>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full flex flex-col">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{resource.title}</h3>
                  <p className="mt-2 flex-1 text-gray-600 leading-relaxed">{resource.description}</p>
                  <Link
                    to={resource.link}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    {resource.linkLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>
      </section>

      <CTASection
        headline="Ready to get started?"
        subtitle="Create your free account and explore the platform."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'Contact support', href: '/contact' }}
      />
    </>
  );
}
