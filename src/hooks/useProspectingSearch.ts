import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BusinessEntity } from '@/types/entity';
import type { ClientType } from '@/types/pharmacy';
import { toBusinessEntity } from '@/services/entityService';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import { logger } from '@/lib/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface SearchFilters {
  country: string;
  province: string;
  city: string;
  clientType?: ClientType;
}

interface GooglePlaceBasic {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface GooglePlaceDetails {
  google_place_id: string;
  name: string;
  address: string;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string[] | null;
  lat: number;
  lng: number;
  google_data: Record<string, unknown> | null;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.name === 'DOMException');
}

function toUserError(error: unknown, context: string): string {
  if (isAbortError(error)) return '';

  if (error instanceof Response || (error instanceof Error && 'status' in error)) {
    const status = (error as Response).status;
    if (status === 401 || status === 403) return `${context}: authentication expired. Please log in again.`;
    if (status === 429) return `${context}: too many requests. Please wait a moment and retry.`;
    if (status >= 500) return `${context}: server error (${status}). Please try again later.`;
    return `${context}: request failed (${status}).`;
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (/401|403/.test(msg)) return `${context}: authentication expired. Please log in again.`;
    if (/429/.test(msg)) return `${context}: too many requests. Please wait and retry.`;
    if (/5\d{2}/.test(msg)) return `${context}: server error. Please try again later.`;
    if (/fetch|network|ERR_/i.test(msg)) return `${context}: network error. Check your connection.`;
  }

  return `${context}: unexpected error. Please try again.`;
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await worker(items[i], i);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(runners);
  return results;
}

/**
 * Hook for manual pharmacy search.
 * - Triggered only by explicit `executeSearch()` call.
 * - Does NOT auto-search on filter changes.
 * - Handles full Google Places pagination.
 * - Caches results to local DB.
 */
