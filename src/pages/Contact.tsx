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
    const s = searchParams.get('subject') || '';
    setSubject(s);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const company = (form.elements.namedItem('company') as HTMLInputElement)?.value || null;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value;

    const { error: err } = await supabase.from('contact_messages').insert({
      name,
      email,
      company: company || null,
      subject: subject || null,
      message,
    });
    setIsLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Need a demo, custom pricing, or have questions? We'll get back to you within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Message sent</h2>
            <p className="mt-2 text-muted-foreground">
              Thanks for reaching out. We'll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-8">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" name="company" placeholder="Your company" />
            </div>
            {subject && SUBJECT_LABELS[subject] && (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                Subject: {SUBJECT_LABELS[subject]}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us about your needs, team size, or questions..."
                rows={5}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
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
