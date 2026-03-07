import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { PageMeta } from '@/components/marketing/PageMeta';

export default function Resources() {
  return (
    <>
      <PageMeta title="Resources" description="Documentation, blog posts, and changelog — everything you need to get started with Polsya." path="/resources" />
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(245_30%_97%),white)]" />
        <div className="mx-auto max-w-2xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Resources
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              We're building our resource library. Check back soon.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </ScrollAnimation>
        </div>
      </section>
    </>
  );
}