export function useProspectingSearch() {
  const [results, setResults] = useState<BusinessEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [progress, setProgress] = useState({ found: 0, cached: 0, processed: 0, failed: 0 });
  const [detectedLocation, setDetectedLocation] = useState<{ country: string; province: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearResults = useCallback(() => {
    setResults([]);
    setHasSearched(false);
    setProgress({ found: 0, cached: 0, processed: 0, failed: 0 });
    setDetectedLocation(null);
  }, []);

  /**
   * Execute a pharmacy search for the given filters.
   * Uses Google Places Text Search to find pharmacies in the specified area.
   */
  const executeSearch = useCallback(async (filters: SearchFilters) => {
    // Validate at least one geographic filter
    if (!filters.country && !filters.province && !filters.city) {
      toast.error('Please select at least one geographic filter');
      return;
    }

    // Abort any ongoing search
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setProgress({ found: 0, cached: 0, processed: 0, failed: 0 });
    setDetectedLocation(null);
    const edgeHeaders = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });

    try {
      // Build search query for Google Places
      const locationParts = [filters.city, filters.province, filters.country].filter(Boolean);
      let searchTerm: string;
      const country = filters.country?.toLowerCase() || '';
      if (filters.clientType === 'herbalist') {
        if (country === 'spain' || country === 'españa') searchTerm = 'herbolario';
        else if (country === 'france' || country === 'francia') searchTerm = 'herboristerie';
        else if (country === 'germany' || country === 'alemania') searchTerm = 'kräuterladen';
        else if (country === 'italy' || country === 'italia') searchTerm = 'erboristeria';
        else if (country === 'portugal') searchTerm = 'ervanária';
        else searchTerm = 'herbalist';
      } else {
        if (country === 'spain' || country === 'españa') searchTerm = 'farmacia';
        else if (country === 'france' || country === 'francia') searchTerm = 'pharmacie';
        else if (country === 'germany' || country === 'alemania') searchTerm = 'apotheke';
        else if (country === 'italy' || country === 'italia') searchTerm = 'farmacia';
        else if (country === 'portugal') searchTerm = 'farmácia';
        else searchTerm = 'pharmacy';
      }
      const searchQuery = `${searchTerm} in ${locationParts.join(', ')}`;

      // Collect all results with FULL pagination - no artificial limits
      // Google Places Text Search returns up to 60 results (20 per page × 3 pages max)
      const allBasicResults: GooglePlaceBasic[] = [];
      let nextPageToken: string | null = null;
      let pageCount = 0;
      // NO maxPages limit - fully paginate until Google returns no more results

      do {
        // Wait before using pageToken (Google requires ~2s delay)
        if (nextPageToken) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (signal.aborted) return;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
          method: 'POST',
          headers: edgeHeaders,
          signal,
          body: JSON.stringify({
            action: 'textSearch',
            query: searchQuery,
            pageToken: nextPageToken,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Google Places search error:', response.status, errorText);
          throw new Error(`Search failed: ${response.status} — ${errorText}`);
        }

        const data = await response.json();
        const pharmacies = data.pharmacies || [];
        allBasicResults.push(...pharmacies);
        nextPageToken = data.nextPageToken || null;
        pageCount++;

        setProgress((prev) => ({ ...prev, found: allBasicResults.length }));

        // Continue until no more pages (nextPageToken is null)
        // Google Places has a natural limit of 3 pages (60 results) per query
      } while (nextPageToken);

      if (allBasicResults.length === 0) {
        toast.info('No pharmacies found in this area');
        setIsSearching(false);
        return;
      }

      // Fetch details and cache each pharmacy with controlled concurrency
      const cachedPharmacies: BusinessEntity[] = [];
      let processed = 0;
      let failed = 0;

      const flushProgress = () => {
        setProgress({ found: allBasicResults.length, cached: cachedPharmacies.length, processed, failed });
        setResults([...cachedPharmacies]);
      };

      await runWithConcurrency(allBasicResults, 5, async (basic) => {
        if (signal.aborted) return;

        try {
          // Check if already in database
          const { data: existing } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('google_place_id', basic.google_place_id)
            .maybeSingle();

          if (existing) {
            cachedPharmacies.push(toBusinessEntity(existing as never));
            processed++;
            flushProgress();
            return;
          }

          // Fetch details from Google Places
          const detailsResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
            method: 'POST',
            headers: edgeHeaders,
            signal,
            body: JSON.stringify({
              action: 'details',
              placeId: basic.google_place_id,
            }),
          });

          if (!detailsResponse.ok) {
            logger.warn(`Failed to get details for ${basic.google_place_id}: ${detailsResponse.status}`);
            processed++;
            failed++;
            flushProgress();
            return;
          }

          const detailsData = await detailsResponse.json();
          const details: GooglePlaceDetails = detailsData.pharmacy;

          // Check if already exists by google_place_id (race-condition guard)
          const { data: existingByPlaceId } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('google_place_id', details.google_place_id)
            .maybeSingle();

          if (existingByPlaceId) {
            cachedPharmacies.push(toBusinessEntity(existingByPlaceId as never));
            processed++;
            flushProgress();
            return;
          }

          // Check if exists by similar name + same city (CSV imports without google_place_id)
          let existingByName = null;
          if (details.city) {
            const { data: nameMatches } = await supabase
              .from('pharmacies')
              .select('*')
              .is('google_place_id', null)
              .ilike('city', details.city)
              .ilike('name', `%${details.name.split(' ').slice(0, 3).join('%')}%`)
              .limit(1);

            if (nameMatches && nameMatches.length > 0) {
              existingByName = nameMatches[0];
            }
          }

          if (existingByName) {
            const { data: updated } = await supabase
              .from('pharmacies')
              .update({
                google_place_id: details.google_place_id,
                phone: details.phone || existingByName.phone,
                website: details.website || existingByName.website,
                opening_hours: details.opening_hours as Json,
                lat: details.lat || existingByName.lat,
                lng: details.lng || existingByName.lng,
                google_data: details.google_data ? (JSON.parse(JSON.stringify(details.google_data)) as Json) : null,
                address: details.address || existingByName.address,
              })
              .eq('id', existingByName.id)
              .select()
              .single();

            cachedPharmacies.push(toBusinessEntity((updated ?? existingByName) as never));
          } else {
            const { data: inserted, error: insertError } = await supabase
              .from('pharmacies')
              .insert([
                {
                  google_place_id: details.google_place_id,
                  name: details.name,
                  address: details.address,
                  city: details.city,
                  province: details.province,
                  country: details.country,
                  phone: details.phone,
                  website: details.website,
                  opening_hours: details.opening_hours as Json,
                  lat: details.lat,
                  lng: details.lng,
                  google_data: details.google_data ? (JSON.parse(JSON.stringify(details.google_data)) as Json) : null,
                  client_type: (filters.clientType || 'pharmacy') as 'pharmacy' | 'herbalist',
                },
              ])
              .select()
              .single();

            if (insertError) {
              const { data: refetched } = await supabase
                .from('pharmacies')
                .select('*')
                .eq('google_place_id', basic.google_place_id)
                .maybeSingle();
              if (refetched) {
                cachedPharmacies.push(toBusinessEntity(refetched as never));
              } else {
                failed++;
              }
            } else if (inserted) {
              cachedPharmacies.push(toBusinessEntity(inserted as never));
            }
          }

          processed++;
          flushProgress();
        } catch (detailError) {
          if (isAbortError(detailError)) return;
          logger.warn(`Error fetching details for ${basic.google_place_id}:`, detailError);
          processed++;
          failed++;
          flushProgress();
        }
      });

      if (signal.aborted) return;

      // Final flush to ensure UI is up to date
      flushProgress();

      // Auto-detect location from first result with country data
      const firstWithCountry = cachedPharmacies.find(p => p.country);
      if (firstWithCountry) {
        setDetectedLocation({
          country: firstWithCountry.country ?? '',
          province: firstWithCountry.region ?? '',
        });
      }

      if (failed > 0 && cachedPharmacies.length > 0) {
        toast.success(`Found ${cachedPharmacies.length} pharmacies (${failed} failed)`);
      } else if (cachedPharmacies.length > 0) {
        toast.success(`Found ${cachedPharmacies.length} pharmacies`);
      } else if (failed > 0) {
        toast.error(`All ${failed} pharmacy lookups failed. Please try again.`);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      logger.error('Search error:', error);
      const msg = toUserError(error, 'Search');
      if (msg) toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSearching(false);
  }, []);

  return {
    results,
    isSearching,
    hasSearched,
    progress,
    executeSearch,
    clearResults,
    cancelSearch,
    detectedLocation,
  };
}
