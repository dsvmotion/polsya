import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'cookie_consent_accepted';

export function CookieConsent() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setAccepted(stored === 'true');
    } catch {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAccepted(true);
    } catch {
      setAccepted(true);
    }
  };

  if (accepted === null || accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-lg border border-border bg-background/95 backdrop-blur shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">We use cookies</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              We use essential cookies to run the app and optional analytics to improve it.{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
        <Button onClick={handleAccept} size="sm" className="shrink-0">
          Accept
        </Button>
      </div>
    </div>
  );
}
