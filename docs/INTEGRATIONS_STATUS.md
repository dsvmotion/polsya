# Estado de integraciones

## Conectadas y funcionando

| Provider | Auth | Sync | Notas |
|----------|------|------|-------|
| WooCommerce | API keys | Pedidos, productos | Edge functions `woocommerce-orders`, `woocommerce-orders-detailed` |
| Gmail | OAuth | Email | `gmail-oauth-url`, `gmail-oauth-exchange` |
| Outlook | OAuth | Email | `outlook-oauth-url`, `outlook-oauth-exchange` |
| Google Maps | API key (env) | Geocoding, Places | Uso en Prospecting |
| OpenAI / Anthropic | API key (vault) | Chat AI | `ai-chat-proxy` |

## OAuth listo, sync pendiente

- **Notion** — OAuth implementado (connect en /integrations). Sync de bases de datos pendiente. Ver [NOTION_SETUP.md](./NOTION_SETUP.md).

## Registradas, sin connector

Provider en BD y UI, pero sin lógica de sync (muestran "unsupported" o similar):
- **Slack** — Pendiente
- **HubSpot** — Pendiente
- **Salesforce** — Pendiente
- **Pipedrive** — Pendiente

## En roadmap

- Notion (OAuth, sync de bases de datos)
- Google Drive/Sheets (OAuth)
- Figma (evaluar)
