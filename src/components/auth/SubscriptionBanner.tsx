import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { evaluateBillingAccess, useBillingOverview, getBillingPastDueGraceDays } from '@/hooks/useBilling';
import { isPlatformOwner } from '@/lib/platform';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/**
 * Banner no bloqueante: avisa cuando la suscripción necesita atención.
 * - Nunca bloquea el uso de la app.
 * - Propietarios de plataforma: no ven el banner.
 * - Sin suscripción: no se muestra (el usuario puede suscribirse cuando quiera).
 * - Suscripción vencida/cancelada: muestra aviso con enlace a Billing.
 */
export function SubscriptionBanner() {
  const { user } = useAuth();
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: overview, isLoading: billingLoading } = useBillingOverview(organization?.id ?? null);
  const [dismissed, setDismissed] = useState(false);

  if (isPlatformOwner(user)) return null;
  if (orgLoading || billingLoading || !organization) return null;
  if (dismissed) return null;

  const access = evaluateBillingAccess(overview?.subscription ?? null);

  // Solo mostrar cuando la suscripción existe y está en mal estado
  if (access.hasAccess) return null;
  if (!overview?.subscription) return null;

  const graceDays = getBillingPastDueGraceDays();
  const message =
    access.reason === 'past_due_expired'
      ? `Tu periodo de cortesía (${graceDays} días) ha finalizado. Actualiza tu método de pago para reactivar tu suscripción.`
      : access.reason === 'blocked_status'
        ? 'Tu suscripción necesita atención. Actualiza tu método de pago para seguir usando el servicio.'
        : 'Tu suscripción necesita atención.';

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <span className="truncate">{message}</span>
        <Link
          to="/billing"
          className="shrink-0 font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
        >
          Ir a Billing
        </Link>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 h-7 w-7 p-0 text-amber-700 hover:bg-amber-100"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
