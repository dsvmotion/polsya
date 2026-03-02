import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/auth/UserMenu';
import {
  evaluateBillingAccess,
  getBillingPastDueGraceDays,
  useBillingOverview,
  useBillingPlans,
  useCreateCheckoutSession,
  useCreateCustomerPortalSession,
} from '@/hooks/useBilling';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { BillingSubscriptionStatus } from '@/types/billing';

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
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
  const { organization, membership, isLoading: orgLoading } = useCurrentOrganization();
  const { data: plans = [], isLoading: plansLoading } = useBillingPlans();
  const { data: overview, isLoading: overviewLoading } = useBillingOverview(organization?.id ?? null);
  const createCheckout = useCreateCheckoutSession();
  const createPortal = useCreateCustomerPortalSession();

  const checkoutResult = searchParams.get('checkout');
  const canManageBilling = membership?.role === 'admin' || membership?.role === 'manager';

  const currentPlan = useMemo(() => {
    if (!overview?.subscription) return null;
    return plans.find((p) => p.stripe_price_id === overview.subscription?.stripe_price_id) ?? null;
  }, [overview?.subscription, plans]);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading billing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 bg-gray-50 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <UserMenu />
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500">Manage your workspace subscription and invoices.</p>
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

        <Card className="border-gray-200">
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
              {currentPlan && <span className="text-sm text-gray-600">{currentPlan.name}</span>}
            </div>
            {overview?.subscription?.current_period_end && (
              <p className="text-sm text-gray-500">
                Current period ends on {new Date(overview.subscription.current_period_end).toLocaleDateString('es-ES')}
              </p>
            )}
            {!hasAccess && (
              <p className="text-sm text-amber-700">Your workspace needs an active subscription to use prospecting and operations modules.</p>
            )}
            {access.reason === 'past_due_grace' && access.graceEndsAt && (
              <p className="text-sm text-amber-700">
                Past due grace active until {new Date(access.graceEndsAt).toLocaleDateString('es-ES')} ({getBillingPastDueGraceDays()} days).
              </p>
            )}
            {access.reason === 'past_due_expired' && access.graceEndsAt && (
              <p className="text-sm text-red-700">
                Grace period expired on {new Date(access.graceEndsAt).toLocaleDateString('es-ES')}. Update payment method to restore access.
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
                <p className="text-xs text-gray-500 mt-2">Only admin/manager can manage billing.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            return (
              <Card key={plan.id} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.name}</span>
                    {isCurrent && <Badge>Current</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatMoney(plan.amount_cents, plan.currency)}
                    <span className="text-sm text-gray-500">/{plan.interval}</span>
                  </div>
                  {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
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

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Recent invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {overview?.invoices?.length ? (
              <div className="space-y-2">
                {overview.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoice_number ?? invoice.stripe_invoice_id}</p>
                      <p className="text-gray-500">{new Date(invoice.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatMoney(invoice.amount_due_cents, invoice.currency)}</p>
                      <p className="text-gray-500 capitalize">{invoice.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No invoices yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
