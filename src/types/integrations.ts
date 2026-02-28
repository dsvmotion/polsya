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
