import type { IntegrationProvider } from '@/types/integrations';

export interface MetadataFieldSchema {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'url' | 'email' | 'text';
}

const FORBIDDEN_KEYS = new Set([
  'api_key', 'apikey', 'api-key',
  'secret', 'client_secret', 'client-secret',
  'password', 'passwd',
  'token', 'access_token', 'refresh_token',
  'private_key', 'private-key',
]);

export const PROVIDER_METADATA_SCHEMA: Record<IntegrationProvider, MetadataFieldSchema[]> = {
  woocommerce: [
    { key: 'store_url', label: 'Store URL', placeholder: 'https://mystore.com', required: true, type: 'url' },
  ],
  shopify: [
    { key: 'store_domain', label: 'Store Domain', placeholder: 'mystore.myshopify.com', required: true, type: 'url' },
  ],
  gmail: [
    { key: 'workspace_email', label: 'Workspace Email', placeholder: 'user@company.com', required: false, type: 'email' },
  ],
  outlook: [
    { key: 'workspace_email', label: 'Workspace Email', placeholder: 'user@company.com', required: false, type: 'email' },
    { key: 'tenant_id', label: 'Tenant ID', placeholder: 'common or tenant GUID', required: false, type: 'text' },
  ],
  email_imap: [
    { key: 'account_email', label: 'Account Email', placeholder: 'contact@company.com', required: true, type: 'email' },
    { key: 'sender_name', label: 'Sender Name', placeholder: 'Sales Team', required: false, type: 'text' },
  ],
  brevo: [
    { key: 'api_base_url', label: 'API Base URL', placeholder: 'https://api.brevo.com', required: true, type: 'url' },
    { key: 'sender_email', label: 'Sender Email', placeholder: 'contact@company.com', required: false, type: 'email' },
  ],
  notion: [
    { key: 'workspace_id', label: 'Workspace ID', placeholder: 'abc123...', required: false, type: 'text' },
  ],
  openai: [
    { key: 'project_id', label: 'Project ID', placeholder: 'proj_abc123', required: false, type: 'text' },
  ],
  anthropic: [
    { key: 'workspace_id', label: 'Workspace ID', placeholder: 'ws_abc123', required: false, type: 'text' },
  ],
  custom_api: [
    { key: 'base_url', label: 'Base URL', placeholder: 'https://api.example.com', required: true, type: 'url' },
  ],
};

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_KEYS.has(key.toLowerCase().replace(/[-\s]/g, '_'));
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateIntegrationMetadata(
  provider: IntegrationProvider,
  metadata: Record<string, string>,
): ValidationResult {
  const schema = PROVIDER_METADATA_SCHEMA[provider];
  const errors: Record<string, string> = {};

  for (const key of Object.keys(metadata)) {
    if (isForbiddenKey(key)) {
      errors[key] = 'Secrets must not be stored here';
    }
  }

  for (const field of schema) {
    const value = (metadata[field.key] ?? '').trim();

    if (field.required && !value) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }

    if (!value) continue;

    if (field.type === 'url' && !isValidUrl(value)) {
      errors[field.key] = 'Must be a valid URL (https://...)';
    }
    if (field.type === 'email' && !isValidEmail(value)) {
      errors[field.key] = 'Must be a valid email';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function sanitizeIntegrationMetadata(
  provider: IntegrationProvider,
  metadata: Record<string, string>,
): Record<string, string> {
  const schema = PROVIDER_METADATA_SCHEMA[provider];
  const result: Record<string, string> = {};

  for (const field of schema) {
    let value = (metadata[field.key] ?? '').trim();
    if (!value) continue;

    if (field.type === 'url') {
      value = value.replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
      }
    }

    if (field.type === 'email') {
      value = value.toLowerCase();
    }

    result[field.key] = value;
  }

  return result;
}
