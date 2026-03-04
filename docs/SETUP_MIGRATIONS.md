# Configuración de Supabase y Migraciones

## Resolver errores 404 (tablas no encontradas)

Si ves en consola errores como:
- `entity_types 404 (Not Found)`
- `billing_plans 404 (Not Found)`
- `billing_customers 404 (Not Found)`

**Causa:** Las migraciones no están aplicadas en tu proyecto Supabase remoto.

### Pasos para aplicar migraciones

1. **Instalar Supabase CLI** (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

2. **Enlazar tu proyecto remoto** (desde la raíz del proyecto):
   ```bash
   supabase link --project-ref taetxohwuuzufmkzpzhb
   ```
   Te pedirá la contraseña de la base de datos (la encuentras en Supabase Dashboard → Settings → Database).

3. **Aplicar todas las migraciones**:
   ```bash
   supabase db push
   ```

4. **Verificar** que las tablas existen en Supabase Dashboard → Table Editor:
   - `organizations`, `organization_members`
   - `entity_types`, `entities` (antiguo `pharmacies`)
   - `billing_plans`, `billing_customers`, `billing_subscriptions`, `billing_invoices`
   - `contact_messages` (formulario de contacto público)

---

## Resolver errores 401 en Edge Functions

Si ves `woocommerce-orders-detailed 401 (Unauthorized)` o similar:

1. **Las migraciones deben estar aplicadas** (sobre todo `organization_members`), ya que las funciones validan tu membresía.

2. **Comprueba que estás logueado** antes de cargar el Dashboard.

3. **Variables de entorno en Edge Functions** (Supabase Dashboard → Edge Functions → Secrets):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (suelen estar por defecto)
   - Para WooCommerce: `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`

4. **Desplegar Edge Functions** si usas proyecto remoto:
   ```bash
   supabase functions deploy woocommerce-orders-detailed
   supabase functions deploy woocommerce-orders
   supabase functions deploy process-integration-sync-jobs
   # ... y el resto de funciones que uses
   ```

---

## Perfiles de usuario (OWNER/DEVELOPER vs usuarios/empresas)

La arquitectura actual usa:
- **organization_members.role**: `admin`, `manager`, `rep`, `ops` (roles dentro de una organización).
- **auth.users.app_metadata**: se puede extender para roles a nivel plataforma.

### Propuesta para OWNER/DEVELOPER

Para distinguir administradores de plataforma de usuarios normales:

1. **Añadir rol de plataforma** en `auth.users.app_metadata`:
   - `owner` / `developer` → acceso total, todas las orgs, configuración del sistema.
   - Sin rol o `user` → usuarios normales, solo su organización.

2. **Implementación sugerida**:
   - Trigger o proceso en signup que asigne `app_metadata.role = 'owner'` o `'developer'` a usuarios en una allowlist (por email o user_id).
   - Las Edge Functions ya usan `allowlistEnvKey` (ej. `WOOCOMMERCE_ALLOWED_USER_IDS`) para usuarios privilegiados.
   - Ampliar `authz-policy.ts` para considerar `app_metadata.role` en las comprobaciones.

3. **Privacidad y seguridad**:
   - RLS ya aísla datos por `organization_id`.
   - Los roles `owner`/`developer` podrían usar `service_role` o bypass RLS solo en operaciones admin (logs, backfills, etc.).
   - Los usuarios normales nunca ven datos de otras organizaciones.

### Cómo configurar platform owner (implementado)

Para que un usuario sea administrador de plataforma (acceso a `/platform`, gestión de pagos de clientes):

**Opción A – app_metadata (recomendado):** En Supabase Dashboard → Authentication → Users → tu usuario → editar `app_metadata`:
```json
{ "role": "platform_owner" }
```
También valen: `owner`, `developer`, `platform_admin`.

**Opción B – Variable de entorno:** En tu `.env`:
```
VITE_PLATFORM_OWNER_EMAILS=tu@email.com,otro@email.com
```
Lista de emails separados por comas (case-insensitive).

Los platform owners:
- No requieren suscripción (no ven el banner de suscripción)
- Acceden al dashboard de plataforma en `/platform`
- Gestionan pagos de clientes en `/platform/billing`
- Ven enlace "Platform Admin" en el menú de usuario cuando usan el CRM

---

## Modelo de suscripciones (no bloqueante)

La web **nunca bloquea** el acceso. Principios:

- **Platform owners:** Acceso total sin comprobaciones de pago.
- **Clientes sin suscripción:** Acceso completo. Pueden suscribirse desde `/billing` cuando quieran.
- **Suscripción activa/trial:** Acceso completo.
- **Impago (past_due):** 7 días de cortesía con acceso completo. Tras la cortesía, se muestra un banner de aviso (no se bloquea el uso).
- **Cancelada/vencida:** Banner de aviso con enlace a Billing. La app sigue funcionando.

El banner (`SubscriptionBanner`) es informativo y se puede cerrar. El periodo de cortesía se configura con `VITE_BILLING_PAST_DUE_GRACE_DAYS` (por defecto 7).

---

## Orden de migraciones (referencia)

Las migraciones se aplican por timestamp. Orden aproximado:

1. `arch_02a` – organizaciones, members, RLS base
2. `arch_03b` – entity_types
3. `bill_01a` – billing_plans, billing_customers, billing_subscriptions, billing_invoices
4. `gen_01a` – entities (renombrado de pharmacies), vistas compatibles
5. … resto de migraciones

 `supabase db push` aplica todas en el orden correcto.

---

## Planes de facturación y Stripe (para /pricing y /billing)

Para que la página `/pricing` muestre botones "Subscribe" en lugar de "Start free trial" para usuarios logueados:

1. Crea Products y Prices en Stripe Dashboard.
2. Inserta filas en `billing_plans` con `code` igual a `starter` y `pro` (case-insensitive) para que coincidan con la UI de pricing.
3. Configura las Edge Functions con `STRIPE_SECRET_KEY`, `APP_BASE_URL`, etc.
4. Despliega `create-checkout-session` y `stripe-webhook`.
5. **Trial:** Configura `BILLING_TRIAL_DAYS` en Edge Functions (por defecto 7). El checkout añade trial automáticamente.

El plan `Enterprise` siempre muestra "Contact sales" y no usa checkout.

---

## Límites por plan (Fase 7)

La migración `bill_02a_plan_limits` añade `entity_limit` y `user_limit` a `billing_plans`. Por defecto:
- **Starter:** 500 entidades, 1 usuario
- **Pro:** 2000 entidades, 5 usuarios
- **Enterprise:** ilimitado (null)

Los triggers impiden crear entidades o miembros por encima del límite cuando la org tiene suscripción activa o en trial. Para ajustar límites: `UPDATE billing_plans SET entity_limit = X, user_limit = Y WHERE code = 'starter';`
