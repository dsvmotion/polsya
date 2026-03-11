import OAuthCallbackPage from '@/components/auth/OAuthCallbackPage';

export default function GoogleDriveOAuthCallback() {
  return <OAuthCallbackPage providerName="Google Drive" redirectPath="/integrations" />;
}
