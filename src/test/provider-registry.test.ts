import { describe, it, expect } from 'vitest';
import {
  PROVIDER_REGISTRY,
  getProviderDefinition,
  getSyncCapableProviders,
  getAllProviderKeys,
} from '@/lib/provider-registry';

describe('provider-registry', () => {
  describe('PROVIDER_REGISTRY', () => {
    it('contains expected providers', () => {
      const keys = Object.keys(PROVIDER_REGISTRY);
      expect(keys).toContain('woocommerce');
      expect(keys).toContain('gmail');
      expect(keys).toContain('shopify');
      expect(keys).toContain('hubspot');
      expect(keys).toContain('salesforce');
      expect(keys).toContain('slack');
    });

    it('every provider has required fields', () => {
      for (const [key, def] of Object.entries(PROVIDER_REGISTRY)) {
        expect(def.key).toBe(key);
        expect(def.label).toBeTruthy();
        expect(def.icon).toBeTruthy();
        expect(def.category).toBeTruthy();
        expect(def.authType).toBeTruthy();
        expect(Array.isArray(def.syncTargets)).toBe(true);
        expect(Array.isArray(def.defaultTargets)).toBe(true);
        expect(Array.isArray(def.metadataSchema)).toBe(true);
      }
    });

    it('oauth2 providers have oauthConfig', () => {
      const oauthProviders = Object.values(PROVIDER_REGISTRY).filter(
        (d) => d.authType === 'oauth2',
      );
      expect(oauthProviders.length).toBeGreaterThan(0);
      for (const def of oauthProviders) {
        expect(def.oauthConfig).toBeDefined();
        expect(def.oauthConfig!.authUrl).toMatch(/^https:\/\//);
        expect(def.oauthConfig!.tokenUrl).toMatch(/^https:\/\//);
        expect(Array.isArray(def.oauthConfig!.scopes)).toBe(true);
        expect(def.oauthConfig!.envPrefix).toBeTruthy();
      }
    });

    it('non-oauth providers do not require oauthConfig', () => {
      const nonOAuth = Object.values(PROVIDER_REGISTRY).filter(
        (d) => d.authType !== 'oauth2',
      );
      expect(nonOAuth.length).toBeGreaterThan(0);
    });

    it('categories are valid', () => {
      const validCategories = ['crm', 'ecommerce', 'email', 'communication', 'ai', 'custom'];
      for (const def of Object.values(PROVIDER_REGISTRY)) {
        expect(validCategories).toContain(def.category);
      }
    });
  });

  describe('getProviderDefinition', () => {
    it('returns definition for known provider', () => {
      const def = getProviderDefinition('gmail');
      expect(def).toBeDefined();
      expect(def!.label).toBe('Gmail');
      expect(def!.authType).toBe('oauth2');
    });

    it('returns undefined for unknown provider', () => {
      expect(getProviderDefinition('does_not_exist')).toBeUndefined();
    });
  });

  describe('getSyncCapableProviders', () => {
    it('returns only providers with syncTargets', () => {
      const syncable = getSyncCapableProviders();
      expect(syncable.length).toBeGreaterThan(0);
      for (const def of syncable) {
        expect(def.syncTargets.length).toBeGreaterThan(0);
      }
    });

    it('excludes providers with empty syncTargets', () => {
      const syncable = getSyncCapableProviders();
      const syncableKeys = syncable.map((d) => d.key);
      // openai and anthropic have empty syncTargets
      const emptySync = Object.values(PROVIDER_REGISTRY).filter(
        (d) => d.syncTargets.length === 0,
      );
      for (const def of emptySync) {
        expect(syncableKeys).not.toContain(def.key);
      }
    });
  });

  describe('getAllProviderKeys', () => {
    it('returns all provider keys', () => {
      const keys = getAllProviderKeys();
      expect(keys).toEqual(Object.keys(PROVIDER_REGISTRY));
    });

    it('is non-empty', () => {
      expect(getAllProviderKeys().length).toBeGreaterThan(0);
    });
  });
});
