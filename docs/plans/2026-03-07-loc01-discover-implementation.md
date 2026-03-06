# LOC-01: Discover Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Discover page where users search Google Places (free text or business type), see results in a DataTable + map split view, and bulk-save as Clients or Leads.

**Architecture:** Edge function proxy (`places-search`) calls Google Places API server-side, returns results to a React page at `/creative/discover`. Results render in a DataTable (left 60%) + Google Map (right 40%). Saving creates `creative_clients` rows with Google Places metadata, optionally with a `creative_opportunity` at `lead` stage.

**Tech Stack:** Deno edge functions, Google Places API (New), React 18, TanStack Table, `@react-google-maps/api`, TanStack Query, Vitest

---

### Task 1: Edge Function — `places-search`

**Files:**
- Create: `supabase/functions/places-search/index.ts`

**Step 1: Create the edge function**

```typescript
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

  // Auth
  const auth = await requireOrgRoleAccess(req, {
    action: 'places_search',
    allowedRoles: ['admin', 'ops', 'member'],
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
      return json({ error: 'Google Places API error', details: errText }, 502);
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
    return json({ error: String(err) }, 500);
  }
});
```

**Step 2: Verify edge function deploys**

Run: `cd /Users/diegosanjuanvillanueva/Desktop/polsya && ls supabase/functions/places-search/index.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add supabase/functions/places-search/index.ts
git commit -m "feat(loc01): add places-search edge function for Google Places proxy"
```

---

### Task 2: Service Layer + Hooks

**Files:**
- Create: `src/services/discoverService.ts`
- Create: `src/hooks/useDiscoverSearch.ts`
- Create: `src/hooks/useSaveDiscoverResults.ts`

**Step 1: Create the service**

`src/services/discoverService.ts`:

```typescript
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
```

**Step 2: Create the search hook**

`src/hooks/useDiscoverSearch.ts`:

```typescript
import { useMutation } from '@tanstack/react-query';
import { searchPlaces, type PlacesSearchParams, type PlacesSearchResponse } from '@/services/discoverService';

export function useDiscoverSearch() {
  return useMutation<PlacesSearchResponse, Error, PlacesSearchParams>({
    mutationFn: searchPlaces,
  });
}
```

**Step 3: Create the bulk save hook**

`src/hooks/useSaveDiscoverResults.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { PlaceResult } from '@/services/discoverService';

interface SaveParams {
  places: PlaceResult[];
  saveAs: 'client' | 'lead';
}

export function useSaveDiscoverResults() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ places, saveAs }: SaveParams) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');

      const savedClients: { id: string; name: string; placeId: string }[] = [];

      for (const place of places) {
        // Upsert client — check for existing by google_place_id
        const { data: existing } = await fromTable('creative_clients')
          .select('id')
          .eq('organization_id', orgId)
          .eq('metadata->>google_place_id', place.placeId)
          .maybeSingle();

        let clientId: string;

        if (existing) {
          clientId = existing.id;
        } else {
          const { data: newClient, error } = await fromTable('creative_clients')
            .insert({
              organization_id: orgId,
              name: place.name,
              website: place.website,
              status: 'prospect',
              metadata: {
                google_place_id: place.placeId,
                phone: place.phone,
                address: place.address,
                lat: place.lat,
                lng: place.lng,
                rating: place.rating,
                google_maps_url: place.googleMapsUrl,
                types: place.types,
                discovered_at: new Date().toISOString(),
                discovery_source: 'google_places',
              },
            })
            .select('id')
            .single();

          if (error) throw error;
          clientId = newClient.id;
        }

        savedClients.push({ id: clientId, name: place.name, placeId: place.placeId });

        // If saving as lead, also create an opportunity
        if (saveAs === 'lead') {
          const { error: oppError } = await fromTable('creative_opportunities')
            .insert({
              organization_id: orgId,
              client_id: clientId,
              title: `${place.name} — Discover Lead`,
              stage: 'lead',
              source: 'google_places',
              metadata: {
                discovery_source: 'google_places',
                google_place_id: place.placeId,
              },
            });
          if (oppError) throw oppError;
        }
      }

      return savedClients;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
    },
  });
}
```

**Step 4: Commit**

```bash
git add src/services/discoverService.ts src/hooks/useDiscoverSearch.ts src/hooks/useSaveDiscoverResults.ts
git commit -m "feat(loc01): add discover service layer and React Query hooks"
```

---

### Task 3: Discover Page + Route + Sidebar Nav

