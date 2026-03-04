-- BILL-02A: Plan limits (entities, users per organization)
-- Enforces limits when org has an active/trialing subscription with a plan that defines limits.
-- Null limit = unlimited. No subscription = no enforcement (trial/new org).
-- SKIP if billing_plans does not exist (bill_01a not applied yet).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_plans') THEN
    RAISE NOTICE 'Skipping bill_02a: billing_plans table not found. Run supabase db push to apply all migrations including bill_01a.';
    RETURN;
  END IF;

  -- Add limit columns to billing_plans
  ALTER TABLE public.billing_plans
    ADD COLUMN IF NOT EXISTS entity_limit integer NULL CHECK (entity_limit IS NULL OR entity_limit >= 0),
    ADD COLUMN IF NOT EXISTS user_limit integer NULL CHECK (user_limit IS NULL OR user_limit >= 0);

  -- Get current plan limits for an org
  CREATE OR REPLACE FUNCTION public.get_org_plan_limits(p_org_id uuid)
  RETURNS TABLE (entity_limit integer, user_limit integer)
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    v_entity_limit integer;
    v_user_limit integer;
  BEGIN
    SELECT bp.entity_limit, bp.user_limit
    INTO v_entity_limit, v_user_limit
    FROM public.billing_subscriptions bs
    JOIN public.billing_plans bp ON bp.stripe_price_id = bs.stripe_price_id
    WHERE bs.organization_id = p_org_id
      AND bs.status IN ('active', 'trialing')
    ORDER BY bs.updated_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN;
    END IF;

    entity_limit := v_entity_limit;
    user_limit := v_user_limit;
    RETURN NEXT;
  END;
  $fn$;

  -- Check entity limit before insert (supports entities or pharmacies table)
  CREATE OR REPLACE FUNCTION public.check_entity_limit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    v_limit integer := NULL;
    v_count bigint;
  BEGIN
    SELECT l.entity_limit INTO v_limit
    FROM public.get_org_plan_limits(NEW.organization_id) l
    LIMIT 1;

    IF v_limit IS NULL THEN
      RETURN NEW;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entities') THEN
      SELECT COUNT(*) INTO v_count FROM public.entities WHERE organization_id = NEW.organization_id;
    ELSE
      SELECT COUNT(*) INTO v_count FROM public.pharmacies WHERE organization_id = NEW.organization_id;
    END IF;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'Organization has reached the entity limit (%) for your plan. Please upgrade.', v_limit;
    END IF;

    RETURN NEW;
  END;
  $fn$;

  -- Check user limit before insert
  CREATE OR REPLACE FUNCTION public.check_user_limit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    v_limit integer := NULL;
    v_count bigint;
  BEGIN
    SELECT l.user_limit INTO v_limit
    FROM public.get_org_plan_limits(NEW.organization_id) l
    LIMIT 1;

    IF v_limit IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM public.organization_members
    WHERE organization_id = NEW.organization_id
      AND status IN ('active', 'invited');

    IF v_count + 1 > v_limit THEN
      RAISE EXCEPTION 'Organization has reached the user limit (%) for your plan. Please upgrade.', v_limit;
    END IF;

    RETURN NEW;
  END;
  $fn$;

  -- Triggers on entities (or pharmacies)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entities') THEN
    DROP TRIGGER IF EXISTS check_entity_limit_trigger ON public.entities;
    CREATE TRIGGER check_entity_limit_trigger
      BEFORE INSERT ON public.entities
      FOR EACH ROW EXECUTE FUNCTION public.check_entity_limit();
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pharmacies') THEN
    DROP TRIGGER IF EXISTS check_entity_limit_trigger ON public.pharmacies;
    CREATE TRIGGER check_entity_limit_trigger
      BEFORE INSERT ON public.pharmacies
      FOR EACH ROW EXECUTE FUNCTION public.check_entity_limit();
  END IF;

  DROP TRIGGER IF EXISTS check_user_limit_trigger ON public.organization_members;
  CREATE TRIGGER check_user_limit_trigger
    BEFORE INSERT ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.check_user_limit();

  -- Update existing plans with default limits
  UPDATE public.billing_plans SET entity_limit = 500, user_limit = 1 WHERE LOWER(code) = 'starter';
  UPDATE public.billing_plans SET entity_limit = 2000, user_limit = 5 WHERE LOWER(code) = 'pro';
  UPDATE public.billing_plans SET entity_limit = NULL, user_limit = NULL WHERE LOWER(code) = 'enterprise';
END
$$;
