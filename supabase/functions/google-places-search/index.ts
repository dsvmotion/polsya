import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

const ALLOWED_PLACE_TYPES = new Set([
  'pharmacy', 'restaurant', 'dentist', 'store', 'doctor', 'hospital',
  'veterinary_care', 'gym', 'beauty_salon', 'hair_care', 'spa',
  'supermarket', 'bakery', 'cafe', 'bar', 'pet_store',
]);

function extractAddressComponent(components: PlaceResult['address_components'], type: string): string | null {
  if (!components) return null;
  const component = components.find(c => c.types.includes(type));
  return component?.long_name || null;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  const auth = await requireOrgRoleAccess(req, {
    action: 'google_places_search',
    allowedRoles: ['admin', 'ops'],
    allowlistEnvKey: 'GOOGLE_PLACES_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing Supabase service credentials' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const billing = await requireBillingAccessForOrg(supabaseAdmin, auth.organizationId, {
    action: 'google_places_search',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    const body = await req.json();
    const {
      action,
      location,
      radius = 50000,
      pageToken,
      placeId,
      query,
      photoReference,
      maxWidth = 400,
      placeType = 'pharmacy',
      searchTerms,
    } = body;

    if (!ALLOWED_PLACE_TYPES.has(placeType)) {
      throw new Error(`Invalid placeType "${placeType}". Allowed: ${[...ALLOWED_PLACE_TYPES].join(', ')}`);
    }

    if (action === 'search') {
      const { lat, lng } = location;

      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${encodeURIComponent(placeType)}&key=${GOOGLE_MAPS_API_KEY}`;

      if (pageToken) {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${GOOGLE_MAPS_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const results = (data.results || []).map((place: PlaceResult) => ({
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      }));

      return new Response(JSON.stringify({
        results,
        placeType,
        nextPageToken: data.next_page_token || null,
        status: data.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'photo') {
      if (!photoReference) {
        throw new Error('photoReference is required for photo action');
      }

      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;

      return new Response(JSON.stringify({ photoUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'details') {
      if (!placeId) {
        throw new Error('placeId is required for details action');
      }

      const fields = 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,address_components,geometry,photos';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Places Details API error:', data.status);
        throw new Error(`Google Places Details API error: ${data.status}`);
      }

      const place: PlaceResult = data.result;
      const addressComponents = place.address_components;

      const entity = {
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        city:
          extractAddressComponent(addressComponents, 'locality') ||
          extractAddressComponent(addressComponents, 'postal_town'),
        province:
          extractAddressComponent(addressComponents, 'administrative_area_level_2') ||
          extractAddressComponent(addressComponents, 'administrative_area_level_1'),
        country: extractAddressComponent(addressComponents, 'country'),
        phone: place.formatted_phone_number || place.international_phone_number || null,
        website: place.website || null,
        opening_hours: place.opening_hours?.weekday_text || null,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        google_data: place,
        place_type: placeType,
      };

      return new Response(JSON.stringify({ entity, pharmacy: entity }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'textSearch') {
      const effectiveQuery = buildTextSearchQuery(query, placeType, searchTerms);
      if (!effectiveQuery && !pageToken) {
        throw new Error('query is required for textSearch action');
      }

      let url: string;
      if (pageToken) {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_MAPS_API_KEY}`;
      } else {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(effectiveQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places Text Search API error:', data.status);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const results = (data.results || []).map((place: PlaceResult) => ({
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      }));

      return new Response(JSON.stringify({
        results,
        placeType,
        nextPageToken: data.next_page_token || null,
        status: data.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use "search", "details", "photo", or "textSearch"');

  } catch (error) {
    console.error('Error in google-places-search:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildTextSearchQuery(
  query: string | undefined,
  placeType: string,
  searchTerms?: string[],
): string {
  if (searchTerms && searchTerms.length > 0) {
    return searchTerms.join(' ');
  }
  return query ?? '';
}
