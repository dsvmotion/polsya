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
  let headers: Record<string, string>;
  try {
    headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('No active organization')) {
      throw new Error(
        'Your account is not linked to an organization. Please log out and sign up again, or contact support.',
      );
    }
    if (msg.includes('Missing authenticated session')) {
      throw new Error('You need to be logged in to search. Please refresh and try again.');
    }
    throw new Error(`Authentication error: ${msg}`);
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/places-search`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const serverError = body.error ?? '';
    if (response.status === 401) {
      throw new Error('Session expired. Please refresh the page and try again.');
    }
    if (response.status === 403) {
      throw new Error(serverError || 'You do not have permission to use Discover search.');
    }
    throw new Error(serverError || `Places search failed (${response.status})`);
  }

  return response.json();
}
