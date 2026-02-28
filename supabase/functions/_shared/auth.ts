import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RoleAccessOptions {
  action: string;
  allowedRoles: string[];
  allowlistEnvKey: string;
  corsHeaders: Record<string, string>;
}

interface AuthSuccess {
  ok: true;
  user: { id: string; app_metadata: Record<string, unknown> };
}

interface AuthFailure {
  ok: false;
  response: Response;
}

export type AuthResult = AuthSuccess | AuthFailure;

export async function requireRoleAccess(
  req: Request,
  options: RoleAccessOptions,
): Promise<AuthResult> {
  const { action, allowedRoles, allowlistEnvKey, corsHeaders } = options;
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
  const token = authHeader.replace('Bearer ', '');
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
