import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const SUBJECT_LABELS: Record<string, string> = {
  enterprise: 'Enterprise plan inquiry',
  demo: 'Request a demo',
  pricing: 'Pricing question',
  support: 'Support',
};

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    setSubject(searchParams.get('subject') || '');
  }, [searchParams]);

  const prefillEmail = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value?.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim();
    const company = (form.elements.namedItem('company') as HTMLInputElement)?.value?.trim() || null;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value?.trim();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('submit-contact', {
        body: { name, email, company, subject: subject || null, message },
      });

      if (fnError) {
        setError(fnError.message || 'Failed to send message');
        return;
      }
      if (data?.error) {
        setError(typeof data.error === 'string' ? data.error : 'Invalid input');
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 text-lg text-white/50">
            Need a demo, custom pricing, or have questions? We'll get back to you within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="glass-panel p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-cta">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">Message sent</h2>
            <p className="mt-2 text-white/50">
              Thanks for reaching out. We'll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-8">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/70">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" defaultValue={prefillEmail} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-white/70">Company (optional)</Label>
              <Input id="company" name="company" placeholder="Your company" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            {subject && SUBJECT_LABELS[subject] && (
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
                Subject: {SUBJECT_LABELS[subject]}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-white/70">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us about your needs, team size, or questions..."
                rows={5}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-gradient-cta text-white hover:opacity-90 border-0">
              {isLoading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send message
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
