import { useLocation, Outlet } from 'react-router-dom';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';
import { evaluateBillingAccess, useBillingOverview } from '@/hooks/useBilling';
import { ActivateSubscriptionCard } from './ActivateSubscriptionCard';
import { PageLoader } from '@/components/ui/page-loader';

const BILLING_TRIAL_DAYS = Math.max(0, Math.floor(Number(import.meta.env.VITE_BILLING_TRIAL_DAYS ?? 7) || 0));
const SKIP_GATE = import.meta.env.VITE_BILLING_SKIP_GATE === 'true' || import.meta.env.VITE_BILLING_SKIP_GATE === '1';

/** Rutas que muestran ActivateSubscriptionCard cuando no hay acceso. */
const GATED_PATHS = [
  '/app',
  '/prospecting',
  '/operations',
  '/reports',
  '/integrations',
];

function isGatedRoute(pathname: string): boolean {
  return GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Trial implícito: org creada en los últimos N días sin suscripción → acceso. */
function hasImplicitTrial(organizationCreatedAt: string | undefined): boolean {
  if (!organizationCreatedAt || BILLING_TRIAL_DAYS <= 0) return false;
  const created = new Date(organizationCreatedAt).getTime();
  const cutoff = Date.now() - BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

/**
 * Si el usuario no tiene acceso (sin suscripción, trial vencido, impago) y está en una ruta "gated",
 * muestra ActivateSubscriptionCard en lugar del contenido. Nunca bloquea navegación.
 * Platform owners y orgs con trial implícito (creadas hace menos de N días) siempre pasan.
 */
export function ActivateSubscriptionGate() {
  const { pathname } = useLocation();
  const { isOwner, isLoading: ownerLoading } = usePlatformOwnerStatus();
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: overview, isLoading: billingLoading } = useBillingOverview(organization?.id ?? null);

  if (SKIP_GATE) return <Outlet />;
  if (isOwner) return <Outlet />;
  if (ownerLoading || orgLoading || billingLoading || !organization) return <PageLoader />;

  const access = evaluateBillingAccess(overview?.subscription ?? null);
  const implicitTrial = access.reason === 'no_subscription' && hasImplicitTrial(organization.created_at);
  const hasAccess = access.hasAccess || implicitTrial;
  const shouldGate = !hasAccess && isGatedRoute(pathname);

  if (shouldGate) {
    return <ActivateSubscriptionCard reason={access.reason === 'no_subscription' ? 'no_subscription' : access.reason === 'past_due_expired' ? 'past_due_expired' : 'blocked_status'} />;
  }

  return <Outlet />;
}
