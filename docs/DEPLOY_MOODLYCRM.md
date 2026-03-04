# Desplegar a moodlycrm.com

Guía para publicar los cambios en tu dominio de producción.

---

## 1. Subir cambios a Git

```bash
# Añadir todos los archivos modificados
git add docs/STRIPE_SETUP.md src/lib/signupPlan.ts src/pages/Features.tsx src/pages/Landing.tsx src/pages/Pricing.tsx supabase/migrations/20250218120000_bill_business_plan.sql

# Commit
git commit -m "feat: landing B2B profesional, plan Business, integraciones visibles"

# Push a tu repositorio (GitHub/GitLab)
git push origin main
```

---

## 2. Vercel (despliegue automático)

Si tu proyecto está conectado a Vercel:

1. **Vercel** despliega automáticamente al hacer push a `main`.
2. **Dominio**: [vercel.com/dashboard](https://vercel.com/dashboard) → tu proyecto → **Settings** → **Domains** → añade `moodlycrm.com`.
3. En el DNS de tu proveedor (donde gestionas moodlycrm.com):
   - Añade un registro **CNAME**: `www` → `cname.vercel-dns.com`
   - O un registro **A** con la IP que te indique Vercel.
4. Espera a que el deploy termine (unos minutos).

---

## 3. Variables de entorno en Vercel

En **Settings** → **Environment Variables**, asegúrate de tener:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `VITE_GOOGLE_MAPS_API_KEY` | (opcional) Para mapas |
| `VITE_PLATFORM_OWNER_EMAILS` | (opcional) Tu email para bypass de suscripción |
| `VITE_BILLING_SKIP_GATE` | (opcional) `true` solo para pruebas en staging |

Tras añadir o cambiar variables, haz **Redeploy** para que se apliquen.

---

## 4. Aplicar migraciones en Supabase

Para el plan Business y el resto de cambios en BD:

```bash
supabase link --project-ref <TU_PROJECT_REF>
supabase db push
```

Sustituye `<TU_PROJECT_REF>` por el ID de tu proyecto Supabase (Dashboard → Settings → General).

---

## 5. Verificar

1. Ve a `https://moodlycrm.com`.
2. Comprueba que la landing B2B se ve correctamente.
3. Prueba login, registro y flujo de billing.

---

## Si usas otro proveedor (Netlify, etc.)

- **Netlify**: Conecta el repo, configura el build command `npm run build` y publish directory `dist`.
- **Otros**: El build de Vite genera la carpeta `dist/`. Sube su contenido a tu hosting estático o configúralo según la documentación de tu proveedor.
