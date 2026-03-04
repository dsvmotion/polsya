# Emails de facturación (Stripe)

Stripe envía automáticamente emails de factura, recibo y pago fallido. Configúralos en el Dashboard para una experiencia completa.

---

## 1. Emails predeterminados de Stripe

Stripe ya envía estos emails cuando están habilitados:

| Evento | Email | Cuándo |
|--------|-------|--------|
| Invoice finalizada | Factura con PDF | Tras generar una factura |
| Pago recibido | Recibo de pago | Tras `invoice.paid` |
| Pago fallido | Recordatorio de pago | Tras `invoice.payment_failed` |

---

## 2. Habilitar en Stripe Dashboard

1. Entra en [Stripe Dashboard](https://dashboard.stripe.com) → **Settings** → **Emails**.
2. En **Customer emails**, activa:
   - **Successful payments** — Recibos automáticos
   - **Failed payments** — Avisos de pago fallido (hasta 4 recordatorios)
3. En **Invoice emails**:
   - **Send invoice emails** — Stripe envía la factura al cliente cuando está lista.

---

## 3. Personalizar plantillas (opcional)

1. **Settings** → **Emails** → **Customize** (junto a cada tipo).
2. Puedes:
   - Cambiar el remitente (por defecto: billing@stripe.com)
   - Usar tu dominio (requiere configurar DKIM/SPF)
   - Editar el contenido del email (texto, logo, pie de página)

---

## 4. Emails de pago fallido — Flujo

Stripe envía automáticamente:

1. **Inmediato** — "Your payment failed"
2. **3 días** — Primer recordatorio
3. **5 días** — Segundo recordatorio
4. **7 días** — Último aviso antes de cancelar

El webhook `invoice.payment_failed` actualiza `billing_subscriptions` a `past_due`. Nuestra lógica de gracia (`VITE_BILLING_PAST_DUE_GRACE_DAYS`) complementa estos emails.

---

## 5. Verificación rápida

1. Crea una suscripción de prueba (modo Test).
2. En Stripe Dashboard → **Customers** → selecciona el cliente → **Emails**.
3. O simula un pago fallido con una tarjeta de test (`4000 0000 0000 0341`) y comprueba que llega el email.

---

## 6. Checklist pre-lanzamiento

- [ ] **Successful payments** activado
- [ ] **Failed payments** activado
- [ ] **Invoice emails** activado
- [ ] (Opcional) Dominio personalizado para emails
- [ ] Probar en modo Test con tarjeta que falla
