import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Search, MapPin } from 'lucide-react';
import { logger } from '@/lib/logger';
import type { PlacesSearchParams } from '@/services/discoverService';

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
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&key=${apiKey}`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        status?: string;
        results?: { geometry?: { location?: { lat: number; lng: number } } }[];
      };
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        logger.warn('[Geocode] API status:', data.status);
        return null;
      }
      const loc = data.results?.[0]?.geometry?.location;
      return loc?.lat != null && loc?.lng != null ? loc : null;
    } catch (err) {
      logger.warn('[Geocode] Failed to geocode location:', err);
      return null;
    }
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

        <Button type="submit" disabled={isLoading || (!query && !selectedType) || !locationText}>
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  );
}
