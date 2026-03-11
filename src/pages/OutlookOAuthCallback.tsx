import OAuthCallbackPage from '@/components/auth/OAuthCallbackPage';

export default function OutlookOAuthCallback() {
  return <OAuthCallbackPage providerName="Outlook" redirectPath="/dashboard" />;
}