**Files:**
- Create: `src/pages/creative/CreativeDiscover.tsx`
- Modify: `src/App.tsx` — add lazy route
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` — add nav item

**Step 1: Create the page component**

`src/pages/creative/CreativeDiscover.tsx`:

```typescript
import { useState } from 'react';
import { DiscoverSearchForm } from '@/components/creative/discover/DiscoverSearchForm';
import { DiscoverResultsTable } from '@/components/creative/discover/DiscoverResultsTable';
import { DiscoverMap } from '@/components/creative/discover/DiscoverMap';
import { BulkActionBar } from '@/components/creative/discover/BulkActionBar';
import { useDiscoverSearch } from '@/hooks/useDiscoverSearch';
import { useSaveDiscoverResults } from '@/hooks/useSaveDiscoverResults';
import type { PlaceResult, PlacesSearchParams } from '@/services/discoverService';
import { useToast } from '@/hooks/use-toast';

export default function CreativeDiscover() {
  const { toast } = useToast();
  const searchMutation = useDiscoverSearch();
  const saveMutation = useSaveDiscoverResults();
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [alreadySavedIds, setAlreadySavedIds] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<PlaceResult[]>([]);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5000);

  const handleSearch = async (params: PlacesSearchParams) => {
    setSelectedRows([]);
    setSearchCenter({ lat: params.lat, lng: params.lng });
    setSearchRadius(params.radiusMeters);

    try {
      const data = await searchMutation.mutateAsync(params);
      setResults(data.results);
      setAlreadySavedIds(data.alreadySavedIds);
    } catch (err) {
      toast({
        title: 'Search failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (saveAs: 'client' | 'lead') => {
    try {
      const saved = await saveMutation.mutateAsync({ places: selectedRows, saveAs });
      toast({
        title: `Saved ${saved.length} ${saveAs === 'lead' ? 'leads' : 'clients'}`,
        description: saved.map((s) => s.name).join(', '),
      });
      // Update already-saved state
      setAlreadySavedIds((prev) => [...prev, ...saved.map((s) => s.placeId)]);
      setSelectedRows([]);
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Form */}
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-lg font-semibold mb-4">Discover</h1>
        <DiscoverSearchForm
          onSearch={handleSearch}
          isLoading={searchMutation.isPending}
        />
      </div>

      {/* Results: Table + Map split */}
      {results.length > 0 && (
        <div className="flex flex-1 min-h-0">
          <div className="w-3/5 border-r overflow-auto">
            <DiscoverResultsTable
              results={results}
              alreadySavedIds={alreadySavedIds}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              highlightedPlaceId={highlightedPlaceId}
              onRowHover={setHighlightedPlaceId}
            />
          </div>
          <div className="w-2/5">
            <DiscoverMap
              results={results}
              center={searchCenter}
              radiusMeters={searchRadius}
              highlightedPlaceId={highlightedPlaceId}
              onPinClick={(placeId) => setHighlightedPlaceId(placeId)}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !searchMutation.isPending && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">Search for businesses</p>
            <p className="text-sm mt-1">Enter a search query and location above to discover leads</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {searchMutation.isPending && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Bulk action bar */}
      {selectedRows.length > 0 && (
        <BulkActionBar
          count={selectedRows.length}
          onSaveAsClient={() => handleSave('client')}
          onSaveAsLead={() => handleSave('lead')}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}
```

**Step 2: Add lazy route in App.tsx**

In `src/App.tsx`, add after other creative lazy imports:

```typescript
const CreativeDiscover = lazy(() => import("./pages/creative/CreativeDiscover"));
```

And inside the creative `<Route>` children, add:

```typescript
<Route path="discover" element={<CreativeDiscover />} />
```

**Step 3: Add sidebar nav item**

In `src/components/creative/layout/CreativeSidebar.tsx`:

Add `Search` to the lucide-react imports, then add the nav item after Dashboard:

```typescript
{ label: 'Discover', icon: Search, path: '/creative/discover' },
```

**Step 4: Commit**

```bash
git add src/pages/creative/CreativeDiscover.tsx src/App.tsx src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat(loc01): add Discover page, route, and sidebar navigation"
```

---

### Task 4: DiscoverSearchForm Component

**Files:**
- Create: `src/components/creative/discover/DiscoverSearchForm.tsx`

**Step 1: Create the search form**

This component has: search mode toggle, query/type input, location autocomplete, radius slider, result count, and search button.

```typescript
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Search, MapPin } from 'lucide-react';
import type { PlacesSearchParams } from '@/services/discoverService';

// Google's commonly used place types
const PLACE_TYPES = [
  'accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery',
  'atm', 'bakery', 'bank', 'bar', 'beauty_salon', 'bicycle_store',
  'book_store', 'bowling_alley', 'bus_station', 'cafe', 'campground',
  'car_dealer', 'car_rental', 'car_repair', 'car_wash', 'casino',
  'cemetery', 'church', 'city_hall', 'clothing_store', 'convenience_store',
  'courthouse', 'dentist', 'department_store', 'doctor', 'drugstore',
  'electrician', 'electronics_store', 'embassy', 'fire_station', 'florist',
  'funeral_home', 'furniture_store', 'gas_station', 'gym', 'hair_care',
  'hardware_store', 'hindu_temple', 'home_goods_store', 'hospital',
  'insurance_agency', 'jewelry_store', 'laundry', 'lawyer', 'library',
  'light_rail_station', 'liquor_store', 'local_government_office',
  'locksmith', 'lodging', 'meal_delivery', 'meal_takeaway', 'mosque',
  'movie_rental', 'movie_theater', 'moving_company', 'museum',
  'night_club', 'painter', 'park', 'parking', 'pet_store', 'pharmacy',
  'physiotherapist', 'plumber', 'police', 'post_office',
  'primary_school', 'real_estate_agency', 'restaurant', 'roofing_contractor',
  'rv_park', 'school', 'secondary_school', 'shoe_store', 'shopping_mall',
  'spa', 'stadium', 'storage', 'store', 'subway_station', 'supermarket',
  'synagogue', 'taxi_stand', 'tourist_attraction', 'train_station',
  'transit_station', 'travel_agency', 'university', 'veterinary_care', 'zoo',
];

interface DiscoverSearchFormProps {
  onSearch: (params: PlacesSearchParams) => void;
  isLoading: boolean;
}

export function DiscoverSearchForm({ onSearch, isLoading }: DiscoverSearchFormProps) {
  const [searchMode, setSearchMode] = useState<'freeText' | 'businessType'>('freeText');
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [maxResults, setMaxResults] = useState(20);

  const geocodeLocation = useCallback(async (text: string) => {
    if (!text.trim()) return null;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&key=${apiKey}`,
    );
    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location as { lat: number; lng: number };
    }
    return null;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let location = coords;
    if (!location && locationText.trim()) {
      location = await geocodeLocation(locationText);
      if (location) setCoords(location);
    }

    if (!location) return;

    const params: PlacesSearchParams = {
      lat: location.lat,
      lng: location.lng,
      radiusMeters: radiusKm * 1000,
      maxResults,
    };

    if (searchMode === 'freeText') {
      params.query = query;
    } else {
      params.type = selectedType;
    }

    onSearch(params);
  };

  const formatRadius = (km: number) => {
    if (km < 1) return `${km * 1000}m`;
    return `${km}km`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Search mode toggle + input */}
      <div className="flex gap-3 items-end">
        {/* Mode toggle */}
        <div className="flex rounded-lg border bg-muted p-0.5 shrink-0">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              searchMode === 'freeText' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'
            }`}
            onClick={() => setSearchMode('freeText')}
          >
            Free text
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              searchMode === 'businessType' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'
            }`}
            onClick={() => setSearchMode('businessType')}
          >
            Business type
          </button>
        </div>

        {/* Search input */}
        <div className="flex-1">
          {searchMode === 'freeText' ? (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for businesses... (e.g. art gallery, coworking space)"
              className="w-full"
            />
          ) : (
            <SearchableSelect
              value={selectedType}
              onValueChange={setSelectedType}
              options={PLACE_TYPES}
              placeholder="Select a business type..."
            />
          )}
        </div>
      </div>

      {/* Row 2: Location + Radius + Results + Search */}
      <div className="flex gap-3 items-end">
        {/* Location */}
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={locationText}
              onChange={(e) => {
                setLocationText(e.target.value);
                setCoords(null);
              }}
              placeholder="City, address, or coordinates..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Radius */}
        <div className="w-48">
          <label className="text-xs text-muted-foreground mb-1 block">
            Radius: {formatRadius(radiusKm)}
          </label>
          <Slider
            value={[radiusKm]}
            onValueChange={([v]) => setRadiusKm(v)}
            min={0.5}
            max={50}
            step={0.5}
          />
        </div>

        {/* Max results */}
        <div className="w-24">
          <label className="text-xs text-muted-foreground mb-1 block">Results</label>
          <Input
            type="number"
            value={maxResults}
            onChange={(e) => setMaxResults(Math.min(60, Math.max(1, Number(e.target.value))))}
            min={1}
            max={60}
          />
        </div>

        {/* Search button */}
        <Button type="submit" disabled={isLoading || (!query && !selectedType) || !locationText}>
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/creative/discover/DiscoverSearchForm.tsx
git commit -m "feat(loc01): add DiscoverSearchForm with free text and business type modes"
```

---

### Task 5: DiscoverResultsTable + BulkActionBar

**Files:**
- Create: `src/components/creative/discover/DiscoverResultsTable.tsx`
- Create: `src/components/creative/discover/BulkActionBar.tsx`

**Step 1: Create the results table**

`src/components/creative/discover/DiscoverResultsTable.tsx`:

```typescript
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceResult } from '@/services/discoverService';

interface DiscoverResultsTableProps {
  results: PlaceResult[];
  alreadySavedIds: string[];
  selectedRows: PlaceResult[];
  onSelectedRowsChange: (rows: PlaceResult[]) => void;
  highlightedPlaceId: string | null;
  onRowHover: (placeId: string | null) => void;
}

export function DiscoverResultsTable({
  results,
  alreadySavedIds,
  selectedRows,
  onSelectedRowsChange,
  highlightedPlaceId,
  onRowHover,
}: DiscoverResultsTableProps) {
  const savedSet = useMemo(() => new Set(alreadySavedIds), [alreadySavedIds]);
  const selectedSet = useMemo(
    () => new Set(selectedRows.map((r) => r.placeId)),
    [selectedRows],
  );

  const selectableResults = results.filter((r) => !savedSet.has(r.placeId));
  const allSelected = selectableResults.length > 0 && selectableResults.every((r) => selectedSet.has(r.placeId));

  const toggleRow = (place: PlaceResult) => {
    if (selectedSet.has(place.placeId)) {
      onSelectedRowsChange(selectedRows.filter((r) => r.placeId !== place.placeId));
    } else {
      onSelectedRowsChange([...selectedRows, place]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onSelectedRowsChange([]);
    } else {
      onSelectedRowsChange(selectableResults);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              disabled={selectableResults.length === 0}
            />
          </TableHead>
          <TableHead className="w-24">Status</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-16">Map</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="w-20">Rating</TableHead>
          <TableHead className="w-28">Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((place, idx) => {
          const isSaved = savedSet.has(place.placeId);
          const isSelected = selectedSet.has(place.placeId);
          const isHighlighted = highlightedPlaceId === place.placeId;

          return (
            <TableRow
              key={place.placeId || idx}
              className={cn(
                'cursor-pointer transition-colors',
                isHighlighted && 'bg-accent',
                isSaved && 'opacity-60',
              )}
              onMouseEnter={() => onRowHover(place.placeId)}
              onMouseLeave={() => onRowHover(null)}
            >
              <TableCell>
                {!isSaved && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(place)}
                  />
                )}
              </TableCell>
              <TableCell>
                <Badge variant={isSaved ? 'outline' : 'secondary'} className="text-xs">
                  {isSaved ? 'Saved' : 'Found'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{place.name}</TableCell>
              <TableCell>
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TableCell>
              <TableCell className="max-w-[160px] truncate">
                {place.website ? (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {new URL(place.website).hostname}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm">{place.phone ?? '—'}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {place.address}
              </TableCell>
              <TableCell>
                {place.rating != null ? (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {place.rating}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                {place.primaryType && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {place.primaryType.replace(/_/g, ' ')}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Create the bulk action bar**

`src/components/creative/discover/BulkActionBar.tsx`:

```typescript
import { Button } from '@/components/ui/button';
import { Users, Briefcase } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onSaveAsClient: () => void;
  onSaveAsLead: () => void;
  isSaving: boolean;
}

export function BulkActionBar({ count, onSaveAsClient, onSaveAsLead, isSaving }: BulkActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {count} selected
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onSaveAsClient}
          disabled={isSaving}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Save as Client{count > 1 ? `s (${count})` : ''}
        </Button>
        <Button
          size="sm"
          onClick={onSaveAsLead}
          disabled={isSaving}
        >
          <Briefcase className="h-4 w-4 mr-1.5" />
          Save as Lead{count > 1 ? `s (${count})` : ''}
        </Button>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/creative/discover/DiscoverResultsTable.tsx src/components/creative/discover/BulkActionBar.tsx
git commit -m "feat(loc01): add DiscoverResultsTable with checkbox selection and BulkActionBar"
```

---

### Task 6: DiscoverMap Component

**Files:**
- Create: `src/components/creative/discover/DiscoverMap.tsx`

**Step 1: Create the map component**

```typescript
import { useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF, InfoWindowF } from '@react-google-maps/api';
import { useState } from 'react';
import type { PlaceResult } from '@/services/discoverService';

interface DiscoverMapProps {
  results: PlaceResult[];
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  highlightedPlaceId: string | null;
  onPinClick: (placeId: string) => void;
}

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

export function DiscoverMap({
  results,
  center,
  radiusMeters,
  highlightedPlaceId,
  onPinClick,
}: DiscoverMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeInfo, setActiveInfo] = useState<PlaceResult | null>(null);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (results.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        results.forEach((r) => bounds.extend({ lat: r.lat, lng: r.lng }));
        if (center) bounds.extend(center);
        map.fitBounds(bounds, 40);
      }
    },
    [results, center],
  );

  const highlightedResult = useMemo(
    () => results.find((r) => r.placeId === highlightedPlaceId),
    [results, highlightedPlaceId],
  );

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center ?? { lat: 40.0, lng: -3.7 }}
      zoom={center ? 13 : 4}
      options={mapOptions}
      onLoad={onLoad}
    >
      {/* Radius circle */}
      {center && (
        <CircleF
          center={center}
          radius={radiusMeters}
          options={{
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.3,
            strokeWeight: 1,
          }}
        />
      )}

      {/* Result pins */}
      {results.map((place, idx) => (
        <MarkerF
          key={place.placeId || idx}
          position={{ lat: place.lat, lng: place.lng }}
          label={{
            text: String(idx + 1),
            color: '#fff',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: highlightedPlaceId === place.placeId ? 16 : 12,
            fillColor: highlightedPlaceId === place.placeId ? '#2563eb' : '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
          onClick={() => {
            onPinClick(place.placeId);
            setActiveInfo(place);
          }}
        />
      ))}

      {/* Info window */}
      {activeInfo && (
        <InfoWindowF
          position={{ lat: activeInfo.lat, lng: activeInfo.lng }}
          onCloseClick={() => setActiveInfo(null)}
        >
          <div className="max-w-[240px] p-1">
            <p className="font-medium text-sm">{activeInfo.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{activeInfo.address}</p>
            {activeInfo.phone && <p className="text-xs mt-0.5">{activeInfo.phone}</p>}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/creative/discover/DiscoverMap.tsx
git commit -m "feat(loc01): add DiscoverMap with numbered pins and radius circle"
```

---

### Task 7: Build Verification + Tests

**Files:**
- Test: `src/test/discover.test.tsx`

**Step 1: Write unit tests for the service types and component rendering**

`src/test/discover.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkActionBar } from '@/components/creative/discover/BulkActionBar';
import { DiscoverResultsTable } from '@/components/creative/discover/DiscoverResultsTable';
import type { PlaceResult } from '@/services/discoverService';

// Mock Google Maps API
vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => ({ isLoaded: true, loadError: null }),
  GoogleMap: ({ children }: { children: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  MarkerF: () => <div data-testid="marker" />,
  CircleF: () => <div data-testid="circle" />,
  InfoWindowF: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockPlaces: PlaceResult[] = [
  {
    placeId: 'place-1',
    name: 'Test Gallery',
    googleMapsUrl: 'https://maps.google.com/?q=place_id:place-1',
    website: 'https://testgallery.com',
    phone: '+34 600 000 000',
    address: 'Calle Test 1, Madrid',
    rating: 4.5,
    primaryType: 'art_gallery',
    types: ['art_gallery'],
    lat: 40.42,
    lng: -3.71,
  },
  {
    placeId: 'place-2',
    name: 'Saved Gallery',
    googleMapsUrl: 'https://maps.google.com/?q=place_id:place-2',
    website: null,
    phone: null,
    address: 'Calle Test 2, Madrid',
    rating: null,
    primaryType: 'museum',
    types: ['museum'],
    lat: 40.43,
    lng: -3.72,
  },
];

describe('BulkActionBar', () => {
  it('renders with correct count', () => {
    const onClient = vi.fn();
    const onLead = vi.fn();

    render(
      <BulkActionBar count={3} onSaveAsClient={onClient} onSaveAsLead={onLead} isSaving={false} />,
    );

    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByText(/Save as Client/)).toBeInTheDocument();
    expect(screen.getByText(/Save as Lead/)).toBeInTheDocument();
  });

  it('calls save handlers on click', () => {
    const onClient = vi.fn();
    const onLead = vi.fn();

    render(
      <BulkActionBar count={1} onSaveAsClient={onClient} onSaveAsLead={onLead} isSaving={false} />,
    );

    fireEvent.click(screen.getByText(/Save as Client/));
    expect(onClient).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText(/Save as Lead/));
    expect(onLead).toHaveBeenCalledOnce();
  });

  it('disables buttons when saving', () => {
    render(
      <BulkActionBar count={1} onSaveAsClient={vi.fn()} onSaveAsLead={vi.fn()} isSaving={true} />,
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});

describe('DiscoverResultsTable', () => {
  it('renders all results', () => {
    render(
      <DiscoverResultsTable
        results={mockPlaces}
        alreadySavedIds={[]}
        selectedRows={[]}
        onSelectedRowsChange={vi.fn()}
        highlightedPlaceId={null}
        onRowHover={vi.fn()}
      />,
    );

    expect(screen.getByText('Test Gallery')).toBeInTheDocument();
    expect(screen.getByText('Saved Gallery')).toBeInTheDocument();
  });

  it('shows Already Saved badge for saved places', () => {
    render(
      <DiscoverResultsTable
        results={mockPlaces}
        alreadySavedIds={['place-2']}
        selectedRows={[]}
        onSelectedRowsChange={vi.fn()}
        highlightedPlaceId={null}
        onRowHover={vi.fn()}
      />,
    );

    const badges = screen.getAllByText('Found');
    expect(badges).toHaveLength(1);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('calls onSelectedRowsChange when checkbox clicked', () => {
    const onChange = vi.fn();

    render(
      <DiscoverResultsTable
        results={mockPlaces}
        alreadySavedIds={[]}
        selectedRows={[]}
        onSelectedRowsChange={onChange}
        highlightedPlaceId={null}
        onRowHover={vi.fn()}
      />,
    );

    // Find checkboxes (excluding the header "select all")
    const checkboxes = screen.getAllByRole('checkbox');
    // First is select-all, then one per selectable row
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledWith([mockPlaces[0]]);
  });

  it('displays rating with star icon', () => {
    render(
      <DiscoverResultsTable
        results={mockPlaces}
        alreadySavedIds={[]}
        selectedRows={[]}
        onSelectedRowsChange={vi.fn()}
        highlightedPlaceId={null}
        onRowHover={vi.fn()}
      />,
    );

    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('shows truncated website hostname', () => {
    render(
      <DiscoverResultsTable
        results={mockPlaces}
        alreadySavedIds={[]}
        selectedRows={[]}
        onSelectedRowsChange={vi.fn()}
        highlightedPlaceId={null}
        onRowHover={vi.fn()}
      />,
    );

    expect(screen.getByText('testgallery.com')).toBeInTheDocument();
  });
});
```

**Step 2: Run the test suite**

Run: `npx vitest run src/test/discover.test.tsx`
Expected: All tests pass

**Step 3: Run full build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (481 + new discover tests)

**Step 5: Commit tests**

```bash
git add src/test/discover.test.tsx
git commit -m "test(loc01): add unit tests for DiscoverResultsTable and BulkActionBar"
```

---

### Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Edge function: `places-search` | `supabase/functions/places-search/index.ts` |
| 2 | Service layer + hooks | `src/services/discoverService.ts`, `src/hooks/useDiscoverSearch.ts`, `src/hooks/useSaveDiscoverResults.ts` |
| 3 | Page + route + sidebar | `src/pages/creative/CreativeDiscover.tsx`, `src/App.tsx`, `CreativeSidebar.tsx` |
| 4 | Search form component | `src/components/creative/discover/DiscoverSearchForm.tsx` |
| 5 | Results table + bulk bar | `src/components/creative/discover/DiscoverResultsTable.tsx`, `BulkActionBar.tsx` |
| 6 | Map component | `src/components/creative/discover/DiscoverMap.tsx` |
| 7 | Tests + build verification | `src/test/discover.test.tsx` |

**Total: 7 tasks, 11 new files, 2 modified files, 7 commits**
