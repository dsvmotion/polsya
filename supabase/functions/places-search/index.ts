import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';

interface PlaceResult {
  placeId: string;
  name: string;
  googleMapsUrl: string;
  website: string | null;
  phone: string | null;
  address: string;
  rating: number | null;
  primaryType: string | null;
  types: string[];
  lat: number;
  lng: number;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const cors = makeCorsHeaders(origin);

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  // Auth — must include allowlistEnvKey to match the shared auth interface
  const auth = await requireOrgRoleAccess(req, {
    action: 'places_search',
    allowedRoles: ['admin', 'ops', 'member'],
    allowlistEnvKey: 'PLACES_SEARCH_ALLOWED_USER_IDS',
    corsHeaders: cors,
  });
  if (!auth.ok) return auth.response;

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_API_KEY) return json({ error: 'Google API key not configured' }, 500);

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!serviceRoleKey || !supabaseUrl) return json({ error: 'Server misconfiguration' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Billing check
    const billing = await requireBillingAccessForOrg(supabase, auth.organizationId, {
      action: 'places_search',
      corsHeaders: cors,
    });
    if (!billing.ok) return billing.response;

    // Parse request
    const body = await req.json().catch(() => ({}));
    const { query, type, lat, lng, radiusMeters = 5000, maxResults = 20 } = body as {
      query?: string;
      type?: string;
      lat?: number;
      lng?: number;
      radiusMeters?: number;
      maxResults?: number;
    };

    if (lat == null || lng == null) return json({ error: 'lat and lng are required' }, 400);
    if (!query && !type) return json({ error: 'Either query or type is required' }, 400);

    // Call Google Places API (Text Search New)
    const googleBody: Record<string, unknown> = {
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
      maxResultCount: Math.min(maxResults, 20),
    };

    if (query) {
      googleBody.textQuery = query;
    } else if (type) {
      googleBody.textQuery = type.replace(/_/g, ' ');
      googleBody.includedType = type;
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.websiteUri',
      'places.internationalPhoneNumber',
      'places.formattedAddress',
      'places.rating',
      'places.primaryType',
      'places.types',
      'places.location',
    ].join(',');

    const googleRes = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(googleBody),
      },
    );

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error('Google Places API error:', googleRes.status, errText);
      return json({ error: `Places search failed (${googleRes.status})` }, 502);
    }

    const googleData = await googleRes.json();
    const places = googleData.places ?? [];

    // Map to PlaceResult
    const results: PlaceResult[] = places.map((p: Record<string, unknown>) => {
      const loc = p.location as { latitude: number; longitude: number } | undefined;
      const display = p.displayName as { text: string } | undefined;
      const placeId = (p.id as string) ?? '';

      return {
        placeId,
        name: display?.text ?? '',
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        website: (p.websiteUri as string) ?? null,
        phone: (p.internationalPhoneNumber as string) ?? null,
        address: (p.formattedAddress as string) ?? '',
        rating: (p.rating as number) ?? null,
        primaryType: (p.primaryType as string) ?? null,
        types: (p.types as string[]) ?? [],
        lat: loc?.latitude ?? lat,
        lng: loc?.longitude ?? lng,
      };
    });

    // Dedup: check which place_ids already exist in this org
    const placeIds = results.map((r) => r.placeId).filter(Boolean);
    let alreadySavedIds: string[] = [];

    if (placeIds.length > 0) {
      const { data: existing } = await supabase
        .from('creative_clients')
        .select('metadata')
        .eq('organization_id', auth.organizationId)
        .in('metadata->>google_place_id', placeIds);

      alreadySavedIds = (existing ?? [])
        .map((row: { metadata: Record<string, unknown> }) =>
          (row.metadata?.google_place_id as string) ?? '',
        )
        .filter(Boolean);
    }

    return json({ results, alreadySavedIds, totalResults: results.length });
  } catch (err) {
    console.error('places-search error:', err);
    return json({ error: 'Places search failed. Please try again later.' }, 500);
  }
});
