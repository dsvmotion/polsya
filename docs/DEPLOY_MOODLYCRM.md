# Desplegar en polsya.com

Guía paso a paso para poner la app en producción en polsya.com.

---

## Orden de operaciones (importante)

1. **Añadir dominio en Vercel** (no requiere web activa)
2. **Configurar DNS en Hostinger** (apuntar polsya.com a Vercel)
3. **Verificar dominio en Resend** (solo DNS, no requiere email hosting)
4. **Configurar Supabase** (URLs, secrets)
5. **Deploy y probar**

---

## 1. Añadir dominio en Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard) → abre tu proyecto
2. **Settings** → **Domains** → Add `polsya.com`
3. Vercel te dará registros DNS para configurar:
   - **Tipo A**: `76.76.21.21` para `polsya.com`
   - **Tipo CNAME**: `cname.vercel-dns.com` para `www.polsya.com`
4. Vercel generará SSL automáticamente una vez los DNS propaguen

---

## 2. Configurar DNS en Hostinger

En **Hostinger** → tu dominio polsya.com → **DNS Zone**:

### Para Vercel (hosting de la web):
| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | `76.76.21.21` | 3600 |
| CNAME | www | `cname.vercel-dns.com` | 3600 |

### Para Resend (envío de emails):
Resend te dará registros específicos al añadir el dominio. Típicamente:
| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | @ o resend._domainkey | (valor SPF de Resend) |
| CNAME | resend._domainkey | (valor DKIM de Resend) |

**NOTA**: Si Hostinger ya tiene registros A apuntando a sus servidores, deberás **eliminarlos** y poner solo el de Vercel. Esto NO afecta al email — Resend no necesita hosting, solo DNS.

---

## 3. Verificar dominio en Resend

1. Crea cuenta en [resend.com](https://resend.com) si no la tienes
2. **Domains** → **Add Domain** → `polsya.com`
3. Añade los registros DNS que Resend te indique (paso 2 arriba)
4. Haz clic en **Verify** — suele tardar 1-5 minutos
5. Crea un **API Key** en Resend → API Keys

**NO necesitas**:
- Web activa en polsya.com
- Email creado en Hostinger
- Hosting de email (MX records)

Solo necesitas que los registros DNS de Resend estén configurados.

---

## 4. Configurar Supabase

### 4.1 Authentication URLs

**Supabase Dashboard** → tu proyecto → **Authentication** → **URL Configuration**:

- **Site URL**: `https://polsya.com`
- **Redirect URLs** (añade):
  ```
  https://polsya.com
  https://polsya.com/**
  https://www.polsya.com
  https://www.polsya.com/**
  ```

### 4.2 Edge Function Secrets

```bash
# Email (Resend)
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxx"
supabase secrets set CONTACT_FORM_TO="contact@polsya.com"
supabase secrets set CONTACT_FROM="Polsya <noreply@polsya.com>"

# App URL
supabase secrets set APP_BASE_URL="https://polsya.com"
```

### 4.3 Deploy Edge Functions

```bash
supabase functions deploy
```

---

## 5. Variables de entorno en Vercel

En el proyecto de Vercel → **Settings** → **Environment Variables**:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://taetxohwuuzufmkzpzhb.supabase.co` | Production |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (tu anon key de Supabase) | Production |
| `VITE_PLATFORM_OWNER_EMAILS` | tu@email.com | Production (opcional) |
| `VITE_GOOGLE_MAPS_API_KEY` | (si usas mapas) | Production (opcional) |

Después de cambiar variables, haz **Redeploy**.

---

## 6. OAuth (si aplica)

En cada proveedor OAuth, actualiza las URLs de callback:

- Gmail: `https://polsya.com/integrations/gmail/callback`
- Notion: `https://polsya.com/integrations/notion/callback`
- Google Drive: `https://polsya.com/integrations/google-drive/callback`

Y en los **Secrets** de las Edge Functions, configura los redirect URIs correspondientes.

---

## Checklist rápido

- [ ] Dominio `polsya.com` añadido en Vercel
- [ ] DNS en Hostinger: A record → Vercel
- [ ] DNS en Hostinger: registros SPF/DKIM de Resend
- [ ] Dominio verificado en Resend
- [ ] Supabase: Site URL = `https://polsya.com`
- [ ] Supabase: Redirect URLs incluyen polsya.com
- [ ] Supabase: Secrets configurados (RESEND_API_KEY, CONTACT_FROM, etc.)
- [ ] Vercel: variables de entorno (VITE_SUPABASE_URL, etc.)
- [ ] Edge Functions desplegadas
- [ ] Probar: https://polsya.com → landing
- [ ] Probar: /features, /pricing, /contact
- [ ] Probar: login y signup
- [ ] Probar: formulario de contacto → email recibido
