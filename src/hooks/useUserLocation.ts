import { useCallback, useState } from 'react';
import { DEFAULT_LOCATION } from '../data/clinics';

export interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocation(DEFAULT_LOCATION);
        setResolved(true);
        setError('Location not supported');
        resolve(DEFAULT_LOCATION);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(loc);
          setResolved(true);
          setError(null);
          resolve(loc);
        },
        (geoError) => {
          console.error('Error getting location', geoError);
          setLocation(DEFAULT_LOCATION);
          setResolved(true);
          setError(geoError.message || 'Location unavailable');
          resolve(DEFAULT_LOCATION);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, []);

  return { location, resolved, error, requestLocation };
}
