import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { stripeFormPost } from '../_shared/stripe.ts';

type PortalSessionResponse = {
  id: string;
  url: string;
};

function isValidHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
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
    action: 'stripe_create_customer_portal_session',
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
    const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? origin;
    const returnUrl = isValidHttpUrl(body.returnUrl) ? body.returnUrl : `${appBaseUrl}/billing`;

    if (!isValidHttpUrl(returnUrl)) {
      return new Response(JSON.stringify({ error: 'Invalid return URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (customerError) {
      return new Response(JSON.stringify({ error: `Failed to resolve billing customer: ${customerError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!customer?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found for this organization' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams();
    params.set('customer', customer.stripe_customer_id);
    params.set('return_url', returnUrl);

    const portal = await stripeFormPost<PortalSessionResponse>(
      '/billing_portal/sessions',
      params,
      'stripe_create_customer_portal_session',
    );

    if (!portal.ok) {
      return new Response(JSON.stringify({ error: portal.error }), {
        status: portal.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sessionId: portal.data.id, url: portal.data.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(JSON.stringify({ action: 'stripe_create_customer_portal_session', error: String(error) }));
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
