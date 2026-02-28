import { supabase } from '@/integrations/supabase/client';

const ORG_CACHE_TTL_MS = 60_000;

type OrgCache = {
  userId: string;
  organizationId: string;
  expiresAt: number;
};

let orgCache: OrgCache | null = null;

async function getCurrentOrganizationId(userId: string): Promise<string | null> {
  const now = Date.now();
  if (orgCache && orgCache.userId === userId && orgCache.expiresAt > now) {
    return orgCache.organizationId;
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve organization context: ${error.message}`);
  }

  const organizationId = data?.organization_id ?? null;
  if (organizationId) {
    orgCache = {
      userId,
      organizationId,
      expiresAt: now + ORG_CACHE_TTL_MS,
    };
  }

  return organizationId;
}

export async function buildEdgeFunctionHeaders(
  extraHeaders: Record<string, string> = {},
): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const userId = session?.user?.id;

  if (!token || !userId) {
    throw new Error('Missing authenticated session');
  }

  const organizationId = await getCurrentOrganizationId(userId);
  if (!organizationId) {
    throw new Error('No active organization membership');
  }

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
    'X-Organization-Id': organizationId,
  };
}
