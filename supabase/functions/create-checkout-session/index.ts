import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { stripeFormPost } from '../_shared/stripe.ts';

type CheckoutSessionResponse = {
  id: string;
  url: string;
};

type StripeCustomerResponse = {
  id: string;
};

function isValidHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  const auth = await requireOrgRoleAccess(req, {
    action: 'stripe_create_checkout_session',
    allowedRoles: ['admin', 'manager'],
    allowlistEnvKey: 'STRIPE_BILLING_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json().catch(() => ({}));
    const planId = typeof body.planId === 'string' ? body.planId : '';

    if (!planId) {
      return new Response(JSON.stringify({ error: 'Missing required field: planId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('billing_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError) {
      return new Response(JSON.stringify({ error: `Failed to load plan: ${planError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? origin;
    const successUrl = isValidHttpUrl(body.successUrl) ? body.successUrl : `${appBaseUrl}/billing?checkout=success`;
    const cancelUrl = isValidHttpUrl(body.cancelUrl) ? body.cancelUrl : `${appBaseUrl}/billing?checkout=cancel`;

    if (!isValidHttpUrl(successUrl) || !isValidHttpUrl(cancelUrl)) {
      return new Response(JSON.stringify({ error: 'Invalid success/cancel URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingCustomer, error: customerLookupError } = await supabaseAdmin
      .from('billing_customers')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (customerLookupError) {
      return new Response(JSON.stringify({ error: `Failed to resolve billing customer: ${customerLookupError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let stripeCustomerId = existingCustomer?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const { data: organization } = await supabaseAdmin
        .from('organizations')
        .select('name, slug')
        .eq('id', auth.organizationId)
        .maybeSingle();

      const customerParams = new URLSearchParams();
      customerParams.set('name', organization?.name ?? 'Workspace');
      if (auth.user.email) customerParams.set('email', auth.user.email);
      customerParams.set('metadata[organization_id]', auth.organizationId);
      customerParams.set('metadata[workspace_slug]', organization?.slug ?? '');

      const stripeCustomer = await stripeFormPost<StripeCustomerResponse>(
        '/customers',
        customerParams,
        'stripe_create_customer',
      );

      if (!stripeCustomer.ok) {
        return new Response(JSON.stringify({ error: stripeCustomer.error }), {
          status: stripeCustomer.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      stripeCustomerId = stripeCustomer.data.id;

      const { error: upsertCustomerError } = await supabaseAdmin
        .from('billing_customers')
        .upsert(
          {
            organization_id: auth.organizationId,
            stripe_customer_id: stripeCustomerId,
            email: auth.user.email ?? null,
            name: organization?.name ?? null,
          },
          { onConflict: 'organization_id' },
        );

      if (upsertCustomerError) {
        return new Response(JSON.stringify({ error: `Failed to save billing customer: ${upsertCustomerError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer', stripeCustomerId);
    params.set('line_items[0][price]', plan.stripe_price_id);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('client_reference_id', auth.organizationId);
    params.set('allow_promotion_codes', 'true');
    params.set('metadata[organization_id]', auth.organizationId);
    params.set('metadata[requested_by]', auth.user.id);
    params.set('subscription_data[metadata][organization_id]', auth.organizationId);
    params.set('subscription_data[metadata][requested_by]', auth.user.id);

    const checkout = await stripeFormPost<CheckoutSessionResponse>(
      '/checkout/sessions',
      params,
      'stripe_create_checkout_session',
    );

    if (!checkout.ok) {
      return new Response(JSON.stringify({ error: checkout.error }), {
        status: checkout.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sessionId: checkout.data.id, url: checkout.data.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(JSON.stringify({ action: 'stripe_create_checkout_session', error: String(error) }));
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
