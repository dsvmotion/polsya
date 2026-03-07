import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';
import { PageLoader } from '@/components/ui/page-loader';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth();
  const { isOwner, isLoading } = usePlatformOwnerStatus();

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <PageLoader />;
  if (!isOwner) return <Navigate to="/app" replace />;

  return <>{children}</>;
}
