import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CreditCard, Loader2, ExternalLink, Database, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  evaluateBillingAccess,
  getBillingPastDueGraceDays,
  useBillingOverview,
  useBillingPlans,
  useCreateCheckoutSession,
  useCreateCustomerPortalSession,
  usePlanUsage,
} from '@/hooks/useBilling';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { canManageBilling as canManageBillingRole } from '@/lib/rbac';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformOwner } from '@/lib/platform';
import type { BillingSubscriptionStatus } from '@/types/billing';

function formatMoney(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function statusLabel(status: BillingSubscriptionStatus | null | undefined): string {
  if (!status) return 'No subscription';
  const labels: Record<BillingSubscriptionStatus, string> = {
    trialing: 'Trialing',
    active: 'Active',
    past_due: 'Past due',
    unpaid: 'Unpaid',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Incomplete expired',
  };
  return labels[status];
}

function statusVariant(status: BillingSubscriptionStatus | null | undefined): 'default' | 'secondary' | 'destructive' {
  if (!status) return 'secondary';
  if (status === 'active' || status === 'trialing') return 'default';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'destructive';
  return 'secondary';
}

export default function Billing() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { organization, membership, isLoading: orgLoading } = useCurrentOrganization();
  const showPlatformLink = isPlatformOwner(user);
  const { data: plans = [], isLoading: plansLoading } = useBillingPlans();
  const { data: overview, isLoading: overviewLoading } = useBillingOverview(organization?.id ?? null);
  const { data: usage } = usePlanUsage(organization?.id ?? null);
  const createCheckout = useCreateCheckoutSession();
  const createPortal = useCreateCustomerPortalSession();

  const checkoutResult = searchParams.get('checkout');
  const preselectedPlanCode = searchParams.get('plan');
  const preselectedPlan = useMemo(() => {
    if (!preselectedPlanCode) return null;
    return plans.find((p) => p.code?.toLowerCase() === preselectedPlanCode.toLowerCase()) ?? null;
  }, [plans, preselectedPlanCode]);
  const currentPlan = useMemo(() => {
    if (!overview?.subscription) return null;
    return plans.find((p) => p.stripe_price_id === overview.subscription?.stripe_price_id) ?? null;
  }, [overview?.subscription, plans]);
  const showPreselectedBanner = preselectedPlan && currentPlan?.id !== preselectedPlan.id;
  const canManageBilling = canManageBillingRole(membership?.role ?? null);
  const orgLocale = organization?.locale ?? 'es-ES';
  const orgTimezone = organization?.timezone ?? 'Europe/Madrid';

  const access = evaluateBillingAccess(overview?.subscription ?? null);
  const hasAccess = access.hasAccess;

  const handleSubscribe = async (planId: string) => {
    try {
      const result = await createCheckout.mutateAsync({
        planId,
        successUrl: `${window.location.origin}/billing?checkout=success`,
        cancelUrl: `${window.location.origin}/billing?checkout=cancel`,
      });
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start checkout');
    }
  };

  const handleOpenPortal = async () => {
    try {
      const result = await createPortal.mutateAsync({ returnUrl: `${window.location.origin}/billing` });
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open billing portal');
    }
  };

  if (orgLoading || plansLoading || overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading billing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <main className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-sm text-muted-foreground">Manage your workspace subscription and invoices.</p>
          </div>
          {showPlatformLink && (
            <Link to="/platform/billing">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Gestionar pagos de clientes
              </Button>
            </Link>
          )}
        </div>

        {checkoutResult === 'success' && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Checkout completed. Subscription status will update shortly.
          </div>
        )}

        {checkoutResult === 'cancel' && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Checkout was canceled.
          </div>
        )}

        {showPreselectedBanner && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
            <p className="font-medium">Complete your subscription</p>
            <p className="mt-1 text-muted-foreground">
              You selected the {preselectedPlan.name} plan. Click below to start your 7-day free trial.
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(overview?.subscription?.status)}>
                {statusLabel(overview?.subscription?.status)}
              </Badge>
              {currentPlan && <span className="text-sm text-muted-foreground">{currentPlan.name}</span>}
            </div>
            {overview?.subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Current period ends on {new Date(overview.subscription.current_period_end).toLocaleDateString(orgLocale, { timeZone: orgTimezone })}
              </p>
            )}
            {!hasAccess && (
              <p className="text-sm text-amber-700">Your workspace needs an active subscription to use prospecting and operations modules.</p>
            )}
            {access.reason === 'past_due_grace' && access.graceEndsAt && (
              <p className="text-sm text-amber-700">
                Past due grace active until {new Date(access.graceEndsAt).toLocaleDateString(orgLocale, { timeZone: orgTimezone })} ({getBillingPastDueGraceDays()} days).
              </p>
            )}
            {access.reason === 'past_due_expired' && access.graceEndsAt && (
              <p className="text-sm text-red-700">
                Grace period expired on {new Date(access.graceEndsAt).toLocaleDateString(orgLocale, { timeZone: orgTimezone })}. Update payment method to restore access.
              </p>
            )}
            <div>
              <Button
                variant="outline"
                onClick={handleOpenPortal}
                disabled={!canManageBilling || createPortal.isPending || !overview?.customer}
              >
                {createPortal.isPending ? 'Opening portal...' : 'Open customer portal'}
              </Button>
              {!canManageBilling && (
                <p className="text-xs text-muted-foreground mt-2">Only admin/manager can manage billing.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {currentPlan && (currentPlan.entity_limit != null || currentPlan.user_limit != null) && usage && (
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentPlan.entity_limit != null && (
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Entities</p>
                      <p className="text-sm text-muted-foreground">
                        {usage.entities} / {currentPlan.entity_limit}
                      </p>
                    </div>
                  </div>
                )}
                {currentPlan.user_limit != null && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Team members</p>
                      <p className="text-sm text-muted-foreground">
                        {usage.users} / {currentPlan.user_limit}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const isPreselected = preselectedPlan?.id === plan.id;
            return (
              <Card key={plan.id} className={isPreselected ? 'ring-2 ring-primary' : undefined}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{plan.name}</span>
                    <span className="flex gap-2">
                      {isPreselected && !isCurrent && <Badge variant="secondary">Selected</Badge>}
                      {isCurrent && <Badge>Current</Badge>}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold">
                    {formatMoney(plan.amount_cents, plan.currency, orgLocale)}
                    <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                  </div>
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!canManageBilling || createCheckout.isPending || isCurrent}
                  >
                    {createCheckout.isPending ? 'Redirecting...' : isCurrent ? 'Current plan' : 'Choose plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {overview?.invoices?.length ? (
              <div className="space-y-2">
                {overview.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                    <div>
                      <p className="font-medium">{invoice.invoice_number ?? invoice.stripe_invoice_id}</p>
                      <p className="text-muted-foreground">{new Date(invoice.created_at).toLocaleDateString(orgLocale, { timeZone: orgTimezone })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(invoice.amount_due_cents, invoice.currency, orgLocale)}</p>
                      <p className="text-muted-foreground capitalize">{invoice.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
