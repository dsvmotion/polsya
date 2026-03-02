import { fetchWithRetry } from './fetchWithRetry.ts';

export type SyncTarget = 'entities' | 'orders' | 'products' | 'inventory';

export interface IntegrationConnectorContext {
  organizationId: string;
  integrationId: string;
  provider: string;
  metadata: Record<string, unknown>;
}

export interface SyncRecord {
  externalId: string;
  externalUpdatedAt: string | null;
  payload: Record<string, unknown>;
}

export interface SyncStepResult {
  processed: number;
  failed: number;
  summary: string;
  records: SyncRecord[];
}

export interface IntegrationConnector {
  provider: string;
  testConnection(ctx: IntegrationConnectorContext): Promise<void>;
  syncEntities(ctx: IntegrationConnectorContext): Promise<SyncStepResult>;
  syncOrders(ctx: IntegrationConnectorContext): Promise<SyncStepResult>;
  syncProducts(ctx: IntegrationConnectorContext): Promise<SyncStepResult>;
  syncInventory(ctx: IntegrationConnectorContext): Promise<SyncStepResult>;
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.endsWith('/') ? withProtocol.slice(0, -1) : withProtocol;
}

function toRecord(value: unknown, updatedAtKeys: string[]): SyncRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  const rawId = row.id;
  if (rawId === null || rawId === undefined) return null;

  let externalUpdatedAt: string | null = null;
  for (const key of updatedAtKeys) {
    const candidate = row[key];
    if (typeof candidate === 'string' && candidate.length > 0) {
      externalUpdatedAt = candidate;
      break;
    }
  }

  return {
    externalId: String(rawId),
    externalUpdatedAt,
    payload: row,
  };
}

function dedupeRecords(records: SyncRecord[]): SyncRecord[] {
  const map = new Map<string, SyncRecord>();
  for (const record of records) {
    map.set(record.externalId, record);
  }
  return Array.from(map.values());
}

function getWooConfig(metadata: Record<string, unknown>) {
  const baseUrl = normalizeBaseUrl(
    (typeof metadata.store_url === 'string' ? metadata.store_url : '') ||
    (Deno.env.get('WOOCOMMERCE_URL') ?? ''),
  );
  const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY') ?? '';
  const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET') ?? '';

  if (!baseUrl || !consumerKey || !consumerSecret) {
    throw new Error('WooCommerce credentials are not configured (store_url + consumer key/secret)');
  }

  return {
    baseUrl,
    authHeader: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
  };
}

async function fetchWooPage(
  ctx: IntegrationConnectorContext,
  endpoint: string,
): Promise<{ items: unknown[]; total: number }> {
  const cfg = getWooConfig(ctx.metadata);
  const url = `${cfg.baseUrl}/wp-json/wc/v3/${endpoint}?per_page=50&page=1`;
  const response = await fetchWithRetry(
    url,
    {
      method: 'GET',
      headers: {
        Authorization: cfg.authHeader,
        'Content-Type': 'application/json',
      },
    },
    { action: `connector_woo_${endpoint}` },
  );

  if (!response.ok) {
    throw new Error(`WooCommerce ${endpoint} fetch failed with status ${response.status}`);
  }

  const body = await response.json();
  const items = Array.isArray(body) ? body : [];

  const totalHeader = Number(response.headers.get('X-WP-Total') ?? String(items.length));
  const total = Number.isFinite(totalHeader) && totalHeader >= 0 ? totalHeader : items.length;

  return { items, total };
}

function wooResult(target: SyncTarget, items: unknown[], total: number): SyncStepResult {
  const updatedAtKeys = ['date_modified_gmt', 'date_modified', 'date_created_gmt', 'date_created'];
  const records = dedupeRecords(
    items
      .map((item) => toRecord(item, updatedAtKeys))
      .filter((item): item is SyncRecord => item !== null),
  );

  return {
    processed: records.length,
    failed: 0,
    summary: `${target}: fetched ${records.length} records (remote total: ${total})`,
    records,
  };
}

const wooConnector: IntegrationConnector = {
  provider: 'woocommerce',
  async testConnection(ctx) {
    await fetchWooPage(ctx, 'orders');
  },
  async syncEntities(ctx) {
    const { items, total } = await fetchWooPage(ctx, 'customers');
    return wooResult('entities', items, total);
  },
  async syncOrders(ctx) {
    const { items, total } = await fetchWooPage(ctx, 'orders');
    return wooResult('orders', items, total);
  },
  async syncProducts(ctx) {
    const { items, total } = await fetchWooPage(ctx, 'products');
    return wooResult('products', items, total);
  },
  async syncInventory(ctx) {
    const { items, total } = await fetchWooPage(ctx, 'products');
    return wooResult('inventory', items, total);
  },
};

