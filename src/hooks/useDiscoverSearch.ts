import { useMutation } from '@tanstack/react-query';
import { searchPlaces, type PlacesSearchParams, type PlacesSearchResponse } from '@/services/discoverService';

export function useDiscoverSearch() {
  return useMutation<PlacesSearchResponse, Error, PlacesSearchParams>({
    mutationFn: searchPlaces,
  });
}
