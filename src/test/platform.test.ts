import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env before importing
vi.stubEnv('VITE_PLATFORM_OWNER_EMAILS', 'admin@polsya.com,owner@test.com');

import { isPlatformOwner } from '@/lib/platform';
import type { User } from '@supabase/supabase-js';

function makeUser(overrides: Partial<User> & { app_metadata?: Record<string, unknown>; email?: string }): User {
  return {
    id: 'user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: overrides.email ?? 'user@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: overrides.app_metadata ?? {},
    user_metadata: {},
    identities: [],
    factors: [],
    ...overrides,
  } as User;
}

describe('platform', () => {
  describe('isPlatformOwner', () => {
    it('returns false for null user', () => {
      expect(isPlatformOwner(null)).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(isPlatformOwner(undefined)).toBe(false);
    });

    it('returns true for user with platform_owner role', () => {
      const user = makeUser({ app_metadata: { role: 'platform_owner' } });
      expect(isPlatformOwner(user)).toBe(true);
    });

    it('returns true for user with owner role', () => {
      const user = makeUser({ app_metadata: { role: 'owner' } });
      expect(isPlatformOwner(user)).toBe(true);
    });

    it('returns true for user with developer role', () => {
      const user = makeUser({ app_metadata: { role: 'developer' } });
      expect(isPlatformOwner(user)).toBe(true);
    });

    it('returns true for user with platform_admin role', () => {
      const user = makeUser({ app_metadata: { role: 'platform_admin' } });
      expect(isPlatformOwner(user)).toBe(true);
    });

    it('returns false for regular user role', () => {
      const user = makeUser({ app_metadata: { role: 'user' } });
      expect(isPlatformOwner(user)).toBe(false);
    });

    it('returns false for user without role in app_metadata', () => {
      const user = makeUser({ app_metadata: {} });
      // Without a recognized role and without matching email, false
      const nonOwnerUser = makeUser({ app_metadata: {}, email: 'nobody@random.com' });
      expect(isPlatformOwner(nonOwnerUser)).toBe(false);
    });
  });
});
