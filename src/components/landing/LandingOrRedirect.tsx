import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';
import Home from '@/pages/marketing/Home';
import { PageLoader } from '@/components/ui/page-loader';

/**
 * Renders marketing Home for guests. Redirects logged-in users to /app or /admin.
 * Platform owners (app_metadata, env, or platform_owner_emails table) go to /admin.
 */
export function LandingOrRedirect() {
  const { user, isLoading } = useAuth();
  const { isOwner, isLoading: ownerLoading } = usePlatformOwnerStatus();

  if (isLoading) return <PageLoader />;
  if (user && ownerLoading) return <PageLoader />;
  if (user) return <Navigate to={isOwner ? '/admin' : '/app'} replace />;

  return <Home />;
}
