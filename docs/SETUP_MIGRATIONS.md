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

---

## Orden de migraciones (referencia)

Las migraciones se aplican por timestamp. Orden aproximado:

1. `arch_02a` – organizaciones, members, RLS base
2. `arch_03b` – entity_types
3. `bill_01a` – billing_plans, billing_customers, billing_subscriptions, billing_invoices
4. `gen_01a` – entities (renombrado de pharmacies), vistas compatibles
5. … resto de migraciones

 `supabase db push` aplica todas en el orden correcto.
