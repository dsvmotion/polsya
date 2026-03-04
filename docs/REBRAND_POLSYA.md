# Rebrand: Polsya (polsya.com)

Checklist de cambios completados para la migración al dominio polsya.com.

## 1. Dominio en Vercel

- [ ] Dominio `polsya.com` (y `www.polsya.com`) añadido en Vercel → Project Settings → Domains
- [ ] DNS configurado según las instrucciones de Vercel
- [ ] SSL activo (Vercel lo genera automáticamente)

## 2. Supabase

- [ ] **Authentication** → URL Configuration:
  - Site URL: `https://polsya.com`
  - Redirect URLs: añadidas `https://polsya.com`, `https://polsya.com/**`, `https://www.polsya.com`, `https://www.polsya.com/**`

## 3. Resend (emails)

- [ ] Dominio `polsya.com` añadido en Resend → Domains
- [ ] Registros DNS (SPF, DKIM) configurados en Hostinger → DNS Zone
- [ ] Dominio verificado en Resend
- [ ] **NOTA**: No necesitas tener email hosting activo ni web en el dominio — solo acceso a los registros DNS

## 4. Secrets en Supabase (Edge Functions)

```bash
# Email donde recibir formularios de contacto
supabase secrets set CONTACT_FORM_TO="contact@polsya.com"

# Remitente (dominio debe estar verificado en Resend)
supabase secrets set CONTACT_FROM="Polsya <noreply@polsya.com>"
```

## 5. Callbacks OAuth (si aplica)

Actualizar en cada integración (Google, Microsoft, etc.):

- Gmail: `https://polsya.com/integrations/gmail/callback`
- Outlook: `https://polsya.com/integrations/outlook/callback`
- Notion: `https://polsya.com/integrations/notion/callback`
- Google Drive: `https://polsya.com/integrations/google-drive/callback`

## 6. CORS (Edge Functions)

El archivo `supabase/functions/_shared/cors.ts` ya incluye `polsya.com` y `moodlycrm.com`. Si usas un subdominio personalizado, añádelo:

```bash
supabase secrets set EDGE_ALLOWED_ORIGINS="https://polsya.com,https://www.polsya.com,https://app.polsya.com"
```

## Ya actualizado en el código

- `index.html` – meta tags, título, canonical → polsya.com
- `src/lib/brand.ts` – APP_NAME = "Polsya"
- `supabase/functions/submit-contact` – sender default: `Polsya <noreply@polsya.com>`
- `supabase/functions/resend` – fallback sender: `Polsya <noreply@polsya.com>`
- `supabase/functions/_shared/cors.ts` – polsya.com primary, moodlycrm.com secondary
- `public/robots.txt` – Sitemap → polsya.com
- `public/sitemap.xml` – todas las URLs → polsya.com
- Tests – referencias actualizadas
