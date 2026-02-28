import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RoleAccessOptions {
  action: string;
  allowedRoles: string[];
  allowlistEnvKey: string;
  corsHeaders: Record<string, string>;
}

interface OrgRoleAccessOptions extends RoleAccessOptions {
  orgHeaderName?: string;
}

interface AuthSuccess {
  ok: true;
  user: { id: string; app_metadata: Record<string, unknown> };
}

interface OrgAuthSuccess extends AuthSuccess {
  organizationId: string;
  organizationRole: string;
}

interface AuthFailure {
  ok: false;
  response: Response;
}

export type AuthResult = AuthSuccess | AuthFailure;
export type OrgAuthResult = OrgAuthSuccess | AuthFailure;

type MembershipRow = {
  organization_id: string;
  role: string;
};

function parseAllowlist(envKey: string): string[] {
  return (Deno.env.get(envKey) ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
}

function resolveOrgHeader(req: Request, headerName: string): string | null {
  return req.headers.get(headerName) ?? req.headers.get(headerName.toLowerCase());
}

export async function requireRoleAccess(
  req: Request,
  options: RoleAccessOptions,
): Promise<AuthResult> {
  const { action, allowedRoles, allowlistEnvKey, corsHeaders } = options;
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  const token = getBearerToken(req);
  if (!token) {
    console.log(JSON.stringify({ action, allowed: false, reason: 'missing_token' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers,
      }),
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(JSON.stringify({ action, error: 'missing_service_config' }));
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }),
        { status: 500, headers },
      ),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    console.log(JSON.stringify({ action, allowed: false, reason: 'invalid_token' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers,
      }),
    };
  }

  const userRole = (user.app_metadata?.role as string) ?? '';
  const userRoles = (user.app_metadata?.roles as string[]) ?? [];
  const hasPrivilegedRole =
    allowedRoles.includes(userRole) || userRoles.some((r) => allowedRoles.includes(r));

  const allowedUserIds = (Deno.env.get(allowlistEnvKey) ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const isInAllowlist = allowedUserIds.includes(user.id);

  if (!hasPrivilegedRole && !isInAllowlist) {
    console.log(
      JSON.stringify({ action, user_id: user.id, allowed: false, reason: 'forbidden' }),
    );
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Forbidden: insufficient privileges' }),
        { status: 403, headers },
      ),
    };
  }

  const reason = hasPrivilegedRole ? 'role' : 'allowlist';
  console.log(JSON.stringify({ action, user_id: user.id, allowed: true, reason }));

  return { ok: true, user };
}

export async function requireOrgRoleAccess(
  req: Request,
  options: OrgRoleAccessOptions,
): Promise<OrgAuthResult> {
  const {
    action,
    allowedRoles,
    allowlistEnvKey,
    corsHeaders,
    orgHeaderName = 'X-Organization-Id',
  } = options;
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  const token = getBearerToken(req);
  if (!token) {
    console.log(JSON.stringify({ action, allowed: false, reason: 'missing_token' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers,
      }),
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(JSON.stringify({ action, error: 'missing_service_config' }));
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }),
        { status: 500, headers },
      ),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    console.log(JSON.stringify({ action, allowed: false, reason: 'invalid_token' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers,
      }),
    };
  }

  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (membershipsError) {
    console.error(JSON.stringify({ action, user_id: user.id, error: 'membership_lookup_failed' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Could not resolve organization membership' }), {
        status: 500,
        headers,
      }),
    };
  }

  const activeMemberships = (memberships ?? []) as MembershipRow[];
  if (activeMemberships.length === 0) {
    console.log(JSON.stringify({ action, user_id: user.id, allowed: false, reason: 'no_membership' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Forbidden: no active organization membership' }), {
        status: 403,
        headers,
      }),
    };
  }

  const requestedOrgId = resolveOrgHeader(req, orgHeaderName);
  let membership: MembershipRow | null = null;

  if (requestedOrgId) {
    membership = activeMemberships.find((m) => m.organization_id === requestedOrgId) ?? null;
    if (!membership) {
      console.log(
        JSON.stringify({ action, user_id: user.id, allowed: false, reason: 'org_forbidden', organization_id: requestedOrgId }),
      );
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'Forbidden: organization access denied' }), {
          status: 403,
          headers,
        }),
      };
    }
  } else if (activeMemberships.length === 1) {
    membership = activeMemberships[0];
  } else {
    console.log(JSON.stringify({ action, user_id: user.id, allowed: false, reason: 'org_context_missing' }));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Missing organization context (X-Organization-Id)' }), {
        status: 400,
        headers,
      }),
    };
  }

  const allowedUserIds = parseAllowlist(allowlistEnvKey);
  const isInAllowlist = allowedUserIds.includes(user.id);
  const hasRoleAccess = allowedRoles.includes(membership.role);

  if (!hasRoleAccess && !isInAllowlist) {
    console.log(
      JSON.stringify({
        action,
        user_id: user.id,
        organization_id: membership.organization_id,
        membership_role: membership.role,
        allowed: false,
        reason: 'forbidden',
      }),
    );
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Forbidden: insufficient organization role' }),
        { status: 403, headers },
      ),
    };
  }

  const reason = hasRoleAccess ? 'membership_role' : 'allowlist';
  console.log(
    JSON.stringify({
      action,
      user_id: user.id,
      organization_id: membership.organization_id,
      membership_role: membership.role,
      allowed: true,
      reason,
    }),
  );

  return {
    ok: true,
    user,
    organizationId: membership.organization_id,
    organizationRole: membership.role,
  };
}
