import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { stripeGet } from '../_shared/stripe.ts';
import {
  normalizeInvoiceStatus,
  normalizeSubscriptionStatus,
  verifyStripeWebhookSignature,
} from '../_shared/stripe-billing.ts';

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
  created: number;
};

type StripeSubscription = {
  id: string;
  customer: string | { id: string };
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
  trial_end?: number | null;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{ price?: { id?: string } }>;
  };
};

type StripeInvoice = {
  id: string;
  number?: string | null;
  customer?: string | { id: string };
  subscription?: string | { id: string } | null;
  status?: string;
  currency?: string;
  amount_due?: number;
  amount_paid?: number;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  period_start?: number;
  period_end?: number;
  due_date?: number | null;
  status_transitions?: {
    paid_at?: number | null;
  };
  metadata?: Record<string, string>;
};

type StripeCheckoutSession = {
  id: string;
  customer?: string | { id: string };
  subscription?: string | { id: string };
  client_reference_id?: string | null;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
  };
  metadata?: Record<string, string>;
};

function unixToIso(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function extractObjectId(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' && id ? id : null;
  }
  return null;
}

async function resolveOrganizationIdByCustomer(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (!stripeCustomerId) return null;

  const { data, error } = await supabaseAdmin
    .from('billing_customers')
    .select('organization_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve billing customer: ${error.message}`);
  }

  return data?.organization_id ?? null;
}

