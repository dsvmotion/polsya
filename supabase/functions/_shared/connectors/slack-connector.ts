import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getSlackConfig(metadata: Record<string, unknown>) {
  const accessToken =
    typeof metadata.slack_access_token === 'string'
      ? metadata.slack_access_token
      : '';
  const channelId =
    typeof metadata.channel_id === 'string' ? metadata.channel_id : '';

  if (!accessToken) {
    throw new Error('Slack OAuth token not found. Connect Slack first.');
  }

  return { accessToken, channelId };
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for slack`, records: [] };
}

async function fetchMessages(ctx: IntegrationConnectorContext): Promise<SyncStepResult> {
  const cfg = getSlackConfig(ctx.metadata);

  if (!cfg.channelId) {
    return {
      processed: 0,
      failed: 0,
      summary: 'messages: no channel_id configured, skipping',
      records: [],
    };
  }

  const res = await fetchWithRetry(
    `https://slack.com/api/conversations.history?channel=${cfg.channelId}&limit=50`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    },
    { action: 'connector_slack_messages' },
  );

  if (!res.ok) {
    throw new Error(`Slack messages fetch failed with status ${res.status}`);
  }

  const body = (await res.json()) as { ok?: boolean; messages?: Array<Record<string, unknown>>; error?: string };

  if (body.ok === false) {
    throw new Error(`Slack API error: ${body.error ?? 'unknown'}`);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  const records: SyncRecord[] = messages
    .filter((m) => typeof m.ts === 'string')
    .map((m) => ({
      externalId: String(m.ts),
      externalUpdatedAt: typeof m.ts === 'string' ? new Date(Number(m.ts) * 1000).toISOString() : null,
      payload: m,
    }));

  return {
    processed: records.length,
    failed: 0,
    summary: `messages: fetched ${records.length} Slack messages`,
    records,
  };
}

export const slackConnector: IntegrationConnector = {
  provider: 'slack',

  async testConnection(ctx) {
    const cfg = getSlackConfig(ctx.metadata);
    const res = await fetchWithRetry(
      'https://slack.com/api/auth.test',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
      },
      { action: 'connector_slack_test' },
    );

    if (!res.ok) {
      throw new Error(`Slack connection test failed with status ${res.status}`);
    }

    const body = (await res.json()) as { ok?: boolean; error?: string };
    if (body.ok === false) {
      throw new Error(`Slack auth.test failed: ${body.error ?? 'unknown'}`);
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
