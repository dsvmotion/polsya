import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface PlaceResult {
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

export interface PlacesSearchParams {
  query?: string;
  type?: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  maxResults?: number;
}

export interface PlacesSearchResponse {
  results: PlaceResult[];
  alreadySavedIds: string[];
  totalResults: number;
}

export async function searchPlaces(params: PlacesSearchParams): Promise<PlacesSearchResponse> {
  const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
  const response = await fetch(`${SUPABASE_URL}/functions/v1/places-search`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Places search failed (${response.status})`);
  }

  return response.json();
}
