import { fetchWithRetry } from './fetchWithRetry.ts';
import { getProviderDefinition } from './provider-registry.ts';
import { hubspotConnector } from './connectors/hubspot-connector.ts';
import { salesforceConnector } from './connectors/salesforce-connector.ts';
import { pipedriveConnector } from './connectors/pipedrive-connector.ts';
import { prestashopConnector } from './connectors/prestashop-connector.ts';
import { whatsappConnector } from './connectors/whatsapp-connector.ts';
import { slackConnector } from './connectors/slack-connector.ts';

export type SyncTarget =
  | 'entities' | 'orders' | 'products' | 'inventory'
  | 'contacts' | 'deals' | 'invoices' | 'messages'
  | 'tickets' | 'campaigns' | 'events';

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
  sync(target: SyncTarget, ctx: IntegrationConnectorContext): Promise<SyncStepResult>;
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

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const laneCount = Math.max(1, Math.min(limit, items.length));
  const out: R[] = [];
  let cursor = 0;

  await Promise.all(
    Array.from({ length: laneCount }, async () => {
      while (true) {
        const idx = cursor;
        cursor += 1;
        if (idx >= items.length) break;
        out[idx] = await worker(items[idx]);
      }
    }),
  );

  return out;
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
  async sync(target, ctx) {
    switch (target) {
      case 'entities': return this.syncEntities(ctx);
      case 'orders': return this.syncOrders(ctx);
      case 'products': return this.syncProducts(ctx);
      case 'inventory': return this.syncInventory(ctx);
      default: return { processed: 0, failed: 0, summary: `${target}: not supported for woocommerce`, records: [] };
    }
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
  async sync(target, ctx) {
    switch (target) {
      case 'entities': return this.syncEntities(ctx);
      case 'orders': return this.syncOrders(ctx);
      case 'products': return this.syncProducts(ctx);
      case 'inventory': return this.syncInventory(ctx);
      default: return { processed: 0, failed: 0, summary: `${target}: not supported for shopify`, records: [] };
    }
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

function getGmailConfig(metadata: Record<string, unknown>) {
  const accessToken = typeof metadata.gmail_access_token === 'string'
    ? metadata.gmail_access_token
    : '';

  if (!accessToken) {
    throw new Error('Gmail OAuth token not found. Connect Gmail first.');
  }

  return { accessToken };
}

function getHeaderValue(headers: Array<{ name?: string; value?: string }> | undefined, key: string): string | null {
  if (!Array.isArray(headers)) return null;
  const match = headers.find((h) => (h.name ?? '').toLowerCase() === key.toLowerCase());
  const value = match?.value;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function fetchGmailMessageRecords(ctx: IntegrationConnectorContext): Promise<SyncRecord[]> {
  const cfg = getGmailConfig(ctx.metadata);

  const listRes = await fetchWithRetry(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=newer_than:14d',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}` },
    },
    { action: 'connector_gmail_messages_list' },
  );

  if (!listRes.ok) {
    throw new Error(`Gmail message list failed with status ${listRes.status}`);
  }

  const listJson = await listRes.json() as { messages?: Array<{ id?: string }> };
  const ids = (listJson.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const records = await runWithConcurrency(ids, 5, async (id) => {
    const msgRes = await fetchWithRetry(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      },
      { action: 'connector_gmail_message_detail' },
    );

    if (!msgRes.ok) return null;

    const msgJson = await msgRes.json() as {
      id?: string;
      internalDate?: string;
      snippet?: string;
      payload?: { headers?: Array<{ name?: string; value?: string }> };
    };

    const messageId = msgJson.id;
    if (!messageId) return null;

    const internalDateMs = Number(msgJson.internalDate ?? 0);
    const internalIso = Number.isFinite(internalDateMs) && internalDateMs > 0
      ? new Date(internalDateMs).toISOString()
      : null;

    const headers = msgJson.payload?.headers;
    return {
      externalId: messageId,
      externalUpdatedAt: internalIso,
      payload: {
        id: messageId,
        from: getHeaderValue(headers, 'From'),
        to: getHeaderValue(headers, 'To'),
        subject: getHeaderValue(headers, 'Subject'),
        date: getHeaderValue(headers, 'Date'),
        snippet: msgJson.snippet ?? null,
        internalDate: msgJson.internalDate ?? null,
      },
    } as SyncRecord;
  });

  return dedupeRecords(records.filter((record): record is SyncRecord => record !== null));
}

const gmailConnector: IntegrationConnector = {
  provider: 'gmail',
  async testConnection(ctx) {
    const cfg = getGmailConfig(ctx.metadata);
    const res = await fetchWithRetry(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      },
      { action: 'connector_gmail_profile' },
    );

    if (!res.ok) {
      throw new Error(`Gmail profile check failed with status ${res.status}`);
    }
  },
  async sync(target, ctx) {
    switch (target) {
      case 'entities': return this.syncEntities(ctx);
      case 'messages': return this.syncEntities(ctx);
      default: return { processed: 0, failed: 0, summary: `${target}: not applicable for gmail`, records: [] };
    }
  },
  async syncEntities(ctx) {
    const records = await fetchGmailMessageRecords(ctx);
    return {
      processed: records.length,
      failed: 0,
      summary: `entities: fetched ${records.length} recent messages`,
      records,
    };
  },
  async syncOrders() {
    return {
      processed: 0,
      failed: 0,
      summary: 'orders: not applicable for gmail',
      records: [],
    };
  },
  async syncProducts() {
    return {
      processed: 0,
      failed: 0,
      summary: 'products: not applicable for gmail',
      records: [],
    };
  },
  async syncInventory() {
    return {
      processed: 0,
      failed: 0,
      summary: 'inventory: not applicable for gmail',
      records: [],
    };
  },
};

function getOutlookConfig(metadata: Record<string, unknown>) {
  const accessToken = typeof metadata.outlook_access_token === 'string'
    ? metadata.outlook_access_token
    : '';

  if (!accessToken) {
    throw new Error('Outlook OAuth token not found. Connect Outlook first.');
  }

  return { accessToken };
}

async function fetchOutlookMessageRecords(ctx: IntegrationConnectorContext): Promise<SyncRecord[]> {
  const cfg = getOutlookConfig(ctx.metadata);

  const listRes = await fetchWithRetry(
    'https://graph.microsoft.com/v1.0/me/messages?$top=20&$select=id,subject,receivedDateTime,lastModifiedDateTime,bodyPreview,from,toRecipients,internetMessageId',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}` },
    },
    { action: 'connector_outlook_messages_list' },
  );

  if (!listRes.ok) {
    throw new Error(`Outlook message list failed with status ${listRes.status}`);
  }

  const listJson = await listRes.json() as { value?: Array<Record<string, unknown>> };
  const messages = Array.isArray(listJson.value) ? listJson.value : [];

  return dedupeRecords(
    messages
      .map((message) => {
        const id = typeof message.id === 'string' ? message.id : null;
        if (!id) return null;

        const from = (message.from as { emailAddress?: { address?: string; name?: string } } | undefined)
          ?.emailAddress?.address ?? null;
        const toRecipients = Array.isArray(message.toRecipients)
          ? message.toRecipients
            .map((r) => (r as { emailAddress?: { address?: string } })?.emailAddress?.address)
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
          : [];

        const updatedAt = typeof message.lastModifiedDateTime === 'string'
          ? message.lastModifiedDateTime
          : (typeof message.receivedDateTime === 'string' ? message.receivedDateTime : null);

        return {
          externalId: id,
          externalUpdatedAt: updatedAt,
          payload: {
            id,
            subject: typeof message.subject === 'string' ? message.subject : null,
            from,
            to: toRecipients,
            bodyPreview: typeof message.bodyPreview === 'string' ? message.bodyPreview : null,
            receivedDateTime: typeof message.receivedDateTime === 'string' ? message.receivedDateTime : null,
            internetMessageId: typeof message.internetMessageId === 'string' ? message.internetMessageId : null,
          },
        } as SyncRecord;
      })
      .filter((record): record is SyncRecord => record !== null),
  );
}

const outlookConnector: IntegrationConnector = {
  provider: 'outlook',
  async testConnection(ctx) {
    const cfg = getOutlookConfig(ctx.metadata);
    const res = await fetchWithRetry(
      'https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      },
      { action: 'connector_outlook_profile' },
    );

    if (!res.ok) {
      throw new Error(`Outlook profile check failed with status ${res.status}`);
    }
  },
  async sync(target, ctx) {
    switch (target) {
      case 'entities': return this.syncEntities(ctx);
      case 'messages': return this.syncEntities(ctx);
      default: return { processed: 0, failed: 0, summary: `${target}: not applicable for outlook`, records: [] };
    }
  },
  async syncEntities(ctx) {
    const records = await fetchOutlookMessageRecords(ctx);
    return {
      processed: records.length,
      failed: 0,
      summary: `entities: fetched ${records.length} recent messages`,
      records,
    };
  },
  async syncOrders() {
    return {
      processed: 0,
      failed: 0,
      summary: 'orders: not applicable for outlook',
      records: [],
    };
  },
  async syncProducts() {
    return {
      processed: 0,
      failed: 0,
      summary: 'products: not applicable for outlook',
      records: [],
    };
  },
  async syncInventory() {
    return {
      processed: 0,
      failed: 0,
      summary: 'inventory: not applicable for outlook',
      records: [],
    };
  },
};

function getEmailImapConfig(metadata: Record<string, unknown>) {
  const accountEmail = typeof metadata.account_email === 'string' ? metadata.account_email : '';
  const username = typeof metadata.username === 'string' ? metadata.username : '';
  const imapHost = typeof metadata.imap_host === 'string' ? metadata.imap_host : '';
  const smtpHost = typeof metadata.smtp_host === 'string' ? metadata.smtp_host : '';

  if (!accountEmail || !username || !imapHost || !smtpHost) {
    throw new Error('IMAP/SMTP credentials are not configured. Save credentials first.');
  }

  return { accountEmail, username, imapHost, smtpHost };
}

const emailImapConnector: IntegrationConnector = {
  provider: 'email_imap',
  async testConnection(ctx) {
    getEmailImapConfig(ctx.metadata);
  },
  async sync(target, ctx) {
    switch (target) {
      case 'entities': return this.syncEntities(ctx);
      case 'messages': return this.syncEntities(ctx);
      default: return { processed: 0, failed: 0, summary: `${target}: not applicable for email_imap`, records: [] };
    }
  },
  async syncEntities(ctx) {
    const cfg = getEmailImapConfig(ctx.metadata);
    const nowIso = new Date().toISOString();
    const normalizedEmail = cfg.accountEmail.trim().toLowerCase();

    const records: SyncRecord[] = [{
      externalId: `email_imap_config:${normalizedEmail}`,
      externalUpdatedAt: nowIso,
      payload: {
        kind: 'imap_config_checkpoint',
        sync_mode: 'config_only',
        account_email: cfg.accountEmail,
        username: cfg.username,
        imap_host: cfg.imapHost,
        smtp_host: cfg.smtpHost,
        synced_at: nowIso,
      },
    }];

    return {
      processed: records.length,
      failed: 0,
      summary: `entities: config-only checkpoint for ${cfg.accountEmail} (full mailbox sync pending)`,
      records,
    };
  },
  async syncOrders() {
    return {
      processed: 0,
      failed: 0,
      summary: 'orders: not applicable for email_imap',
      records: [],
    };
  },
  async syncProducts() {
    return {
      processed: 0,
      failed: 0,
      summary: 'products: not applicable for email_imap',
      records: [],
    };
  },
  async syncInventory() {
    return {
      processed: 0,
      failed: 0,
      summary: 'inventory: not applicable for email_imap',
      records: [],
    };
  },
};

function getBrevoConfig(metadata: Record<string, unknown>) {
  const apiBaseUrl = normalizeBaseUrl(
    (typeof metadata.api_base_url === 'string' ? metadata.api_base_url : '') ||
    (Deno.env.get('BREVO_API_BASE_URL') ?? 'https://api.brevo.com'),
  );
  const apiKey = typeof metadata.brevo_api_key === 'string'
    ? metadata.brevo_api_key
    : (Deno.env.get('BREVO_API_KEY') ?? '');

  if (!apiBaseUrl || !apiKey) {
    throw new Error('Brevo credentials are not configured. Save API key first.');
  }

  return { apiBaseUrl, apiKey };
}

async function fetchBrevoRecords(ctx: IntegrationConnectorContext): Promise<SyncRecord[]> {
  const cfg = getBrevoConfig(ctx.metadata);
  const headers = {
    'api-key': cfg.apiKey,
    'Content-Type': 'application/json',
  };

  const campaignsRes = await fetchWithRetry(
    `${cfg.apiBaseUrl}/v3/emailCampaigns?limit=25&sort=desc`,
    { method: 'GET', headers },
    { action: 'connector_brevo_campaigns' },
  );
  if (!campaignsRes.ok) {
    throw new Error(`Brevo campaigns fetch failed with status ${campaignsRes.status}`);
  }
  const campaignsJson = await campaignsRes.json() as { campaigns?: Array<Record<string, unknown>> };
  const campaigns = Array.isArray(campaignsJson.campaigns) ? campaignsJson.campaigns : [];

  const contactsRes = await fetchWithRetry(
    `${cfg.apiBaseUrl}/v3/contacts?limit=25`,
    { method: 'GET', headers },
    { action: 'connector_brevo_contacts' },
  );
  if (!contactsRes.ok) {
    throw new Error(`Brevo contacts fetch failed with status ${contactsRes.status}`);
  }
  const contactsJson = await contactsRes.json() as { contacts?: Array<Record<string, unknown>> };
  const contacts = Array.isArray(contactsJson.contacts) ? contactsJson.contacts : [];

  const campaignRecords: SyncRecord[] = campaigns
    .map((campaign) => {
      const id = campaign.id;
      if (id === null || id === undefined) return null;
      const sentDate = typeof campaign.sentDate === 'string' ? campaign.sentDate : null;
      const modifiedDate = typeof campaign.modifiedDate === 'string' ? campaign.modifiedDate : null;
      const createdAt = typeof campaign.createdAt === 'string' ? campaign.createdAt : null;
      const externalUpdatedAt = modifiedDate ?? sentDate ?? createdAt;

      return {
        externalId: `campaign:${String(id)}`,
        externalUpdatedAt,
        payload: {
          kind: 'campaign',
          id,
          name: typeof campaign.name === 'string' ? campaign.name : null,
          subject: typeof campaign.subject === 'string' ? campaign.subject : null,
          status: typeof campaign.status === 'string' ? campaign.status : null,
          sentDate,
          modifiedDate,
          createdAt,
        },
      } as SyncRecord;
    })
    .filter((record): record is SyncRecord => record !== null);

  const contactRecords: SyncRecord[] = contacts
    .map((contact) => {
      const email = typeof contact.email === 'string' ? contact.email.toLowerCase() : null;
      const id = contact.id;
      const externalId = email || (id === null || id === undefined ? null : `contact:${String(id)}`);
      if (!externalId) return null;

      const modifiedAt = typeof contact.modifiedAt === 'string' ? contact.modifiedAt : null;
      const createdAt = typeof contact.createdAt === 'string' ? contact.createdAt : null;
      const externalUpdatedAt = modifiedAt ?? createdAt;

      return {
        externalId,
        externalUpdatedAt,
        payload: {
          kind: 'contact',
          id: id ?? null,
          email,
          attributes: typeof contact.attributes === 'object' && contact.attributes !== null
            ? contact.attributes
            : null,
          modifiedAt,
          createdAt,
          listIds: Array.isArray(contact.listIds) ? contact.listIds : [],
        },
      } as SyncRecord;
    })
    .filter((record): record is SyncRecord => record !== null);

  return dedupeRecords([...campaignRecords, ...contactRecords]);
}

const brevoConnector: IntegrationConnector = {
  provider: 'brevo',
  async testConnection(ctx) {
    const cfg = getBrevoConfig(ctx.metadata);
    const res = await fetchWithRetry(
      `${cfg.apiBaseUrl}/v3/account`,
      {
        method: 'GET',
        headers: {
          'api-key': cfg.apiKey,
          'Content-Type': 'application/json',
        },
      },
      { action: 'connector_brevo_account' },
    );

    if (!res.ok) {
      throw new Error(`Brevo account check failed with status ${res.status}`);
    }
  },
  async sync(target, ctx) {
    switch (target) {
      case 'entities': return this.syncEntities(ctx);
      case 'campaigns': return this.syncEntities(ctx);
      case 'contacts': return this.syncEntities(ctx);
      default: return { processed: 0, failed: 0, summary: `${target}: not applicable for brevo`, records: [] };
    }
  },
  async syncEntities(ctx) {
    const records = await fetchBrevoRecords(ctx);
    return {
      processed: records.length,
      failed: 0,
      summary: `entities: fetched ${records.length} Brevo campaigns/contacts`,
      records,
    };
  },
  async syncOrders() {
    return {
      processed: 0,
      failed: 0,
      summary: 'orders: not applicable for brevo',
      records: [],
    };
  },
  async syncProducts() {
    return {
      processed: 0,
      failed: 0,
      summary: 'products: not applicable for brevo',
      records: [],
    };
  },
  async syncInventory() {
    return {
      processed: 0,
      failed: 0,
      summary: 'inventory: not applicable for brevo',
      records: [],
    };
  },
};

const unsupportedConnector: IntegrationConnector = {
  provider: 'unsupported',
  async testConnection(ctx) {
    throw new Error(`Provider ${ctx.provider} is not supported yet`);
  },
  async sync(_target) {
    return { processed: 0, failed: 0, summary: 'Not supported', records: [] };
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

const connectorMap: Record<string, IntegrationConnector> = {
  woocommerce: wooConnector,
  shopify: shopifyConnector,
  gmail: gmailConnector,
  outlook: outlookConnector,
  email_imap: emailImapConnector,
  brevo: brevoConnector,
  hubspot: hubspotConnector,
  salesforce: salesforceConnector,
  pipedrive: pipedriveConnector,
  prestashop: prestashopConnector,
  whatsapp: whatsappConnector,
  slack: slackConnector,
  notion: unsupportedConnector,
  openai: unsupportedConnector,
  anthropic: unsupportedConnector,
  custom_api: unsupportedConnector,
};

export function getIntegrationConnector(provider: string): IntegrationConnector {
  return connectorMap[provider] ?? unsupportedConnector;
}

export function parseSyncTargets(provider: string, payload: Record<string, unknown>): SyncTarget[] {
  const def = getProviderDefinition(provider);
  const allowed = new Set<SyncTarget>(def?.syncTargets ?? ['entities', 'orders', 'products', 'inventory']);
  const defaults = def?.defaultTargets ?? ['orders'];

  const raw = payload.targets;
  if (!Array.isArray(raw) || raw.length === 0) return defaults;

  const targets = raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase())
    .filter((value): value is SyncTarget => allowed.has(value as SyncTarget));

  return targets.length > 0 ? targets : defaults;
}
