# Arquitectura: Tres experiencias bajo un solo dominio

Visión alineada con [Radar.com](https://radar.com/): portfolio público, plataforma propietaria y cuenta de cliente.

---

## 1. Web portfolio (pública, sin usuario)

**Quién:** Cualquier visitante  
**Ruta:** `/` cuando no hay sesión  
**Contenido:**
- Landing de presentación
- Features y características de la app
- CTA: "Empezar", "Registrarse", "Ver demo"
- Sin necesidad de login

---

## 2. Plataforma propietaria (nosotros)

**Quién:** Usuarios con `app_metadata.role = platform_owner` (o en `VITE_PLATFORM_OWNER_EMAILS`)  
**Ruta:** `/platform`, `/platform/billing`, etc.  
**Características:**
- Control total de la app y clientes
- Gestión de suscripciones de todos los tenants
- Herramientas administrativas
- Sin restricciones de suscripción

---

## 3. Cuenta de cliente (usuarios de pago)

**Quién:** Usuarios que han completado onboarding y tienen suscripción activa/trial  
**Ruta:** Dashboard, Prospecting, Operations, Reports, Integrations, etc.  
**Características:**
- Herramientas y servicios contratados
- Acceso a su información, base de datos, pagos, integraciones
- Personalización
- **Requisito:** Cuenta creada + credenciales validadas + suscripción activa o en trial

---

## Flujo de usuario

```
Visitante → Web portfolio (landing)
    ↓
Registro → Creación de cuenta
    ↓
Validación de credenciales + onboarding
    ↓
Login → Acceso a cuenta de usuario
    ↓
Trial 7 días (acceso completo)
    ↓
[Fin trial] → Servicio se para → Activar suscripción para reanudar
    ↓
Suscripción activa (3 planes escalados)
    ↓
[Fallo de pago] → Recordatorios/avisos
    ↓
[5-7 días sin pago] → Bloqueo de servicios (datos intactos)
    ↓
[Pago confirmado] → Reanudar servicio
```

---

## Modelo de suscripción

| Estado | Acceso |
|--------|--------|
| Sin cuenta | Solo portfolio público |
| Cuenta sin suscripción | Login posible, pero servicios bloqueados (pantalla "Activa tu suscripción") |
| Trial (7 días) | Acceso completo |
| Suscripción activa | Acceso según plan (3 tiers) |
| Impago (past_due) | 5-7 días de gracia con avisos |
| Bloqueado | Servicios parados, datos conservados |

---

## Planes de suscripción (3 tiers)

Escalado por capacidades y servicios (por definir en detalle).

---

## Integraciones previstas

- Notion, Figma, Google, AWS, Claude, OpenAI
- Base de datos por usuario: potente y privada
- Pagos: Stripe (billing, landings) — mejorar conexión backend/frontend

---

## Implementación por fases

### Fase 1: Routing y landing pública
- [ ] Crear estructura de rutas: público vs autenticado
- [ ] Landing/portfolio como página principal para no logueados
- [ ] Redirect a app internas solo cuando hay sesión válida

### Fase 2: Gating por suscripción (refinado)
- [ ] Trial 7 días tras onboarding
- [ ] Bloqueo de servicios si no hay suscripción activa/trial (mostrar pantalla "Activa tu suscripción", no redirect a billing)
- [ ] Grace 5-7 días en impago, luego bloqueo (datos intactos)

### Fase 3: Landing y pricing
- [ ] Landing tipo Radar con features, CTAs
- [ ] Páginas de pricing con los 3 planes
- [ ] Conexión Stripe en landings

### Fase 4: Herramientas propietarias
- [ ] Ampliar `/platform` con más controles y gestión de clientes

### Fase 5: Integraciones y base de datos
- [ ] Notion, Figma, Google, AWS, Claude, OpenAI
- [ ] Aislamiento y robustez de datos por tenant

---

## Estructura de rutas propuesta

```
/                     → Landing (público) o redirect si logueado
/login                → Login
/signup               → Registro
/pricing              → Planes y precios (público)
/features             → Features (público)

/dashboard            → App cliente (requiere auth + suscripción)
/prospecting/*        → ...
/operations/*         → ...
...

/platform             → Admin plataforma (solo platform owners)
/platform/billing     → Gestión pagos clientes
```
