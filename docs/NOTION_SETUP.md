# Configuración de Notion OAuth

Para conectar workspaces de Notion mediante OAuth (sin API key manual).

---

## 1. Crear integración en Notion

1. Entra en [Notion Integrations](https://www.notion.so/my-integrations) → **New integration**.
2. Name: `Sales Compass` (o el nombre de tu app).
3. Asocia el workspace que quieres usar para desarrollo.
4. En **Capabilities**, activa:
   - **Content capabilities:** Read content, Update content, Insert content (según lo que necesites).
   - **User capabilities:** Read user information (opcional).
5. Guarda y copia el **OAuth client ID** y **OAuth client secret**.

---

## 2. Configurar redirect URI en Notion

En la configuración de tu integración, añade la **Redirect URI**:

```
https://<TU_DOMINIO>/integrations/notion/callback
```

Ejemplos:
- Producción: `https://sales-compass.app/integrations/notion/callback`
- Local: `http://localhost:5173/integrations/notion/callback`

---

## 3. Secrets en Edge Functions

En Supabase Dashboard → **Edge Functions** → **Secrets**:

| Variable | Descripción |
|----------|-------------|
| `NOTION_CLIENT_ID` | OAuth client ID de tu integración |
| `NOTION_CLIENT_SECRET` | OAuth client secret |
| `NOTION_REDIRECT_URI` | URL de callback (ej. `https://sales-compass.app/integrations/notion/callback`) |

---

## 4. Desplegar funciones

```bash
supabase functions deploy oauth-start
supabase functions deploy oauth-exchange
```

---

## 5. Conectar desde la app

1. Login → **Integrations**.
2. Añadir integración → selecciona **Notion**.
3. Clic en **Connect** → se abre Notion para autorizar.
4. Tras autorizar, vuelves a la app con el workspace conectado.

---

## Notas

- El token se guarda en `integration_oauth_tokens`; el `workspace_id` y `workspace_name` en `metadata`.
- Sync de datos (bases de datos, páginas) se implementa en el connector; el OAuth solo habilita la conexión.
