import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  MapPin, 
  Truck, 
  Plane, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Layers, 
  Radio, 
  Crosshair, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Info,
  Loader2,
  LocateFixed
} from 'lucide-react';
import { PolarRegion, PolarAsset, Expedition, ResearchStation, HazardZone, Waypoint, ActiveDistressAlert, RealtimeWeatherReading } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { RealMapView } from './RealMapView';

interface PolarMapProps {
  region: PolarRegion;
  stations: ResearchStation[];
  assets: PolarAsset[];
  expeditions: Expedition[];
  hazards: HazardZone[];
  stationWeather?: Record<string, RealtimeWeatherReading>;
  expeditionWeather?: Record<string, RealtimeWeatherReading>;
  userLocationWeather?: RealtimeWeatherReading | null;
  userLocationName?: string | null;
  selectedAssetId?: string;
  selectedExpeditionId?: string;
  activeDistress?: ActiveDistressAlert | null;
  focusCoords?: { lat: number; lng: number } | null;
  googleMapsApiKey?: string;
  onOpenApiKeyModal?: () => void;
  onSelectAsset: (asset: PolarAsset | null) => void;
  onSelectExpedition: (expedition: Expedition | null) => void;
  customWaypoints?: Waypoint[];
  onOpenAddBase?: () => void;
  onOpenAddWaypoint?: () => void;
  onAddWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
  onDeleteWaypoint?: (waypointId: string, expeditionId?: string) => void;
  onUpdateWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
}

