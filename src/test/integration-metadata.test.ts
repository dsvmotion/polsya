import { describe, it, expect } from 'vitest';
import {
  validateIntegrationMetadata,
  sanitizeIntegrationMetadata,
  PROVIDER_METADATA_SCHEMA,
} from '../lib/integration-metadata';

describe('validateIntegrationMetadata', () => {
  // --- Required fields ---

  it('rejects empty store_url for woocommerce', () => {
    const r = validateIntegrationMetadata('woocommerce', {});
    expect(r.valid).toBe(false);
    expect(r.errors.store_url).toContain('required');
  });

  it('rejects whitespace-only store_url for woocommerce', () => {
    const r = validateIntegrationMetadata('woocommerce', { store_url: '   ' });
    expect(r.valid).toBe(false);
    expect(r.errors.store_url).toContain('required');
  });

  it('rejects empty store_domain for shopify', () => {
    const r = validateIntegrationMetadata('shopify', {});
    expect(r.valid).toBe(false);
    expect(r.errors.store_domain).toContain('required');
  });

  it('rejects empty base_url for custom_api', () => {
    const r = validateIntegrationMetadata('custom_api', { base_url: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.base_url).toContain('required');
  });

  it('rejects empty api_base_url for brevo', () => {
    const r = validateIntegrationMetadata('brevo', { api_base_url: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.api_base_url).toContain('required');
  });

  // --- Optional fields pass when empty ---

  it('passes gmail with no metadata', () => {
    const r = validateIntegrationMetadata('gmail', {});
    expect(r.valid).toBe(true);
    expect(Object.keys(r.errors)).toHaveLength(0);
  });

  it('passes notion with empty workspace_id', () => {
    const r = validateIntegrationMetadata('notion', { workspace_id: '' });
    expect(r.valid).toBe(true);
  });

  it('passes openai with no metadata', () => {
    const r = validateIntegrationMetadata('openai', {});
    expect(r.valid).toBe(true);
  });

  it('passes anthropic with no metadata', () => {
    const r = validateIntegrationMetadata('anthropic', {});
    expect(r.valid).toBe(true);
  });

  it('passes outlook with no metadata', () => {
    const r = validateIntegrationMetadata('outlook', {});
    expect(r.valid).toBe(true);
  });

  it('rejects empty account_email for email_imap', () => {
    const r = validateIntegrationMetadata('email_imap', {});
    expect(r.valid).toBe(false);
    expect(r.errors.account_email).toContain('required');
  });

  // --- Valid URLs ---

  it('accepts valid https URL for woocommerce', () => {
    const r = validateIntegrationMetadata('woocommerce', { store_url: 'https://mystore.com' });
    expect(r.valid).toBe(true);
  });

  it('accepts valid http URL for custom_api', () => {
    const r = validateIntegrationMetadata('custom_api', { base_url: 'http://localhost:3000' });
    expect(r.valid).toBe(true);
  });

  it('accepts valid https URL for brevo', () => {
    const r = validateIntegrationMetadata('brevo', { api_base_url: 'https://api.brevo.com' });
    expect(r.valid).toBe(true);
  });

  it('accepts valid shopify domain URL', () => {
    const r = validateIntegrationMetadata('shopify', { store_domain: 'https://mystore.myshopify.com' });
    expect(r.valid).toBe(true);
  });

  // --- Invalid URLs ---

  it('rejects plain text as URL for woocommerce', () => {
    const r = validateIntegrationMetadata('woocommerce', { store_url: 'not-a-url' });
    expect(r.valid).toBe(false);
    expect(r.errors.store_url).toContain('valid URL');
  });

  it('rejects ftp:// as URL for shopify', () => {
    const r = validateIntegrationMetadata('shopify', { store_domain: 'ftp://files.example.com' });
    expect(r.valid).toBe(false);
    expect(r.errors.store_domain).toContain('valid URL');
  });

  it('rejects URL without protocol for custom_api', () => {
    const r = validateIntegrationMetadata('custom_api', { base_url: 'api.example.com' });
    expect(r.valid).toBe(false);
    expect(r.errors.base_url).toContain('valid URL');
  });

  it('rejects URL without protocol for brevo', () => {
    const r = validateIntegrationMetadata('brevo', { api_base_url: 'api.brevo.com' });
    expect(r.valid).toBe(false);
    expect(r.errors.api_base_url).toContain('valid URL');
  });

  // --- Valid emails ---

  it('accepts valid email for gmail', () => {
    const r = validateIntegrationMetadata('gmail', { workspace_email: 'user@company.com' });
    expect(r.valid).toBe(true);
  });

  it('accepts valid account_email for email_imap', () => {
    const r = validateIntegrationMetadata('email_imap', { account_email: 'contact@company.com' });
    expect(r.valid).toBe(true);
  });

  it('accepts valid sender_email for brevo', () => {
    const r = validateIntegrationMetadata('brevo', {
      api_base_url: 'https://api.brevo.com',
      sender_email: 'contact@company.com',
    });
    expect(r.valid).toBe(true);
  });

  // --- Invalid emails ---

  it('rejects email without @', () => {
    const r = validateIntegrationMetadata('gmail', { workspace_email: 'usercompany.com' });
    expect(r.valid).toBe(false);
    expect(r.errors.workspace_email).toContain('valid email');
  });

  it('rejects email without domain', () => {
    const r = validateIntegrationMetadata('gmail', { workspace_email: 'user@' });
    expect(r.valid).toBe(false);
    expect(r.errors.workspace_email).toContain('valid email');
  });

  it('rejects email with spaces', () => {
    const r = validateIntegrationMetadata('gmail', { workspace_email: 'user @company.com' });
    expect(r.valid).toBe(false);
    expect(r.errors.workspace_email).toContain('valid email');
  });

  it('rejects invalid account_email for email_imap', () => {
    const r = validateIntegrationMetadata('email_imap', { account_email: 'not-an-email' });
    expect(r.valid).toBe(false);
    expect(r.errors.account_email).toContain('valid email');
  });

  it('rejects invalid sender_email for brevo', () => {
    const r = validateIntegrationMetadata('brevo', {
      api_base_url: 'https://api.brevo.com',
      sender_email: 'not-an-email',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.sender_email).toContain('valid email');
  });

  // --- Forbidden keys ---

  it('blocks api_key in metadata', () => {
    const r = validateIntegrationMetadata('woocommerce', { store_url: 'https://x.com', api_key: 'sk_123' });
    expect(r.valid).toBe(false);
    expect(r.errors.api_key).toContain('Secrets');
  });

  it('blocks token in metadata', () => {
    const r = validateIntegrationMetadata('notion', { token: 'ntn_abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.token).toContain('Secrets');
  });

  it('blocks client_secret in metadata', () => {
    const r = validateIntegrationMetadata('shopify', { store_domain: 'https://x.myshopify.com', client_secret: 'abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.client_secret).toContain('Secrets');
  });

  it('blocks password in metadata', () => {
    const r = validateIntegrationMetadata('gmail', { password: 'hunter2' });
    expect(r.valid).toBe(false);
    expect(r.errors.password).toContain('Secrets');
  });

  it('blocks access_token in metadata', () => {
    const r = validateIntegrationMetadata('openai', { access_token: 'tok_abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.access_token).toContain('Secrets');
  });

  it('blocks private_key in metadata', () => {
    const r = validateIntegrationMetadata('anthropic', { private_key: 'pk_abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.private_key).toContain('Secrets');
  });

  // --- Combined: forbidden key + valid required field ---

  it('reports both forbidden key and valid field', () => {
    const r = validateIntegrationMetadata('woocommerce', { store_url: 'https://ok.com', secret: 'x' });
    expect(r.valid).toBe(false);
    expect(r.errors.secret).toBeDefined();
    expect(r.errors.store_url).toBeUndefined();
  });

  // --- Schema coverage ---

  it('has schema defined for every provider', () => {
    const providers = ['woocommerce', 'shopify', 'gmail', 'outlook', 'email_imap', 'brevo', 'notion', 'openai', 'anthropic', 'custom_api'] as const;
    for (const p of providers) {
      expect(PROVIDER_METADATA_SCHEMA[p]).toBeDefined();
      expect(Array.isArray(PROVIDER_METADATA_SCHEMA[p])).toBe(true);
    }
  });
});

describe('sanitizeIntegrationMetadata', () => {
  // --- Trim ---

  it('trims whitespace from values', () => {
    const r = sanitizeIntegrationMetadata('notion', { workspace_id: '  abc123  ' });
    expect(r.workspace_id).toBe('abc123');
  });

  // --- URL: prepend https:// ---

  it('prepends https:// to URL without protocol', () => {
    const r = sanitizeIntegrationMetadata('woocommerce', { store_url: 'mystore.com' });
    expect(r.store_url).toBe('https://mystore.com');
  });

  it('prepends https:// to shopify domain without protocol', () => {
    const r = sanitizeIntegrationMetadata('shopify', { store_domain: 'mystore.myshopify.com' });
    expect(r.store_domain).toBe('https://mystore.myshopify.com');
  });

  it('preserves existing https://', () => {
    const r = sanitizeIntegrationMetadata('woocommerce', { store_url: 'https://mystore.com' });
    expect(r.store_url).toBe('https://mystore.com');
  });

  it('preserves existing http://', () => {
    const r = sanitizeIntegrationMetadata('custom_api', { base_url: 'http://localhost:3000' });
    expect(r.base_url).toBe('http://localhost:3000');
  });

  it('preserves existing https:// for brevo', () => {
    const r = sanitizeIntegrationMetadata('brevo', { api_base_url: 'https://api.brevo.com' });
    expect(r.api_base_url).toBe('https://api.brevo.com');
  });

  // --- URL: strip trailing slashes ---

  it('strips trailing slash from URL', () => {
    const r = sanitizeIntegrationMetadata('woocommerce', { store_url: 'https://mystore.com/' });
    expect(r.store_url).toBe('https://mystore.com');
  });

  it('strips multiple trailing slashes from URL', () => {
    const r = sanitizeIntegrationMetadata('custom_api', { base_url: 'https://api.example.com///' });
    expect(r.base_url).toBe('https://api.example.com');
  });

  it('normalizes brevo api url and lowercases sender email', () => {
    const r = sanitizeIntegrationMetadata('brevo', {
      api_base_url: '  api.brevo.com/  ',
      sender_email: 'SALES@COMPANY.COM',
    });
    expect(r.api_base_url).toBe('https://api.brevo.com');
    expect(r.sender_email).toBe('sales@company.com');
  });

  // --- Email: lowercase ---

  it('lowercases email', () => {
    const r = sanitizeIntegrationMetadata('gmail', { workspace_email: 'User@Company.COM' });
    expect(r.workspace_email).toBe('user@company.com');
  });

  it('lowercases email_imap account_email', () => {
    const r = sanitizeIntegrationMetadata('email_imap', { account_email: 'Contact@Company.COM' });
    expect(r.account_email).toBe('contact@company.com');
  });

  // --- Drops unknown keys ---

  it('drops keys not in schema', () => {
    const r = sanitizeIntegrationMetadata('woocommerce', {
      store_url: 'https://x.com',
      unknown_field: 'should be dropped',
      api_key: 'should also be dropped',
    });
    expect(r.store_url).toBe('https://x.com');
    expect(r).not.toHaveProperty('unknown_field');
    expect(r).not.toHaveProperty('api_key');
  });

  // --- Empty values are omitted ---

  it('omits empty values after trim', () => {
    const r = sanitizeIntegrationMetadata('gmail', { workspace_email: '   ' });
    expect(r).not.toHaveProperty('workspace_email');
  });

  it('omits missing keys', () => {
    const r = sanitizeIntegrationMetadata('notion', {});
    expect(Object.keys(r)).toHaveLength(0);
  });

  // --- Combined: trim + prepend + strip slash ---

  it('trims, prepends https, and strips slash in one pass', () => {
    const r = sanitizeIntegrationMetadata('shopify', { store_domain: '  mystore.myshopify.com/  ' });
    expect(r.store_domain).toBe('https://mystore.myshopify.com');
  });

  // --- Text fields pass through unchanged (except trim) ---

  it('preserves text field value with only trim', () => {
    const r = sanitizeIntegrationMetadata('openai', { project_id: '  proj_ABC123  ' });
    expect(r.project_id).toBe('proj_ABC123');
  });
});
