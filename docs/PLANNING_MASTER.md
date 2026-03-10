# Planning Master — Sales Compass

Plan detallado sin dejar nada olvidado. Referencia: visión tipo [Radar.com](https://radar.com/).

---

## 1. TRES EXPERIENCIAS BAJO UN DOMINIO

### 1.1 Web portfolio (pública)

| Aspecto | Detalle |
|---------|---------|
| **Audiencia** | Cualquier visitante, sin cuenta |
| **Rutas** | `/`, `/features`, `/pricing`, `/contact`, `/terms`, `/privacy` |
| **Contenido** | Hero, features, testimonios, CTAs, pricing preview, FAQ |
| **Header** | Logo, navegación (Features, Pricing, Contact), botón "Entrar" / "Registrarse" |
| **Footer** | Links legales, redes, newsletter |
| **Acceso** | Público, sin auth |

### 1.2 Plataforma propietaria

| Aspecto | Detalle |
|---------|---------|
| **Audiencia** | Usuarios con `app_metadata.role` en platform_owner/owner/developer/platform_admin o email en `VITE_PLATFORM_OWNER_EMAILS` |
| **Rutas** | `/platform`, `/platform/billing`, `/platform/users`, `/platform/analytics`, etc. |
| **Características** | Gestión total de clientes, suscripciones, facturación, logs, configuración global |
| **Sin restricción** | No requiere suscripción propia |

### 1.3 Cuenta de cliente

| Aspecto | Detalle |
|---------|---------|
| **Audiencia** | Usuarios que han completado onboarding y tienen suscripción activa o trial |
| **Rutas** | `/dashboard`, `/prospecting/*`, `/operations/*`, `/reports`, `/integrations`, `/team`, `/profile`, `/billing` |
| **Características** | Herramientas de producto, datos propios, integraciones, personalización |
| **Requisito** | Cuenta + validación + suscripción activa o trial |

---

## 2. FLUJO DE USUARIO COMPLETO

```
1. Visitante llega a /
   → Ve landing pública

2. Clic "Registrarse" o "Empezar"
   → /signup

3. Registro (email, contraseña, validación)
   → Cuenta creada en auth.users
   → Trigger crea organization + organization_members

4. Confirmación de email (si está habilitada)
   → Usuario confirmado

5. Login
   → /login → sesión

6. Onboarding (si existe)
   → Guía de primeros pasos, configuración inicial

7. Estado: cuenta nueva
   → Trial 7 días empieza (o ya empezó al crear org)
   → Acceso completo a app cliente

8. Fin trial (día 7)
   → Servicio se para
   → Pantalla "Activa tu suscripción" (no bloquea navegación a /billing)
   → Datos intactos

9. Usuario elige plan en /pricing o /billing
   → Stripe Checkout / Customer Portal
   → Webhook Stripe → billing_subscriptions actualizado

10. Suscripción activa
    → Acceso según plan (tier 1, 2, 3)

11. Fallo de pago (Stripe webhook payment_failed)
    → Estado past_due
    → Avisos por email (Stripe + nuestro sistema)
    → 5-7 días de gracia con acceso

12. Tras 5-7 días sin pago
    → Bloqueo de servicios
    → Pantalla informativa "Actualiza tu método de pago"
    → Datos intactos

13. Usuario actualiza pago
    → Stripe webhook invoice.paid
    → Servicio reanudado
```

---

## 3. MODELO DE SUSCRIPCIÓN

### 3.1 Estados

| Estado | Descripción | Acceso app cliente |
|--------|-------------|---------------------|
| `sin_cuenta` | No registrado | Solo landing |
| `cuenta_sin_suscripcion` | Registrado, sin trial ni plan | Pantalla "Activa tu suscripción" |
| `trialing` | Trial 7 días | Completo |
| `active` | Suscripción pagada | Según plan |
| `past_due` | Impago, dentro de gracia | Completo + avisos |
| `past_due_expired` | Impago, gracia terminada | Bloqueado (datos intactos) |
| `canceled` / `unpaid` | Cancelada o impagada | Bloqueado (datos intactos) |

### 3.2 Parámetros

| Parámetro | Valor | Variable env |
|-----------|-------|--------------|
| Trial | 7 días | `VITE_BILLING_TRIAL_DAYS` |
| Gracia impago | 5-7 días | `VITE_BILLING_PAST_DUE_GRACE_DAYS` |

### 3.3 Tres planes (tiers)

| Plan | Capacidades (por definir) | Precio |
|------|---------------------------|--------|
| **Starter** | Básico: X entidades, Y integraciones | €/mes |
| **Pro** | Ampliado: más entidades, más integraciones, soporte | €/mes |
| **Enterprise** | Completo: ilimitado, prioridad, custom | €/mes |

*Detallar límites concretos (entidades, usuarios, integraciones, almacenamiento) en fase de producto.*

---

## 4. ESTRUCTURA DE RUTAS DEFINITIVA

```
PÚBLICAS (sin auth)
├── /                     → Landing
├── /features             → Características
├── /pricing              → Planes y precios
├── /contact              → Contacto
├── /terms                → Términos de uso
├── /privacy              → Privacidad
├── /login                → Login
├── /signup               → Registro
└── /forgot-password      → Recuperar contraseña

AUTH + APP CLIENTE (requiere suscripción activa/trial)
├── /dashboard            → Index (redirect desde / si logueado)
├── /prospecting/entities
├── /prospecting/entities/:typeKey
├── /operations/entities
├── /operations/entities/:typeKey
├── /reports
├── /integrations
├── /team
├── /profile
├── /billing              → Gestión suscripción del usuario
└── /integrations/*/callback

PLATFORM ADMIN (solo platform owners)
├── /platform             → Dashboard admin
├── /platform/billing     → Gestión pagos de todos los clientes
├── /platform/users       → Usuarios/orgs
├── /platform/analytics   → Métricas globales
└── ...

CATCH-ALL
└── /*                    → NotFound
```

---

## 5. LÓGICA DE REDIRECCIÓN

| Situación | Comportamiento |
|-----------|----------------|
| No logueado en `/` | Muestra landing |
| No logueado en `/dashboard` | Redirect a `/login` |
| Logueado platform owner en `/` | Redirect a `/platform` |
| Logueado cliente en `/` | Redirect a `/dashboard` |
| Logueado sin suscripción activa/trial | Accede a app pero ve pantalla "Activa tu suscripción" en contenido principal (o banner persistente) |
| Logueado con suscripción activa/trial | Acceso normal |

---

## 6. LANDING PÚBLICA — SECCIONES

### 6.1 Hero
- Título impactante
- Subtítulo
- CTA principal: "Empezar gratis" / "Registrarse"
- CTA secundario: "Ver demo" / "Ver características"
- Imagen o visual

### 6.2 Features
- Grid de features (6-8 bloques)
- Iconos, títulos, descripciones
- Ej: CRM, Prospecting, Integraciones, IA, Reportes, Base de datos privada

### 6.3 Social proof
- Logos de clientes (si hay)
- Testimonios
- Métricas (usuarios, empresas)

### 6.4 Pricing preview
- Resumen de 3 planes
- CTA "Ver planes completos" → /pricing

### 6.5 FAQ
- Preguntas frecuentes
- Acordeón o lista

### 6.6 CTA final
- "Empieza tu trial de 7 días"
- Formulario de contacto o link a signup

---

## 7. PÁGINA DE PRICING

- Tabla comparativa de 3 planes
- Precios, características por plan
- Botón "Empezar" por plan → Stripe Checkout o /signup con plan preseleccionado
- FAQ de facturación
- Trial 7 días destacado

---

## 8. ONBOARDING

- Flujo post-registro (opcional pero recomendado)
- Pasos: configurar workspace, añadir primer contacto, explorar dashboard
- Puede ser wizard modal o páginas dedicadas
- Marcar `onboarding_completed` en organization o user metadata

---

## 9. PANTALLA "ACTIVA TU SUSCRIPCIÓN"

- Cuando: cuenta sin trial activo ni suscripción
- Dónde: dentro del layout de app (sidebar visible)
- Contenido: explicación, planes, CTA a /billing o Stripe
- No bloquea: usuario puede ir a /billing, /profile, etc.
- Diseño: centrado, claro, sin sensación de error

---

## 10. BILLING Y STRIPE

### 10.1 Backend existente
- Tablas: `billing_plans`, `billing_customers`, `billing_subscriptions`, `billing_invoices`
- Stripe webhooks para sync
- Edge functions o API routes para Checkout/Customer Portal

### 10.2 Mejoras pendientes
- [x] Stripe Checkout para nuevos suscriptores (desde landing y desde /billing)
- [x] Customer Portal para gestión (cambiar plan, método de pago)
- [x] Webhooks robustos: `customer.subscription.created`, `invoice.paid`, `invoice.payment_failed`
- [x] Emails de recordatorio (Stripe) — ver docs/STRIPE_EMAILS.md
- [x] UI de /billing sin bugs, estados claros
- [x] Precios y planes en BD alineados con Stripe Products/Prices (bill_seed_plans)

### 10.3 Landings + Stripe
- [x] CTAs en landing que lleven a Checkout con plan preseleccionado
- [x] Página /pricing con links a Checkout por plan

---

## 11. PLATAFORMA PROPIETARIA — HERRAMIENTAS

### 11.1 Actual
- `/platform` — Dashboard básico
- `/platform/billing` — Gestión pagos clientes

### 11.2 Ampliaciones
- [x] Lista de organizaciones/tenants con búsqueda y filtros
- [x] Detalle de organización: miembros, suscripción, uso
- [x] Impersonación o vista "como cliente" — "Ver como cliente" en org detail, ?as_org=
- [x] Logs de auditoría (platform_audit_logs, /platform/logs)
- [x] Configuración global (feature flags) — platform_settings, /platform/settings
- [x] Analytics agregados (MRR, churn, nuevos usuarios) — /platform/analytics
- [x] Gestión de usuarios platform (añadir/quitar owners) — /platform/settings, platform_owner_emails

---

## 12. INTEGRACIONES

### 12.1 Existentes
- Google Maps (prospecting)
- Gmail / Outlook (email)
- WooCommerce (pedidos)

### 12.2 Previstas
- [x] **Notion** — OAuth listo; sync datos pendiente
- [ ] **Figma** — (evaluar) docs/INTEGRATIONS_EVALUATION.md
- [ ] **Google** — Drive, Sheets, Calendar
- [ ] **AWS** — S3, Lambda (roadmap) docs/INTEGRATIONS_EVALUATION.md
- [x] **OpenAI** — Chat (ai-chat-proxy), embeddings (ai-embeddings)
- [x] **Claude/Anthropic** — Chat alternativo (ai_chat_config.provider; ver AI_CHAT_CLAUDE_SETUP.md)
- [ ] Otras: Slack, HubSpot, Salesforce (según demanda)

### 12.3 Patrón
- Connector por servicio
- OAuth donde aplique
- Sync jobs con retry y dead letter
- UI unificada en /integrations

---

## 13. BASE DE DATOS POR USUARIO

### 13.1 Aislamiento
- `organization_id` en todas las tablas de negocio
- RLS por organización
- Ningún leak entre tenants

### 13.2 Robustez
- [x] Backups automáticos (Supabase) — docs/BACKUPS_SUPABASE.md
- [x] Migraciones seguras (ya con gen_01a resiliente)
- [x] Índices para consultas frecuentes — perf_04a_index_pack + engine_index_pack
- [x] Límites por plan — bill_02a: entity_limit, user_limit + triggers + UI en /billing

### 13.3 Privacidad
- Datos encriptados en reposo (Supabase)
- Sin compartir datos entre organizaciones
- Cumplimiento RGPD/GDPR (documentar en /privacy)

---

## 14. FASES DE IMPLEMENTACIÓN DETALLADAS

### Fase 1: Routing y landing (1-2 sprints)

| # | Tarea | Descripción |
|---|-------|-------------|
| 1.1 | Layout público | ✅ Crear `PublicLayout` con header/footer para rutas públicas |
| 1.2 | Página Landing | ✅ Hero, features, CTAs, estructura lista para contenido |
| 1.3 | Rutas públicas | ✅ `/`, `/features`, `/pricing`, `/contact`, `/terms`, `/privacy` |
| 1.4 | Lógica de redirect | ✅ Si logueado en `/` → `/dashboard` o `/platform` según rol |
| 1.5 | Header público | ✅ Logo, nav, "Entrar", "Registrarse" |
| 1.6 | Footer público | ✅ Links legales, contacto |
| 1.7 | Contenido | Textos, imágenes, copy (iterativo) |

### Fase 2: Gating y suscripción (1 sprint)

| # | Tarea | Descripción |
|---|-------|-------------|
| 2.1 | Trial 7 días | ✅ Lógica en `evaluateBillingAccess` |
| 2.2 | Pantalla "Activa suscripción" | ✅ `ActivateSubscriptionCard` + `ActivateSubscriptionGate` |
| 2.3 | Gracia impago | ✅ 5-7 días en `evaluateBillingAccess`, `VITE_BILLING_PAST_DUE_GRACE_DAYS` |
| 2.4 | Bloqueo sin pérdida de datos | ✅ No bloquea; muestra card invitando a /billing |
| 2.5 | SubscriptionBanner | ✅ Banner informativo en AppLayout |

### Fase 3: Pricing y Stripe (1-2 sprints)

| # | Tarea | Descripción |
|---|-------|-------------|
| 3.1 | Página /pricing | ✅ Tabla 3 planes, precios, CTA |
| 3.2 | Stripe Products/Prices | ✅ bill_seed_plans + docs/STRIPE_SETUP.md |
| 3.3 | Stripe Checkout | ✅ Flujo desde /pricing y /billing |
| 3.4 | Customer Portal | ✅ create-customer-portal-session, "Open customer portal" en /billing |
| 3.5 | Webhooks | ✅ customer.subscription.*, invoice.paid, invoice.payment_failed |
| 3.6 | Emails Stripe | Configuración Stripe Dashboard (invoice, receipt, payment failed) |
| 3.7 | Pruebas | Flujos de pago, trial, cancelación |

### Fase 4: Platform admin (1 sprint)

| # | Tarea | Descripción |
|---|-------|-------------|
| 4.1 | Lista de organizaciones | ✅ PlatformDashboard con tabla, búsqueda, estado suscripción |
| 4.2 | Detalle organización | ✅ /platform/org/:orgId (PlatformOrganizationDetail) |
| 4.3 | Gestión pagos | ✅ PlatformBilling |
| 4.4 | Logs básicos | ✅ platform_audit_logs + /platform/logs |

### Fase 5: Onboarding (0.5 sprint)

| # | Tarea | Descripción |
|---|-------|-------------|
| 5.1 | Wizard post-registro | ✅ 5 pasos guiados (Welcome, Dashboard, Prospecting, Integrations, Billing) |
| 5.2 | Flag onboarding_completed | ✅ En `user_metadata` vía `supabase.auth.updateUser` |
| 5.3 | Skip opcional | ✅ Botón "Skip" en cada paso |

### Fase 6: Integraciones nuevas (2+ sprints)

| # | Tarea | Descripción |
|---|-------|-------------|
| 6.1 | Notion | ✅ OAuth + sync databases |
| 6.2 | Google (Drive/Sheets) | ✅ OAuth + sync files |
| 6.3 | Claude/OpenAI | ✅ Chat (OpenAI + Claude vía ai_chat_config) + embeddings |
| 6.4 | AWS | Evaluar casos de uso |
| 6.5 | Figma | Evaluar necesidad |

### Fase 7: Límites por plan (1 sprint)

| # | Tarea | Descripción |
|---|-------|-------------|
| 7.1 | Definir límites | ✅ bill_02a: entity_limit, user_limit por plan |
| 7.2 | Checks en backend | ✅ Triggers check_entity_limit, check_user_limit |
| 7.3 | UI de límites | ✅ /billing muestra Usage (entities, users) |

### Fase 8: Legales y SEO (0.5 sprint)

| # | Tarea | Descripción |
|---|-------|-------------|
| 8.1 | Términos de uso | ✅ /terms |
| 8.2 | Privacidad | ✅ /privacy, política de datos |
| 8.3 | Cookies | ✅ CookieConsent banner, sección en /privacy |
| 8.4 | SEO | ✅ Meta tags index.html, sitemap.xml, robots.txt |

---

## 15. DEPENDENCIAS Y ORDEN

```
Fase 1 (landing)     → Puede ir en paralelo con otras
Fase 2 (gating)      → Depende de lógica billing existente
Fase 3 (Stripe)      → Depende de Fase 2 para integración completa
Fase 4 (platform)    → Independiente
Fase 5 (onboarding)  → Depende de Fase 1 (signup flow)
Fase 6 (integraciones) → Por prioridad de producto
Fase 7 (límites)     → Depende de Fase 3 (planes definidos)
Fase 8 (legales)     → Paralelo, baja prioridad técnica
```

---

## 16. CHECKLIST PRE-LANZAMIENTO

- [x] Landing pública operativa
- [x] Registro y login sin errores
- [x] Trial 7 días funcionando (evaluateBillingAccess, BILLING_TRIAL_DAYS)
- [x] Tres planes en Stripe y BD (bill_seed_plans; configurar price IDs en Stripe)
- [x] Checkout y Customer Portal operativos
- [x] Webhooks Stripe probados (customer.subscription.*, invoice.*)
- [x] Platform admin para gestión
- [x] Emails de pago/impago (Stripe Dashboard) — docs/STRIPE_EMAILS.md
- [x] Términos y privacidad publicados
- [x] Tests críticos pasando (279 tests)
- [x] Sin bugs conocidos en billing

---

## 17. RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|------------|
| Stripe webhooks fallan | Retry, dead letter, alertas |
| Usuarios bloqueados por error | Grace period generoso, soporte manual |
| Pérdida de datos | Backups, RLS, pruebas de migración |
| Confusión en rutas público/privado | Tests de rutas, documentación |

---

## 18. MÉTRICAS A SEGUIR

- Visitantes landing → Signups (funnel)
- Trial → Conversión a pago
- Churn, MRR
- Tiempo de resolución de impagos
- Uso por plan (límites)
