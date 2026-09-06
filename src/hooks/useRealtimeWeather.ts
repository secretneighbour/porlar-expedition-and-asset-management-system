import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeWeatherReading, HourlyForecastPoint, PolarRegion, ResearchStation, Expedition } from '../types';

/**
 * Maps WMO weather interpretation codes (0-99) to clear descriptive text
 */
function interpretWmoCode(code: number, isPolar: boolean = false): { description: string; isSnow: boolean } {
  if (isPolar) {
    switch (code) {
      case 0:
        return { description: 'Clear Ice Fog Crystals / Polar Sky', isSnow: false };
      case 1:
        return { description: 'Mainly Clear / High Cirrus', isSnow: false };
      case 2:
        return { description: 'Partly Cloudy / Polar Twilight', isSnow: false };
      case 3:
        return { description: 'Overcast / High Stratocumulus', isSnow: false };
      case 45:
      case 48:
        return { description: 'Supercooled Rime Fog / Cryo Mist', isSnow: false };
      case 51:
      case 53:
      case 55:
        return { description: 'Freezing Cryo-Drizzle', isSnow: true };
      case 56:
      case 57:
        return { description: 'Dense Freezing Drizzle', isSnow: true };
      case 61:
      case 63:
      case 65:
        return { description: 'Light to Heavy Sleet / Ice Pellets', isSnow: true };
      case 71:
        return { description: 'Light Snow / Diamond Dust Fall', isSnow: true };
      case 73:
        return { description: 'Moderate Snowpack Fall', isSnow: true };
      case 75:
        return { description: 'Heavy Blizzard Snowfall', isSnow: true };
      case 77:
        return { description: 'Snow Grains / Ice Needle Crystals', isSnow: true };
      case 85:
        return { description: 'Sustained Drifting Snow Squalls', isSnow: true };
      case 86:
        return { description: 'Severe Ground Blizzard Whiteout', isSnow: true };
      default:
        return { description: 'Sub-Zero Meteorological System', isSnow: false };
    }
  }

  // Real-time location general WMO definitions
  switch (code) {
    case 0:
      return { description: 'Clear Sky', isSnow: false };
    case 1:
      return { description: 'Mainly Clear', isSnow: false };
    case 2:
      return { description: 'Partly Cloudy', isSnow: false };
    case 3:
      return { description: 'Overcast', isSnow: false };
    case 45:
      return { description: 'Fog', isSnow: false };
    case 48:
      return { description: 'Depositing Rime Fog', isSnow: false };
    case 51:
      return { description: 'Light Drizzle', isSnow: false };
    case 53:
      return { description: 'Moderate Drizzle', isSnow: false };
    case 55:
      return { description: 'Dense Drizzle', isSnow: false };
    case 56:
    case 57:
      return { description: 'Freezing Drizzle', isSnow: true };
    case 61:
      return { description: 'Slight Rain', isSnow: false };
    case 63:
      return { description: 'Moderate Rain', isSnow: false };
    case 65:
      return { description: 'Heavy Rain', isSnow: false };
    case 66:
    case 67:
      return { description: 'Freezing Rain', isSnow: true };
    case 71:
      return { description: 'Slight Snowfall', isSnow: true };
    case 73:
      return { description: 'Moderate Snowfall', isSnow: true };
    case 75:
      return { description: 'Heavy Snowfall', isSnow: true };
    case 77:
      return { description: 'Snow Grains', isSnow: true };
    case 80:
      return { description: 'Slight Rain Showers', isSnow: false };
    case 81:
      return { description: 'Moderate Rain Showers', isSnow: false };
    case 82:
      return { description: 'Violent Rain Showers', isSnow: false };
    case 85:
      return { description: 'Slight Snow Showers', isSnow: true };
    case 86:
      return { description: 'Heavy Snow Showers', isSnow: true };
    case 95:
      return { description: 'Thunderstorm', isSnow: false };
    case 96:
    case 99:
      return { description: 'Thunderstorm with Hail', isSnow: false };
    default:
      return { description: 'Fair Weather', isSnow: false };
  }
}

