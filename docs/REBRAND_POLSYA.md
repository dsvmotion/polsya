# Rebrand: Moodly → Polsya

Checklist de cambios que debes hacer manualmente cuando migres al nuevo dominio y correos.

## 1. Dominio en Vercel

- [ ] Añadir dominio `polsya.com` (y `www.polsya.com`) en Vercel → Project Settings → Domains
- [ ] Configurar DNS según las instrucciones de Vercel
- [ ] (Opcional) Mantener moodlycrm.com temporalmente como redirect

## 2. Supabase

- [ ] **Authentication** → URL Configuration:
  - Site URL: `https://polsya.com`
  - Redirect URLs: añadir `https://polsya.com`, `https://polsya.com/**`, `https://www.polsya.com`, `https://www.polsya.com/**`

## 3. Resend (emails)

- [ ] Añadir dominio `polsya.com` en Resend → Domains
- [ ] Configurar registros DNS (SPF, DKIM) en tu proveedor (Hostinger, etc.)
- [ ] Esperar verificación del dominio

## 4. Secrets en Supabase (Edge Functions)

```bash
# Email donde recibir formularios de contacto
supabase secrets set CONTACT_FORM_TO="hello@polsya.com"

# Remitente (dominio debe estar verificado en Resend)
supabase secrets set CONTACT_FROM="Polsya <noreply@polsya.com>"
```

## 5. Callbacks OAuth (si aplica)

Los callbacks usan el dominio. Actualizar en cada integración (Google, Microsoft, etc.):

- Gmail: `https://polsya.com/integrations/gmail/callback`
- Outlook: `https://polsya.com/integrations/outlook/callback`
- Notion: `https://polsya.com/integrations/notion/callback`
- Google Drive: `https://polsya.com/integrations/google-drive/callback`

## 6. CORS (Edge Functions)

El archivo `supabase/functions/_shared/cors.ts` ya incluye `polsya.com`. Si usas un dominio personalizado (ej. `app.polsya.com`), añádelo a `EDGE_ALLOWED_ORIGINS` en los secrets de Supabase:

```bash
supabase secrets set EDGE_ALLOWED_ORIGINS="https://polsya.com,https://www.polsya.com,https://app.polsya.com"
```

## Ya actualizado en el código

- `index.html` – meta tags, título, canonical
- `src/lib/brand.ts` – APP_NAME = "Polsya"
- `supabase/functions/submit-contact` – defaults y subject
- `supabase/functions/_shared/cors.ts` – polsya.com en allowlist
- Tests – referencias actualizadas
