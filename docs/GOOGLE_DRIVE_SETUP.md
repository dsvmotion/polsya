# Configuración de Google Drive OAuth

Para conectar Google Drive y Google Sheets mediante OAuth (sin API key manual).

---

## 1. Crear credenciales en Google Cloud

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Crea o selecciona un proyecto.
3. **Create Credentials** → **OAuth client ID**.
4. Si es la primera vez, configura la **OAuth consent screen** (External o Internal según tu uso).
5. Application type: **Web application**.
6. Name: `Sales Compass` (o el nombre de tu app).
7. En **Authorized redirect URIs**, añade:
   ```
   https://<TU_DOMINIO>/integrations/google-drive/callback
   ```
   Ejemplos:
   - Producción: `https://sales-compass.app/integrations/google-drive/callback`
   - Local: `http://localhost:5173/integrations/google-drive/callback`
8. Guarda y copia el **Client ID** y **Client secret**.

---

## 2. Habilitar APIs

En **APIs & Services** → **Library**, habilita:
- **Google Drive API**
- **Google Sheets API**

---

## 3. Secrets en Edge Functions

En Supabase Dashboard → **Edge Functions** → **Secrets**:

| Variable | Descripción |
|----------|-------------|
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_DRIVE_REDIRECT_URI` | URL de callback (ej. `https://sales-compass.app/integrations/google-drive/callback`) |

**Nota:** Puedes reutilizar las mismas credenciales de Gmail si quieres (proyecto compartido). En ese caso usa `GMAIL_CLIENT_ID` como fallback o crea credenciales separadas para Drive con redirect distinto.

---

## 4. Desplegar funciones

```bash
supabase functions deploy oauth-start
supabase functions deploy oauth-exchange
```

---

## 5. Conectar desde la app

1. Login → **Integrations**.
2. Añadir integración → selecciona **Google Drive**.
3. Nombre (ej. "Mi Drive").
4. Clic en **Add** → luego **Connect**.
5. Se abre Google para autorizar Drive y Sheets.
6. Tras autorizar, vuelves a la app con la cuenta conectada.

---

## Scopes utilizados

- `https://www.googleapis.com/auth/drive.readonly` — Leer archivos de Drive.
- `https://www.googleapis.com/auth/spreadsheets.readonly` — Leer hojas de cálculo.

**Sync:** El connector lista archivos de Drive (API v3). Tras conectar, ve a Integrations → "Queue sync" para sincronizar.
