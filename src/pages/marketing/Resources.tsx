import { BookOpen, FileText, GitCommit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'API docs, integration guides, and step-by-step tutorials to get the most out of Polsya.',
    link: '#',
    linkLabel: 'Browse docs',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: FileText,
    title: 'Blog',
    description: 'Industry insights, product updates, and best practices for creative intelligence.',
    link: '#',
    linkLabel: 'Read blog',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: GitCommit,
    title: 'Changelog',
    description: 'Release notes, feature announcements, and platform improvements.',
    link: '#',
    linkLabel: 'View changelog',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export default function Resources() {
  return (
    <>
      <PageMeta title="Resources" description="Documentation, blog posts, and changelog — everything you need to get started with Polsya." path="/resources" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="absolute top-0 right-0 -z-10 w-[400px] h-[400px] rounded-full bg-indigo-100/30 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Resources</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Learn, build,{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">grow</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
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
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${resource.bg} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`h-6 w-6 ${resource.color}`} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{resource.title}</h3>
                  <p className="mt-2 flex-1 text-gray-500 leading-relaxed">{resource.description}</p>
                  <Link
                    to={resource.link}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors group/link"
                  >
                    {resource.linkLabel}
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" />
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
