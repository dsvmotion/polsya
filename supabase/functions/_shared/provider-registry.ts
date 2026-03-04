import type { SyncTarget } from './integration-connectors.ts';

export type ProviderCategory = 'crm' | 'ecommerce' | 'email' | 'communication' | 'ai' | 'custom';
export type AuthType = 'oauth2' | 'api_key' | 'credentials' | 'none';

export interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'email' | 'select';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  envPrefix: string;
  extraAuthParams?: Record<string, string>;
}

export interface ProviderDefinition {
  key: string;
  label: string;
  icon: string;
  category: ProviderCategory;
  authType: AuthType;
  syncTargets: SyncTarget[];
  defaultTargets: SyncTarget[];
  metadataSchema: MetadataField[];
  oauthConfig?: OAuthConfig;
}

export const PROVIDER_REGISTRY: Record<string, ProviderDefinition> = {
  woocommerce: {
    key: 'woocommerce',
    label: 'WooCommerce',
    icon: '🛒',
    category: 'ecommerce',
    authType: 'api_key',
    syncTargets: ['entities', 'orders', 'products', 'inventory'],
    defaultTargets: ['orders'],
    metadataSchema: [
      { key: 'store_url', label: 'Store URL', type: 'url', required: true },
    ],
  },
  shopify: {
    key: 'shopify',
    label: 'Shopify',
    icon: '🏪',
    category: 'ecommerce',
    authType: 'api_key',
    syncTargets: ['entities', 'orders', 'products', 'inventory'],
    defaultTargets: ['orders'],
    metadataSchema: [
      { key: 'store_domain', label: 'Store Domain', type: 'url', required: true },
    ],
  },
  gmail: {
    key: 'gmail',
    label: 'Gmail',
    icon: '✉️',
    category: 'email',
    authType: 'oauth2',
    syncTargets: ['entities', 'messages'],
    defaultTargets: ['entities'],
    metadataSchema: [],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      envPrefix: 'GMAIL',
      extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    },
  },
  outlook: {
    key: 'outlook',
    label: 'Outlook',
    icon: '📧',
    category: 'email',
    authType: 'oauth2',
    syncTargets: ['entities', 'messages'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'workspace_email', label: 'Workspace Email', type: 'email', required: false },
      { key: 'tenant_id', label: 'Tenant ID', type: 'text', required: false, placeholder: 'common' },
    ],
    oauthConfig: {
      authUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
      scopes: [
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Mail.Send',
        'offline_access',
      ],
      envPrefix: 'OUTLOOK',
      extraAuthParams: { prompt: 'select_account' },
    },
  },
  email_imap: {
    key: 'email_imap',
    label: 'IMAP/SMTP',
    icon: '📮',
    category: 'email',
    authType: 'credentials',
    syncTargets: ['entities', 'messages'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'account_email', label: 'Account Email', type: 'email', required: true },
      { key: 'imap_host', label: 'IMAP Host', type: 'text', required: true },
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', required: true },
      { key: 'sender_name', label: 'Sender Name', type: 'text', required: false },
    ],
  },
  brevo: {
    key: 'brevo',
    label: 'Brevo',
    icon: '📣',
    category: 'email',
    authType: 'api_key',
    syncTargets: ['entities', 'campaigns', 'contacts'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'api_base_url', label: 'API Base URL', type: 'url', required: false, placeholder: 'https://api.brevo.com' },
      { key: 'sender_email', label: 'Sender Email', type: 'email', required: false },
    ],
  },
  notion: {
    key: 'notion',
    label: 'Notion',
    icon: '📓',
    category: 'ai',
    authType: 'oauth2',
    syncTargets: ['entities'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'workspace_id', label: 'Workspace ID', type: 'text', required: false },
    ],
    oauthConfig: {
      authUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: [],
      envPrefix: 'NOTION',
      extraAuthParams: { owner: 'user' },
    },
  },
  openai: {
    key: 'openai',
    label: 'OpenAI',
    icon: '🤖',
    category: 'ai',
    authType: 'api_key',
    syncTargets: [],
    defaultTargets: [],
    metadataSchema: [
      { key: 'project_id', label: 'Project ID', type: 'text', required: false },
    ],
  },
  anthropic: {
    key: 'anthropic',
    label: 'Anthropic',
    icon: '🧠',
    category: 'ai',
    authType: 'api_key',
    syncTargets: [],
    defaultTargets: [],
    metadataSchema: [
      { key: 'workspace_id', label: 'Workspace ID', type: 'text', required: false },
    ],
  },
  custom_api: {
    key: 'custom_api',
    label: 'Custom API',
    icon: '🔌',
    category: 'custom',
    authType: 'api_key',
    syncTargets: ['entities', 'orders', 'products', 'inventory'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'base_url', label: 'Base URL', type: 'url', required: true },
    ],
  },
  hubspot: {
    key: 'hubspot',
    label: 'HubSpot',
    icon: '🟠',
    category: 'crm',
    authType: 'oauth2',
    syncTargets: ['contacts', 'deals'],
    defaultTargets: ['contacts'],
    metadataSchema: [],
    oauthConfig: {
      authUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scopes: ['crm.objects.contacts.read', 'crm.objects.deals.read'],
      envPrefix: 'HUBSPOT',
    },
  },
  salesforce: {
    key: 'salesforce',
    label: 'Salesforce',
    icon: '☁️',
    category: 'crm',
    authType: 'oauth2',
    syncTargets: ['contacts', 'deals'],
    defaultTargets: ['contacts'],
    metadataSchema: [
      { key: 'instance_url', label: 'Instance URL', type: 'url', required: false },
    ],
    oauthConfig: {
      authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      scopes: ['api', 'refresh_token'],
      envPrefix: 'SALESFORCE',
    },
  },
  pipedrive: {
    key: 'pipedrive',
    label: 'Pipedrive',
    icon: '🔵',
    category: 'crm',
    authType: 'api_key',
    syncTargets: ['contacts', 'deals'],
    defaultTargets: ['contacts'],
    metadataSchema: [
      { key: 'api_key', label: 'API Token', type: 'text', required: true },
    ],
  },
  prestashop: {
    key: 'prestashop',
    label: 'PrestaShop',
    icon: '🛍️',
    category: 'ecommerce',
    authType: 'api_key',
    syncTargets: ['orders', 'products', 'inventory'],
    defaultTargets: ['orders'],
    metadataSchema: [
      { key: 'store_url', label: 'Store URL', type: 'url', required: true },
      { key: 'api_key', label: 'API Key', type: 'text', required: true },
    ],
  },
  whatsapp: {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    category: 'communication',
    authType: 'api_key',
    syncTargets: ['messages'],
    defaultTargets: ['messages'],
    metadataSchema: [
      { key: 'access_token', label: 'Access Token', type: 'text', required: true },
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', required: true },
    ],
  },
  slack: {
    key: 'slack',
    label: 'Slack',
    icon: '💼',
    category: 'communication',
    authType: 'oauth2',
    syncTargets: ['messages'],
    defaultTargets: ['messages'],
    metadataSchema: [
      { key: 'channel_id', label: 'Channel ID', type: 'text', required: false },
    ],
    oauthConfig: {
      authUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['channels:history', 'channels:read'],
      envPrefix: 'SLACK',
    },
  },
};

export function getProviderDefinition(provider: string): ProviderDefinition | undefined {
  return PROVIDER_REGISTRY[provider];
}

export function getSyncCapableProviders(): ProviderDefinition[] {
  return Object.values(PROVIDER_REGISTRY).filter((def) => def.syncTargets.length > 0);
}

export function getAllProviderKeys(): string[] {
  return Object.keys(PROVIDER_REGISTRY);
}
