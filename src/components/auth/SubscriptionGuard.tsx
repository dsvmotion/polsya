import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { evaluateBillingAccess, useBillingOverview } from '@/hooks/useBilling';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const location = useLocation();
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: overview, isLoading: billingLoading } = useBillingOverview(organization?.id ?? null);

  if (orgLoading || billingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Checking subscription...</p>
        </div>
      </div>
    );
  }

  const access = evaluateBillingAccess(overview?.subscription ?? null);
  if (access.hasAccess) {
    return <>{children}</>;
  }

  return <Navigate to="/billing" state={{ from: location }} replace />;
}
