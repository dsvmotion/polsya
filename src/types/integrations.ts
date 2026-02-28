export type IntegrationProvider =
  | 'woocommerce'
  | 'shopify'
  | 'gmail'
  | 'notion'
  | 'openai'
  | 'anthropic'
  | 'custom_api';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  display_name: string;
  status: IntegrationStatus;
  is_enabled: boolean;
  metadata: Record<string, unknown>;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  woocommerce: 'WooCommerce',
  shopify: 'Shopify',
  gmail: 'Gmail',
  notion: 'Notion',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom_api: 'Custom API',
};

export const PROVIDER_ICONS: Record<IntegrationProvider, string> = {
  woocommerce: '🛒',
  shopify: '🏪',
  gmail: '✉️',
  notion: '📓',
  openai: '🤖',
  anthropic: '🧠',
  custom_api: '🔌',
};

export const STATUS_COLORS: Record<IntegrationStatus, { bg: string; text: string; dot: string }> = {
  connected: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  disconnected: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export type SyncRunType = 'manual' | 'scheduled' | 'webhook';

export type SyncRunStatus = 'running' | 'success' | 'error';

export interface IntegrationSyncRun {
  id: string;
  integration_id: string;
  run_type: SyncRunType;
  status: SyncRunStatus;
  started_at: string;
  finished_at: string | null;
  records_processed: number;
  records_failed: number;
  error_message: string | null;
  created_at: string;
}

export const SYNC_RUN_STATUS_COLORS: Record<SyncRunStatus, { bg: string; text: string }> = {
  running: { bg: 'bg-blue-100', text: 'text-blue-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
};
