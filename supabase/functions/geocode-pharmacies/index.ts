import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://moodlycrm.com',
  'https://www.moodlycrm.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
  };

  if (req.method === 'OPTIONS') {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // For non-OPTIONS requests, check origin
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // After the CORS check, verify admin role
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // For now, allow any authenticated user. TODO: add admin role check when roles are implemented.
  // Future: check user.app_metadata.role === 'admin'

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SB_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