/**
 * Converts wind degrees (0-360) to 16-point cardinal compass direction
 */
function degToCardinal(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return `${String(Math.round(deg)).padStart(3, '0')}° ${directions[index]}`;
}

/**
 * Calculates standard polar windchill in °C
 * Twc = 13.12 + 0.6215*T - 11.37*(V_kmh^0.16) + 0.3965*T*(V_kmh^0.16)
 */
function calculateWindchill(tempC: number, windKmh: number): number {
  if (tempC > 10 || windKmh < 4.8) {
    return tempC;
  }
  const chill = 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windKmh, 0.16) + 0.3965 * tempC * Math.pow(windKmh, 0.16);
  return Math.round(chill * 10) / 10;
}

/**
 * Calculates exposed flesh frostbite onset threshold
 */
function calculateFrostbite(chillC: number): { time: string; level: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe' | 'Extreme' } {
  if (chillC >= 0) return { time: 'No Risk (Above 0°C)', level: 'None' };
  if (chillC > -15) return { time: 'Safe (> 2 hours)', level: 'Low' };
  if (chillC > -25) return { time: '> 60 min', level: 'Low' };
  if (chillC > -35) return { time: '30 min', level: 'Moderate' };
  if (chillC > -48) return { time: '10 min', level: 'High' };
  if (chillC > -60) return { time: '2 - 5 min', level: 'Severe' };
  return { time: '< 60 seconds', level: 'Extreme' };
}

// Fallback Climatological Station Data in case of network interruption
const FALLBACK_WEATHER: Record<string, Partial<RealtimeWeatherReading>> = {
  'st-amundsen-scott': {
    tempC: -51.2,
    apparentTempC: -73.4,
    windSpeedKts: 18,
    windSpeedKmh: 33.3,
    windDirectionDeg: 40,
    windDirectionCardinal: '040° NNE',
    windGustsKts: 24,
    pressureHpa: 678.2,
    relativeHumidity: 45,
    precipitationMm: 0,
    weatherCode: 0,
    weatherDescription: 'Clear Ice Fog Crystals / Polar Sky',
    visibilityKm: 8.0,
    frostbiteRiskTime: '< 60 seconds',
    frostbiteRiskLevel: 'Extreme',
    isKatabaticStorm: false,
  },
  'st-mcmurdo': {
    tempC: -24.6,
    apparentTempC: -42.1,
    windSpeedKts: 38,
    windSpeedKmh: 70.4,
    windDirectionDeg: 160,
    windDirectionCardinal: '160° SSE',
    windGustsKts: 48,
    pressureHpa: 982.5,
    relativeHumidity: 78,
    precipitationMm: 0.4,
    weatherCode: 85,
    weatherDescription: 'Sustained Drifting Snow Squalls',
    visibilityKm: 0.8,
    frostbiteRiskTime: '10 min',
    frostbiteRiskLevel: 'High',
    isKatabaticStorm: true,
  },
  'st-concordia': {
    tempC: -62.8,
    apparentTempC: -81.2,
    windSpeedKts: 14,
    windSpeedKmh: 25.9,
    windDirectionDeg: 190,
    windDirectionCardinal: '190° S',
    windGustsKts: 20,
    pressureHpa: 642.1,
    relativeHumidity: 40,
    precipitationMm: 0,
    weatherCode: 71,
    weatherDescription: 'Light Snow / Diamond Dust Fall',
    visibilityKm: 12.0,
    frostbiteRiskTime: '< 60 seconds',
    frostbiteRiskLevel: 'Extreme',
    isKatabaticStorm: false,
  },
  'st-vostok': {
    tempC: -68.4,
    apparentTempC: -89.0,
    windSpeedKts: 16,
    windSpeedKmh: 29.6,
    windDirectionDeg: 270,
    windDirectionCardinal: '270° W',
    windGustsKts: 22,
    pressureHpa: 624.0,
    relativeHumidity: 35,
    precipitationMm: 0,
    weatherCode: 0,
    weatherDescription: 'Clear Ice Fog Crystals / Polar Sky',
    visibilityKm: 10.0,
    frostbiteRiskTime: '< 60 seconds',
    frostbiteRiskLevel: 'Extreme',
    isKatabaticStorm: false,
  },
  'st-halley-vi': {
    tempC: -28.5,
    apparentTempC: -46.2,
    windSpeedKts: 24,
    windSpeedKmh: 44.4,
    windDirectionDeg: 80,
    windDirectionCardinal: '080° E',
    windGustsKts: 32,
    pressureHpa: 989.1,
    relativeHumidity: 82,
    precipitationMm: 0.2,
    weatherCode: 73,
    weatherDescription: 'Moderate Snowpack Fall',
    visibilityKm: 3.5,
    frostbiteRiskTime: '10 min',
    frostbiteRiskLevel: 'High',
    isKatabaticStorm: false,
  },
  'st-svalbard': {
    tempC: -14.2,
    apparentTempC: -26.5,
    windSpeedKts: 26,
    windSpeedKmh: 48.2,
    windDirectionDeg: 340,
    windDirectionCardinal: '340° NNW',
    windGustsKts: 36,
    pressureHpa: 1004.2,
    relativeHumidity: 84,
    precipitationMm: 0.8,
    weatherCode: 85,
    weatherDescription: 'Sustained Drifting Snow Squalls',
    visibilityKm: 4.5,
    frostbiteRiskTime: '30 min',
    frostbiteRiskLevel: 'Moderate',
    isKatabaticStorm: false,
  },
};

