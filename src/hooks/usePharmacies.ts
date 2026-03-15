import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type BusinessEntity, type EntityTypeKey } from '@/types/entity';
import type { Json } from '@/integrations/supabase/types';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import { toBusinessEntity, toBusinessEntities } from '@/services/entityService';
import { logger } from '@/lib/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** @deprecated Use useBusinessEntities from useBusinessEntities.ts instead */
export function usePharmacies(clientType?: EntityTypeKey, entityTypeId?: string) {
  return useQuery({
    queryKey: ['pharmacies', clientType ?? 'all', entityTypeId ?? 'all'],
    queryFn: async (): Promise<BusinessEntity[]> => {
      let query = supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      if (entityTypeId) {
        query = query.eq('entity_type_id', entityTypeId);
      } else if (clientType) {
        query = query.eq('client_type', clientType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error fetching entities:', error);
        throw error;
      }
      
      return toBusinessEntities(data || []);
    },
  });
}

export function usePharmacy(id: string | null) {
  return useQuery({
    queryKey: ['pharmacy', id],
    queryFn: async (): Promise<BusinessEntity | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        logger.error('Error fetching entity:', error);
        throw error;
      }
      
      return toBusinessEntity(data);
    },
    enabled: !!id,
  });
}

export function useUpdatePharmacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Record<string, unknown> 
    }) => {
      const { data, error } = await supabase
        .from('pharmacies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toBusinessEntity(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.setQueryData(['pharmacy', data.id], data);
    },
  });
}

// Separate hook for updating status from Operations view
export function useUpdateEntityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Record<string, unknown> 
    }) => {
      const { data, error } = await supabase
        .from('pharmacies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toBusinessEntity(data);
    },
    onSuccess: (data) => {
      // Invalidate all entity-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.setQueryData(['pharmacy', data.id], data);
    },
  });
}

export function useCachePharmacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pharmacy: {
      google_place_id: string;
      name: string;
      address?: string | null;
      city?: string | null;
      province?: string | null;
      country?: string | null;
      phone?: string | null;
      website?: string | null;
      opening_hours?: string[] | null;
      lat: number;
      lng: number;
      google_data?: Record<string, unknown> | null;
    }) => {
      // Check if pharmacy already exists
      const { data: existing } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('google_place_id', pharmacy.google_place_id)
        .single();
      
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('pharmacies')
          .update({
            name: pharmacy.name,
            address: pharmacy.address,
            city: pharmacy.city,
            province: pharmacy.province,
            country: pharmacy.country,
            phone: pharmacy.phone,
            website: pharmacy.website,
            opening_hours: pharmacy.opening_hours as Json,
            lat: pharmacy.lat,
            lng: pharmacy.lng,
            google_data: (pharmacy.google_data ?? null) as Json,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return toBusinessEntity(data);
      }
      
      // Insert new
      const { data, error } = await supabase
        .from('pharmacies')
        .insert([{
          google_place_id: pharmacy.google_place_id,
          name: pharmacy.name,
          address: pharmacy.address,
          city: pharmacy.city,
          province: pharmacy.province,
          country: pharmacy.country,
          phone: pharmacy.phone,
          website: pharmacy.website,
          opening_hours: pharmacy.opening_hours as Json,
          lat: pharmacy.lat,
          lng: pharmacy.lng,
          google_data: (pharmacy.google_data ?? null) as Json,
          client_type: 'pharmacy',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return toBusinessEntity(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    },
  });
}

export function useSearchGooglePlaces() {
  return useMutation({
    mutationFn: async ({ 
      location, 
      radius, 
      pageToken,
      signal,
    }: { 
      location: { lat: number; lng: number }; 
      radius?: number;
      pageToken?: string;
      signal?: AbortSignal;
    }) => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          action: 'search',
          location,
          radius,
          pageToken,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Google Places search error:', response.status, errorText);
        throw new Error(`Failed to search: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
  });
}

export function useGetPharmacyDetails() {
  return useMutation({
    mutationFn: async (placeId: string) => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-places-pharmacies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'details',
          placeId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Google Places details error:', response.status, errorText);
        throw new Error(`Failed to get details: ${response.status}`);
      }
      
      const data = await response.json();
      return data.pharmacy;
    },
  });
}
