# Configuración de Stripe para Polsya

Para que Checkout y Customer Portal funcionen, debes crear Products y Prices en Stripe y actualizar `billing_plans` con los IDs reales.

---

## 1. Crear Products y Prices en Stripe Dashboard

1. Entra en [Stripe Dashboard](https://dashboard.stripe.com) → **Products** → **Add product**.

2. **Producto Starter**
   - Name: `Polsya Starter`
   - Description: opcional
   - Pricing: **Recurring** → **Monthly** → precio (ej. 29€)
   - Crea el producto. En la sección **Pricing**, anota el **Price ID** (formato `price_1ABC123...`).

3. **Producto Pro**
   - Repite con `Polsya Pro`, precio (ej. 79€/mes).
   - Anota el Price ID.

4. **Producto Business**
   - Repite con `Polsya Business`, precio (ej. 149€/mes).
   - Anota el Price ID.
   - La migración `bill_business_plan` inserta el plan; actualiza `stripe_price_id` tras crear el Price en Stripe.

5. (Opcional) **Producto Enterprise** — para "Contact sales" no necesitas Price, solo el plan en la UI.

---

## 2. Actualizar billing_plans en Supabase

La migración `bill_seed_plans` inserta los planes con placeholders. Debes reemplazar los `stripe_price_id` con los Price IDs reales.

**Opción A – SQL en Supabase Dashboard**

Ve a **SQL Editor** y ejecuta:

```sql
UPDATE public.billing_plans SET stripe_price_id = 'price_XXXXXXXXXXXX' WHERE code = 'starter';
UPDATE public.billing_plans SET stripe_price_id = 'price_YYYYYYYYYYYY' WHERE code = 'pro';
UPDATE public.billing_plans SET stripe_price_id = 'price_ZZZZZZZZZZZZ' WHERE code = 'business';
```

Sustituye los placeholders por los Price IDs que copiaste de Stripe.

**Opción B – Si usas modo Test/Live**

- En Test mode, los IDs empiezan por `price_` y son distintos a los de Live.
- Tras cambiar a Live, vuelve a ejecutar los `UPDATE` con los Price IDs de Live.

---

## 3. Variables de entorno para Edge Functions

En Supabase Dashboard → **Edge Functions** → **Secrets** (o tu `.env` local para `supabase functions serve`):

| Variable | Descripción |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Secret key de Stripe (sk_test_... o sk_live_...) |
| `APP_BASE_URL` | URL de tu app (ej. `https://polsya.com` o `http://localhost:5173`) |
| `BILLING_TRIAL_DAYS` | Días de trial (opcional, por defecto 7) |

Las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` suelen estar ya configuradas.

---

## 4. Desplegar Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-customer-portal-session
supabase functions deploy stripe-webhook
```

---

## 5. Webhook de Stripe

1. En Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. URL: `https://<TU_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
3. Eventos a suscribir:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copia el **Signing secret** (whsec_...) y añádelo en Supabase Edge Functions como `STRIPE_WEBHOOK_SECRET`.

---

## 6. Verificación rápida

1. Login en la app → ir a `/billing`.
2. Clic en "Subscribe" en un plan.
3. Deberías ser redirigido a Stripe Checkout.
4. Tras completar (o cancelar), volver a `/billing`.

Si ves errores como "No such price", revisa que los `stripe_price_id` en `billing_plans` coincidan con los Price IDs de tu proyecto Stripe (y modo Test/Live correcto).

---

## 7. Emails (factura, recibo, pago fallido)

Ver [STRIPE_EMAILS.md](./STRIPE_EMAILS.md) para configurar los emails automáticos de Stripe.
