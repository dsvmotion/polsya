# Desplegar a moodlycrm.com

Guía para que las landings (/, /features, /pricing, etc.) funcionen en moodlycrm.com igual que en localhost.

---

## 1. Forzar nuevo deploy en Vercel

El dominio ya está en Vercel. Para que muestre el código más reciente:

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard) y abre el proyecto vinculado a moodlycrm.com.
2. Pestaña **Deployments** → comprueba que el último deploy sea posterior a tu último `git push`.
3. Si no hay deploy reciente o falló:
   - Haz clic en los **tres puntos (⋯)** del último deploy → **Redeploy**.
   - O en **Settings** → **Git** confirma que el repo es `dsvmotion/sales-compass-95` y la rama `main`.
4. Espera 2–3 minutos a que termine el build.

---

## 2. Supabase: URLs para moodlycrm.com

Para que Login, Signup y OAuth funcionen en producción:

1. **Supabase Dashboard** → tu proyecto → **Authentication** → **URL Configuration**.
2. **Site URL**: `https://moodlycrm.com`
3. **Redirect URLs** (añade):
   ```
   https://moodlycrm.com/**
   https://moodlycrm.com
   ```
4. Guarda los cambios.

---

## 3. Variables de entorno en Vercel

En el proyecto de Vercel → **Settings** → **Environment Variables**:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://taetxohwuuzufmkzpzhb.supabase.co` | Production |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (tu anon key de Supabase) | Production |
| `VITE_PLATFORM_OWNER_EMAILS` | tu@email.com | Production (opcional) |
| `VITE_GOOGLE_MAPS_API_KEY` | (si usas mapas) | Production (opcional) |

Después de cambiar variables, haz **Redeploy** para que se apliquen.

---

## 4. OAuth (Gmail, Notion, Google Drive, etc.)

Si usas integraciones con OAuth, en cada proveedor (Google Cloud, Notion, etc.) añade la URL de callback de producción:

- Gmail: `https://moodlycrm.com/integrations/gmail/callback`
- Notion: `https://moodlycrm.com/integrations/notion/callback`
- Google Drive: `https://moodlycrm.com/integrations/google-drive/callback`
- etc.

Y en los **Secrets** de las Edge Functions (`oauth-start`, `oauth-exchange`), configura `NOTION_REDIRECT_URI`, `GOOGLE_DRIVE_REDIRECT_URI`, etc. con esas URLs.

---

## 5. Migraciones (plan Business)

```bash
supabase link --project-ref taetxohwuuzufmkzpzhb
supabase db push
```

---

## Checklist rápido

- [ ] Último deploy en Vercel después del push
- [ ] Supabase: Site URL = https://moodlycrm.com, Redirect URLs incluyen moodlycrm.com
- [ ] Vercel: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en Production
- [ ] Probar: https://moodlycrm.com → landing
- [ ] Probar: https://moodlycrm.com/features, /pricing, /contact
- [ ] Probar: login y signup
