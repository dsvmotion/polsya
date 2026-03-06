import { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF, InfoWindowF } from '@react-google-maps/api';
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
