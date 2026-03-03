import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getPrestashopConfig(metadata: Record<string, unknown>) {
  const storeUrl =
    typeof metadata.store_url === 'string'
      ? metadata.store_url.replace(/\/+$/, '')
      : '';
  const apiKey =
    typeof metadata.api_key === 'string' ? metadata.api_key : '';

  if (!storeUrl || !apiKey) {
    throw new Error('PrestaShop credentials not configured (store_url + api_key).');
  }

  return {
    storeUrl,
    authHeader: `Basic ${btoa(`${apiKey}:`)}`,
  };
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for prestashop`, records: [] };
}

function prestashopRecords(
  items: Array<Record<string, unknown>>,
  updatedAtKeys: string[],
): SyncRecord[] {
  return items
    .filter((r) => r.id !== null && r.id !== undefined)
    .map((r) => {
      let externalUpdatedAt: string | null = null;
      for (const key of updatedAtKeys) {
        const candidate = r[key];
        if (typeof candidate === 'string' && candidate.length > 0) {
          externalUpdatedAt = candidate;
          break;
        }
      }
      return {
        externalId: String(r.id),
        externalUpdatedAt,
        payload: r,
      };
    });
}

async function fetchPrestashopResource(
  ctx: IntegrationConnectorContext,
  resource: string,
  action: string,
): Promise<Array<Record<string, unknown>>> {
  const cfg = getPrestashopConfig(ctx.metadata);
  const res = await fetchWithRetry(
    `${cfg.storeUrl}/api/${resource}?output_format=JSON&display=full&limit=50`,
    {
      method: 'GET',
      headers: { Authorization: cfg.authHeader, 'Content-Type': 'application/json' },
    },
    { action },
  );

  if (!res.ok) {
    throw new Error(`PrestaShop ${resource} fetch failed with status ${res.status}`);
  }

  const body = await res.json();
  const items = Array.isArray(body?.[resource]) ? body[resource] : [];
  return items as Array<Record<string, unknown>>;
}

async function fetchOrders(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const items = await fetchPrestashopResource(ctx, 'orders', 'connector_prestashop_orders');
  const records = prestashopRecords(items, ['date_upd', 'date_add']);

  return {
    processed: records.length,
    failed: 0,
    summary: `orders: fetched ${records.length} PrestaShop orders`,
    records,
  };
}

async function fetchProducts(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const items = await fetchPrestashopResource(ctx, 'products', 'connector_prestashop_products');
  const records = prestashopRecords(items, ['date_upd', 'date_add']);

  return {
    processed: records.length,
    failed: 0,
    summary: `products: fetched ${records.length} PrestaShop products`,
    records,
  };
}

async function fetchInventory(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const items = await fetchPrestashopResource(ctx, 'stock_availables', 'connector_prestashop_inventory');
  const records = prestashopRecords(items, ['date_upd', 'date_add']);

  return {
    processed: records.length,
    failed: 0,
    summary: `inventory: fetched ${records.length} PrestaShop stock records`,
    records,
  };
}

export const prestashopConnector: IntegrationConnector = {
  provider: 'prestashop',

  async testConnection(ctx) {
    const cfg = getPrestashopConfig(ctx.metadata);
    const res = await fetchWithRetry(
      `${cfg.storeUrl}/api/shop?output_format=JSON`,
      {
        method: 'GET',
        headers: { Authorization: cfg.authHeader, 'Content-Type': 'application/json' },
      },
      { action: 'connector_prestashop_test' },
    );

    if (!res.ok) {
      throw new Error(`PrestaShop connection test failed with status ${res.status}`);
    }
  },

  async sync(target: SyncTarget, ctx) {
    switch (target) {
      case 'orders':
        return fetchOrders(ctx);
      case 'products':
        return fetchProducts(ctx);
      case 'inventory':
        return fetchInventory(ctx);
      default:
        return notApplicable(target);
    }
  },

  async syncEntities() {
    return notApplicable('entities');
  },
  async syncOrders(ctx) {
    return fetchOrders(ctx);
  },
  async syncProducts(ctx) {
    return fetchProducts(ctx);
  },
  async syncInventory(ctx) {
    return fetchInventory(ctx);
  },
};
