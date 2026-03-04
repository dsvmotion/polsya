import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function PlatformContactMessages() {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['platform', 'contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('id, name, email, company, subject, message, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/platform">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Contact form submissions</h1>
          <p className="text-sm text-muted-foreground">
            Messages from the public contact page
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <a
                        href={`mailto:${m.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {m.email}
                      </a>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  {m.company && (
                    <p className="text-sm text-muted-foreground">Company: {m.company}</p>
                  )}
                  {m.subject && (
                    <p className="text-sm text-muted-foreground">Subject: {m.subject}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
