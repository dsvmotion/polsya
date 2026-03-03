import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getPipedriveApiKey(metadata: Record<string, unknown>): string {
  const key =
    typeof metadata.api_key === 'string' && metadata.api_key.length > 0
      ? metadata.api_key
      : (Deno.env.get('PIPEDRIVE_API_KEY') ?? '');

  if (!key) {
    throw new Error('Pipedrive API key not configured. Provide api_key in metadata or set PIPEDRIVE_API_KEY.');
  }

  return key;
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for pipedrive`, records: [] };
}

function pipedriveRecords(items: Array<Record<string, unknown>>): SyncRecord[] {
  return items
    .filter((r) => r.id !== null && r.id !== undefined)
    .map((r) => ({
      externalId: String(r.id),
      externalUpdatedAt: typeof r.update_time === 'string' ? r.update_time : null,
      payload: r,
    }));
}

async function fetchContacts(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const apiKey = getPipedriveApiKey(ctx.metadata);
  const res = await fetchWithRetry(
    `https://api.pipedrive.com/v1/persons?limit=50&api_token=${apiKey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    { action: 'connector_pipedrive_contacts' },
  );

  if (!res.ok) {
    throw new Error(`Pipedrive contacts fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const records = pipedriveRecords(Array.isArray(body.data) ? body.data : []);

  return {
    processed: records.length,
    failed: 0,
    summary: `contacts: fetched ${records.length} Pipedrive persons`,
    records,
  };
}

async function fetchDeals(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const apiKey = getPipedriveApiKey(ctx.metadata);
  const res = await fetchWithRetry(
    `https://api.pipedrive.com/v1/deals?limit=50&api_token=${apiKey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    { action: 'connector_pipedrive_deals' },
  );

  if (!res.ok) {
    throw new Error(`Pipedrive deals fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const records = pipedriveRecords(Array.isArray(body.data) ? body.data : []);

  return {
    processed: records.length,
    failed: 0,
    summary: `deals: fetched ${records.length} Pipedrive deals`,
    records,
  };
}

export const pipedriveConnector: IntegrationConnector = {
  provider: 'pipedrive',

  async testConnection(ctx) {
    const apiKey = getPipedriveApiKey(ctx.metadata);
    const res = await fetchWithRetry(
      `https://api.pipedrive.com/v1/users/me?api_token=${apiKey}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      { action: 'connector_pipedrive_test' },
    );

    if (!res.ok) {
      throw new Error(`Pipedrive connection test failed with status ${res.status}`);
    }
  },

  async sync(target: SyncTarget, ctx) {
    switch (target) {
      case 'contacts':
        return fetchContacts(ctx);
      case 'deals':
        return fetchDeals(ctx);
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