export const PolarMap: React.FC<PolarMapProps> = ({
  region,
  stations,
  assets,
  expeditions,
  hazards,
  stationWeather = {},
  expeditionWeather = {},
  userLocationWeather = null,
  userLocationName = null,
  selectedAssetId,
  selectedExpeditionId,
  activeDistress,
  focusCoords,
  googleMapsApiKey = '',
  onOpenApiKeyModal,
  onSelectAsset,
  onSelectExpedition,
  customWaypoints = [],
  onOpenAddBase,
  onOpenAddWaypoint,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Real-time Geolocation Hook
  const {
    latitude: userLat,
    longitude: userLng,
    accuracyMeters: userAccuracy,
    altitudeMeters: userAlt,
    speedMps: userSpeed,
    loading: geoLoading,
    error: geoError,
    acquireSingleFix,
    startLiveTracking,
    stopLiveTracking,
    isWatching: isGpsTracking,
    formattedAccuracy,
  } = useGeolocation();
  
  // Layer toggles
  const [mapMode, setMapMode] = useState<'radar' | 'real_satellite'>('real_satellite');
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showAssets, setShowAssets] = useState<boolean>(true);
  const [showTraverses, setShowTraverses] = useState<boolean>(true);
  const [showHazards, setShowHazards] = useState<boolean>(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showUserGps, setShowUserGps] = useState<boolean>(true);

  // Inspector card state
  const [selectedInspectable, setSelectedInspectable] = useState<{
    type: 'station' | 'asset' | 'expedition' | 'hazard' | 'waypoint' | 'user_gps' | 'distress';
    data: any;
  } | null>(null);

  // Dimensions of map canvas
  const size = 700;
  const center = size / 2;
  const maxRadius = size * 0.44;

  // Polar Stereographic Projection formula
  // For Antarctica: Lat ranges from -90 to -65. Pole is center.
  // For Arctic: Lat ranges from +90 to +65. Pole is center.
  const projectCoordinates = useMemo(() => {
    return (lat: number, lng: number): { x: number; y: number } => {
      let safeLat = Number(lat) || 0;
      let safeLng = Number(lng) || 0;

      if (region === 'antarctica') {
        // Bound latitude between -90 and -65 for polar projection
        const clampedLat = Math.max(-90, Math.min(-65, safeLat < 0 ? safeLat : -75));
        const polarDistDeg = Math.abs(clampedLat) - 65; // 25 at -90, 0 at -65
        const r = Math.min(maxRadius * 1.02, Math.max(0, (25 - polarDistDeg) * (maxRadius / 25)));
        // In Antarctica map conventions, 0° longitude is upwards (Prime Meridian)
        const rad = ((safeLng - 90) * Math.PI) / 180;
        return {
          x: center + r * Math.cos(rad),
          y: center + r * Math.sin(rad),
        };
      } else {
        // Arctic: Lat 90 is center, 65 is edge
        const clampedLat = Math.min(90, Math.max(65, safeLat > 0 ? safeLat : 75));
        const polarDistDeg = 90 - clampedLat; // 0 at 90, 25 at 65
        const r = Math.min(maxRadius * 1.02, Math.max(0, polarDistDeg * (maxRadius / 25)));
        const rad = ((safeLng - 90) * Math.PI) / 180;
        return {
          x: center + r * Math.cos(rad),
          y: center + r * Math.sin(rad),
        };
      }
    };
  }, [region, center, maxRadius]);

  // Handle programmatic radar lock onto coordinates or active distress
  React.useEffect(() => {
    if (activeDistress) {
      let lat = activeDistress.targetLat;
      let lng = activeDistress.targetLng;
      if ((lat === undefined || lng === undefined) && activeDistress.coordinates) {
        const parts = activeDistress.coordinates.split(',').map((p: string) => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          lat = parts[0];
          lng = parts[1];
        }
      }
      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        const pos = projectCoordinates(lat, lng);
        setZoomLevel(1.8);
        setPan({
          x: Math.max(-350, Math.min(350, (center - pos.x) * 1.8)),
          y: Math.max(-350, Math.min(350, (center - pos.y) * 1.8)),
        });
        return;
      }
    }

    if (focusCoords && typeof focusCoords.lat === 'number' && typeof focusCoords.lng === 'number') {
      const pos = projectCoordinates(focusCoords.lat, focusCoords.lng);
      setZoomLevel(1.8);
      setPan({
        x: Math.max(-400, Math.min(400, (center - pos.x) * 1.8)),
        y: Math.max(-400, Math.min(400, (center - pos.y) * 1.8)),
      });
    }
  }, [focusCoords, activeDistress, projectCoordinates, center]);

  const handleAcquireAndCenterGps = async () => {
    try {
      if (activeDistress) {
        let lat = activeDistress.targetLat;
        let lng = activeDistress.targetLng;
        if ((lat === undefined || lng === undefined) && activeDistress.coordinates) {
          const parts = activeDistress.coordinates.split(',').map((p: string) => parseFloat(p.trim()));
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            lat = parts[0];
            lng = parts[1];
          }
        }
        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          const pos = projectCoordinates(lat, lng);
          setZoomLevel(1.8);
          setPan({
            x: Math.max(-350, Math.min(350, (center - pos.x) * 1.8)),
            y: Math.max(-350, Math.min(350, (center - pos.y) * 1.8)),
          });
          return;
        }
      }

      const fix = await acquireSingleFix();
      startLiveTracking();

      const isPolarLat = region === 'antarctica' ? fix.lat <= -60 : fix.lat >= 60;
      if (isPolarLat) {
        const pos = projectCoordinates(fix.lat, fix.lng);
        setZoomLevel(1.8);
        setPan({
          x: Math.max(-350, Math.min(350, (center - pos.x) * 1.8)),
          y: Math.max(-350, Math.min(350, (center - pos.y) * 1.8)),
        });
      } else {
        setZoomLevel(1.0);
        setPan({ x: 0, y: 0 });
      }
    } catch (e) {
      console.warn('GPS acquisition error, locking to polar backup coordinates:', e);
      const fallbackLat = activeDistress?.targetLat || -77.846;
      const fallbackLng = activeDistress?.targetLng || 166.668;
      const pos = projectCoordinates(fallbackLat, fallbackLng);
      setZoomLevel(1.8);
      setPan({
        x: Math.max(-350, Math.min(350, (center - pos.x) * 1.8)),
        y: Math.max(-350, Math.min(350, (center - pos.y) * 1.8)),
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  // Filter stations & assets by region
  const regionalStations = stations.filter((s) => s.region === region);
  const regionalExpeditions = expeditions.filter((e) => e.region === region);
  const regionalAssets = assets.filter((a) => {
    if (region === 'antarctica') return a.currentLocation.lat < 0;
    return a.currentLocation.lat > 0;
  });

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-sky-400" />
          <span className="font-display font-bold text-sm tracking-wide text-white uppercase">
            {mapMode === 'real_satellite'
              ? `REAL-TIME SATELLITE & GEOGRAPHICAL MAP // ${region === 'antarctica' ? 'ANTARCTIC CONTINENT' : 'ARCTIC BASIN'}`
              : `POLAR STEREOGRAPHIC RADAR // ${region === 'antarctica' ? 'ANTARCTIC CONTINENT' : 'ARCTIC BASIN'}`}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
            WGS84 POLAR GRID
          </span>
        </div>

        {/* View Mode Switcher: Real Satellite Map vs Stereographic Radar */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setMapMode('real_satellite')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              mapMode === 'real_satellite'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>REAL SATELLITE MAP</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode('radar')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              mapMode === 'radar'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>POLAR RADAR</span>
          </button>
        </div>

        {/* Map View Zoom / Reset for Radar */}
        {mapMode === 'radar' && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Zoom In"
              aria-label="Zoom in on polar map"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-slate-300 px-1.5">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Zoom Out"
              aria-label="Zoom out on polar map"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 ml-1"
              title="Recenter Pole"
              aria-label="Recenter polar map view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Conditional rendering of Real Satellite Map vs Polar Radar */}
      {mapMode === 'real_satellite' ? (
        <div className="p-3">
          <RealMapView
            region={region}
            stations={stations}
            assets={assets}
            expeditions={expeditions}
            hazards={hazards}
            stationWeather={stationWeather}
            expeditionWeather={expeditionWeather}
            userLat={userLat}
            userLng={userLng}
            userAccuracy={userAccuracy}
            userAlt={userAlt}
            userSpeed={userSpeed}
            isWatching={isGpsTracking}
            formattedAccuracy={formattedAccuracy}
            geoLoading={geoLoading}
            geoError={geoError}
            userLocationWeather={userLocationWeather}
            userLocationName={userLocationName}
            onAcquireGps={async () => {
              await handleAcquireAndCenterGps();
            }}
            onSelectStation={(st) => setSelectedInspectable({ type: 'station', data: st })}
            onSelectAsset={(ast) => onSelectAsset(ast)}
            onSelectExpedition={(exp) => onSelectExpedition(exp)}
            activeDistress={activeDistress}
            focusCoords={focusCoords}
            googleMapsApiKey={googleMapsApiKey}
            onOpenApiKeyModal={onOpenApiKeyModal}
            customWaypoints={customWaypoints}
            onOpenAddBase={onOpenAddBase}
            onOpenAddWaypoint={onOpenAddWaypoint}
            onAddWaypoint={onAddWaypoint}
            onDeleteWaypoint={onDeleteWaypoint}
            onUpdateWaypoint={onUpdateWaypoint}
          />
        </div>
      ) : (
        <>
          {/* Layer Filters Toggles */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 uppercase text-[10px]">RADAR LAYERS:</span>
            <button
              type="button"
              onClick={() => setShowStations(!showStations)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showStations ? 'bg-sky-950/80 border-sky-600 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>STATIONS</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAssets(!showAssets)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showAssets ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>ASSETS ({regionalAssets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTraverses(!showTraverses)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showTraverses ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>TRAVERSE ROUTES</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHazards(!showHazards)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showHazards ? 'bg-rose-950/80 border-rose-600 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>CREVASSE HAZARDS</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showWeatherOverlay ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>KATABATIC RADAR</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showGrid ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span>GRID</span>
            </button>

            {/* Real-time GPS Location Tool */}
            <button
              type="button"
              onClick={handleAcquireAndCenterGps}
              disabled={geoLoading}
              className={`px-2.5 py-0.5 rounded border transition-colors flex items-center gap-1.5 ml-auto ${
                userLat !== null
                  ? 'bg-sky-900/90 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Acquire device high-accuracy GPS fix and lock radar center"
            >
              {geoLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              ) : (
                <LocateFixed className={`w-3.5 h-3.5 ${userLat !== null ? 'text-sky-400 animate-pulse' : 'text-slate-400'}`} />
              )}
              <span>{userLat !== null ? 'GPS LOCKED' : 'GPS AUTO-FIX'}</span>
            </button>

            {/* Quick Station / Waypoint Creation Buttons */}
            {onOpenAddBase && (
              <button
                type="button"
                onClick={onOpenAddBase}
                className="px-2.5 py-0.5 rounded border border-sky-500 bg-sky-700/80 hover:bg-sky-600 text-white font-bold transition-colors flex items-center gap-1"
                title="Commission New Research Base Location"
              >
                <span>+ ADD BASE</span>
              </button>
            )}

            {onOpenAddWaypoint && (
              <button
                type="button"
                onClick={onOpenAddWaypoint}
                className="px-2.5 py-0.5 rounded border border-amber-500 bg-amber-700/80 hover:bg-amber-600 text-white font-bold transition-colors flex items-center gap-1"
                title="Add Tactical Waypoint or Ground Fix"
              >
                <span>+ ADD WAYPOINT</span>
              </button>
            )}
          </div>

          {/* Main Map SVG Viewport */}
          <div 
            className="relative w-full aspect-square max-h-[580px] bg-[#050811] cursor-grab active:cursor-grabbing select-none overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Grid Radial Patterns */}
            <radialGradient id="polarRadarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#0369a1" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>

            {/* Crevasse Danger Hatch */}
            <pattern id="crevasseHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.7" />
            </pattern>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Radar Background Glow */}
          <circle cx={center} cy={center} r={maxRadius} fill="url(#polarRadarGlow)" />

          {/* Ice Sheet Cartographic Outlines (Antarctic Continent / Arctic Outline) */}
          {region === 'antarctica' ? (
            <g id="antarctic-landmass" opacity="0.85">
              {/* Outer Continental Ice Shelf Base */}
              <path
                d={`M ${center} ${center - maxRadius * 0.95} 
                   C ${center + 120} ${center - maxRadius * 0.9}, ${center + maxRadius * 0.85} ${center - 80}, ${center + maxRadius * 0.92} ${center + 40}
                   C ${center + maxRadius * 0.95} ${center + 140}, ${center + 160} ${center + maxRadius * 0.85}, ${center + 80} ${center + maxRadius * 0.9}
                   C ${center - 20} ${center + maxRadius * 0.92}, ${center - 140} ${center + maxRadius * 0.75}, ${center - maxRadius * 0.75} ${center + 120}
                   C ${center - maxRadius * 0.95} ${center + 20}, ${center - maxRadius * 0.85} ${center - 120}, ${center - 100} ${center - maxRadius * 0.85}
                   Z`}
                fill="#0b162c"
                stroke="#1e3a5f"
                strokeWidth="2"
              />

              {/* Ross Ice Shelf Bay indentation */}
              <path
                d={`M ${center + 30} ${center + maxRadius * 0.45}
                   Q ${center + 90} ${center + maxRadius * 0.72}, ${center + 160} ${center + maxRadius * 0.65}
                   L ${center + 120} ${center + maxRadius * 0.4} Z`}
                fill="#0f2347"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x={center + 80} y={center + maxRadius * 0.58} fill="#38bdf8" fontSize="9" fontFamily="monospace" opacity="0.7">
                ROSS ICE SHELF
              </text>

              {/* Ronne-Filchner Ice Shelf */}
              <path
                d={`M ${center - 110} ${center - maxRadius * 0.45}
                   Q ${center - 80} ${center - maxRadius * 0.7}, ${center - 30} ${center - maxRadius * 0.6}
                   L ${center - 60} ${center - maxRadius * 0.35} Z`}
                fill="#0f2347"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x={center - 95} y={center - maxRadius * 0.52} fill="#38bdf8" fontSize="9" fontFamily="monospace" opacity="0.7">
                RONNE SHELF
              </text>

              {/* Antarctic Peninsula ridge spur */}
              <path
                d={`M ${center - maxRadius * 0.75} ${center - 80}
                   Q ${center - maxRadius * 0.92} ${center - 150}, ${center - maxRadius * 0.85} ${center - 210}
                   L ${center - maxRadius * 0.78} ${center - 200}
                   Q ${center - maxRadius * 0.68} ${center - 140}, ${center - maxRadius * 0.6} ${center - 90} Z`}
                fill="#0c1a36"
                stroke="#1e3a5f"
                strokeWidth="1.5"
              />
              <text x={center - maxRadius * 0.85} y={center - 160} fill="#64748b" fontSize="8" fontFamily="monospace" transform={`rotate(-45, ${center - maxRadius * 0.85}, ${center - 160})`}>
                ANTARCTIC PENINSULA
              </text>
            </g>
          ) : (
            <g id="arctic-basin" opacity="0.85">
              {/* Arctic Ocean basin & Greenland Mass */}
              <circle cx={center} cy={center} r={maxRadius * 0.88} fill="#0b172a" stroke="#1e293b" strokeWidth="2" />
              {/* Greenland ice cap */}
              <path
                d={`M ${center - 120} ${center + 40}
                   Q ${center - 160} ${center + 140}, ${center - 120} ${center + 240}
                   Q ${center - 70} ${center + 260}, ${center - 40} ${center + 180}
                   Q ${center - 50} ${center + 80}, ${center - 120} ${center + 40} Z`}
                fill="#0e2343"
                stroke="#1e3a5f"
                strokeWidth="1.5"
              />
              <text x={center - 110} y={center + 150} fill="#64748b" fontSize="10" fontFamily="monospace">
                GREENLAND ICE SHEET
              </text>
              {/* Svalbard Archipelago */}
              <circle cx={center + 80} cy={center + 120} r="18" fill="#162e52" stroke="#38bdf8" strokeWidth="1" />
              <text x={center + 102} y={center + 125} fill="#38bdf8" fontSize="9" fontFamily="monospace">
                SVALBARD
              </text>
            </g>
          )}

          {/* Coordinate Grid: Concentric Latitude Rings */}
          {showGrid && (
            <g id="polar-grid" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3">
              {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const r = maxRadius * frac;
                const latLabel = region === 'antarctica' 
                  ? `${90 - Math.round(25 * (1 - frac))}°S` 
                  : `${90 - Math.round(25 * frac)}°N`;
                return (
                  <g key={idx}>
                    <circle cx={center} cy={center} r={r} fill="none" />
                    <text x={center + 6} y={center - r + 12} fill="#475569" fontSize="9" fontFamily="monospace">
                      {latLabel}
                    </text>
                  </g>
                );
              })}

              {/* Radial Longitude Lines */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x2 = center + maxRadius * Math.cos(rad);
                const y2 = center + maxRadius * Math.sin(rad);
                return (
                  <g key={deg}>
                    <line x1={center} y1={center} x2={x2} y2={y2} stroke="#1e293b" strokeWidth="0.8" />
                    <text
                      x={center + (maxRadius + 14) * Math.cos(rad)}
                      y={center + (maxRadius + 14) * Math.sin(rad)}
                      fill="#475569"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {deg}°
                    </text>
                  </g>
                );
              })}

              {/* Cardinal Pole Mark */}
              <circle cx={center} cy={center} r="4" fill="#38bdf8" />
              <text x={center} y={center - 10} fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                {region === 'antarctica' ? 'SOUTH POLE (90°00\'S)' : 'NORTH POLE (90°00\'N)'}
              </text>
            </g>
          )}

          {/* Weather / Katabatic Radar Wave Overlay */}
          {showWeatherOverlay && (
            <g id="weather-katabatic-waves" opacity="0.6">
              {/* Rotating radar sweep indicator */}
              <line
                x1={center}
                y1={center}
                x2={center + maxRadius * 0.9}
                y2={center - maxRadius * 0.4}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <path
                d={`M ${center} ${center} L ${center + maxRadius * 0.9} ${center - maxRadius * 0.4} A ${maxRadius} ${maxRadius} 0 0 0 ${center + maxRadius * 0.85} ${center - maxRadius * 0.65} Z`}
                fill="url(#polarRadarGlow)"
                opacity="0.3"
              />

              {/* Katabatic wind flow vectors */}
              <path
                d={`M ${center + 40} ${center - 40} Q ${center + 120} ${center + 60}, ${center + 180} ${center + 150}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="8 6"
                opacity="0.5"
              />
              <path
                d={`M ${center - 50} ${center + 30} Q ${center - 110} ${center + 120}, ${center - 160} ${center + 180}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="8 6"
                opacity="0.5"
              />
            </g>
          )}

          {/* Crevasse & Hazard Danger Zones */}
          {showHazards && (
            <g id="hazard-zones">
              {hazards.map((h) => {
                const pos = projectCoordinates(h.lat, h.lng);
                const rPix = Math.max(14, (h.radiusKm / 100) * 40);
                return (
                  <g
                    key={h.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedInspectable({ type: 'hazard', data: h })}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={rPix}
                      fill="url(#crevasseHatch)"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                    <circle cx={pos.x} cy={pos.y} r="3" fill="#f43f5e" />
                    <text
                      x={pos.x}
                      y={pos.y - rPix - 4}
                      fill="#f43f5e"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ! {h.name.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Traverse Routes & Waypoints */}
          {showTraverses && (
            <g id="traverse-routes">
              {regionalExpeditions.map((exp) => {
                if (!exp.waypoints || exp.waypoints.length === 0) return null;
                const points = exp.waypoints.map((wp) => projectCoordinates(wp.lat, wp.lng));
                const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                const isSelected = selectedExpeditionId === exp.id;

                return (
                  <g key={exp.id}>
                    {/* Route Line Glow & Dash */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSelected ? '#38bdf8' : '#6366f1'}
                      strokeWidth={isSelected ? '3.5' : '2'}
                      strokeDasharray="6 4"
                      className="cursor-pointer hover:stroke-sky-300 transition-colors"
                      onClick={() => {
                        onSelectExpedition(exp);
                        setSelectedInspectable({ type: 'expedition', data: exp });
                      }}
                    />

                    {/* Waypoint Nodes */}
                    {exp.waypoints.map((wp, idx) => {
                      const pt = points[idx];
                      return (
                        <g
                          key={wp.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedInspectable({ type: 'waypoint', data: { ...wp, expeditionCode: exp.code } })}
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={wp.passed ? '3' : '4.5'}
                            fill={wp.passed ? '#10b981' : wp.hazardNote ? '#f59e0b' : '#38bdf8'}
                            stroke="#0f172a"
                            strokeWidth="1.5"
                          />
                          <text
                            x={pt.x + 6}
                            y={pt.y - 4}
                            fill="#94a3b8"
                            fontSize="8"
                            fontFamily="monospace"
                            className="pointer-events-none"
                          >
                            WP-{idx + 1}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          )}

          {/* Tactical Custom Waypoints & Ground Fixes */}
          {customWaypoints && customWaypoints.length > 0 && (
            <g id="custom-tactical-waypoints">
              {customWaypoints.map((cwp) => {
                const isRegional = region === 'antarctica' ? cwp.lat < 0 : cwp.lat > 0;
                if (!isRegional) return null;
                const pt = projectCoordinates(cwp.lat, cwp.lng);
                return (
                  <g
                    key={cwp.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedInspectable({ type: 'waypoint', data: { ...cwp, expeditionCode: 'TACTICAL FIX' } })}
                  >
                    <polygon
                      points={`${pt.x},${pt.y - 7} ${pt.x + 6},${pt.y + 5} ${pt.x - 6},${pt.y + 5}`}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="group-hover:scale-125 transition-transform origin-center"
                    />
                    <text
                      x={pt.x + 8}
                      y={pt.y + 3}
                      fill="#fbbf24"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {cwp.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Research Stations */}
          {showStations && (
            <g id="research-stations">
              {regionalStations.map((station) => {
                const pos = projectCoordinates(station.lat, station.lng);
                return (
                  <g
                    key={station.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedInspectable({ type: 'station', data: station })}
                  >
                    {/* Katabatic storm warning pulse ring */}
                    {stationWeather && stationWeather[station.id]?.isKatabaticStorm && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="18"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        className="animate-pulse"
                        opacity="0.9"
                      />
                    )}

                    {/* Outer target marker */}
                    <rect
                      x={pos.x - 6}
                      y={pos.y - 6}
                      width="12"
                      height="12"
                      fill={stationWeather && stationWeather[station.id]?.isKatabaticStorm ? "#b91c1c" : "#0284c7"}
                      stroke="#e0f2fe"
                      strokeWidth="1.5"
                      className="group-hover:scale-125 transition-transform origin-center"
                    />
                    <circle cx={pos.x} cy={pos.y} r="2" fill="#ffffff" />

                    {/* Station Name Label */}
                    <text
                      x={pos.x + 9}
                      y={pos.y + 3}
                      fill="#e2e8f0"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="group-hover:fill-sky-300 drop-shadow-md"
                    >
                      {station.code} ({station.name.split(' ')[0]})
                    </text>

                    {/* Live AWOS Temperature & Wind Badge */}
                    {stationWeather && stationWeather[station.id] && (
                      <g className="pointer-events-none">
                        <rect
                          x={pos.x + 9}
                          y={pos.y + 6}
                          width={stationWeather[station.id].isKatabaticStorm ? "102" : "80"}
                          height="14"
                          rx="3"
                          fill={stationWeather[station.id].isKatabaticStorm ? "#7f1d1d" : "#082f49"}
                          fillOpacity="0.9"
                          stroke={stationWeather[station.id].isKatabaticStorm ? "#ef4444" : "#0284c7"}
                          strokeWidth="0.8"
                        />
                        <text
                          x={pos.x + 13}
                          y={pos.y + 16}
                          fill={stationWeather[station.id].isKatabaticStorm ? "#fca5a5" : "#38bdf8"}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {stationWeather[station.id].tempC}°C • {stationWeather[station.id].windSpeedKts}kt
                          {stationWeather[station.id].isKatabaticStorm ? ' ⚠️ GALE' : ''}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Live Mobile Assets */}
          {showAssets && (
            <g id="polar-assets">
              {regionalAssets.map((asset) => {
                const pos = projectCoordinates(asset.currentLocation.lat, asset.currentLocation.lng);
                const isSelected = selectedAssetId === asset.id;

                let iconColor = '#f59e0b'; // amber
                if (asset.category === 'aviation') iconColor = '#38bdf8'; // sky
                if (asset.category === 'emergency_sar') iconColor = '#ef4444'; // red
                if (asset.category === 'scientific_rig') iconColor = '#a855f7'; // purple

                return (
                  <g
                    key={asset.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      onSelectAsset(asset);
                      setSelectedInspectable({ type: 'asset', data: asset });
                    }}
                  >
                    {/* Pulsing Beacon Ring */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? '14' : '10'}
                      fill="none"
                      stroke={iconColor}
                      strokeWidth={isSelected ? '2' : '1.5'}
                      strokeDasharray={asset.status === 'in_transit' ? '3 2' : 'none'}
                      className={asset.status === 'in_transit' ? 'animate-[spin_6s_linear_infinite] origin-center' : ''}
                    />

                    {/* Center point */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="4"
                      fill={iconColor}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />

                    {/* Asset Call-sign Tag */}
                    <g transform={`translate(${pos.x + 10}, ${pos.y - 6})`}>
                      <rect
                        x="0"
                        y="-8"
                        width={asset.code.length * 7 + 10}
                        height="15"
                        fill="#020617"
                        stroke={isSelected ? '#38bdf8' : '#334155'}
                        strokeWidth="1"
                        rx="3"
                        opacity="0.9"
                      />
                      <text
                        x="5"
                        y="3"
                        fill={isSelected ? '#38bdf8' : '#f8fafc'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {asset.code}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* Active Field Distress Emergency Marker */}
          {activeDistress && (() => {
            let lat = activeDistress.targetLat;
            let lng = activeDistress.targetLng;
            if (lat === undefined || lng === undefined) {
              const parts = activeDistress.coordinates.split(',').map((p) => parseFloat(p.trim()));
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                lat = parts[0];
                lng = parts[1];
              }
            }
            if (lat === undefined || lng === undefined) return null;
            // Check if matches current region
            const isAntarctica = lat < 0;
            if ((region === 'antarctica' && !isAntarctica) || (region === 'arctic' && isAntarctica)) {
              return null;
            }
            const pos = projectCoordinates(lat, lng);
            return (
              <g
                id="active-distress-marker"
                className="cursor-pointer"
                onClick={() => setSelectedInspectable({ type: 'distress' as any, data: activeDistress })}
              >
                {/* Radiating emergency beacon rings */}
                <circle cx={pos.x} cy={pos.y} r="30" fill="none" stroke="#e11d48" strokeWidth="1.5" opacity="0.5" />
                <circle cx={pos.x} cy={pos.y} r="18" fill="none" stroke="#f43f5e" strokeWidth="2" opacity="0.8" />
                <circle cx={pos.x} cy={pos.y} r="7" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                {/* Crosshairs */}
                <line x1={pos.x - 24} y1={pos.y} x2={pos.x + 24} y2={pos.y} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={pos.x} y1={pos.y - 24} x2={pos.x} y2={pos.y + 24} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Emergency Tag */}
                <g transform={`translate(${pos.x + 12}, ${pos.y - 12})`}>
                  <rect x="0" y="-10" width="125" height="18" fill="#881337" stroke="#f43f5e" strokeWidth="1" rx="3" />
                  <text x="6" y="3" fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    🚨 MAYDAY BEACON
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Real-time User GPS Position Marker */}
          {userLat !== null && userLng !== null && showUserGps && (() => {
            const isAntarcticGps = userLat < 0;
            const matchesRegion = (region === 'antarctica' && isAntarcticGps) || (region === 'arctic' && !isAntarcticGps);
            
            // If user coordinates match polar region, project accurately; otherwise project on outer perimeter radar grid
            const effectiveLat = matchesRegion ? userLat : (region === 'antarctica' ? -75 : 75);
            const effectiveLng = matchesRegion ? userLng : userLng;
            const pos = projectCoordinates(effectiveLat, effectiveLng);

            return (
              <g
                id="realtime-user-gps-marker"
                className="cursor-pointer"
                onClick={() =>
                  setSelectedInspectable({
                    type: 'user_gps',
                    data: {
                      latitude: userLat,
                      longitude: userLng,
                      accuracyMeters: userAccuracy,
                      altitudeMeters: userAlt,
                      speedMps: userSpeed,
                      isWatching: isGpsTracking,
                      formattedAccuracy,
                    },
                  })
                }
              >
                {/* Accuracy Radius Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={Math.max(16, Math.min(45, (userAccuracy || 10) * 1.5))}
                  fill="#0284c7"
                  fillOpacity="0.2"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                
                {/* Pulsing Beacon Ring */}
                <circle cx={pos.x} cy={pos.y} r="12" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
                <circle cx={pos.x} cy={pos.y} r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />

                {/* Crosshairs */}
                <line x1={pos.x - 14} y1={pos.y} x2={pos.x + 14} y2={pos.y} stroke="#38bdf8" strokeWidth="1" />
                <line x1={pos.x} y1={pos.y - 14} x2={pos.x} y2={pos.y + 14} stroke="#38bdf8" strokeWidth="1" />

                {/* GPS Tag */}
                <g transform={`translate(${pos.x + 10}, ${pos.y - 10})`}>
                  <rect x="0" y="-9" width="135" height="17" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" rx="3" opacity="0.95" />
                  <text x="5" y="3" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    📍 LIVE GPS FIX ({formattedAccuracy})
                  </text>
                </g>
              </g>
            );
          })()}

        </svg>

        {/* Selected Inspectable Tactical Overlay Card */}
        {selectedInspectable && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-slate-950/95 backdrop-blur border border-sky-500/60 rounded-lg p-3.5 shadow-2xl text-xs font-mono z-30">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 font-bold uppercase text-[10px] border border-sky-800">
                  {selectedInspectable.type}
                </span>
                <span className="font-bold text-white text-sm font-display">
                  {selectedInspectable.data.name || selectedInspectable.data.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspectable(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
                aria-label="Close tactical inspector"
              >
                ✕
              </button>
            </div>

            {/* Content per inspectable type */}
            {selectedInspectable.type === 'asset' && (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">CATEGORY:</span>
                  <span className="text-amber-400 font-bold">{selectedInspectable.data.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MODEL:</span>
                  <span>{selectedInspectable.data.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="text-emerald-400 uppercase font-bold">{selectedInspectable.data.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">LOCATION:</span>
                  <span>{selectedInspectable.data.currentLocation.lat.toFixed(2)}°, {selectedInspectable.data.currentLocation.lng.toFixed(2)}° ({selectedInspectable.data.currentLocation.elevationM}m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FUEL / BATTERY:</span>
                  <span className="font-bold text-sky-400">{selectedInspectable.data.fuelOrBatteryPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">COLD RATING:</span>
                  <span className="text-blue-400 font-bold">{selectedInspectable.data.coldRatingC}°C</span>
                </div>
              </div>
            )}

            {selectedInspectable.type === 'station' && (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">ADMIN:</span>
                  <span className="text-white">{selectedInspectable.data.country}</span>
                </div>
                {stationWeather[selectedInspectable.data.id] && (
                  <div className="p-2 rounded bg-slate-900 border border-sky-800/60 my-1.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400 font-bold">LIVE AWOS WEATHER:</span>
                      <span className="text-emerald-400 font-bold">REAL-TIME</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">AIR / CHILL</span>
                        <span className="text-sky-300 font-bold">
                          {stationWeather[selectedInspectable.data.id].tempC}°C ({stationWeather[selectedInspectable.data.id].apparentTempC}°C)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">WIND</span>
                        <span className="text-amber-300 font-bold">
                          {stationWeather[selectedInspectable.data.id].windSpeedKts} kts ({stationWeather[selectedInspectable.data.id].windDirectionCardinal})
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-cyan-300 mt-1 truncate">
                      {stationWeather[selectedInspectable.data.id].weatherDescription}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">RUNWAY:</span>
                  <span className="text-sky-300">{selectedInspectable.data.runwayType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FUEL RESERVE:</span>
                  <span className="text-amber-400 font-bold">{selectedInspectable.data.fuelReserveL.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">POPULATION:</span>
                  <span>{selectedInspectable.data.winterPopulation} winter / {selectedInspectable.data.summerPopulation} summer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ELEVATION:</span>
                  <span>{selectedInspectable.data.elevationM}m above sea level</span>
                </div>
              </div>
            )}

            {selectedInspectable.type === 'expedition' && (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">LEADER:</span>
                  <span className="text-white font-bold">{selectedInspectable.data.leader}</span>
                </div>
                {expeditionWeather[selectedInspectable.data.id] && (
                  <div className="p-2 rounded bg-slate-900 border border-amber-800/60 my-1.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-amber-400 font-bold">LIVE CONVOY ATMOSPHERE:</span>
                      <span className="text-emerald-400 font-bold">FIELD AWOS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">AIR / CHILL</span>
                        <span className="text-amber-300 font-bold">
                          {expeditionWeather[selectedInspectable.data.id].tempC}°C ({expeditionWeather[selectedInspectable.data.id].apparentTempC}°C)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">WIND</span>
                        <span className="text-cyan-300 font-bold">
                          {expeditionWeather[selectedInspectable.data.id].windSpeedKts} kts
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">TRAVERSE PROGRESS:</span>
                  <span className="text-sky-400 font-bold">{selectedInspectable.data.distanceCoveredKm} / {selectedInspectable.data.totalDistanceKm} km ({Math.round((selectedInspectable.data.distanceCoveredKm / selectedInspectable.data.totalDistanceKm) * 100)}%)</span>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                  {selectedInspectable.data.objective}
                </p>
              </div>
            )}

            {selectedInspectable.type === 'hazard' && (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">DANGER LEVEL:</span>
                  <span className="text-rose-400 font-bold uppercase">{selectedInspectable.data.dangerLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RADIAL EXTENT:</span>
                  <span className="text-amber-400">{selectedInspectable.data.radiusKm} km radius</span>
                </div>
                <p className="text-[11px] text-rose-300/90 pt-1 border-t border-slate-800">
                  {selectedInspectable.data.notes}
                </p>
              </div>
            )}

            {selectedInspectable.type === 'waypoint' && (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">EXPEDITION:</span>
                  <span className="text-sky-400 font-bold">{selectedInspectable.data.expeditionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STATUS:</span>
                  <span className={selectedInspectable.data.passed ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedInspectable.data.passed ? 'CLEARED' : 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">COORDINATES:</span>
                  <span>{selectedInspectable.data.lat.toFixed(2)}°, {selectedInspectable.data.lng.toFixed(2)}° ({selectedInspectable.data.elevationM}m)</span>
                </div>
                {selectedInspectable.data.hazardNote && (
                  <div className="text-[11px] text-amber-400 bg-amber-950/60 p-1.5 rounded border border-amber-800/80">
                    Warning: {selectedInspectable.data.hazardNote}
                  </div>
                )}
              </div>
            )}

            {selectedInspectable.type === 'distress' && (
              <div className="space-y-1.5 text-rose-200">
                <div className="flex justify-between font-bold text-rose-400">
                  <span>EMERGENCY:</span>
                  <span>{selectedInspectable.data.incidentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SECTOR:</span>
                  <span className="text-white">{selectedInspectable.data.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">COORDS:</span>
                  <span className="text-amber-300">{selectedInspectable.data.coordinates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SOURCE:</span>
                  <span className="text-white">{selectedInspectable.data.reportedByDevice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">STATUS:</span>
                  <span className={selectedInspectable.data.acknowledgedByHQ ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold animate-pulse'}>
                    {selectedInspectable.data.acknowledgedByHQ ? 'SAR SCRAMBLED' : 'AWAITING HQ DISPATCH'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  {selectedInspectable.data.summary}
                </p>
              </div>
            )}

            {selectedInspectable.type === 'user_gps' && (
              <div className="space-y-1.5 text-sky-200">
                <div className="flex justify-between font-bold text-sky-400">
                  <span>GEOLOCATION:</span>
                  <span>DEVICE REAL-TIME FIX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LAT, LNG:</span>
                  <span className="text-white font-bold">{selectedInspectable.data.latitude?.toFixed(5)}°, {selectedInspectable.data.longitude?.toFixed(5)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ACCURACY:</span>
                  <span className="text-emerald-400">{selectedInspectable.data.formattedAccuracy}</span>
                </div>
                {selectedInspectable.data.altitudeMeters !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ALTITUDE:</span>
                    <span className="text-cyan-300">{Math.round(selectedInspectable.data.altitudeMeters)}m AMSL</span>
                  </div>
                )}
                {selectedInspectable.data.speedMps !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">GROUND SPEED:</span>
                    <span className="text-amber-300">{(selectedInspectable.data.speedMps * 3.6).toFixed(1)} km/h</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">TRACKING:</span>
                  <span className="text-sky-300">{selectedInspectable.data.isWatching ? 'CONTINUOUS LIVE RADAR WATCH' : 'SINGLE FIX'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend Overlay at top right */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-400 space-y-1 hidden sm:block pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#0284c7] border border-white inline-block"></span>
            <span>Research Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Active Asset</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-400 inline-block"></span>
            <span>Traverse Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50 border border-rose-500 inline-block"></span>
            <span>Crevasse Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white inline-block"></span>
            <span>Real-time GPS Fix</span>
          </div>
        </div>
      </div>

      {/* Real-time GPS Telemetry Status Strip */}
      {userLat !== null && userLng !== null && (
        <div className="px-4 py-2 bg-slate-950 border-t border-sky-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <LocateFixed className="w-4 h-4 animate-pulse" />
              <span>LIVE GPS TELEMETRY:</span>
            </div>
            <span className="text-white font-bold">{userLat.toFixed(5)}°, {userLng.toFixed(5)}°</span>
            <span className="text-emerald-400">{formattedAccuracy}</span>
            {userAlt !== null && <span className="text-cyan-300">Alt: {Math.round(userAlt)}m</span>}
            {userSpeed !== null && <span className="text-amber-300">Speed: {(userSpeed * 3.6).toFixed(1)} km/h</span>}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleAcquireAndCenterGps}
              className="px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700 text-[10px] font-bold"
            >
              RE-CENTER GPS
            </button>
            <button
              type="button"
              onClick={() => {
                stopLiveTracking();
                setShowUserGps(false);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px]"
            >
              DISENGAGE GPS
            </button>
          </div>
        </div>
      )}

      {geoError && (
        <div className="px-4 py-1.5 bg-rose-950/80 border-t border-rose-800 text-[11px] font-mono text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={handleAcquireAndCenterGps}
            className="text-[10px] underline hover:text-white"
          >
            Retry GPS Acquisition
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
};
