import { describe, expect, it } from 'vitest';
import {
  getIntegrationConnector,
  parseSyncTargets,
} from '../../supabase/functions/_shared/integration-connectors.ts';

describe('parseSyncTargets', () => {
  it('uses provider default when targets are missing', () => {
    expect(parseSyncTargets('woocommerce', {})).toEqual(['orders']);
    expect(parseSyncTargets('gmail', {})).toEqual(['entities']);
  });

  it('uses provider default when targets is empty array', () => {
    expect(parseSyncTargets('shopify', { targets: [] })).toEqual(['orders']);
  });

  it('filters unsupported targets for email providers', () => {
    expect(parseSyncTargets('gmail', { targets: ['orders', 'entities', 'inventory'] })).toEqual(['entities']);
    expect(parseSyncTargets('outlook', { targets: ['products', 'entities'] })).toEqual(['entities']);
    expect(parseSyncTargets('email_imap', { targets: ['entities', 'orders'] })).toEqual(['entities']);
  });

  it('keeps valid commerce targets in requested order', () => {
    expect(parseSyncTargets('woocommerce', { targets: ['products', 'orders'] })).toEqual(['products', 'orders']);
    expect(parseSyncTargets('shopify', { targets: ['inventory', 'entities'] })).toEqual(['inventory', 'entities']);
  });

  it('falls back to default when all requested targets are invalid', () => {
    expect(parseSyncTargets('woocommerce', { targets: ['foo', 'bar'] })).toEqual(['orders']);
    expect(parseSyncTargets('brevo', { targets: ['orders'] })).toEqual(['entities']);
  });
});

describe('getIntegrationConnector', () => {
  it('returns known connector for supported providers', () => {
    expect(getIntegrationConnector('woocommerce').provider).toBe('woocommerce');
    expect(getIntegrationConnector('shopify').provider).toBe('shopify');
    expect(getIntegrationConnector('gmail').provider).toBe('gmail');
    expect(getIntegrationConnector('outlook').provider).toBe('outlook');
    expect(getIntegrationConnector('email_imap').provider).toBe('email_imap');
    expect(getIntegrationConnector('brevo').provider).toBe('brevo');
  });

  it('returns unsupported connector fallback', () => {
    const connector = getIntegrationConnector('unknown_provider');
    expect(connector.provider).toBe('unsupported');
  });

  it('email_imap syncEntities emits config checkpoint record', async () => {
    const connector = getIntegrationConnector('email_imap');
    const result = await connector.syncEntities({
      organizationId: 'org-1',
      integrationId: 'int-1',
      provider: 'email_imap',
      metadata: {
        account_email: 'contact@polsya.com',
        username: 'contact@polsya.com',
        imap_host: 'imap.hostinger.com',
        smtp_host: 'smtp.hostinger.com',
      },
    });

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].externalId).toBe('email_imap_config:contact@polsya.com');
    expect(result.records[0].payload.sync_mode).toBe('config_only');
  });
});
