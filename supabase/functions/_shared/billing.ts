import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type BillingSubscriptionRow = {
  status: string;
  current_period_end: string | null;
};

type BillingAccessReason =
  | 'active'
  | 'trialing'
  | 'past_due_grace'
  | 'past_due_expired'
  | 'no_subscription'
  | 'blocked_status';

type BillingAccessDecision = {
  hasAccess: boolean;
  reason: BillingAccessReason;
  graceEndsAt: string | null;
};

type BillingAccessFailure = {
  ok: false;
  response: Response;
};

type BillingAccessSuccess = {
  ok: true;
  decision: BillingAccessDecision;
};

export type BillingAccessResult = BillingAccessFailure | BillingAccessSuccess;

interface BillingAccessOptions {
  action: string;
  corsHeaders: Record<string, string>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseGraceDays(): number {
  const raw = Number(Deno.env.get('BILLING_PAST_DUE_GRACE_DAYS') ?? '7');
  if (!Number.isFinite(raw) || raw < 0) return 7;
  return Math.floor(raw);
}

function evaluateBillingAccess(
  subscription: BillingSubscriptionRow | null,
  nowMs: number = Date.now(),
): BillingAccessDecision {
  if (!subscription) {
    // No subscription = free tier / trial — allow access by default.
    // When billing is enforced, create a subscription record with the appropriate status.
    return { hasAccess: true, reason: 'no_subscription', graceEndsAt: null };
  }

  if (subscription.status === 'active') {
    return { hasAccess: true, reason: 'active', graceEndsAt: null };
  }

  if (subscription.status === 'trialing') {
    return { hasAccess: true, reason: 'trialing', graceEndsAt: null };
  }

  if (subscription.status === 'past_due') {
    const periodEndMs = subscription.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : nowMs;
    const graceEndsMs = periodEndMs + parseGraceDays() * DAY_MS;
    const graceEndsAt = new Date(graceEndsMs).toISOString();

    if (nowMs <= graceEndsMs) {
      return { hasAccess: true, reason: 'past_due_grace', graceEndsAt };
    }

    return { hasAccess: false, reason: 'past_due_expired', graceEndsAt };
  }

  return { hasAccess: false, reason: 'blocked_status', graceEndsAt: null };
}

export async function requireBillingAccessForOrg(
  supabaseAdmin: SupabaseClient,
  organizationId: string,
  options: BillingAccessOptions,
): Promise<BillingAccessResult> {
  const { action, corsHeaders } = options;
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  const { data: subscriptions, error } = await supabaseAdmin
    .from('billing_subscriptions')
    .select('status, current_period_end')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error(
      JSON.stringify({
        action,
        organization_id: organizationId,
        allowed: false,
        reason: 'billing_lookup_failed',
        error: error.message,
      }),
    );

    return {
      ok: false,
      response: new Response(JSON.stringify({ error: `Could not verify billing access: ${error.message}` }), {
        status: 500,
        headers,
      }),
    };
  }

  const subscription = ((subscriptions ?? [])[0] ?? null) as BillingSubscriptionRow | null;
  const decision = evaluateBillingAccess(subscription);

  if (!decision.hasAccess) {
    console.log(
      JSON.stringify({
        action,
        organization_id: organizationId,
        allowed: false,
        reason: 'billing_blocked',
        billing_reason: decision.reason,
        grace_ends_at: decision.graceEndsAt,
      }),
    );

    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: 'Billing access required for this module',
          billingReason: decision.reason,
          graceEndsAt: decision.graceEndsAt,
        }),
        {
          status: 402,
          headers,
        },
      ),
    };
  }

  return { ok: true, decision };
}
