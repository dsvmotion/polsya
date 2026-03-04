# Estado de integraciones

## Conectadas y funcionando

| Provider | Auth | Sync | Notas |
|----------|------|------|-------|
| WooCommerce | API keys | Pedidos, productos | Edge functions `woocommerce-orders`, `woocommerce-orders-detailed` |
| Gmail | OAuth | Email | `gmail-oauth-url`, `gmail-oauth-exchange` |
| Outlook | OAuth | Email | `outlook-oauth-url`, `outlook-oauth-exchange` |
| Google Maps | API key (env) | Geocoding, Places | Uso en Prospecting |
| OpenAI / Anthropic | API key (env) | Chat AI | `ai-chat-proxy` (OpenAI por defecto; Claude por org vía ai_chat_config) |
| OpenAI | API key (env) | Embeddings | `ai-embeddings` (RAG, búsqueda semántica) |

## OAuth listo, sync básico operativo

- **Notion** — OAuth + sync de bases de datos (Search API). Conecta en /integrations, luego "Queue sync" para sincronizar. Ver [NOTION_SETUP.md](./NOTION_SETUP.md).
- **Google Drive** — OAuth + sync de archivos (Drive API v3). Conecta en /integrations, luego "Queue sync" para listar archivos. Ver [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md).

## Registradas, sin connector

Provider en BD y UI, pero sin lógica de sync (muestran "unsupported" o similar):
- **Slack** — Pendiente
- **HubSpot** — Pendiente
- **Salesforce** — Pendiente
- **Pipedrive** — Pendiente

## En roadmap

- Notion (sync de páginas dentro de bases de datos)
- Google Drive (sync de contenido de hojas; filtros por carpeta/tipo)
- Figma (evaluar)
