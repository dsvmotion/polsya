import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import type {
  BillingCustomer,
  BillingInvoice,
  BillingOverview,
  BillingPlan,
  BillingSubscription,
  BillingSubscriptionStatus,
  BillingInvoiceStatus,
} from '@/types/billing';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const BILLING_ACTIVE_STATUSES: BillingSubscriptionStatus[] = ['active', 'trialing', 'past_due', 'unpaid'];

export function hasBillingAccess(status: BillingSubscriptionStatus | null | undefined): boolean {
  return !!status && BILLING_ACTIVE_STATUSES.includes(status);
}

export function useBillingPlans() {
  return useQuery<BillingPlan[]>({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('amount_cents', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as BillingPlan[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBillingOverview(organizationId: string | null) {
  return useQuery<BillingOverview>({
    queryKey: ['billing-overview', organizationId ?? ''],
    enabled: !!organizationId,
    queryFn: async () => {
      const [{ data: customer, error: customerError }, { data: subscriptions, error: subscriptionError }, { data: invoices, error: invoiceError }] = await Promise.all([
        supabase
          .from('billing_customers')
          .select('*')
          .eq('organization_id', organizationId!)
          .maybeSingle(),
        supabase
          .from('billing_subscriptions')
          .select('*')
          .eq('organization_id', organizationId!)
          .order('updated_at', { ascending: false })
          .limit(1),
        supabase
          .from('billing_invoices')
          .select('*')
          .eq('organization_id', organizationId!)
          .order('created_at', { ascending: false })
          .limit(25),
      ]);

      if (customerError) throw new Error(customerError.message);
      if (subscriptionError) throw new Error(subscriptionError.message);
      if (invoiceError) throw new Error(invoiceError.message);

      return {
        customer: (customer ?? null) as BillingCustomer | null,
        subscription: ((subscriptions ?? [])[0] ?? null) as BillingSubscription | null,
        invoices: (invoices ?? []) as BillingInvoice[],
      };
    },
  });
}

export function useUpsertBillingCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      organizationId: string;
      stripeCustomerId: string;
      email?: string | null;
      name?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('billing_customers')
        .upsert(
          {
            organization_id: input.organizationId,
            stripe_customer_id: input.stripeCustomerId,
            email: input.email ?? null,
            name: input.name ?? null,
          },
          { onConflict: 'organization_id' },
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as BillingCustomer;
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview', customer.organization_id] });
    },
  });
}

export function useUpsertBillingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      organizationId: string;
      stripeSubscriptionId: string;
      stripePriceId: string;
      status: BillingSubscriptionStatus;
      currentPeriodStart?: string | null;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: string | null;
      trialEnd?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .upsert(
          {
            organization_id: input.organizationId,
            stripe_subscription_id: input.stripeSubscriptionId,
            stripe_price_id: input.stripePriceId,
            status: input.status,
            current_period_start: input.currentPeriodStart ?? null,
            current_period_end: input.currentPeriodEnd ?? null,
            cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
            canceled_at: input.canceledAt ?? null,
            trial_end: input.trialEnd ?? null,
            metadata: ((input.metadata ?? {}) as unknown) as Json,
          },
          { onConflict: 'stripe_subscription_id' },
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as BillingSubscription;
    },
    onSuccess: (subscription) => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview', subscription.organization_id] });
    },
  });
}

export function useUpsertBillingInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      organizationId: string;
      stripeInvoiceId: string;
      subscriptionId?: string | null;
      invoiceNumber?: string | null;
      status: BillingInvoiceStatus;
      currency: string;
      amountDueCents: number;
      amountPaidCents: number;
      hostedInvoiceUrl?: string | null;
      invoicePdfUrl?: string | null;
      periodStart?: string | null;
      periodEnd?: string | null;
      dueDate?: string | null;
      paidAt?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('billing_invoices')
        .upsert(
          {
            organization_id: input.organizationId,
            stripe_invoice_id: input.stripeInvoiceId,
            subscription_id: input.subscriptionId ?? null,
            invoice_number: input.invoiceNumber ?? null,
            status: input.status,
            currency: input.currency,
            amount_due_cents: input.amountDueCents,
            amount_paid_cents: input.amountPaidCents,
            hosted_invoice_url: input.hostedInvoiceUrl ?? null,
            invoice_pdf_url: input.invoicePdfUrl ?? null,
            period_start: input.periodStart ?? null,
            period_end: input.periodEnd ?? null,
            due_date: input.dueDate ?? null,
            paid_at: input.paidAt ?? null,
          },
          { onConflict: 'stripe_invoice_id' },
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as BillingInvoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview', invoice.organization_id] });
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (input: {
      planId: string;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Checkout session failed: ${response.status}`);
      }

      return body as { sessionId: string; url: string };
    },
  });
}

export function useCreateCustomerPortalSession() {
  return useMutation({
    mutationFn: async (input?: { returnUrl?: string }) => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-customer-portal-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input ?? {}),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Customer portal session failed: ${response.status}`);
      }

      return body as { sessionId: string; url: string };
    },
  });
}
