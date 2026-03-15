export type ProviderCategory = 'crm' | 'ecommerce' | 'email' | 'communication' | 'ai' | 'custom';
export type AuthType = 'oauth2' | 'api_key' | 'credentials' | 'none';

export type SyncTarget =
  | 'entities' | 'orders' | 'products' | 'inventory'
  | 'contacts' | 'deals' | 'invoices' | 'messages'
  | 'tickets' | 'campaigns' | 'events';

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
  description: string;
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
    description: 'Sync orders, products, and inventory from your WooCommerce store',
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
    description: 'Sync orders, products, and inventory from your Shopify store',
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
    description: 'Connect Gmail to sync contacts and email communications',
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
    description: 'Connect Outlook to sync contacts and email communications',
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
    description: 'Connect any email via IMAP/SMTP for contact sync and messaging',
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
    description: 'Sync contacts, campaigns, and email marketing data from Brevo',
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
    description: 'Connect Notion to sync workspace data and documents',
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
  google_drive: {
    key: 'google_drive',
    label: 'Google Drive',
    description: 'Connect Google Drive to import files and spreadsheet data',
    icon: '📁',
    category: 'ai',
    authType: 'oauth2',
    syncTargets: ['entities'],
    defaultTargets: ['entities'],
    metadataSchema: [],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
      envPrefix: 'GOOGLE_DRIVE',
      extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    },
  },
  openai: {
    key: 'openai',
    label: 'OpenAI',
    description: 'Connect OpenAI for AI-powered features and document processing',
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
    description: 'Connect Anthropic Claude for AI-powered features and analysis',
    icon: '🧠',
    category: 'ai',
    authType: 'api_key',
    syncTargets: [],
    defaultTargets: [],
    metadataSchema: [
      { key: 'organization_id', label: 'Organization ID', type: 'text', required: false, placeholder: 'org-...' },
    ],
  },
  custom_api: {
    key: 'custom_api',
    label: 'Custom API',
    description: 'Connect any REST API with custom configuration',
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
    description: 'Sync contacts, deals, and CRM data from HubSpot',
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
    description: 'Sync contacts, deals, and CRM data from Salesforce',
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
    description: 'Sync contacts, deals, and pipeline data from Pipedrive',
    icon: '🔵',
    category: 'crm',
    authType: 'api_key',
    syncTargets: ['contacts', 'deals'],
    defaultTargets: ['contacts'],
    metadataSchema: [
      { key: 'company_domain', label: 'Company Domain', type: 'text', required: false, placeholder: 'yourcompany.pipedrive.com' },
    ],
  },
  prestashop: {
    key: 'prestashop',
    label: 'PrestaShop',
    description: 'Sync orders, products, and inventory from PrestaShop',
    icon: '🛍️',
    category: 'ecommerce',
    authType: 'api_key',
    syncTargets: ['orders', 'products', 'inventory'],
    defaultTargets: ['orders'],
    metadataSchema: [
      { key: 'store_url', label: 'Store URL', type: 'url', required: true },
    ],
  },
  whatsapp: {
    key: 'whatsapp',
    label: 'WhatsApp',
    description: 'Send and receive WhatsApp messages via Business API',
    icon: '💬',
    category: 'communication',
    authType: 'api_key',
    syncTargets: ['messages'],
    defaultTargets: ['messages'],
    metadataSchema: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'business_account_id', label: 'Business Account ID', type: 'text', required: false },
    ],
  },
  slack: {
    key: 'slack',
    label: 'Slack',
    description: 'Receive alerts and notifications directly in Slack',
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
  sendgrid: {
    key: 'sendgrid',
    label: 'SendGrid',
    description: 'Send transactional emails and track delivery with SendGrid',
    icon: '📤',
    category: 'email',
    authType: 'api_key',
    syncTargets: ['messages', 'contacts'],
    defaultTargets: ['messages'],
    metadataSchema: [
      { key: 'sender_email', label: 'Sender Email', type: 'email', required: false },
      { key: 'sender_name', label: 'Sender Name', type: 'text', required: false },
    ],
  },
  mailchimp: {
    key: 'mailchimp',
    label: 'Mailchimp',
    description: 'Sync audiences, campaigns, and email marketing data from Mailchimp',
    icon: '🐒',
    category: 'email',
    authType: 'oauth2',
    syncTargets: ['contacts', 'campaigns'],
    defaultTargets: ['contacts'],
    metadataSchema: [],
    oauthConfig: {
      authUrl: 'https://login.mailchimp.com/oauth2/authorize',
      tokenUrl: 'https://login.mailchimp.com/oauth2/token',
      scopes: [],
      envPrefix: 'MAILCHIMP',
    },
  },
  google_sheets: {
    key: 'google_sheets',
    label: 'Google Sheets',
    description: 'Import and export data with Google Sheets spreadsheets',
    icon: '📊',
    category: 'custom',
    authType: 'oauth2',
    syncTargets: ['entities'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text', required: false, placeholder: 'From the spreadsheet URL' },
    ],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      envPrefix: 'GOOGLE_SHEETS',
      extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    },
  },
  zapier: {
    key: 'zapier',
    label: 'Zapier',
    description: 'Automate workflows by connecting Polsya with 5,000+ apps via Zapier',
    icon: '⚡',
    category: 'custom',
    authType: 'api_key',
    syncTargets: ['entities'],
    defaultTargets: ['entities'],
    metadataSchema: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: false, placeholder: 'https://hooks.zapier.com/...' },
    ],
  },
  intercom: {
    key: 'intercom',
    label: 'Intercom',
    description: 'Sync customer conversations and contact data from Intercom',
    icon: '💬',
    category: 'communication',
    authType: 'oauth2',
    syncTargets: ['contacts', 'messages'],
    defaultTargets: ['contacts'],
    metadataSchema: [],
    oauthConfig: {
      authUrl: 'https://app.intercom.com/oauth',
      tokenUrl: 'https://api.intercom.io/auth/eagle/token',
      scopes: [],
      envPrefix: 'INTERCOM',
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
