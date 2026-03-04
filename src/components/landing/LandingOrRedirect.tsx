import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformOwner } from '@/lib/platform';
import Landing from '@/pages/Landing';
import { PageLoader } from '@/components/ui/page-loader';

/**
 * Renders Landing for guests. Redirects logged-in users to dashboard or platform.
 */
export function LandingOrRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to={isPlatformOwner(user) ? '/platform' : '/dashboard'} replace />;
  }

  return <Landing />;
}