async function resolveLocalSubscriptionId(
  supabaseAdmin: ReturnType<typeof createClient>,
  organizationId: string,
  stripeSubscriptionId: string | null,
): Promise<string | null> {
  if (!stripeSubscriptionId) return null;

  const { data, error } = await supabaseAdmin
    .from('billing_subscriptions')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve local subscription: ${error.message}`);
  }

  return data?.id ?? null;
}

async function upsertBillingSubscription(
  supabaseAdmin: ReturnType<typeof createClient>,
  organizationId: string,
  subscription: StripeSubscription,
): Promise<void> {
  let stripePriceId = subscription.items?.data?.[0]?.price?.id ?? null;

  if (!stripePriceId) {
    const { data: existing } = await supabaseAdmin
      .from('billing_subscriptions')
      .select('stripe_price_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    stripePriceId = existing?.stripe_price_id ?? null;
  }

  if (!stripePriceId) {
    throw new Error(`Subscription ${subscription.id} missing stripe price id`);
  }

  const { error } = await supabaseAdmin
    .from('billing_subscriptions')
    .upsert(
      {
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: stripePriceId,
        status: normalizeSubscriptionStatus(subscription.status),
        current_period_start: unixToIso(subscription.current_period_start),
        current_period_end: unixToIso(subscription.current_period_end),
        cancel_at_period_end: !!subscription.cancel_at_period_end,
        canceled_at: unixToIso(subscription.canceled_at),
        trial_end: unixToIso(subscription.trial_end),
        metadata: subscription.metadata ?? {},
      },
      { onConflict: 'stripe_subscription_id' },
    );

  if (error) {
    throw new Error(`Failed to upsert billing subscription: ${error.message}`);
  }
}

async function upsertBillingInvoice(
  supabaseAdmin: ReturnType<typeof createClient>,
  organizationId: string,
  invoice: StripeInvoice,
): Promise<void> {
  const stripeSubscriptionId = extractObjectId(invoice.subscription);
  const localSubscriptionId = await resolveLocalSubscriptionId(
    supabaseAdmin,
    organizationId,
    stripeSubscriptionId,
  );

  const { error } = await supabaseAdmin
    .from('billing_invoices')
    .upsert(
      {
        organization_id: organizationId,
        subscription_id: localSubscriptionId,
        stripe_invoice_id: invoice.id,
        invoice_number: invoice.number ?? null,
        status: normalizeInvoiceStatus(invoice.status),
        currency: (invoice.currency ?? 'eur').toLowerCase(),
        amount_due_cents: invoice.amount_due ?? 0,
        amount_paid_cents: invoice.amount_paid ?? 0,
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf_url: invoice.invoice_pdf ?? null,
        period_start: unixToIso(invoice.period_start),
        period_end: unixToIso(invoice.period_end),
        due_date: unixToIso(invoice.due_date),
        paid_at: unixToIso(invoice.status_transitions?.paid_at),
      },
      { onConflict: 'stripe_invoice_id' },
    );

  if (error) {
    throw new Error(`Failed to upsert billing invoice: ${error.message}`);
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe webhook secret is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const signatureHeader = req.headers.get('Stripe-Signature') ?? '';
  if (!signatureHeader) {
    return new Response(JSON.stringify({ error: 'Missing Stripe-Signature header' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  const signatureCheck = await verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret);

  if (!signatureCheck.ok) {
    console.log(JSON.stringify({ action: 'stripe_webhook', allowed: false, reason: signatureCheck.reason }));
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let event: StripeEvent | null = null;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error: ledgerInsertError } = await supabaseAdmin
    .from('billing_webhook_events')
    .insert({
      id: event.id,
      provider: 'stripe',
      event_type: event.type,
      processing_status: 'processing',
      payload: event as unknown as Record<string, unknown>,
      received_at: new Date().toISOString(),
    });

  if (ledgerInsertError) {
    const code = (ledgerInsertError as { code?: string }).code;
    if (code === '23505') {
      console.log(JSON.stringify({ action: 'stripe_webhook', event: event.type, event_id: event.id, duplicate: true }));
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Failed to log webhook event: ${ledgerInsertError.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    let handled = false;
    let resolvedOrganizationId: string | null = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        handled = true;
        const session = event.data.object as unknown as StripeCheckoutSession;
        const organizationId =
          session.client_reference_id ?? session.metadata?.organization_id ?? null;
        resolvedOrganizationId = organizationId;

        if (!organizationId) {
          console.log(JSON.stringify({ action: 'stripe_webhook', event: event.type, event_id: event.id, handled: false, reason: 'missing_organization_id' }));
          break;
        }

        const stripeCustomerId = extractObjectId(session.customer);
        if (stripeCustomerId) {
          const { error: customerError } = await supabaseAdmin
            .from('billing_customers')
            .upsert(
              {
                organization_id: organizationId,
                stripe_customer_id: stripeCustomerId,
                email: session.customer_details?.email ?? session.customer_email ?? null,
                name: session.customer_details?.name ?? null,
              },
              { onConflict: 'organization_id' },
            );

          if (customerError) {
            throw new Error(`Failed to upsert billing customer from checkout: ${customerError.message}`);
          }
        }

        const stripeSubscriptionId = extractObjectId(session.subscription);
        if (stripeSubscriptionId) {
          const stripeSubscription = await stripeGet<StripeSubscription>(
            `/subscriptions/${encodeURIComponent(stripeSubscriptionId)}`,
            'stripe_webhook_fetch_subscription',
          );

          if (!stripeSubscription.ok) {
            throw new Error(stripeSubscription.error);
          }

          await upsertBillingSubscription(supabaseAdmin, organizationId, stripeSubscription.data);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.created': {
        handled = true;
        const subscription = event.data.object as unknown as StripeSubscription;
        const stripeCustomerId = extractObjectId(subscription.customer);

        const organizationId =
          subscription.metadata?.organization_id ??
          (await resolveOrganizationIdByCustomer(supabaseAdmin, stripeCustomerId));
        resolvedOrganizationId = organizationId;

        if (!organizationId) {
          console.log(JSON.stringify({ action: 'stripe_webhook', event: event.type, event_id: event.id, handled: false, reason: 'organization_not_found' }));
          break;
        }

        if (event.type === 'customer.subscription.deleted') {
          subscription.status = 'canceled';
        }

        await upsertBillingSubscription(supabaseAdmin, organizationId, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        handled = true;
        const invoice = event.data.object as unknown as StripeInvoice;
        const stripeCustomerId = extractObjectId(invoice.customer);

        const organizationId =
          invoice.metadata?.organization_id ??
          (await resolveOrganizationIdByCustomer(supabaseAdmin, stripeCustomerId));
        resolvedOrganizationId = organizationId;

        if (!organizationId) {
          console.log(JSON.stringify({ action: 'stripe_webhook', event: event.type, event_id: event.id, handled: false, reason: 'organization_not_found' }));
          break;
        }

        await upsertBillingInvoice(supabaseAdmin, organizationId, invoice);

        const stripeSubscriptionId = extractObjectId(invoice.subscription);
        if (stripeSubscriptionId) {
          const { error: updateSubError } = await supabaseAdmin
            .from('billing_subscriptions')
            .update({ status: 'past_due' })
            .eq('organization_id', organizationId)
            .eq('stripe_subscription_id', stripeSubscriptionId);

          if (updateSubError) {
            throw new Error(`Failed to mark subscription as past_due: ${updateSubError.message}`);
          }
        }
        break;
      }

      default:
        break;
    }

    await supabaseAdmin
      .from('billing_webhook_events')
      .update({
        organization_id: resolvedOrganizationId,
        processing_status: handled ? 'processed' : 'ignored',
        processed_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    console.log(JSON.stringify({ action: 'stripe_webhook', event: event.type, event_id: event.id, handled }));
    return new Response(JSON.stringify({ received: true, handled }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await supabaseAdmin
      .from('billing_webhook_events')
      .update({
        processing_status: 'error',
        error_message: error instanceof Error ? error.message : String(error),
        processed_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    console.error(JSON.stringify({ action: 'stripe_webhook', event: event.type, event_id: event.id, error: String(error) }));
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
