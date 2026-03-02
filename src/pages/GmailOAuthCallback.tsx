import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useExchangeGmailOAuth } from '@/hooks/useGmailOAuth';
import { Button } from '@/components/ui/button';

export default function GmailOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exchange = useExchangeGmailOAuth();
  const hasStarted = useRef(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (oauthError) {
      return;
    }

    if (!code || !state) {
      return;
    }

    exchange.mutate({ code, state });
  }, [code, state, oauthError, exchange]);

  if (oauthError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Gmail connection cancelled</h1>
          <p className="text-sm text-gray-600">Google returned: {oauthError}</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!code || !state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Missing OAuth parameters</h1>
          <p className="text-sm text-gray-600">The callback URL is missing the required code/state values.</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (exchange.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
          <h1 className="text-lg font-semibold text-gray-900">Connecting Gmail</h1>
          <p className="text-sm text-gray-600">Finalizing OAuth and storing your workspace token…</p>
        </div>
      </div>
    );
  }

  if (exchange.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Gmail connection failed</h1>
          <p className="text-sm text-gray-600">{exchange.error.message}</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (exchange.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Gmail connected</h1>
          <p className="text-sm text-gray-600">
            {exchange.data.accountEmail
              ? `Connected account: ${exchange.data.accountEmail}`
              : 'Connection completed successfully.'}
          </p>
          <Button onClick={() => navigate('/')}>Continue</Button>
        </div>
      </div>
    );
  }

  return null;
}
