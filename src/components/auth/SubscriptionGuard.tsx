import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { evaluateBillingAccess, useBillingOverview } from '@/hooks/useBilling';

const TRIAL_DAYS = (() => {
  const raw = Number(import.meta.env.VITE_BILLING_TRIAL_DAYS ?? 14);
  if (!Number.isFinite(raw) || raw < 0) return 14;
  return Math.floor(raw);
})();

const SKIP_SUBSCRIPTION_CHECK = import.meta.env.VITE_SKIP_SUBSCRIPTION_CHECK === 'true';

function isWithinTrial(createdAt: string | undefined): boolean {
  if (!createdAt || TRIAL_DAYS <= 0) return false;
  const created = new Date(createdAt).getTime();
  const trialEnd = created + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() <= trialEnd;
}

interface SubscriptionGuardProps {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const location = useLocation();
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: overview, isLoading: billingLoading, isError: billingError } = useBillingOverview(organization?.id ?? null);

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

  if (SKIP_SUBSCRIPTION_CHECK) {
    return <>{children}</>;
  }

  const access = evaluateBillingAccess(overview?.subscription ?? null);
  if (access.hasAccess) {
    return <>{children}</>;
  }

  // New workspace trial: no subscription but org created within trial period
  if (!overview?.subscription && organization && isWithinTrial(organization.created_at)) {
    return <>{children}</>;
  }

  // Billing query failed (e.g. tables not migrated): allow access to avoid blocking dev
  if (billingError) {
    return <>{children}</>;
  }

  return <Navigate to="/billing" state={{ from: location }} replace />;
}
