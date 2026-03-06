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
