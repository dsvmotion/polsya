/**
 * Contract tests for supabase/functions/places-search/index.ts
 *
 * Validates the request parsing and response mapping logic of the
 * places-search edge function without requiring the Deno runtime.
 * This tests the "business logic core" extracted from the handler.
 */
import { describe, expect, it } from 'vitest';

// --- Request validation (replicates lines 61-72 of the edge function) ---

interface PlacesSearchRequest {
  query?: string;
  type?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  maxResults?: number;
}

function validateRequest(body: PlacesSearchRequest): { ok: true } | { ok: false; error: string } {
  if (body.lat == null || body.lng == null) {
    return { ok: false, error: 'lat and lng are required' };
  }
  if (!body.query && !body.type) {
    return { ok: false, error: 'Either query or type is required' };
  }
  return { ok: true };
}

// --- Google Places request builder (replicates lines 74-90) ---

function buildGoogleBody(body: PlacesSearchRequest) {
  const { query, type, lat, lng, radiusMeters = 5000, maxResults = 20 } = body;

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

  return googleBody;
}

// --- Response mapper (replicates lines 127-145) ---

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

function mapGooglePlace(
  p: Record<string, unknown>,
  fallbackLat: number,
  fallbackLng: number,
): PlaceResult {
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
    lat: loc?.latitude ?? fallbackLat,
    lng: loc?.longitude ?? fallbackLng,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('places-search request validation', () => {
  it('rejects missing lat/lng', () => {
    const result = validateRequest({ query: 'cafes' });
    expect(result.ok).toBe(false);
    if ('error' in result) expect(result.error).toBe('lat and lng are required');
  });

  it('rejects missing lat only', () => {
    const result = validateRequest({ query: 'cafes', lng: 1 });
    expect(result.ok).toBe(false);
  });

  it('rejects missing lng only', () => {
    const result = validateRequest({ query: 'cafes', lat: 1 });
    expect(result.ok).toBe(false);
  });

  it('rejects when neither query nor type is provided', () => {
    const result = validateRequest({ lat: 1, lng: 2 });
    expect(result.ok).toBe(false);
    if ('error' in result) expect(result.error).toBe('Either query or type is required');
  });

  it('accepts valid query search', () => {
    expect(validateRequest({ query: 'coffee shops', lat: 40, lng: -74 })).toEqual({ ok: true });
  });

  it('accepts valid type search', () => {
    expect(validateRequest({ type: 'restaurant', lat: 40, lng: -74 })).toEqual({ ok: true });
  });

  it('accepts lat=0 and lng=0 (equator)', () => {
    expect(validateRequest({ query: 'test', lat: 0, lng: 0 })).toEqual({ ok: true });
  });
});

describe('places-search Google body builder', () => {
  it('builds free-text query body', () => {
    const body = buildGoogleBody({ query: 'pizza near me', lat: 40, lng: -74, radiusMeters: 3000 });
    expect(body.textQuery).toBe('pizza near me');
    expect(body.includedType).toBeUndefined();
    expect(body.locationBias).toEqual({
      circle: { center: { latitude: 40, longitude: -74 }, radius: 3000 },
    });
  });

  it('builds type search body with underscores replaced', () => {
    const body = buildGoogleBody({ type: 'hair_salon', lat: 51, lng: -0.1 });
    expect(body.textQuery).toBe('hair salon');
    expect(body.includedType).toBe('hair_salon');
  });

  it('caps maxResultCount at 20', () => {
    const body = buildGoogleBody({ query: 'test', lat: 0, lng: 0, maxResults: 60 });
    expect(body.maxResultCount).toBe(20);
  });

  it('defaults maxResultCount to 20 when not specified', () => {
    const body = buildGoogleBody({ query: 'test', lat: 0, lng: 0 });
    expect(body.maxResultCount).toBe(20);
  });

  it('defaults radiusMeters to 5000 when not specified', () => {
    const body = buildGoogleBody({ query: 'test', lat: 0, lng: 0 });
    const circle = (body.locationBias as { circle: { radius: number } }).circle;
    expect(circle.radius).toBe(5000);
  });

  it('query takes precedence over type when both are provided', () => {
    const body = buildGoogleBody({ query: 'best pizza', type: 'restaurant', lat: 0, lng: 0 });
    expect(body.textQuery).toBe('best pizza');
    expect(body.includedType).toBeUndefined();
  });
});

describe('places-search response mapper', () => {
  it('maps a full Google Places response', () => {
    const googlePlace = {
      id: 'ChIJ_abc123',
      displayName: { text: 'Test Café' },
      websiteUri: 'https://testcafe.com',
      internationalPhoneNumber: '+1234567890',
      formattedAddress: '123 Main St',
      rating: 4.5,
      primaryType: 'cafe',
      types: ['cafe', 'restaurant'],
      location: { latitude: 40.7, longitude: -74.0 },
    };

    const result = mapGooglePlace(googlePlace, 0, 0);

    expect(result.placeId).toBe('ChIJ_abc123');
    expect(result.name).toBe('Test Café');
    expect(result.googleMapsUrl).toContain('ChIJ_abc123');
    expect(result.website).toBe('https://testcafe.com');
    expect(result.phone).toBe('+1234567890');
    expect(result.address).toBe('123 Main St');
    expect(result.rating).toBe(4.5);
    expect(result.primaryType).toBe('cafe');
    expect(result.types).toEqual(['cafe', 'restaurant']);
    expect(result.lat).toBe(40.7);
    expect(result.lng).toBe(-74.0);
  });

  it('handles missing optional fields with null defaults', () => {
    const minimal = { id: 'place_1', displayName: { text: 'Just Name' } };
    const result = mapGooglePlace(minimal, 10, 20);

    expect(result.website).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.rating).toBeNull();
    expect(result.primaryType).toBeNull();
    expect(result.types).toEqual([]);
  });

  it('uses fallback lat/lng when location is missing', () => {
    const noLocation = { id: 'place_2', displayName: { text: 'No Loc' } };
    const result = mapGooglePlace(noLocation, 51.5, -0.1);

    expect(result.lat).toBe(51.5);
    expect(result.lng).toBe(-0.1);
  });

  it('constructs Google Maps URL from place ID', () => {
    const p = { id: 'ChIJ_xyz789' };
    const result = mapGooglePlace(p, 0, 0);
    expect(result.googleMapsUrl).toBe(
      'https://www.google.com/maps/place/?q=place_id:ChIJ_xyz789',
    );
  });

  it('handles missing displayName gracefully', () => {
    const noName = { id: 'place_3' };
    const result = mapGooglePlace(noName, 0, 0);
    expect(result.name).toBe('');
  });

  it('handles completely empty Google place object', () => {
    const empty = {};
    const result = mapGooglePlace(empty, 45, 90);

    expect(result.placeId).toBe('');
    expect(result.name).toBe('');
    expect(result.website).toBeNull();
    expect(result.lat).toBe(45);
    expect(result.lng).toBe(90);
  });
});
