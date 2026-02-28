import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const cors = makeCorsHeaders(origin);

  // --- Authorization: require valid JWT + privileged role/allowlist ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(JSON.stringify({ action: 'geocode_pharmacies', allowed: false, reason: 'missing_token' }));
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

  if (!serviceRoleKey || !supabaseUrl) {
    console.error(JSON.stringify({ action: 'geocode_pharmacies', error: 'missing_service_config' }));
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    console.log(JSON.stringify({ action: 'geocode_pharmacies', allowed: false, reason: 'invalid_token' }));
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const ALLOWED_ROLES = ['admin', 'ops'];
  const userRole = (user.app_metadata?.role as string) ?? '';
  const userRoles = (user.app_metadata?.roles as string[]) ?? [];
  const hasPrivilegedRole = ALLOWED_ROLES.includes(userRole) || userRoles.some(r => ALLOWED_ROLES.includes(r));

  const allowedUserIds = (Deno.env.get('GEOCODE_ALLOWED_USER_IDS') ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  const isInAllowlist = allowedUserIds.includes(user.id);

  if (!hasPrivilegedRole && !isInAllowlist) {
    console.log(JSON.stringify({ action: 'geocode_pharmacies', user_id: user.id, allowed: false, reason: 'forbidden' }));
    return new Response(JSON.stringify({ error: 'Forbidden: insufficient privileges' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const authReason = hasPrivilegedRole ? 'role' : 'allowlist';
  console.log(JSON.stringify({ action: 'geocode_pharmacies', user_id: user.id, allowed: true, reason: authReason }));

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get batch size from request body (default 100)
    const { batchSize = 100, clientType } = await req.json().catch(() => ({}));

    // Fetch pharmacies without coordinates
    let query = supabase
      .from('pharmacies')
      .select('id, name, address, city, province, postal_code, country')
      .or('lat.is.null,lat.eq.0')
      .limit(batchSize);

    if (clientType) {
      query = query.eq('client_type', clientType);
    }

    const { data: pharmacies, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!pharmacies || pharmacies.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pharmacies to geocode', remaining: 0 }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let geocoded = 0;
    let errors = 0;
    const results: any[] = [];

    for (const pharmacy of pharmacies) {
      try {
        // Build address string
        const parts = [
          pharmacy.address,
          pharmacy.city,
          pharmacy.postal_code,
          pharmacy.province,
          pharmacy.country || 'Spain',
        ].filter(Boolean);
        const addressStr = parts.join(', ');

        // Call Google Geocoding API
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressStr)}&key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          const location = data.results[0].geometry.location;

          // Update pharmacy with coordinates
          const { error: updateError } = await supabase
            .from('pharmacies')
            .update({ lat: location.lat, lng: location.lng })
            .eq('id', pharmacy.id);

          if (updateError) {
            errors++;
            results.push({ id: pharmacy.id, name: pharmacy.name, error: updateError.message });
          } else {
            geocoded++;
            results.push({ id: pharmacy.id, name: pharmacy.name, lat: location.lat, lng: location.lng });
          }
        } else {
          errors++;
          results.push({ id: pharmacy.id, name: pharmacy.name, error: `Geocoding failed: ${data.status}` });
        }

        // Small delay to avoid rate limiting (50ms between requests)
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        errors++;
        results.push({ id: pharmacy.id, name: pharmacy.name, error: String(err) });
      }
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from('pharmacies')
      .select('id', { count: 'exact', head: true })
      .or('lat.is.null,lat.eq.0');

    return new Response(
      JSON.stringify({
        geocoded,
        errors,
        remaining: remaining || 0,
        batchSize: pharmacies.length,
        message: `Geocoded ${geocoded}/${pharmacies.length}. ${remaining} remaining.`
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
