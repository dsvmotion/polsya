# Contact Form Email Setup

The contact form (and demo request flow) sends email notifications to the team via [Resend](https://resend.com).

## Prerequisites

1. Create a [Resend](https://resend.com) account
2. Verify your domain (`polsya.com`) — only requires DNS access, NOT email hosting
3. Create an API key in Resend Dashboard → API Keys

### Hostinger + Resend

Si tu dominio está en Hostinger y quieres enviar desde `noreply@polsya.com`:

1. En [Resend Dashboard](https://resend.com/domains) → Domains → Add Domain
2. Añade `polsya.com`
3. Resend mostrará registros DNS (SPF, DKIM). Añádelos en **Hostinger** → Hosting → DNS Zone
4. Espera a que Resend verifique el dominio (normalmente unos minutos)
5. Usa `Polsya <noreply@polsya.com>` como `CONTACT_FROM`

**IMPORTANTE**: NO necesitas tener una web activa en polsya.com ni un email creado. Solo necesitas acceso a los registros DNS del dominio en Hostinger.

**Testing sin verificación de dominio**: Usa el sandbox de Resend `onboarding@resend.dev` como sender — los emails solo llegarán al email de tu cuenta de Resend.

## Supabase Edge Function Secrets

Configura estos secrets en tu proyecto de Supabase (Dashboard → Project Settings → Edge Functions → Secrets, o via `supabase secrets set`):

| Secret | Descripción | Status |
|--------|-------------|--------|
| `RESEND_API_KEY` | API key de Resend | ⚠️ **Requerido** |
| `CONTACT_FORM_TO` | Email(s) que reciben los formularios (separados por coma) | ⚠️ **Requerido** |
| `CONTACT_FROM` | Remitente (debe estar verificado en Resend) | ⚠️ **Requerido** |

**Comandos**:

```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxx"
supabase secrets set CONTACT_FORM_TO="contact@polsya.com"
supabase secrets set CONTACT_FROM="Polsya <noreply@polsya.com>"
```

## Deploy the Edge Function

```bash
supabase functions deploy submit-contact
```

O deploy todas las funciones:

```bash
supabase functions deploy
```

## Testing

1. Visita `/contact` en tu sitio
2. Rellena y envía el formulario
3. Comprueba que:
   - Aparece el mensaje de éxito
   - Llega un email a la(s) dirección(es) en `CONTACT_FORM_TO`
   - El usuario que envió el formulario recibe un email de confirmación
4. Las solicitudes de demo (desde la landing) usan el mismo flujo con `subject=demo`

## Troubleshooting

- **No llega email**: Revisa los logs de la Edge Function (Dashboard → Edge Functions → submit-contact → Logs)
- **Error de Resend**: Verifica que `RESEND_API_KEY` es correcto y el dominio está verificado
- **403 Origin not allowed**: Añade tu URL de deployment a `EDGE_ALLOWED_ORIGINS` en Supabase secrets
- **emailWarnings en la respuesta**: La API devuelve warnings si algún email falló — útil para debugging
