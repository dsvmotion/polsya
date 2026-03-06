import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock edge-function-headers before importing
vi.mock('@/lib/edge-function-headers', () => ({
  buildEdgeFunctionHeaders: vi.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer fake-jwt',
    'x-organization-id': 'org-123',
  }),
}));

import { searchPlaces, type PlaceResult, type PlacesSearchResponse } from '@/services/discoverService';

describe('searchPlaces', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockResponse: PlacesSearchResponse = {
    results: [
      {
        placeId: 'ChIJ_abc123',
        name: 'Test Café',
        googleMapsUrl: 'https://maps.google.com/?cid=123',
        website: 'https://testcafe.com',
        phone: '+1234567890',
        address: '123 Main St, City',
        rating: 4.5,
        primaryType: 'cafe',
        types: ['cafe', 'restaurant'],
        lat: 40.7128,
        lng: -74.006,
      },
    ],
    alreadySavedIds: ['ChIJ_existing'],
    totalResults: 1,
  };

  it('calls the edge function with correct params and returns parsed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );
    global.fetch = fetchMock as typeof fetch;

    const result = await searchPlaces({
      query: 'cafes',
      lat: 40.7128,
      lng: -74.006,
      radiusMeters: 5000,
      maxResults: 20,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/functions/v1/places-search');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.query).toBe('cafes');
    expect(body.lat).toBe(40.7128);
    expect(body.lng).toBe(-74.006);
    expect(body.radiusMeters).toBe(5000);
    expect(body.maxResults).toBe(20);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe('Test Café');
    expect(result.alreadySavedIds).toContain('ChIJ_existing');
    expect(result.totalResults).toBe(1);
  });

  it('passes type param for business-type search mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [], alreadySavedIds: [], totalResults: 0 }), { status: 200 }),
    );
    global.fetch = fetchMock as typeof fetch;

    await searchPlaces({
      type: 'restaurant',
      lat: 51.5074,
      lng: -0.1278,
      radiusMeters: 10000,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe('restaurant');
    expect(body.query).toBeUndefined();
  });

  it('throws with error message from edge function on 4xx/5xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not set' }), { status: 500 }),
    );
    global.fetch = fetchMock as typeof fetch;

    await expect(
      searchPlaces({ lat: 0, lng: 0, radiusMeters: 1000 }),
    ).rejects.toThrow('GOOGLE_PLACES_API_KEY not set');
  });

  it('falls back to generic error when body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );
    global.fetch = fetchMock as typeof fetch;

    await expect(
      searchPlaces({ lat: 0, lng: 0, radiusMeters: 1000 }),
    ).rejects.toThrow('Places search failed (500)');
  });

  it('includes authorization and org headers from buildEdgeFunctionHeaders', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [], alreadySavedIds: [], totalResults: 0 }), { status: 200 }),
    );
    global.fetch = fetchMock as typeof fetch;

    await searchPlaces({ lat: 0, lng: 0, radiusMeters: 1000 });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer fake-jwt');
    expect(headers['x-organization-id']).toBe('org-123');
    expect(headers['Content-Type']).toBe('application/json');
  });
});

describe('PlaceResult type contract', () => {
  it('has all required fields for UI rendering', () => {
    const place: PlaceResult = {
      placeId: 'test',
      name: 'Test Place',
      googleMapsUrl: 'https://maps.google.com/?cid=1',
      website: null,
      phone: null,
      address: '123 Street',
      rating: null,
      primaryType: null,
      types: [],
      lat: 0,
      lng: 0,
    };

    // These fields are used by DiscoverResultsTable columns
    expect(place.placeId).toBeDefined();
    expect(place.name).toBeDefined();
    expect(place.googleMapsUrl).toBeDefined();
    expect(place.address).toBeDefined();
    expect(typeof place.lat).toBe('number');
    expect(typeof place.lng).toBe('number');

    // Nullable fields should be handled gracefully
    expect(place.website).toBeNull();
    expect(place.phone).toBeNull();
    expect(place.rating).toBeNull();
    expect(place.primaryType).toBeNull();
  });
});
