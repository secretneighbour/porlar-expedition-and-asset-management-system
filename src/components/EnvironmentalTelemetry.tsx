import React, { useState, useEffect } from 'react';
import { 
  CloudSnow, 
  Wind, 
  Thermometer, 
  Eye, 
  Gauge, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Calculator,
  Compass,
  ArrowDownRight,
  TrendingDown,
  RefreshCw,
  LocateFixed,
  Radio,
  Zap,
  Droplets,
  CloudRain,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
  Crosshair,
  MapPin,
  Plus
} from 'lucide-react';
import { ConditionLevel, PolarRegion, ResearchStation, Expedition, RealtimeWeatherReading, HourlyForecastPoint, CitySearchResult } from '../types';

interface EnvironmentalTelemetryProps {
  conditionLevel: ConditionLevel;
  region: PolarRegion;
  stations: ResearchStation[];
  expeditions: Expedition[];
  stationWeather: Record<string, RealtimeWeatherReading>;
  userLocationWeather: RealtimeWeatherReading | null;
  expeditionWeather: Record<string, RealtimeWeatherReading>;
  customWeather?: RealtimeWeatherReading | null;
  queryCustomLocationWeather?: (lat: number, lng: number, name?: string) => Promise<RealtimeWeatherReading>;
  loadingWeather: boolean;
  weatherLastUpdated: string | null;
  onRefreshWeather: () => Promise<void>;
  userLat: number | null;
  userLng: number | null;
  userCityName?: string | null;
  geoSource?: 'gps' | 'ip' | 'manual' | null;
  onAcquireGps?: () => Promise<any>;
  onSetManualLocation?: (lat: number, lng: number, name?: string) => void;
  onSearchCity?: (query: string) => Promise<CitySearchResult[]>;
  onFlyToLocation?: (coords: { lat: number; lng: number }) => void;
  onOpenAddBase?: () => void;
}

