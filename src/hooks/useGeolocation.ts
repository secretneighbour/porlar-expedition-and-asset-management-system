import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeoLocationState {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  headingDegrees: number | null;
  speedMps: number | null;
  timestamp: number | null;
  isWatching: boolean;
  cityName: string | null;
  source: 'gps' | 'ip' | 'manual' | null;
}

export interface CitySearchResult {
  name: string;
  lat: number;
  lng: number;
  country: string;
  admin1?: string;
}

export interface UseGeolocationReturn extends GeoLocationState {
  acquireSingleFix: () => Promise<{ lat: number; lng: number; accuracy: number }>;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
  setManualLocation: (lat: number, lng: number, name?: string) => void;
  searchCity: (query: string) => Promise<CitySearchResult[]>;
  formattedCoords: string;
  formattedAccuracy: string;
}

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0, // No cached positions, strictly real-time fix
};

export const useGeolocation = (autoStartWatch: boolean = true): UseGeolocationReturn => {
  const [state, setState] = useState<GeoLocationState>({
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    loading: false,
    error: null,
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    altitudeMeters: null,
    headingDegrees: null,
    speedMps: null,
    timestamp: null,
    isWatching: false,
    cityName: null,
    source: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const reverseGeocodingRef = useRef<boolean>(false);

  // Helper to reverse-geocode coordinates to city & country
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (reverseGeocodingRef.current) return;
    reverseGeocodingRef.current = true;
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const country = data.countryName;
        const resolvedName = city && country ? `${city}, ${country}` : city || country || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        setState((prev) => ({ ...prev, cityName: resolvedName }));
      }
    } catch {
      // Non-critical, ignore
    } finally {
      reverseGeocodingRef.current = false;
    }
  }, []);

  // IP-based fallback when browser GPS is blocked, delayed, or restricted by iframe
  const fetchIpLocationFallback = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          const place = data.city && data.country_name ? `${data.city}, ${data.country_name}` : data.city || 'Local Area';
          setState((prev) => {
            // Only use IP if GPS has not set a fix yet or if GPS is unavailable
            if (prev.source === 'gps') return prev;
            return {
              ...prev,
              loading: false,
              error: null,
              latitude: lat,
              longitude: lng,
              accuracyMeters: 5000,
              cityName: place,
              source: 'ip',
              timestamp: Date.now(),
            };
          });
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }, []);

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        latitude: lat,
        longitude: lng,
        accuracyMeters: position.coords.accuracy,
        altitudeMeters: position.coords.altitude,
        headingDegrees: position.coords.heading,
        speedMps: position.coords.speed,
        timestamp: position.timestamp,
        source: 'gps',
      }));

      // Trigger reverse geocoding for human-readable city
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handlePositionError = useCallback(
    (err: GeolocationPositionError) => {
      let message = 'Unable to acquire real-time GPS location.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Geolocation permission denied by browser/device.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'GPS positioning satellites unavailable or signal obstructed.';
          break;
        case err.TIMEOUT:
          message = 'GPS signal acquisition timed out.';
          break;
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));

      // If browser GPS fails, attempt IP Geolocation fallback so real-time weather can still correspond!
      fetchIpLocationFallback();
    },
    [fetchIpLocationFallback]
  );

  const acquireSingleFix = useCallback((): Promise<{ lat: number; lng: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation API is not supported on this device/browser.';
        setState((prev) => ({ ...prev, error: err }));
        fetchIpLocationFallback();
        reject(new Error(err));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          handlePositionError(err);
          reject(err);
        },
        HIGH_ACCURACY_OPTIONS
      );
    });
  }, [handlePositionSuccess, handlePositionError, fetchIpLocationFallback]);

  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      fetchIpLocationFallback();
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState((prev) => ({ ...prev, isWatching: true, loading: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      HIGH_ACCURACY_OPTIONS
    );
  }, [handlePositionSuccess, handlePositionError, fetchIpLocationFallback]);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isWatching: false, loading: false }));
  }, []);

  // Allow manual override of location coordinates
  const setManualLocation = useCallback((lat: number, lng: number, name?: string) => {
    setState((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      cityName: name || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
      accuracyMeters: 10,
      source: 'manual',
      loading: false,
      error: null,
      timestamp: Date.now(),
    }));
  }, []);

  // Search cities worldwide using free Open-Meteo Geocoding
  const searchCity = useCallback(async (query: string): Promise<CitySearchResult[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
      )}&count=6&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) return [];
      return data.results.map((r: any) => ({
        name: r.name,
        lat: r.latitude,
        lng: r.longitude,
        country: r.country || '',
        admin1: r.admin1,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (autoStartWatch && state.isSupported) {
      startLiveTracking();
    } else {
      fetchIpLocationFallback();
    }
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStartWatch, state.isSupported, startLiveTracking, fetchIpLocationFallback]);

  const formattedCoords =
    state.latitude !== null && state.longitude !== null
      ? `${state.latitude.toFixed(5)}, ${state.longitude.toFixed(5)}`
      : '';

  const formattedAccuracy =
    state.accuracyMeters !== null
      ? state.source === 'ip'
        ? 'Est. via IP Geo'
        : `±${state.accuracyMeters < 10 ? state.accuracyMeters.toFixed(1) : Math.round(state.accuracyMeters)}m ${
            state.accuracyMeters < 15 ? '(High Precision GPS)' : '(Coarse Fix)'
          }`
      : 'Awaiting fix';

  return {
    ...state,
    acquireSingleFix,
    startLiveTracking,
    stopLiveTracking,
    setManualLocation,
    searchCity,
    formattedCoords,
    formattedAccuracy,
  };
};

