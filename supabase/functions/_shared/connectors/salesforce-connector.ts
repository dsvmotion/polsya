import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getSalesforceConfig(metadata: Record<string, unknown>) {
  const accessToken =
    typeof metadata.salesforce_access_token === 'string'
      ? metadata.salesforce_access_token
      : '';
  const instanceUrl =
    typeof metadata.instance_url === 'string'
      ? metadata.instance_url.replace(/\/+$/, '')
      : '';

  if (!accessToken || !instanceUrl) {
    throw new Error('Salesforce credentials not configured (access_token + instance_url).');
  }

  return { accessToken, instanceUrl };
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for salesforce`, records: [] };
}

function soqlRecords(rows: Array<Record<string, unknown>>): SyncRecord[] {
  return rows
    .filter((r) => r.Id !== null && r.Id !== undefined)
    .map((r) => ({
      externalId: String(r.Id),
      externalUpdatedAt: typeof r.LastModifiedDate === 'string' ? r.LastModifiedDate : null,
      payload: r,
    }));
}

async function fetchContacts(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const cfg = getSalesforceConfig(ctx.metadata);
  const query = 'SELECT+Id,Name,Email,Phone,CreatedDate,LastModifiedDate+FROM+Contact+LIMIT+50';
  const res = await fetchWithRetry(
    `${cfg.instanceUrl}/services/data/v59.0/query?q=${query}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    },
    { action: 'connector_salesforce_contacts' },
  );

  if (!res.ok) {
    throw new Error(`Salesforce contacts fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { records?: Array<Record<string, unknown>> };
  const records = soqlRecords(Array.isArray(body.records) ? body.records : []);

  return {
    processed: records.length,
    failed: 0,
    summary: `contacts: fetched ${records.length} Salesforce contacts`,
    records,
  };
}

async function fetchDeals(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const cfg = getSalesforceConfig(ctx.metadata);
  const query = 'SELECT+Id,Name,Amount,StageName,CloseDate,CreatedDate,LastModifiedDate+FROM+Opportunity+LIMIT+50';
  const res = await fetchWithRetry(
    `${cfg.instanceUrl}/services/data/v59.0/query?q=${query}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    },
    { action: 'connector_salesforce_deals' },
  );

  if (!res.ok) {
    throw new Error(`Salesforce deals fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { records?: Array<Record<string, unknown>> };
  const records = soqlRecords(Array.isArray(body.records) ? body.records : []);

  return {
    processed: records.length,
    failed: 0,
    summary: `deals: fetched ${records.length} Salesforce opportunities`,
    records,
  };
}

export const salesforceConnector: IntegrationConnector = {
  provider: 'salesforce',

  async testConnection(ctx) {
    const cfg = getSalesforceConfig(ctx.metadata);
    const res = await fetchWithRetry(
      `${cfg.instanceUrl}/services/data/v59.0/limits`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
      },
      { action: 'connector_salesforce_test' },
    );

    if (!res.ok) {
      throw new Error(`Salesforce connection test failed with status ${res.status}`);
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