export const EnvironmentalTelemetry: React.FC<EnvironmentalTelemetryProps> = ({
  conditionLevel,
  region,
  stations,
  expeditions,
  stationWeather,
  userLocationWeather,
  expeditionWeather,
  customWeather,
  queryCustomLocationWeather,
  loadingWeather,
  weatherLastUpdated,
  onRefreshWeather,
  userLat,
  userLng,
  userCityName,
  geoSource,
  onAcquireGps,
  onSetManualLocation,
  onSearchCity,
  onFlyToLocation,
  onOpenAddBase,
}) => {
  // Interactive windchill calculator state: real-time vs manual mode
  const [calcMode, setCalcMode] = useState<'realtime' | 'manual'>('realtime');
  const [calcTemp, setCalcTemp] = useState<number>(userLocationWeather?.tempC ?? -45);
  const [calcWindKts, setCalcWindKts] = useState<number>(userLocationWeather?.windSpeedKts ?? 30);
  const [viewFilter, setViewFilter] = useState<'all' | 'antarctica' | 'arctic' | 'expeditions'>('all');

  // Keep calculator in sync with real-time location weather when in realtime mode
  useEffect(() => {
    if (calcMode === 'realtime' && userLocationWeather) {
      setCalcTemp(userLocationWeather.tempC);
      setCalcWindKts(userLocationWeather.windSpeedKts);
    }
  }, [calcMode, userLocationWeather?.tempC, userLocationWeather?.windSpeedKts]);
  
  // Expanded 24-hour forecast item ID
  const [expandedForecastId, setExpandedForecastId] = useState<string | null>(null);

  // Custom coordinate probe state
  const [probeLat, setProbeLat] = useState<string>('-78.4644');
  const [probeLng, setProbeLng] = useState<string>('106.8340');
  const [probeName, setProbeName] = useState<string>('Vostok Deep Ice Core Station');
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeError, setProbeError] = useState<string | null>(null);

  // City Search & Location switch state
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [citySearchResults, setCitySearchResults] = useState<CitySearchResult[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const [isCitySearchOpen, setIsCitySearchOpen] = useState<boolean>(false);
  const [isAcquiringGpsLocally, setIsAcquiringGpsLocally] = useState<boolean>(false);

  // Standard polar windchill calculation:
  // Twc = 13.12 + 0.6215*T - 11.37*(V_kmh^0.16) + 0.3965*T*(V_kmh^0.16)
  const calcWindKmh = calcWindKts * 1.852;
  const calculatedWindchill = Math.round(
    13.12 +
    0.6215 * calcTemp -
    11.37 * Math.pow(calcWindKmh, 0.16) +
    0.3965 * calcTemp * Math.pow(calcWindKmh, 0.16)
  );

  // Frostbite exposure time approximation
  const getFrostbiteRisk = (chill: number) => {
    if (chill > -25) return { time: '> 60 min', risk: 'Low', color: 'text-emerald-400', badgeBg: 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300' };
    if (chill > -35) return { time: '30 min', risk: 'Moderate', color: 'text-amber-400', badgeBg: 'bg-amber-950/60 border-amber-700/50 text-amber-300' };
    if (chill > -48) return { time: '10 min', risk: 'High', color: 'text-orange-400', badgeBg: 'bg-orange-950/60 border-orange-700/50 text-orange-300' };
    if (chill > -60) return { time: '2 - 5 min', risk: 'Severe (Flesh Freezes)', color: 'text-rose-400', badgeBg: 'bg-rose-950/60 border-rose-700/50 text-rose-300' };
    return { time: '< 60 seconds', risk: 'Extreme Cryo-Lethal', color: 'text-rose-500 font-bold', badgeBg: 'bg-rose-900/80 border-rose-500 text-rose-100 animate-pulse' };
  };

  const frostbite = getFrostbiteRisk(calculatedWindchill);

  // Quick preset applicator for simulator
  const applyPreset = (temp: number, wind: number) => {
    setCalcTemp(Math.round(temp));
    setCalcWindKts(Math.round(wind));
  };

  // Handler for custom coordinate weather probe
  const handleProbeCustomWeather = async (latVal?: string, lngVal?: string, nameVal?: string) => {
    const lat = parseFloat(latVal ?? probeLat);
    const lng = parseFloat(lngVal ?? probeLng);
    const name = nameVal ?? probeName;
    if (isNaN(lat) || isNaN(lng)) {
      setProbeError('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }
    setProbeError(null);
    setIsProbing(true);
    try {
      if (queryCustomLocationWeather) {
        await queryCustomLocationWeather(lat, lng, name);
      }
    } catch (err: any) {
      setProbeError(err?.message || 'Failed to query polar weather for coordinates');
    } finally {
      setIsProbing(false);
    }
  };

  // Quick polar coordinate presets
  const POLAR_PRESETS = [
    { name: 'Vostok Station (Coldest Record)', lat: '-78.4644', lng: '106.8340' },
    { name: 'Dome Fuji Ice Core Station', lat: '-77.3167', lng: '39.7000' },
    { name: 'Amundsen-Scott South Pole (90°S)', lat: '-90.0000', lng: '0.0000' },
    { name: 'North Pole Sea Ice (90°N)', lat: '90.0000', lng: '0.0000' },
    { name: 'Summit Camp (Greenland Apex)', lat: '72.5800', lng: '-38.4500' },
  ];

  // Helper to render 24-hour hourly forecast timeline drawer
  const renderHourlyForecastDrawer = (reading?: RealtimeWeatherReading) => {
    if (!reading || !reading.hourlyForecast || reading.hourlyForecast.length === 0) {
      return (
        <div className="p-3 bg-slate-950/90 rounded-b-lg border-t border-slate-800 text-[11px] text-slate-400 font-mono">
          Connecting to Open-Meteo High-Resolution Polar Ensemble to retrieve 24-hour forecast steps...
        </div>
      );
    }

    return (
      <div className="p-3 bg-slate-950/95 rounded-b-lg border-t border-slate-800 font-mono space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sky-300 font-bold">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>24-HOUR HOURLY FORECAST & KATABATIC TRENDS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            HIGH-RES SATELLITE AWOS MODEL • HOURLY RESOLUTION
          </span>
        </div>

        <div className="overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex gap-2 min-w-max">
            {reading.hourlyForecast.slice(0, 20).map((pt, idx) => {
              const isSevereWind = pt.windKts >= 35;
              const isCold = pt.apparentTempC <= -45;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded border flex flex-col items-center justify-between gap-1 w-20 text-center ${
                    isSevereWind
                      ? 'bg-amber-950/50 border-amber-600/80 text-amber-200'
                      : isCold
                      ? 'bg-sky-950/50 border-sky-600/70 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-bold">{pt.time}</span>
                  <span className="text-xs font-bold text-sky-300">{pt.tempC}°C</span>
                  <span className="text-[9px] text-cyan-300">Feels {pt.apparentTempC}°</span>
                  <div className="flex items-center gap-0.5 text-[9.5px] text-amber-300 font-bold mt-0.5">
                    <Wind className="w-2.5 h-2.5" />
                    <span>{pt.windKts}kt</span>
                  </div>
                  {pt.precipitationMm > 0 && (
                    <span className="text-[9px] text-indigo-300">{pt.precipitationMm}mm</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Filter stations based on selected viewFilter
  const filteredStations = stations.filter((s) => {
    if (viewFilter === 'antarctica') return s.region === 'antarctica';
    if (viewFilter === 'arctic') return s.region === 'arctic';
    return true;
  });

  const filteredExpeditions = expeditions.filter((e) => {
    if (viewFilter === 'antarctica') return e.region === 'antarctica';
    if (viewFilter === 'arctic') return e.region === 'arctic';
    return true;
  });

  // Check if any station or expedition has active katabatic gale alert
  const katabaticAlerts: RealtimeWeatherReading[] = (Object.values(stationWeather) as RealtimeWeatherReading[]).filter((w) => w && w.isKatabaticStorm);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl space-y-4">
      {/* Top Header & Live Satellite Sync Status */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CloudSnow className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              REAL-TIME METEOROLOGICAL & KATABATIC ATMOSPHERIC TELEMETRY
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-2">
            <span>High-resolution polar AWOS satellite telemetry, adiabatic gravity wind corridors, and live cryogenic sensors</span>
          </p>
        </div>

        {/* Live sync badge and manual refresh button */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-emerald-800 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE MET TELEMETRY SYNC</span>
          </div>

          {weatherLastUpdated && (
            <span className="text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-950 border border-slate-800">
              UPDATED: <strong className="text-sky-300">{weatherLastUpdated}</strong>
            </span>
          )}

          <button
            type="button"
            onClick={onRefreshWeather}
            disabled={loadingWeather}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-200 transition-colors"
            title="Fetch real-time atmospheric readings from meteorological sensors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin text-sky-400' : 'text-sky-300'}`} />
            <span>{loadingWeather ? 'SYNCING...' : 'REFRESH LIVE MET'}</span>
          </button>
        </div>
      </div>

      {/* Active Katabatic Severe Gale Warning Banner (if detected) */}
      {katabaticAlerts.length > 0 && (
        <div className="p-3 bg-amber-950/70 border border-amber-500/80 rounded-lg flex items-start gap-3 text-xs font-mono text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
              <span>KATABATIC GRAVITY WIND WARNING ACTIVE ({katabaticAlerts.length} SECTORS AFFECTED)</span>
            </div>
            <p className="text-amber-200/90 text-[11px]">
              High-velocity cold-dense air drainage detected at {katabaticAlerts.map(a => a.locationName).join(', ')}. Wind speeds exceed 35 knots with severe drifting whiteout risks. Restrict exterior un-tethered foot travel.
            </p>
          </div>
        </div>
      )}

      {/* Real-time Weather at User's Live Real-Time Location (GPS / IP / City) */}
      <div className="p-3.5 bg-gradient-to-r from-sky-950/80 via-slate-950 to-slate-900 border border-sky-500/80 rounded-xl shadow-xl font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-sky-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center justify-center">
              <LocateFixed className="w-5 h-5 text-sky-400 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm tracking-wide">
                  REAL-TIME WEATHER AT YOUR REAL-TIME LOCATION
                </span>
                {geoSource === 'gps' && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    SATELLITE GPS FIX
                  </span>
                )}
                {geoSource === 'ip' && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950/90 text-sky-300 border border-sky-600/80 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    NETWORK IP FIX
                  </span>
                )}
                {geoSource === 'manual' && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/90 text-amber-300 border border-amber-600/80 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    MANUAL LOCATION
                  </span>
                )}
              </div>
              <div className="text-[11px] text-sky-200 mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-white">
                  📍 {userCityName || (userLocationWeather ? userLocationWeather.locationName : 'Resolving local position...')}
                </span>
                {userLat !== null && userLng !== null && (
                  <span className="text-slate-400 text-[10px]">
                    ({userLat >= 0 ? `${userLat.toFixed(4)}°N` : `${Math.abs(userLat).toFixed(4)}°S`}, {userLng >= 0 ? `${userLng.toFixed(4)}°E` : `${Math.abs(userLng).toFixed(4)}°W`})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {onAcquireGps && (
              <button
                type="button"
                onClick={async () => {
                  setIsAcquiringGpsLocally(true);
                  try {
                    await onAcquireGps();
                  } finally {
                    setIsAcquiringGpsLocally(false);
                  }
                }}
                disabled={isAcquiringGpsLocally}
                className="px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-600 text-sky-200 font-bold flex items-center gap-1.5 transition-colors"
                title="Acquire live GPS coordinates from your device hardware"
              >
                <LocateFixed className={`w-3.5 h-3.5 text-sky-400 ${isAcquiringGpsLocally ? 'animate-spin' : ''}`} />
                <span>{isAcquiringGpsLocally ? 'LOCKING GPS...' : 'RE-SYNC GPS'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCitySearchOpen(!isCitySearchOpen)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
              title="Search and switch real-time weather to any city worldwide"
            >
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span>{isCitySearchOpen ? 'CLOSE SEARCH' : 'SEARCH CITY'}</span>
            </button>

            {userLocationWeather && (
              <>
                <button
                  type="button"
                  onClick={() => setExpandedForecastId(expandedForecastId === 'user-location' ? null : 'user-location')}
                  className="px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-600 text-sky-200 font-bold flex items-center gap-1 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{expandedForecastId === 'user-location' ? 'HIDE 24H FORECAST' : '24H FORECAST'}</span>
                  {expandedForecastId === 'user-location' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(userLocationWeather.tempC, userLocationWeather.windSpeedKts)}
                  className="px-2.5 py-1 rounded bg-sky-800 hover:bg-sky-700 text-white font-bold transition-colors"
                  title="Load real-time readings into frostbite simulator"
                >
                  Apply to Simulator
                </button>
                {onFlyToLocation && userLat !== null && userLng !== null && (
                  <button
                    type="button"
                    onClick={() => onFlyToLocation({ lat: userLat, lng: userLng })}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold border border-slate-700 transition-colors flex items-center gap-1"
                    title="Center and inspect your location on the map"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>VIEW ON MAP</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Global City Search Bar (if opened) */}
        {isCitySearchOpen && (
          <div className="p-3 mb-3 bg-slate-950 border border-sky-800/80 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
              <Search className="w-4 h-4 text-sky-400" />
              <span>LOOKUP REAL-TIME WEATHER FOR ANY GLOBAL LOCATION:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && onSearchCity && citySearchQuery.trim()) {
                    setIsSearchingCity(true);
                    try {
                      const results = await onSearchCity(citySearchQuery.trim());
                      setCitySearchResults(results);
                    } finally {
                      setIsSearchingCity(false);
                    }
                  }
                }}
                placeholder="Type city name (e.g., Tromsø, Reykjavik, Oslo, Ushuaia, New York, Tokyo)..."
                className="flex-1 min-w-[240px] bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={async () => {
                  if (onSearchCity && citySearchQuery.trim()) {
                    setIsSearchingCity(true);
                    try {
                      const results = await onSearchCity(citySearchQuery.trim());
                      setCitySearchResults(results);
                    } finally {
                      setIsSearchingCity(false);
                    }
                  }
                }}
                disabled={isSearchingCity}
                className="px-3 py-1.5 rounded bg-sky-800 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1"
              >
                {isSearchingCity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>SEARCH</span>
              </button>
            </div>

            {/* Quick location chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
              <span className="text-slate-500 uppercase text-[10px] mr-1">QUICK PRESETS:</span>
              {[
                { name: 'Tromsø (Arctic Gateway)', lat: 69.6492, lng: 18.9553 },
                { name: 'Reykjavik (Iceland)', lat: 64.1466, lng: -21.9426 },
                { name: 'Ushuaia (Antarctic Gateway)', lat: -54.8019, lng: -68.3030 },
                { name: 'Oslo (Norway)', lat: 59.9139, lng: 10.7522 },
                { name: 'London (UK)', lat: 51.5074, lng: -0.1278 },
                { name: 'New York (USA)', lat: 40.7128, lng: -74.0060 },
                { name: 'Tokyo (Japan)', lat: 35.6762, lng: 139.6503 },
              ].map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onSetManualLocation) {
                      onSetManualLocation(c.lat, c.lng, c.name);
                      setIsCitySearchOpen(false);
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 hover:text-white transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Search Results Dropdown */}
            {citySearchResults.length > 0 && (
              <div className="mt-2 p-2 bg-slate-900/90 border border-sky-700/60 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">SEARCH RESULTS:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {citySearchResults.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (onSetManualLocation) {
                          const fullName = res.admin1 ? `${res.name}, ${res.admin1}, ${res.country}` : `${res.name}, ${res.country}`;
                          onSetManualLocation(res.lat, res.lng, fullName);
                          setIsCitySearchOpen(false);
                          setCitySearchResults([]);
                        }
                      }}
                      className="text-left px-2.5 py-1.5 rounded bg-slate-950 hover:bg-sky-950 border border-slate-800 hover:border-sky-600 transition-colors"
                    >
                      <div className="font-bold text-white text-xs">{res.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {res.admin1 ? `${res.admin1}, ` : ''}{res.country} ({res.lat.toFixed(2)}°, {res.lng.toFixed(2)}°)
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-time Weather Telemetry Reading Display */}
        {userLocationWeather ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>AIR TEMPERATURE</span>
                  <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-xl font-extrabold text-sky-300">
                  {userLocationWeather.tempC}°C
                  <span className="text-xs text-slate-400 font-normal ml-1.5">
                    ({Math.round((userLocationWeather.tempC * 9) / 5 + 32)}°F)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Feels: <span className="text-sky-200 font-bold">{userLocationWeather.apparentTempC}°C</span>
                </span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>WIND SPEED & GUSTS</span>
                  <Wind className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-extrabold text-amber-300">
                  {userLocationWeather.windSpeedKts} kts
                  <span className="text-xs text-slate-400 font-normal ml-1.5">
                    ({userLocationWeather.windSpeedKmh} km/h)
                  </span>
                </div>
                <span className="text-[10px] text-amber-400/90 block mt-0.5">
                  Gusts: {userLocationWeather.windGustsKts} kts
                </span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>WIND DIRECTION</span>
                  <Compass className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="text-base font-extrabold text-slate-200">
                  {userLocationWeather.windDirectionCardinal}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Compass Bearing: {userLocationWeather.windDirectionDeg}°
                </span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>PRESSURE & HUMIDITY</span>
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-base font-extrabold text-cyan-300">
                  {userLocationWeather.pressureHpa} hPa
                </div>
                <span className="text-[10px] text-cyan-200/80 block mt-0.5">
                  Humidity: {userLocationWeather.relativeHumidity}% • Precip: {userLocationWeather.precipitationMm}mm
                </span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 sm:col-span-2 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>METEOROLOGICAL CONDITION & SAFETY</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white tracking-wide">
                  {userLocationWeather.weatherDescription}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    userLocationWeather.frostbiteRiskLevel === 'None' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                      : userLocationWeather.frostbiteRiskLevel === 'Low'
                      ? 'bg-sky-950 text-sky-300 border border-sky-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    Exposure: {userLocationWeather.frostbiteRiskTime}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Source: {userLocationWeather.source}
                  </span>
                </div>
              </div>
            </div>

            {expandedForecastId === 'user-location' && renderHourlyForecastDrawer(userLocationWeather)}
          </>
        ) : (
          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sky-300 font-bold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span>Fetching live real-time meteorological reading for your coordinates...</span>
            </div>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Connecting to global meteorological sensors for {userCityName || 'your detected position'}. Coordinates:{' '}
              {userLat !== null && userLng !== null ? `${userLat.toFixed(4)}°, ${userLng.toFixed(4)}°` : 'Pending GPS fix'}.
            </p>
          </div>
        )}
      </div>

      {/* Custom Probed Polar Coordinate Weather (if available) */}
      {customWeather && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-950/70 via-slate-950 to-slate-900 border border-indigo-500/80 rounded-xl shadow-lg font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2.5 border-b border-indigo-800/50">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="font-bold text-white text-sm">PROBED POLAR LOCATION: {customWeather.locationName.toUpperCase()}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                {customWeather.lat.toFixed(4)}°, {customWeather.lng.toFixed(4)}°
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setExpandedForecastId(expandedForecastId === 'custom-probe' ? null : 'custom-probe')}
                className="px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-600 text-indigo-200 font-bold flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                <span>{expandedForecastId === 'custom-probe' ? 'HIDE 24H FORECAST' : '24H HOURLY FORECAST'}</span>
                {expandedForecastId === 'custom-probe' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => applyPreset(customWeather.tempC, customWeather.windSpeedKts)}
                className="px-2 py-0.5 rounded bg-indigo-800 hover:bg-indigo-700 text-white font-bold"
                title="Load into simulator"
              >
                Apply to Simulator
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">AIR TEMP</span>
              <span className="text-xl font-bold text-indigo-300">{customWeather.tempC}°C</span>
              <span className="text-[10px] text-slate-500 block">Feels: {customWeather.apparentTempC}°C</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">WIND SPEED</span>
              <span className="text-lg font-bold text-amber-300">{customWeather.windSpeedKts} kts</span>
              <span className="text-[10px] text-slate-500 block">Gusts: {customWeather.windGustsKts} kts</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">WIND DIRECTION</span>
              <span className="text-sm font-bold text-slate-200">{customWeather.windDirectionCardinal}</span>
              <span className="text-[10px] text-slate-500 block">{customWeather.windDirectionDeg}°</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">BARO PRESSURE</span>
              <span className="text-sm font-bold text-cyan-300">{customWeather.pressureHpa} hPa</span>
              <span className="text-[10px] text-slate-500 block">Humidity: {customWeather.relativeHumidity}%</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 sm:col-span-2">
              <span className="text-slate-400 text-[10px] block">CONDITION</span>
              <span className="text-xs font-bold text-slate-100 block">{customWeather.weatherDescription}</span>
              <span className="text-[10px] text-emerald-400 block">Freeze risk: {customWeather.frostbiteRiskTime} ({customWeather.frostbiteRiskLevel})</span>
            </div>
          </div>

          {expandedForecastId === 'custom-probe' && renderHourlyForecastDrawer(customWeather)}
        </div>
      )}

      {/* Custom Polar Coordinate Weather Probe Tool */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl font-mono text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Search className="w-4 h-4" />
            <span>PROBE REAL-TIME ATMOSPHERIC SENSORS AT CUSTOM POLAR COORDINATES</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[10px]">
            <span className="text-slate-500 uppercase mr-1">QUICK PROBES:</span>
            {POLAR_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setProbeLat(p.lat);
                  setProbeLng(p.lng);
                  setProbeName(p.name);
                  handleProbeCustomWeather(p.lat, p.lng, p.name);
                }}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProbeCustomWeather();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">NAME:</span>
            <input
              type="text"
              value={probeName}
              onChange={(e) => setProbeName(e.target.value)}
              placeholder="e.g. South Pole Depot"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-32">
            <span className="text-slate-400 text-[11px]">LAT:</span>
            <input
              type="text"
              value={probeLat}
              onChange={(e) => setProbeLat(e.target.value)}
              placeholder="-78.46"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-32">
            <span className="text-slate-400 text-[11px]">LNG:</span>
            <input
              type="text"
              value={probeLng}
              onChange={(e) => setProbeLng(e.target.value)}
              placeholder="106.83"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isProbing}
            className="px-3 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-bold transition-colors flex items-center gap-1.5"
          >
            {isProbing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isProbing ? 'PROBING MET...' : 'PROBE ATMOSPHERE'}</span>
          </button>
        </form>

        {probeError && (
          <div className="text-rose-400 text-[11px] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{probeError}</span>
          </div>
        )}
      </div>

      {/* Main Meteorological Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Interactive Field Operator Windchill & Frostbite Simulator */}
        <div className="lg:col-span-1 bg-slate-950/90 border border-cyan-500/40 rounded-xl p-4 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between text-cyan-300 font-bold mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>FIELD WINDCHILL & FROSTBITE CALCULATOR</span>
              </div>
            </div>

            {/* Mode Switcher: Real-Time Location Sync vs Manual Simulator */}
            <div className="flex items-center justify-between bg-slate-900 p-1 rounded-lg border border-slate-800 mb-3">
              <button
                type="button"
                onClick={() => {
                  setCalcMode('realtime');
                  if (userLocationWeather) {
                    setCalcTemp(userLocationWeather.tempC);
                    setCalcWindKts(userLocationWeather.windSpeedKts);
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  calcMode === 'realtime'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3 h-3 text-sky-300 animate-pulse" />
                <span>REAL-TIME GPS SYNC</span>
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('manual')}
                className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  calcMode === 'manual'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-amber-300" />
                <span>MANUAL SIMULATOR</span>
              </button>
            </div>

            {/* Real-time sync status indicator */}
            {calcMode === 'realtime' && (
              <div className="mb-3 p-2.5 bg-sky-950/70 border border-sky-700/60 rounded-lg text-[11px] text-sky-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {userCityName || userLocationWeather?.locationName || 'Current Location'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-900/80 text-sky-300 border border-sky-600">
                    ● AUTO-SYNCED
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span>
                    Lat: {userLat !== null && userLat !== undefined ? userLat.toFixed(2) : '--'}°, Lng: {userLng !== null && userLng !== undefined ? userLng.toFixed(2) : '--'}°
                  </span>
                  <span className="text-slate-400">
                    {userLocationWeather ? `${userLocationWeather.tempC}°C / ${userLocationWeather.windSpeedKts} kts` : 'Acquiring weather...'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Values reflect real-time live sensor telemetry. Move sliders below to switch to manual override mode.
                </p>
              </div>
            )}

            {/* Manual mode status with re-sync action and presets */}
            {calcMode === 'manual' && (
              <div className="mb-3 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    MANUAL SIMULATOR ACTIVE
                  </span>
                  {userLocationWeather && (
                    <button
                      type="button"
                      onClick={() => {
                        setCalcMode('realtime');
                        setCalcTemp(userLocationWeather.tempC);
                        setCalcWindKts(userLocationWeather.windSpeedKts);
                      }}
                      className="px-2 py-0.5 rounded bg-sky-800 hover:bg-sky-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors border border-sky-600"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>RE-SYNC GPS</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  LOAD LIVE BASE PRESET:
                </div>
                <div className="flex flex-wrap gap-1">
                  {stations.slice(0, 5).map((st) => {
                    const w = stationWeather[st.id];
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => applyPreset(w?.tempC ?? -40, w?.windSpeedKts ?? 25)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-[10px] border border-slate-700"
                      >
                        {st.code} ({w ? `${w.tempC}°C` : '...'})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slider 1: Temperature */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">AMBIENT AIR TEMP:</span>
                <span className="text-sky-300 font-bold text-sm">{calcTemp}°C</span>
              </div>
              <input
                type="range"
                min="-85"
                max="10"
                step="1"
                value={calcTemp}
                onChange={(e) => {
                  setCalcMode('manual');
                  setCalcTemp(Number(e.target.value));
                }}
                className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>-85°C (Extreme Cryo)</span>
                <span>-40°C</span>
                <span>+10°C</span>
              </div>
            </div>

            {/* Slider 2: Wind Speed */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">SURFACE WIND SPEED:</span>
                <span className="text-amber-300 font-bold text-sm">{calcWindKts} knots ({Math.round(calcWindKmh)} km/h)</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={calcWindKts}
                onChange={(e) => {
                  setCalcMode('manual');
                  setCalcWindKts(Number(e.target.value));
                }}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0 kts (Calm)</span>
                <span>35 kts (Katabatic)</span>
                <span>80 kts (Severe Blizzard)</span>
              </div>
            </div>
          </div>

          {/* Output Display */}
          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400 text-xs">EFFECTIVE WINDCHILL:</span>
              <span className="text-3xl font-bold font-mono text-cyan-300">
                {calculatedWindchill}°C
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800">
              <span className="text-slate-400">FROSTBITE RISK LEVEL:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${frostbite.badgeBg}`}>
                {frostbite.risk}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">EXPOSURE TIME LIMIT:</span>
              <span className="text-white font-bold text-sm">{frostbite.time}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Polar AWOS Sensors & Expedition Telemetry */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col">
          {/* Table Controls / Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider">
                AUTOMATED WEATHER OBSERVING STATIONS (AWOS)
              </span>
              {onOpenAddBase && (
                <button
                  type="button"
                  onClick={onOpenAddBase}
                  className="px-2 py-0.5 rounded bg-sky-700 hover:bg-sky-600 text-white font-bold text-[10px] flex items-center gap-1 transition-colors border border-sky-500"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ ADD BASE</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-2 py-0.5 rounded ${viewFilter === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All Sectors ({stations.length + expeditions.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('antarctica')}
                className={`px-2 py-0.5 rounded ${viewFilter === 'antarctica' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Antarctica
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('arctic')}
                className={`px-2 py-0.5 rounded ${viewFilter === 'arctic' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Arctic
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('expeditions')}
                className={`px-2 py-0.5 rounded ${viewFilter === 'expeditions' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Field Convoys ({expeditions.length})
              </button>
            </div>
          </div>

          {/* Station Weather Readings Cards */}
          <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            {/* 1. Research Station Readings */}
            {viewFilter !== 'expeditions' && filteredStations.map((station) => {
              const reading = stationWeather[station.id];
              const temp = reading ? reading.tempC : -40;
              const chill = reading ? reading.apparentTempC : -60;
              const wind = reading ? reading.windSpeedKts : 20;
              const windDir = reading ? reading.windDirectionCardinal : '180° S';
              const pressure = reading ? reading.pressureHpa : 980;
              const vis = reading ? reading.visibilityKm : 10.0;
              const desc = reading ? reading.weatherDescription : 'Live Telemetry Connecting...';
              const isKatabatic = reading?.isKatabaticStorm;

              const isExpanded = expandedForecastId === station.id;

              return (
                <div
                  key={station.id}
                  className={`rounded-lg bg-slate-900/90 border transition-all ${
                    isKatabatic ? 'border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sky-400 font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800">
                          {station.code}
                        </span>
                        <span className="text-white font-display font-bold text-sm">{station.name}</span>
                        <span className="text-[10px] text-slate-400">({station.country})</span>
                        {isKatabatic && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 text-[10px] font-bold">
                            KATABATIC GALE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Coords: <strong className="text-slate-300">{station.lat.toFixed(2)}°, {station.lng.toFixed(2)}°</strong></span>
                        <span>Baro: <strong className="text-slate-300">{pressure} hPa</strong></span>
                        <span>Vis: <strong className={vis < 1.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{vis} km</strong></span>
                        <span className="text-cyan-300">{desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="md:text-right">
                        <div className="text-sky-300 font-bold text-base">
                          {temp}°C <span className="text-slate-400 font-normal text-xs">Air</span>
                        </div>
                        <div className="text-[11px] text-cyan-400 font-bold">
                          {chill}°C <span className="text-slate-400 font-normal">Windchill</span>
                        </div>
                      </div>

                      <div className="border-l border-slate-800 pl-3">
                        <div className="text-amber-300 font-bold flex items-center gap-1 text-sm">
                          <Wind className="w-3.5 h-3.5" />
                          <span>{wind} kts</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {windDir}
                        </div>
                      </div>

                      <div className="border-l border-slate-800 pl-2 flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedForecastId(isExpanded ? null : station.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="View 24-hour hourly forecast timeline"
                        >
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>{isExpanded ? 'HIDE' : '24H'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(temp, wind)}
                          className="px-1.5 py-0.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-800 text-[9px] text-sky-300 font-bold"
                          title="Load into frostbite calculator"
                        >
                          SIM
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && renderHourlyForecastDrawer(reading)}
                </div>
              );
            })}

            {/* 2. Active Field Convoys Weather */}
            {(viewFilter === 'all' || viewFilter === 'expeditions') && filteredExpeditions.map((exp) => {
              const reading = expeditionWeather[exp.id];
              const temp = reading ? reading.tempC : exp.currentWeather.tempC;
              const chill = reading ? reading.apparentTempC : exp.currentWeather.windchillC;
              const wind = reading ? reading.windSpeedKts : exp.currentWeather.windKnots;
              const windDir = reading ? reading.windDirectionCardinal : '180° S';
              const pressure = reading ? reading.pressureHpa : 780;
              const vis = reading ? reading.visibilityKm : 5.0;
              const desc = reading ? reading.weatherDescription : 'Convoy Field Telemetry';
              const isExpanded = expandedForecastId === `exp-${exp.id}`;

              return (
                <div
                  key={exp.id}
                  className="rounded-lg bg-amber-950/20 border border-amber-800/60 hover:border-amber-600 transition-colors text-xs font-mono"
                >
                  <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700">
                          {exp.code}
                        </span>
                        <span className="text-amber-100 font-display font-bold text-sm">{exp.name} (Field Convoy)</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                          Leader: {exp.leader}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Field GPS: <strong className="text-slate-300">{exp.currentLat.toFixed(2)}°, {exp.currentLng.toFixed(2)}°</strong></span>
                        <span>Progress: <strong className="text-amber-300">{exp.distanceCoveredKm}/{exp.totalDistanceKm}km</strong></span>
                        <span>Vis: <strong className={vis < 1.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{vis} km</strong></span>
                        <span className="text-amber-200/90">{desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="md:text-right">
                        <div className="text-amber-300 font-bold text-base">
                          {temp}°C <span className="text-slate-400 font-normal text-xs">Air</span>
                        </div>
                        <div className="text-[11px] text-cyan-300 font-bold">
                          {chill}°C <span className="text-slate-400 font-normal">Chill</span>
                        </div>
                      </div>

                      <div className="border-l border-slate-800 pl-3">
                        <div className="text-amber-400 font-bold flex items-center gap-1 text-sm">
                          <Wind className="w-3.5 h-3.5" />
                          <span>{wind} kts</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {windDir}
                        </div>
                      </div>

                      <div className="border-l border-slate-800 pl-2 flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedForecastId(isExpanded ? null : `exp-${exp.id}`)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="View convoy 24h hourly forecast"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{isExpanded ? 'HIDE' : '24H'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(temp, wind)}
                          className="px-1.5 py-0.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-[9px] text-amber-300 font-bold"
                          title="Load into frostbite calculator"
                        >
                          SIM
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && renderHourlyForecastDrawer(reading)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
