import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';
import Landing from '@/pages/Landing';
import { PageLoader } from '@/components/ui/page-loader';

/**
 * Renders Landing for guests. Redirects logged-in users to dashboard or platform.
 * Platform owners (app_metadata, env, or platform_owner_emails table) go to /platform.
 */
export function LandingOrRedirect() {
  const { user, isLoading } = useAuth();
  const { isOwner, isLoading: ownerLoading } = usePlatformOwnerStatus();

  if (isLoading) return <PageLoader />;
  if (user && ownerLoading) return <PageLoader />;
  if (user) return <Navigate to={isOwner ? '/platform' : '/dashboard'} replace />;

  return <Landing />;
}
