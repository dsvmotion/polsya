-- Add Business plan between Pro and Enterprise.
-- Create Stripe Product/Price for Business, then update stripe_price_id.
-- See docs/STRIPE_SETUP.md.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_plans') THEN
    RAISE NOTICE 'Skipping: billing_plans table not found.';
    RETURN;
  END IF;

  INSERT INTO public.billing_plans (code, name, description, stripe_price_id, amount_cents, currency, interval, entity_limit, user_limit)
  VALUES (
    'business',
    'Business',
    'For scaling B2B teams with advanced needs',
    'price_business_placeholder',
    14900,
    'eur',
    'month',
    10000,
    15
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    amount_cents = EXCLUDED.amount_cents,
    entity_limit = EXCLUDED.entity_limit,
    user_limit = EXCLUDED.user_limit;
END
$$;