interface UseRealtimeWeatherParams {
  stations: ResearchStation[];
  expeditions: Expedition[];
  userLat: number | null;
  userLng: number | null;
  userLocationName?: string | null;
  region: PolarRegion;
}

export function useRealtimeWeather({
  stations,
  expeditions,
  userLat,
  userLng,
  userLocationName,
  region,
}: UseRealtimeWeatherParams) {
  const [stationWeather, setStationWeather] = useState<Record<string, RealtimeWeatherReading>>({});
  const [userLocationWeather, setUserLocationWeather] = useState<RealtimeWeatherReading | null>(null);
  const [expeditionWeather, setExpeditionWeather] = useState<Record<string, RealtimeWeatherReading>>({});
  const [customWeather, setCustomWeather] = useState<RealtimeWeatherReading | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchInProgressRef = useRef<boolean>(false);

  /**
   * Fetches weather for a single coordinate set from Open-Meteo
   */
  const fetchSingleCoordinate = async (
    lat: number,
    lng: number,
    name: string,
    id: string,
    stationCode?: string,
    stationRegion?: PolarRegion,
    country?: string,
    elevationM?: number
  ): Promise<RealtimeWeatherReading> => {
    try {
      const isPolar = Math.abs(lat) >= 60;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,apparent_temperature,precipitation,wind_speed_10m&forecast_days=2&timezone=auto`;
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const cur = data.current;

      const tempC = Math.round((cur.temperature_2m ?? -30) * 10) / 10;
      const windKmh = Math.round((cur.wind_speed_10m ?? 20) * 10) / 10;
      const windKts = Math.round((windKmh / 1.852) * 10) / 10;
      const windGustsKmh = Math.round((cur.wind_gusts_10m ?? windKmh) * 10) / 10;
      const windGustsKts = Math.round((windGustsKmh / 1.852) * 10) / 10;
      const windDir = Math.round(cur.wind_direction_10m ?? 0);
      const pressureHpa = Math.round((cur.surface_pressure ?? 990) * 10) / 10;
      const relativeHumidity = Math.round(cur.relative_humidity_2m ?? 60);
      const precipitationMm = Math.round((cur.precipitation ?? 0) * 10) / 10;
      const weatherCode = cur.weather_code ?? 0;

      const apparentTempC = cur.apparent_temperature !== undefined
        ? Math.round(cur.apparent_temperature * 10) / 10
        : calculateWindchill(tempC, windKmh);

      const { description } = interpretWmoCode(weatherCode, isPolar);
      const frostbite = calculateFrostbite(apparentTempC);
      const isKatabatic = windKts >= 35 || windGustsKts >= 45;

      // Extract 24-hour hourly forecast
      let hourlyForecast: HourlyForecastPoint[] = [];
      if (data.hourly && Array.isArray(data.hourly.time)) {
        const hTimes: string[] = data.hourly.time;
        const hTemps: number[] = data.hourly.temperature_2m || [];
        const hApparent: number[] = data.hourly.apparent_temperature || [];
        const hPrecip: number[] = data.hourly.precipitation || [];
        const hWind: number[] = data.hourly.wind_speed_10m || [];

        hourlyForecast = hTimes.slice(0, 24).map((t, idx) => {
          const hourLabel = t.includes('T') ? t.split('T')[1].slice(0, 5) : t;
          const wKmh = hWind[idx] ?? 0;
          return {
            time: hourLabel,
            fullTime: t,
            tempC: Math.round((hTemps[idx] ?? 0) * 10) / 10,
            apparentTempC: Math.round((hApparent[idx] ?? 0) * 10) / 10,
            windKts: Math.round((wKmh / 1.852) * 10) / 10,
            precipitationMm: Math.round((hPrecip[idx] ?? 0) * 10) / 10,
          };
        });
      }

      // Estimate visibility in km based on weather code and wind speed
      let visibilityKm = 10.0;
      if (weatherCode === 86 || (windKts > 40 && weatherCode >= 71)) {
        visibilityKm = 0.2; // severe whiteout
      } else if (weatherCode === 85 || weatherCode === 75) {
        visibilityKm = 1.0; // heavy blowing snow
      } else if (weatherCode === 73 || weatherCode >= 51) {
        visibilityKm = 3.5;
      } else if (weatherCode === 45 || weatherCode === 48) {
        visibilityKm = 2.0; // rime fog
      }

      return {
        id,
        locationName: name,
        stationCode,
        country,
        region: stationRegion || 'local_gps',
        lat,
        lng,
        elevationM,
        tempC,
        apparentTempC,
        windSpeedKts: Math.round(windKts),
        windSpeedKmh: Math.round(windKmh),
        windDirectionDeg: windDir,
        windDirectionCardinal: degToCardinal(windDir),
        windGustsKts: Math.round(windGustsKts),
        pressureHpa,
        relativeHumidity,
        precipitationMm,
        weatherCode,
        weatherDescription: description,
        visibilityKm,
        frostbiteRiskTime: frostbite.time,
        frostbiteRiskLevel: frostbite.level,
        isKatabaticStorm: isKatabatic,
        hourlyForecast,
        updatedAt: new Date().toISOString(),
        source: isPolar ? 'Open-Meteo High-Res Polar AWOS' : 'Open-Meteo Real-Time Global AWOS',
      };
    } catch (err) {
      // Fallback
      const fallback = FALLBACK_WEATHER[id];
      const tempC = fallback?.tempC ?? -35;
      const windKts = fallback?.windSpeedKts ?? 20;
      const windKmh = windKts * 1.852;
      const apparentTempC = fallback?.apparentTempC ?? calculateWindchill(tempC, windKmh);
      const frostbite = calculateFrostbite(apparentTempC);

      return {
        id,
        locationName: name,
        stationCode,
        country,
        region: stationRegion || 'local_gps',
        lat,
        lng,
        elevationM,
        tempC,
        apparentTempC,
        windSpeedKts: Math.round(windKts),
        windSpeedKmh: Math.round(windKmh),
        windDirectionDeg: fallback?.windDirectionDeg ?? 180,
        windDirectionCardinal: fallback?.windDirectionCardinal ?? '180° S',
        windGustsKts: fallback?.windGustsKts ?? 28,
        pressureHpa: fallback?.pressureHpa ?? 990,
        relativeHumidity: fallback?.relativeHumidity ?? 65,
        precipitationMm: fallback?.precipitationMm ?? 0,
        weatherCode: fallback?.weatherCode ?? 0,
        weatherDescription: fallback?.weatherDescription ?? 'Polar Atmosphere (Climatology Fallback)',
        visibilityKm: fallback?.visibilityKm ?? 8.0,
        frostbiteRiskTime: frostbite.time,
        frostbiteRiskLevel: frostbite.level,
        isKatabaticStorm: fallback?.isKatabaticStorm ?? false,
        updatedAt: new Date().toISOString(),
        source: 'Climatological Model',
      };
    }
  };

  /**
   * Refreshes all weather data
   */
  const refreshAllWeather = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Station Weather in parallel
      const stationPromises = stations.map((st) =>
        fetchSingleCoordinate(
          st.lat,
          st.lng,
          st.name,
          st.id,
          st.code,
          st.region,
          st.country,
          st.elevationM
        )
      );

      // 2. Fetch Expedition Weather in parallel
      const expPromises = expeditions.map((exp) =>
        fetchSingleCoordinate(
          exp.currentLat,
          exp.currentLng,
          `${exp.name} (Field Convoy)`,
          exp.id,
          exp.code,
          exp.region
        )
      );

      // 3. Fetch User GPS Location Weather if coordinates are available
      let userWeatherPromise: Promise<RealtimeWeatherReading> | null = null;
      if (userLat !== null && userLng !== null) {
        const resolvedName = userLocationName || 'Your Real-Time Location';
        userWeatherPromise = fetchSingleCoordinate(
          userLat,
          userLng,
          resolvedName,
          'user-gps-location',
          'GPS-LOCAL'
        );
      }

      const [stationResults, expResults, userResult] = await Promise.all([
        Promise.all(stationPromises),
        Promise.all(expPromises),
        userWeatherPromise ? userWeatherPromise : Promise.resolve(null),
      ]);

      const stMap: Record<string, RealtimeWeatherReading> = {};
      stationResults.forEach((r) => {
        stMap[r.id] = r;
      });
      setStationWeather(stMap);

      const expMap: Record<string, RealtimeWeatherReading> = {};
      expResults.forEach((r) => {
        expMap[r.id] = r;
      });
      setExpeditionWeather(expMap);

      if (userResult) {
        setUserLocationWeather(userResult);
      }

      setLastUpdated(new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false }) + ' UTC');
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err?.message || 'Failed to sync live meteorological telemetry');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [stations, expeditions, userLat, userLng, userLocationName]);

  // Initial fetch and 60-second periodic live polling
  useEffect(() => {
    refreshAllWeather();

    const interval = setInterval(() => {
      refreshAllWeather();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshAllWeather]);

  // If user lat/lng or location name changes, fetch user weather immediately
  const refreshUserLocationWeather = useCallback(async () => {
    if (userLat !== null && userLng !== null) {
      const resolvedName = userLocationName || 'Your Real-Time Location';
      try {
        const res = await fetchSingleCoordinate(
          userLat,
          userLng,
          resolvedName,
          'user-gps-location',
          'GPS-LOCAL'
        );
        setUserLocationWeather(res);
      } catch (err) {
        console.error('Failed to fetch user real-time weather:', err);
      }
    }
  }, [userLat, userLng, userLocationName]);

  useEffect(() => {
    refreshUserLocationWeather();
  }, [refreshUserLocationWeather]);

  /**
   * Query custom polar coordinate weather
   */
  const queryCustomLocationWeather = useCallback(async (lat: number, lng: number, name = 'Custom Polar Location') => {
    setLoading(true);
    try {
      const res = await fetchSingleCoordinate(
        lat,
        lng,
        name,
        `custom-${lat.toFixed(2)}-${lng.toFixed(2)}`,
        'CUSTOM-AWOS',
        lat < 0 ? 'antarctica' : 'arctic'
      );
      setCustomWeather(res);
      setLoading(false);
      return res;
    } catch (e: any) {
      setLoading(false);
      throw e;
    }
  }, []);

  return {
    stationWeather,
    userLocationWeather,
    expeditionWeather,
    customWeather,
    loading,
    error,
    lastUpdated,
    refreshAllWeather,
    refreshUserLocationWeather,
    queryCustomLocationWeather,
  };
}
