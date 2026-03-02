import { fetchWithRetry } from './fetchWithRetry.ts';

export type SyncTarget = 'entities' | 'orders' | 'products' | 'inventory';

export interface IntegrationConnectorContext {
  organizationId: string;
  integrationId: string;
  provider: string;
  metadata: Record<string, unknown>;
}

export interface SyncStepResult {
  processed: number;
  failed: number;
  summary: string;
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

async function fetchWooCount(
  ctx: IntegrationConnectorContext,
  endpoint: string,
): Promise<number> {
  const cfg = getWooConfig(ctx.metadata);
  const url = `${cfg.baseUrl}/wp-json/wc/v3/${endpoint}?per_page=1&page=1`;
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

  const total = Number(response.headers.get('X-WP-Total') ?? '0');
  if (!Number.isFinite(total) || total < 0) return 0;
  return total;
}

const wooConnector: IntegrationConnector = {
  provider: 'woocommerce',
  async testConnection(ctx) {
    await fetchWooCount(ctx, 'orders');
  },
  async syncEntities(ctx) {
    const count = await fetchWooCount(ctx, 'customers');
    return { processed: count, failed: 0, summary: `Customers discovered: ${count}` };
  },
  async syncOrders(ctx) {
    const count = await fetchWooCount(ctx, 'orders');
    return { processed: count, failed: 0, summary: `Orders discovered: ${count}` };
  },
  async syncProducts(ctx) {
    const count = await fetchWooCount(ctx, 'products');
    return { processed: count, failed: 0, summary: `Products discovered: ${count}` };
  },
  async syncInventory(ctx) {
    const count = await fetchWooCount(ctx, 'products');
    return { processed: count, failed: 0, summary: `Inventory snapshot from ${count} products` };
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

async function fetchShopifyCount(
  ctx: IntegrationConnectorContext,
  endpoint: 'orders' | 'products' | 'customers',
): Promise<number> {
  const cfg = getShopifyConfig(ctx.metadata);
  const url = `${cfg.domain}/admin/api/2024-10/${endpoint}/count.json`;

  const response = await fetchWithRetry(
    url,
    {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': cfg.accessToken,
        'Content-Type': 'application/json',
      },
    },
    { action: `connector_shopify_${endpoint}` },
  );

  if (!response.ok) {
    throw new Error(`Shopify ${endpoint} count failed with status ${response.status}`);
  }

  const body = await response.json();
  const key = `${endpoint}_count`;
  const count = Number(body?.[key] ?? 0);
  if (!Number.isFinite(count) || count < 0) return 0;
  return count;
}

const shopifyConnector: IntegrationConnector = {
  provider: 'shopify',
  async testConnection(ctx) {
    await fetchShopifyCount(ctx, 'orders');
  },
  async syncEntities(ctx) {
    const count = await fetchShopifyCount(ctx, 'customers');
    return { processed: count, failed: 0, summary: `Customers discovered: ${count}` };
  },
  async syncOrders(ctx) {
    const count = await fetchShopifyCount(ctx, 'orders');
    return { processed: count, failed: 0, summary: `Orders discovered: ${count}` };
  },
  async syncProducts(ctx) {
    const count = await fetchShopifyCount(ctx, 'products');
    return { processed: count, failed: 0, summary: `Products discovered: ${count}` };
  },
  async syncInventory(ctx) {
    const count = await fetchShopifyCount(ctx, 'products');
    return { processed: count, failed: 0, summary: `Inventory snapshot from ${count} products` };
  },
};

const unsupportedConnector: IntegrationConnector = {
  provider: 'unsupported',
  async testConnection(ctx) {
    throw new Error(`Provider ${ctx.provider} is not supported yet`);
  },
  async syncEntities() {
    return { processed: 0, failed: 0, summary: 'Not supported' };
  },
  async syncOrders() {
    return { processed: 0, failed: 0, summary: 'Not supported' };
  },
  async syncProducts() {
    return { processed: 0, failed: 0, summary: 'Not supported' };
  },
  async syncInventory() {
    return { processed: 0, failed: 0, summary: 'Not supported' };
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
