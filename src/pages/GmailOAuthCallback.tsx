import OAuthCallbackPage from '@/components/auth/OAuthCallbackPage';

export default function GmailOAuthCallback() {
  return <OAuthCallbackPage providerName="Gmail" redirectPath="/app/integrations" />;
}
