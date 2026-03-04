import { fetchWithRetry } from '../fetchWithRetry.ts';
import type {
  IntegrationConnector,
  IntegrationConnectorContext,
  SyncRecord,
  SyncStepResult,
  SyncTarget,
} from '../integration-connectors.ts';

function getGoogleDriveConfig(metadata: Record<string, unknown>) {
  const accessToken =
    typeof metadata.google_drive_access_token === 'string'
      ? metadata.google_drive_access_token
      : '';

  if (!accessToken) {
    throw new Error('Google Drive OAuth token not found. Connect Google Drive first.');
  }

  return { accessToken };
}

async function fetchFiles(ctx: IntegrationConnectorContext): Promise<SyncRecord[]> {
  const cfg = getGoogleDriveConfig(ctx.metadata);
  const pageSize = 100;
  const fields = 'nextPageToken,files(id,name,mimeType,modifiedTime,createdTime,webViewLink)';

  const res = await fetchWithRetry(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.accessToken}` },
    },
    { action: 'connector_google_drive_files' },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Drive files list failed: ${res.status} ${errText}`);
  }

  const body = (await res.json()) as {
    files?: Array<{
      id?: string;
      name?: string;
      mimeType?: string;
      modifiedTime?: string;
      createdTime?: string;
      webViewLink?: string;
    }>;
  };

  const files = Array.isArray(body.files) ? body.files : [];
  const records: SyncRecord[] = files
    .filter((f) => f.id)
    .map((f) => ({
      externalId: f.id!,
      externalUpdatedAt: f.modifiedTime ?? f.createdTime ?? null,
      payload: {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
        createdTime: f.createdTime,
        webViewLink: f.webViewLink,
      },
    }));

  return records;
}

function notApplicable(target: string): SyncStepResult {
  return { processed: 0, failed: 0, summary: `${target}: not applicable for google_drive`, records: [] };
}

export const googleDriveConnector: IntegrationConnector = {
  provider: 'google_drive',

  async testConnection(ctx) {
    const cfg = getGoogleDriveConfig(ctx.metadata);
    const res = await fetchWithRetry(
      'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      },
      { action: 'connector_google_drive_test' },
    );

    if (!res.ok) {
      throw new Error(`Google Drive connection test failed: ${res.status}`);
    }
  },

  async sync(target: SyncTarget, ctx) {
    if (target === 'entities') return this.syncEntities(ctx);
    return notApplicable(target);
  },

  async syncEntities(ctx) {
    const records = await fetchFiles(ctx);
    return {
      processed: records.length,
      failed: 0,
      summary: `entities: fetched ${records.length} Drive files`,
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
