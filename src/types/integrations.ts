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
  organization_id?: string;
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

export interface WooCommerceMetadata { store_url: string }
export interface ShopifyMetadata { store_domain: string }
export interface GmailMetadata { workspace_email?: string }
export interface NotionMetadata { workspace_id?: string }
export interface OpenAIMetadata { project_id?: string }
export interface AnthropicMetadata { workspace_id?: string }
export interface CustomApiMetadata { base_url: string }

export interface IntegrationMetadataByProvider {
  woocommerce: WooCommerceMetadata;
  shopify: ShopifyMetadata;
  gmail: GmailMetadata;
  notion: NotionMetadata;
  openai: OpenAIMetadata;
  anthropic: AnthropicMetadata;
  custom_api: CustomApiMetadata;
}

export type IntegrationMetadata = IntegrationMetadataByProvider[IntegrationProvider];

export type SyncRunType = 'manual' | 'scheduled' | 'webhook';

export type SyncRunStatus = 'running' | 'success' | 'error';

export interface IntegrationSyncRun {
  id: string;
  organization_id?: string;
  integration_id: string;
  run_type: SyncRunType;
  status: SyncRunStatus;
  started_at: string;
  finished_at: string | null;
  duration_ms: number;
  records_processed: number;
  records_failed: number;
  metrics: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
}

export interface IntegrationSyncObject {
  id: string;
  organization_id?: string;
  integration_id: string;
  provider: string;
  sync_target: 'entities' | 'orders' | 'products' | 'inventory';
  external_id: string;
  external_updated_at: string | null;
  payload: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export const SYNC_RUN_STATUS_COLORS: Record<SyncRunStatus, { bg: string; text: string }> = {
  running: { bg: 'bg-blue-100', text: 'text-blue-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
};

export type IntegrationJobType = 'manual' | 'scheduled' | 'webhook';

export type IntegrationJobStatus = 'queued' | 'running' | 'success' | 'error' | 'cancelled';

export interface IntegrationSyncJob {
  id: string;
  organization_id?: string;
  integration_id: string;
  provider: string;
  job_type: IntegrationJobType;
  status: IntegrationJobStatus;
  payload: Record<string, unknown>;
  requested_by: string | null;
  idempotency_key: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export const INTEGRATION_JOB_STATUS_COLORS: Record<IntegrationJobStatus, { bg: string; text: string }> = {
  queued: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  running: { bg: 'bg-blue-100', text: 'text-blue-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
};
