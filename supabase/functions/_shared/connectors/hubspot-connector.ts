import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getHubspotConfig(metadata: Record<string, unknown>) {
  const accessToken =
    typeof metadata.hubspot_access_token === 'string'
      ? metadata.hubspot_access_token
      : '';

  if (!accessToken) {
    throw new Error('HubSpot OAuth token not found. Connect HubSpot first.');
  }

  return { accessToken };
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for hubspot`, records: [] };
}

async function fetchContacts(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const cfg = getHubspotConfig(ctx.metadata);
  const res = await fetchWithRetry(
    'https://api.hubapi.com/crm/v3/objects/contacts?limit=50',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    },
    { action: 'connector_hubspot_contacts' },
  );

  if (!res.ok) {
    throw new Error(`HubSpot contacts fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const results = Array.isArray(body.results) ? body.results : [];

  const records: SyncRecord[] = results
    .filter((r) => r.id !== null && r.id !== undefined)
    .map((r) => ({
      externalId: String(r.id),
      externalUpdatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null,
      payload: r,
    }));

  return {
    processed: records.length,
    failed: 0,
    summary: `contacts: fetched ${records.length} HubSpot contacts`,
    records,
  };
}

async function fetchDeals(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const cfg = getHubspotConfig(ctx.metadata);
  const res = await fetchWithRetry(
    'https://api.hubapi.com/crm/v3/objects/deals?limit=50',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    },
    { action: 'connector_hubspot_deals' },
  );

  if (!res.ok) {
    throw new Error(`HubSpot deals fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const results = Array.isArray(body.results) ? body.results : [];

  const records: SyncRecord[] = results
    .filter((r) => r.id !== null && r.id !== undefined)
    .map((r) => ({
      externalId: String(r.id),
      externalUpdatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null,
      payload: r,
    }));

  return {
    processed: records.length,
    failed: 0,
    summary: `deals: fetched ${records.length} HubSpot deals`,
    records,
  };
}

export const hubspotConnector: IntegrationConnector = {
  provider: 'hubspot',

  async testConnection(ctx) {
    const cfg = getHubspotConfig(ctx.metadata);
    const res = await fetchWithRetry(
      'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
      },
      { action: 'connector_hubspot_test' },
    );

    if (!res.ok) {
      throw new Error(`HubSpot connection test failed with status ${res.status}`);
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
