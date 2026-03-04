import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

const NOTION_API_VERSION = '2022-06-28';

function getNotionConfig(metadata: Record<string, unknown>) {
  const accessToken =
    typeof metadata.notion_access_token === 'string'
      ? metadata.notion_access_token
      : '';

  if (!accessToken) {
    throw new Error('Notion OAuth token not found. Connect Notion first.');
  }

  return { accessToken };
}

function extractTitle(blocks: Array<{ plain_text?: string }> | undefined): string {
  if (!Array.isArray(blocks)) return '';
  return blocks.map((b) => b.plain_text ?? '').join('').trim() || 'Untitled';
}

async function fetchDatabases(ctx: IntegrationConnectorContext): Promise<SyncRecord[]> {
  const cfg = getNotionConfig(ctx.metadata);

  const res = await fetchWithRetry(
    'https://api.notion.com/v1/search',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.accessToken}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'object', value: 'database' },
        page_size: 100,
      }),
    },
    { action: 'connector_notion_databases' },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Notion search failed: ${res.status} ${errText}`);
  }

  const body = (await res.json()) as {
    results?: Array<{
      id?: string;
      title?: Array<{ plain_text?: string }>;
      last_edited_time?: string;
      created_time?: string;
      url?: string;
    }>;
  };

  const results = Array.isArray(body.results) ? body.results : [];
  const records: SyncRecord[] = results
    .filter((r) => r.id)
    .map((r) => ({
      externalId: r.id!,
      externalUpdatedAt: r.last_edited_time ?? r.created_time ?? null,
      payload: {
        id: r.id,
        title: extractTitle(r.title),
        last_edited_time: r.last_edited_time,
        created_time: r.created_time,
        url: r.url,
      },
    }));

  return records;
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for notion`, records: [] };
}

export const notionConnector: IntegrationConnector = {
  provider: 'notion',

  async testConnection(ctx) {
    const cfg = getNotionConfig(ctx.metadata);
    const res = await fetchWithRetry(
      'https://api.notion.com/v1/search',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.accessToken}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 1 }),
      },
      { action: 'connector_notion_test' },
    );

    if (!res.ok) {
      throw new Error(`Notion connection test failed: ${res.status}`);
    }
  },

  async sync(target: SyncTarget, ctx) {
    if (target === 'entities') return this.syncEntities(ctx);
    return notApplicable(target);
  },

  async syncEntities(ctx) {
    const records = await fetchDatabases(ctx);
    return {
      processed: records.length,
      failed: 0,
      summary: `entities: fetched ${records.length} Notion databases`,
      records,
    };
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
