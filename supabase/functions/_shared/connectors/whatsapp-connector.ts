import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getWhatsappConfig(metadata: Record<string, unknown>) {
  const accessToken =
    typeof metadata.access_token === 'string' ? metadata.access_token : '';
  const phoneNumberId =
    typeof metadata.phone_number_id === 'string' ? metadata.phone_number_id : '';

  if (!accessToken || !phoneNumberId) {
    throw new Error('WhatsApp credentials not configured (access_token + phone_number_id).');
  }

  return { accessToken, phoneNumberId };
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for whatsapp`, records: [] };
}

async function fetchMessages(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const cfg = getWhatsappConfig(ctx.metadata);
  const res = await fetchWithRetry(
    `https://graph.facebook.com/v18.0/${cfg.phoneNumberId}/messages`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    },
    { action: 'connector_whatsapp_messages' },
  );

  if (!res.ok) {
    throw new Error(`WhatsApp messages fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const items = Array.isArray(body.data) ? body.data : [];

  const records: SyncRecord[] = items
    .filter((r) => r.id !== null && r.id !== undefined)
    .map((r) => ({
      externalId: String(r.id),
      externalUpdatedAt: typeof r.timestamp === 'string' ? r.timestamp : null,
      payload: r,
    }));

  return {
    processed: records.length,
    failed: 0,
    summary: `messages: fetched ${records.length} WhatsApp messages`,
    records,
  };
}

export const whatsappConnector: IntegrationConnector = {
  provider: 'whatsapp',

  async testConnection(ctx) {
    const cfg = getWhatsappConfig(ctx.metadata);
    const res = await fetchWithRetry(
      `https://graph.facebook.com/v18.0/${cfg.phoneNumberId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
      },
      { action: 'connector_whatsapp_test' },
    );

    if (!res.ok) {
      throw new Error(`WhatsApp connection test failed with status ${res.status}`);
    }
  },

  async sync(target: SyncTarget, ctx) {
    switch (target) {
      case 'messages':
        return fetchMessages(ctx);
      default:
        return notApplicable(target);
    }
  },

  async syncEntities() {
    return notApplicable('entities');
  },
  async syncOrders() {
    return notApplicable('orders');
  },
  async syncProducts() {
    return notApplicable('products');
  },
  async syncInventory() {
    return notApplicable('inventory');
  },
};
