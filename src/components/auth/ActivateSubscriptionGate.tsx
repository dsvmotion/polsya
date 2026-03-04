import { useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { evaluateBillingAccess, useBillingOverview } from '@/hooks/useBilling';
import { isPlatformOwner } from '@/lib/platform';
import { ActivateSubscriptionCard } from './ActivateSubscriptionCard';
import { PageLoader } from '@/components/ui/page-loader';

/** Rutas que muestran ActivateSubscriptionCard cuando no hay acceso. */
const GATED_PATHS = [
  '/dashboard',
  '/prospecting',
  '/operations',
  '/reports',
  '/integrations',
];

/** Rutas que siempre se muestran (billing, profile, team). */
function isGatedRoute(pathname: string): boolean {
  return GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Si el usuario no tiene acceso (sin suscripción, trial vencido, impago) y está en una ruta "gated",
 * muestra ActivateSubscriptionCard en lugar del contenido. Nunca bloquea navegación.
 */
export function ActivateSubscriptionGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: overview, isLoading: billingLoading } = useBillingOverview(organization?.id ?? null);

  if (isPlatformOwner(user)) return <Outlet />;
  if (orgLoading || billingLoading || !organization) return <PageLoader />;

  const access = evaluateBillingAccess(overview?.subscription ?? null);
  const shouldGate = !access.hasAccess && isGatedRoute(pathname);

  if (shouldGate) {
    return <ActivateSubscriptionCard reason={access.reason === 'no_subscription' ? 'no_subscription' : access.reason === 'past_due_expired' ? 'past_due_expired' : 'blocked_status'} />;
  }

  return <Outlet />;
}
