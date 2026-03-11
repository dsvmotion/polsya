import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useExchangeOAuth } from '@/hooks/useOAuth';
import { Button } from '@/components/ui/button';

interface OAuthCallbackPageProps {
  providerName: string;
  redirectPath: string;
}

export default function OAuthCallbackPage({ providerName, redirectPath }: OAuthCallbackPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exchange = useExchangeOAuth();
  const hasStarted = useRef(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (oauthError) return;
    if (!code || !state) return;

    exchange.mutate({ code, state });
  }, [code, state, oauthError, exchange]);

  const backLabel = redirectPath === '/integrations' ? 'Back to Integrations' : 'Back to Dashboard';

  if (oauthError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">{providerName} connection cancelled</h1>
          <p className="text-sm text-muted-foreground">
            {oauthError === 'access_denied'
              ? 'You cancelled the authorization request.'
              : 'An authorization error occurred. Please try again.'}
          </p>
          <Button onClick={() => navigate(redirectPath)}>{backLabel}</Button>
        </div>
      </div>
    );
  }

  if (!code || !state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Missing OAuth parameters</h1>
          <p className="text-sm text-muted-foreground">The callback URL is missing the required code/state values.</p>
          <Button onClick={() => navigate(redirectPath)}>{backLabel}</Button>
        </div>
      </div>
    );
  }

  if (exchange.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <h1 className="text-lg font-semibold">Connecting {providerName}</h1>
          <p className="text-sm text-muted-foreground">Finalizing OAuth and storing your workspace token…</p>
        </div>
      </div>
    );
  }

  if (exchange.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">{providerName} connection failed</h1>
          <p className="text-sm text-muted-foreground">{exchange.error.message}</p>
          <Button onClick={() => navigate(redirectPath)}>{backLabel}</Button>
        </div>
      </div>
    );
  }

  if (exchange.isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <h1 className="text-lg font-semibold">{providerName} connected</h1>
          <p className="text-sm text-muted-foreground">
            {exchange.data.accountEmail
              ? `Connected: ${exchange.data.accountEmail}`
              : 'Connection completed successfully.'}
          </p>
          <Button onClick={() => navigate(redirectPath)}>Continue</Button>
        </div>
      </div>
    );
  }

  return null;
}
