import OAuthCallbackPage from '@/components/auth/OAuthCallbackPage';

export default function NotionOAuthCallback() {
  return <OAuthCallbackPage providerName="Notion" redirectPath="/integrations" />;
}
