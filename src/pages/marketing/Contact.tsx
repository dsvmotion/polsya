import { useState } from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';
import { CTASection } from '@/components/marketing/CTASection';
import { PageMeta } from '@/components/marketing/PageMeta';

const SUBJECTS = [
  'General inquiry',
  'Sales & pricing',
  'Enterprise plan',
  'Technical support',
  'Partnership',
  'Security',
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <PageMeta title="Contact" description="Get in touch with the Polsya team. We'd love to hear from you." path="/contact" />
      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollAnimation>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Contact us
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Have a question, need a demo, or want to discuss an Enterprise plan? We would love to hear from you.
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2">
          {/* Form */}
          <ScrollAnimation>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              {submitted ? (
                <div className="text-center py-12">
                  <p className="text-lg font-semibold text-gray-900">Thank you!</p>
                  <p className="mt-2 text-gray-600">We will get back to you within one business day.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <select
                      id="subject"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg"
                  >
                    Send message
                  </Button>
                </form>
              )}
            </div>
          </ScrollAnimation>

          {/* Company info */}
          <ScrollAnimation delay={0.1}>
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Get in touch</h2>
                <p className="mt-2 text-gray-600">
                  Prefer to reach out directly? Here is how you can contact us.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                    <Mail className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">hello@polsya.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">Madrid, Spain</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Business hours</p>
                    <p className="text-sm text-gray-600">Monday - Friday, 9:00 - 18:00 CET</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      <CTASection
        headline="Not ready to talk? Start exploring."
        subtitle="Create a free account and try Polsya on your own terms."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
      />
    </>
  );
}