function getShopifyConfig(metadata: Record<string, unknown>) {
  const domain = normalizeBaseUrl(
    (typeof metadata.store_domain === 'string' ? metadata.store_domain : '') ||
    (Deno.env.get('SHOPIFY_STORE_DOMAIN') ?? ''),
  );
  const accessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN') ?? '';

  if (!domain || !accessToken) {
    throw new Error('Shopify credentials are not configured (store_domain + SHOPIFY_ACCESS_TOKEN)');
  }

  return { domain, accessToken };
}

async function fetchShopifyItems(
  ctx: IntegrationConnectorContext,
  endpoint: 'orders' | 'products' | 'customers',
): Promise<{ items: unknown[]; count: number }> {
  const cfg = getShopifyConfig(ctx.metadata);
  const listUrl = `${cfg.domain}/admin/api/2024-10/${endpoint}.json?limit=50&status=any`;
  const listResponse = await fetchWithRetry(
    listUrl,
    {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': cfg.accessToken,
        'Content-Type': 'application/json',
      },
    },
    { action: `connector_shopify_${endpoint}_list` },
  );

  if (!listResponse.ok) {
    throw new Error(`Shopify ${endpoint} list failed with status ${listResponse.status}`);
  }

  const listBody = await listResponse.json();
  const containerKey = endpoint;
  const items = Array.isArray(listBody?.[containerKey]) ? listBody[containerKey] : [];

  const countUrl = `${cfg.domain}/admin/api/2024-10/${endpoint}/count.json`;
  const countResponse = await fetchWithRetry(
    countUrl,
    {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': cfg.accessToken,
        'Content-Type': 'application/json',
      },
    },
    { action: `connector_shopify_${endpoint}_count` },
  );

  if (!countResponse.ok) {
    throw new Error(`Shopify ${endpoint} count failed with status ${countResponse.status}`);
  }

  const countBody = await countResponse.json();
  const countKey = `${endpoint}_count`;
  const countRaw = Number(countBody?.[countKey] ?? items.length);
  const count = Number.isFinite(countRaw) && countRaw >= 0 ? countRaw : items.length;

  return { items, count };
}

function shopifyResult(target: SyncTarget, items: unknown[], count: number): SyncStepResult {
  const records = dedupeRecords(
    items
      .map((item) => toRecord(item, ['updated_at', 'created_at']))
      .filter((item): item is SyncRecord => item !== null),
  );

  return {
    processed: records.length,
    failed: 0,
    summary: `${target}: fetched ${records.length} records (remote total: ${count})`,
    records,
  };
}

const shopifyConnector: IntegrationConnector = {
  provider: 'shopify',
  async testConnection(ctx) {
    await fetchShopifyItems(ctx, 'orders');
  },
  async syncEntities(ctx) {
    const { items, count } = await fetchShopifyItems(ctx, 'customers');
    return shopifyResult('entities', items, count);
  },
  async syncOrders(ctx) {
    const { items, count } = await fetchShopifyItems(ctx, 'orders');
    return shopifyResult('orders', items, count);
  },
  async syncProducts(ctx) {
    const { items, count } = await fetchShopifyItems(ctx, 'products');
    return shopifyResult('products', items, count);
  },
  async syncInventory(ctx) {
    const { items, count } = await fetchShopifyItems(ctx, 'products');
    return shopifyResult('inventory', items, count);
  },
};

const unsupportedConnector: IntegrationConnector = {
  provider: 'unsupported',
  async testConnection(ctx) {
    throw new Error(`Provider ${ctx.provider} is not supported yet`);
  },
  async syncEntities() {
    return { processed: 0, failed: 0, summary: 'Not supported', records: [] };
  },
  async syncOrders() {
    return { processed: 0, failed: 0, summary: 'Not supported', records: [] };
  },
  async syncProducts() {
    return { processed: 0, failed: 0, summary: 'Not supported', records: [] };
  },
  async syncInventory() {
    return { processed: 0, failed: 0, summary: 'Not supported', records: [] };
  },
};

export function getIntegrationConnector(provider: string): IntegrationConnector {
  if (provider === 'woocommerce') return wooConnector;
  if (provider === 'shopify') return shopifyConnector;
  return unsupportedConnector;
}

export function parseSyncTargets(payload: Record<string, unknown>): SyncTarget[] {
  const raw = payload.targets;
  if (!Array.isArray(raw) || raw.length === 0) return ['orders'];

  const allowed = new Set<SyncTarget>(['entities', 'orders', 'products', 'inventory']);
  const targets = raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase())
    .filter((value): value is SyncTarget => allowed.has(value as SyncTarget));

  return targets.length > 0 ? targets : ['orders'];
}
