import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const cors = makeCorsHeaders(origin);

  const auth = await requireOrgRoleAccess(req, {
    action: 'geocode_pharmacies',
    allowedRoles: ['admin', 'ops'],
    allowlistEnvKey: 'GEOCODE_ALLOWED_USER_IDS',
    corsHeaders: cors,
  });
  if (!auth.ok) return auth.response;

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing service role key or URL' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const organizationId = auth.organizationId;

    // Get batch size from request body (default 100)
    const { batchSize = 100, clientType } = await req.json().catch(() => ({}));

    // Fetch pharmacies without coordinates
    let query = supabase
      .from('pharmacies')
      .select('id, name, address, city, province, postal_code, country')
      .eq('organization_id', organizationId)
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
            .eq('id', pharmacy.id)
            .eq('organization_id', organizationId);

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
      .eq('organization_id', organizationId)
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
