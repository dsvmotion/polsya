-- Seed billing_plans for Starter and Pro (Enterprise = contact only, no plan row).
-- stripe_price_id must be replaced with real Stripe Price IDs after creating Products in Stripe Dashboard.
-- See docs/STRIPE_SETUP.md for instructions.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_plans') THEN
    RAISE NOTICE 'Skipping bill_seed_plans: billing_plans table not found. Run supabase db push to apply bill_01a first.';
    RETURN;
  END IF;

  INSERT INTO public.billing_plans (code, name, description, stripe_price_id, amount_cents, currency, interval, entity_limit, user_limit)
  VALUES
    ('starter', 'Starter', 'For individuals and small teams', 'price_starter_placeholder', 2900, 'eur', 'month', 500, 1),
    ('pro', 'Pro', 'For growing teams that need more power', 'price_pro_placeholder', 7900, 'eur', 'month', 2000, 5)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    amount_cents = EXCLUDED.amount_cents,
    entity_limit = COALESCE(billing_plans.entity_limit, EXCLUDED.entity_limit),
    user_limit = COALESCE(billing_plans.user_limit, EXCLUDED.user_limit);
END
$$;
