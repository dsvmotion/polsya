export type IntegrationProvider =
  | 'woocommerce'
  | 'shopify'
  | 'gmail'
  | 'outlook'
  | 'email_imap'
  | 'brevo'
  | 'notion'
  | 'google_drive'
  | 'openai'
  | 'anthropic'
  | 'custom_api'
  | 'hubspot'
  | 'salesforce'
  | 'pipedrive'
  | 'prestashop'
  | 'whatsapp'
  | 'slack'
  | 'sendgrid'
  | 'mailchimp'
  | 'google_sheets'
  | 'zapier'
  | 'intercom'
  | 'zoom'
  | 'mailgun'
  | 'klaviyo'
  | 'airtable'
  | 'zendesk'
  | 'segment';

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
  outlook: 'Outlook',
  email_imap: 'IMAP/SMTP',
  brevo: 'Brevo',
  notion: 'Notion',
  google_drive: 'Google Drive',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom_api: 'Custom API',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  pipedrive: 'Pipedrive',
  prestashop: 'PrestaShop',
  whatsapp: 'WhatsApp',
  slack: 'Slack',
  sendgrid: 'SendGrid',
  mailchimp: 'Mailchimp',
  google_sheets: 'Google Sheets',
  zapier: 'Zapier',
  intercom: 'Intercom',
  zoom: 'Zoom',
  mailgun: 'Mailgun',
  klaviyo: 'Klaviyo',
  airtable: 'Airtable',
  zendesk: 'Zendesk',
  segment: 'Segment',
};

export const PROVIDER_ICONS: Record<IntegrationProvider, string> = {
  woocommerce: '🛒',
  shopify: '🏪',
  gmail: '✉️',
  outlook: '📧',
  email_imap: '📮',
  brevo: '📣',
  notion: '📓',
  google_drive: '📁',
  openai: '🤖',
  anthropic: '🧠',
  custom_api: '🔌',
  hubspot: '🟠',
  salesforce: '☁️',
  pipedrive: '🔵',
  prestashop: '🛍️',
  whatsapp: '💬',
  slack: '💼',
  sendgrid: '📤',
  mailchimp: '🐒',
  google_sheets: '📊',
  zapier: '⚡',
  intercom: '💬',
  zoom: '📹',
  mailgun: '📬',
  klaviyo: '📈',
  airtable: '📋',
  zendesk: '🎫',
  segment: '🔀',
};

export const STATUS_COLORS: Record<IntegrationStatus, { bg: string; text: string; dot: string }> = {
  connected: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  disconnected: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export interface WooCommerceMetadata { store_url: string }
export interface ShopifyMetadata { store_domain: string }
export interface GmailMetadata { workspace_email?: string }
export interface OutlookMetadata { workspace_email?: string; tenant_id?: string }
export interface EmailImapMetadata { account_email: string; sender_name?: string }
export interface BrevoMetadata { api_base_url: string; sender_email?: string }
export interface NotionMetadata { workspace_id?: string }
export interface GoogleDriveMetadata { workspace_email?: string }
export interface OpenAIMetadata { project_id?: string }
export interface AnthropicMetadata { workspace_id?: string }
export interface CustomApiMetadata { base_url: string }
export interface HubSpotMetadata { hubspot_access_token?: string }
export interface SalesforceMetadata { salesforce_access_token?: string; instance_url?: string }
export interface PipedriveMetadata { api_key: string }
export interface PrestaShopMetadata { store_url: string; api_key: string }
export interface WhatsAppMetadata { access_token: string; phone_number_id: string }
export interface SlackMetadata { slack_access_token?: string; channel_id?: string }
export interface SendGridMetadata { sender_email?: string; sender_name?: string }
export interface MailchimpMetadata { mailchimp_access_token?: string }
export interface GoogleSheetsMetadata { spreadsheet_id?: string }
export interface ZapierMetadata { webhook_url?: string }
export interface IntercomMetadata { intercom_access_token?: string }
export interface ZoomMetadata { zoom_access_token?: string }
export interface MailgunMetadata { domain?: string; region?: string }
export interface KlaviyoMetadata { api_key?: string }
export interface AirtableMetadata { base_id?: string }
export interface ZendeskMetadata { subdomain: string; zendesk_access_token?: string }
export interface SegmentMetadata { write_key?: string }

export interface IntegrationMetadataByProvider {
  woocommerce: WooCommerceMetadata;
  shopify: ShopifyMetadata;
  gmail: GmailMetadata;
  outlook: OutlookMetadata;
  email_imap: EmailImapMetadata;
  brevo: BrevoMetadata;
  notion: NotionMetadata;
  google_drive: GoogleDriveMetadata;
  openai: OpenAIMetadata;
  anthropic: AnthropicMetadata;
  custom_api: CustomApiMetadata;
  hubspot: HubSpotMetadata;
  salesforce: SalesforceMetadata;
  pipedrive: PipedriveMetadata;
  prestashop: PrestaShopMetadata;
  whatsapp: WhatsAppMetadata;
  slack: SlackMetadata;
  sendgrid: SendGridMetadata;
  mailchimp: MailchimpMetadata;
  google_sheets: GoogleSheetsMetadata;
  zapier: ZapierMetadata;
  intercom: IntercomMetadata;
  zoom: ZoomMetadata;
  mailgun: MailgunMetadata;
  klaviyo: KlaviyoMetadata;
  airtable: AirtableMetadata;
  zendesk: ZendeskMetadata;
  segment: SegmentMetadata;
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
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  last_attempt_at: string | null;
  dead_lettered_at: string | null;
}

export const INTEGRATION_JOB_STATUS_COLORS: Record<IntegrationJobStatus, { bg: string; text: string }> = {
  queued: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  running: { bg: 'bg-blue-100', text: 'text-blue-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
};
