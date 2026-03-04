import type { User } from '@supabase/supabase-js';

const PLATFORM_ROLES = ['platform_owner', 'owner', 'developer', 'platform_admin'] as const;
const OWNER_EMAILS: string[] = (() => {
  const raw = import.meta.env.VITE_PLATFORM_OWNER_EMAILS ?? '';
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
})();

/**
 * Returns true if the user is a platform owner/admin (not a tenant).
 * Platform owners can:
 * - Skip subscription checks
 * - Access platform admin dashboard
 * - Manage tenant billing (their clients' subscriptions)
 */
export function isPlatformOwner(user: User | null | undefined): boolean {
  if (!user) return false;

  const role = (user.app_metadata?.role as string) ?? '';
  if (PLATFORM_ROLES.includes(role as (typeof PLATFORM_ROLES)[number])) return true;

  if (OWNER_EMAILS.length > 0 && user.email) {
    return OWNER_EMAILS.includes(user.email.toLowerCase());
  }

  return false;
}
