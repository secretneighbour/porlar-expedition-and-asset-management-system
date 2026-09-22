import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { 
  Compass, 
  MapPin, 
  Truck, 
  Plane, 
  AlertTriangle, 
  Layers, 
  LocateFixed, 
  Loader2, 
  Crosshair, 
  Navigation,
  Globe,
  Radio,
  ExternalLink,
  Key,
  Maximize2,
  Plus,
  Flame,
  ThermometerSnowflake,
  ShieldAlert,
  Building2,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  PolarRegion,
  PolarAsset,
  Expedition,
  ResearchStation,
  HazardZone,
  ActiveDistressAlert,
  RealtimeWeatherReading,
  Waypoint,
  WaypointOptimizationResult,
  WaypointOptimizationRequest,
} from '../types';
import { getSubZeroDangerZones, SubZeroDangerZone } from '../utils/dangerZones';
import { evaluateWaypointProgress, formatDistanceKm, DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM } from '../utils/waypointTracing';
import { emitAiActionBroadcast } from '../data/polarisData';

interface RealMapViewProps {
  region: PolarRegion;
  stations: ResearchStation[];
  assets: PolarAsset[];
  expeditions: Expedition[];
  hazards: HazardZone[];
  stationWeather?: Record<string, RealtimeWeatherReading>;
  expeditionWeather?: Record<string, RealtimeWeatherReading>;
  userLat: number | null;
  userLng: number | null;
  userAccuracy: number | null;
  userAlt: number | null;
  userSpeed: number | null;
  isWatching: boolean;
  formattedAccuracy: string;
  geoLoading: boolean;
  geoError: string | null;
  onAcquireGps: () => Promise<void>;
  userLocationWeather?: RealtimeWeatherReading | null;
  userLocationName?: string | null;
  onSelectStation?: (station: ResearchStation) => void;
  onSelectAsset?: (asset: PolarAsset) => void;
  onSelectExpedition?: (expedition: Expedition) => void;
  onSelectDangerZone?: (zone: SubZeroDangerZone) => void;
  activeDistress?: ActiveDistressAlert | null;
  focusCoords?: { lat: number; lng: number } | null;
  googleMapsApiKey?: string;
  onOpenApiKeyModal?: () => void;
  customWaypoints?: Waypoint[];
  onOpenAddBase?: () => void;
  onOpenAddWaypoint?: () => void;
  onOpenAddBaseWithCoords?: (lat: number, lng: number) => void;
  onOpenAddWaypointWithCoords?: (lat: number, lng: number) => void;
  onAddWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
  onDeleteWaypoint?: (waypointId: string, expeditionId?: string) => void;
  onUpdateWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
  showDangerHeatmap?: boolean;
  onToggleDangerHeatmap?: () => void;
  isSimulation?: boolean;
  proposedRoute?: WaypointOptimizationResult | null;
  onApplyProposedRoute?: (result: WaypointOptimizationResult, expeditionId?: string) => void;
  onClearProposedRoute?: () => void;
}

/**
 * Web Mercator projection (EPSG:3857) mathematical boundary is [-85.05112878°, +85.05112878°].
 * Clamps coordinates safely so Leaflet projection formulas never encounter Infinity/NaN.
 */
function safeMercatorLatLng(lat: number, lng: number): [number, number] {
  const safeLat = Math.max(-85.0, Math.min(85.0, Number(lat) || 0));
  let safeLng = Number(lng) || 0;
  while (safeLng > 180) safeLng -= 360;
  while (safeLng < -180) safeLng += 360;
  return [safeLat, safeLng];
}

export const RealMapView: React.FC<RealMapViewProps> = ({
  region,
  stations,
  assets,
  expeditions,
  hazards,
  stationWeather = {},
  expeditionWeather = {},
  userLat,
  userLng,
  userAccuracy,
  userAlt,
  userSpeed,
  isWatching,
  formattedAccuracy,
  geoLoading,
  geoError,
  onAcquireGps,
  userLocationWeather,
  userLocationName,
  onSelectStation,
  onSelectAsset,
  onSelectExpedition,
  onSelectDangerZone,
  activeDistress,
  focusCoords,
  googleMapsApiKey = '',
  onOpenApiKeyModal,
  customWaypoints = [],
  onOpenAddBase,
  onOpenAddWaypoint,
  onOpenAddBaseWithCoords,
  onOpenAddWaypointWithCoords,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
  showDangerHeatmap: showDangerHeatmapProp,
  onToggleDangerHeatmap,
  isSimulation = false,
  proposedRoute: proposedRouteProp,
  onApplyProposedRoute,
  onClearProposedRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userGpsMarkerRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'satellite' | 'dark' | 'terrain' | 'osm' | 'google_hybrid'>('satellite');
  const [localHeatmapActive, setLocalHeatmapActive] = useState<boolean>(true);
  const [dangerFilter, setDangerFilter] = useState<'all' | 'extreme' | 'lethal'>('all');
  const [followMode, setFollowMode] = useState<boolean>(false);
  const [showGpsTrack, setShowGpsTrack] = useState<boolean>(true);
  const [arrivalRadiusKm, setArrivalRadiusKm] = useState<number>(DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM);
  const [showWaypointLabels, setShowWaypointLabels] = useState<boolean>(true);

  // Gemini AI Waypoint Route Optimization States
  const [localProposedRoute, setLocalProposedRoute] = useState<WaypointOptimizationResult | null>(null);
  const [optimizingRoute, setOptimizingRoute] = useState<boolean>(false);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  const [showProposedPanel, setShowProposedPanel] = useState<boolean>(true);

  const activeProposedRoute = proposedRouteProp !== undefined ? proposedRouteProp : localProposedRoute;

  const isHeatmapActive = showDangerHeatmapProp !== undefined ? showDangerHeatmapProp : localHeatmapActive;

  // Derive dynamic sub-zero danger zones using live weather telemetry
  const dangerZones = useMemo(() => {
    return getSubZeroDangerZones(stationWeather, region, dangerFilter);
  }, [stationWeather, region, dangerFilter]);

  // Trigger Leaflet invalidateSize safely
  const triggerInvalidateSize = useCallback(() => {
    if (mapInstance) {
      try {
        mapInstance.invalidateSize();
      } catch (e) {
        // Safe catch
      }
    }
  }, [mapInstance]);

  // 1. Initialize Leaflet Map Instance once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // McMurdo area (-77.85°, 166.66°) or Svalbard (78.92°, 11.93°)
    const [initialLat, initialLng] = region === 'antarctica' 
      ? safeMercatorLatLng(-77.85, 166.66)
      : safeMercatorLatLng(78.92, 11.93);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 4,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer (ESRI World Imagery by default)
    const initialTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri World Imagery</a> | Earthstar, USGS, NASA Polar Data',
      noWrap: false,
    }).addTo(map);
    currentTileLayerRef.current = initialTile;

    // Create data layers (Heatmap sits beneath markers)
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    userGpsMarkerRef.current = L.layerGroup().addTo(map);

    // Auto-disable follow mode when operator manually pans/drags the map
    map.on('dragstart', () => {
      setFollowMode(false);
    });

    // Map Click Listener to Set Waypoint / Establish Base
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      const targetEl = e.originalEvent?.target as HTMLElement | null;
      if (targetEl && (targetEl.closest('.leaflet-marker-icon') || targetEl.closest('.leaflet-popup'))) {
        return;
      }
      
      const popupContent = `
        <div style="font-family: ui-monospace, monospace; padding: 4px; color: #0f172a; min-width: 210px;">
          <div style="font-weight: 800; font-size: 11px; color: #0284c7; margin-bottom: 3px; display:flex; align-items:center; gap:4px;">
            <span>📍 POLAR GEOSPATIAL COORDINATES</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            Lat: <strong>${clickLat.toFixed(4)}°</strong><br/>
            Lng: <strong>${clickLng.toFixed(4)}°</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button id="map-quick-add-wp-btn" style="
              width: 100%;
              background: #d97706;
              color: #ffffff;
              border: none;
              padding: 6px 8px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 11px;
              font-family: ui-monospace, monospace;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            ">
              <span>📍</span> + SET WAYPOINT HERE
            </button>
            <button id="map-quick-add-base-btn" style="
              width: 100%;
              background: #0284c7;
              color: #ffffff;
              border: none;
              padding: 6px 8px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 11px;
              font-family: ui-monospace, monospace;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            ">
              <span>🏢</span> + ESTABLISH BASE HERE
            </button>
          </div>
        </div>
      `;

      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);

      setTimeout(() => {
        const wpBtn = document.getElementById('map-quick-add-wp-btn');
        const baseBtn = document.getElementById('map-quick-add-base-btn');

        if (wpBtn) {
          wpBtn.onclick = () => {
            map.closePopup();
            if (onOpenAddWaypointWithCoords) {
              onOpenAddWaypointWithCoords(clickLat, clickLng);
            } else if (onAddWaypoint) {
              onAddWaypoint({
                id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: `Map Fix (${clickLat.toFixed(2)}°, ${clickLng.toFixed(2)}°)`,
                lat: Number(clickLat.toFixed(4)),
                lng: Number(clickLng.toFixed(4)),
                elevationM: 1800,
                distanceFromPrevKm: 35,
                passed: false,
              });
            } else if (onOpenAddWaypoint) {
              onOpenAddWaypoint();
            }
          };
        }

        if (baseBtn) {
          baseBtn.onclick = () => {
            map.closePopup();
            if (onOpenAddBaseWithCoords) {
              onOpenAddBaseWithCoords(clickLat, clickLng);
            } else if (onOpenAddBase) {
              onOpenAddBase();
            }
          };
        }
      }, 100);
    });

    setMapInstance(map);

    // Staged size invalidations to ensure proper tile loading across layout renders
    const timer1 = setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 150);
    const timer2 = setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      try {
        map.remove();
      } catch (e) {}
      setMapInstance(null);
    };
  }, []); // Run once on mount

  // 2. Fly to region center when region changes
  useEffect(() => {
    if (!mapInstance) return;
    const [centerLat, centerLng] = region === 'antarctica'
      ? safeMercatorLatLng(-77.85, 166.66)
      : safeMercatorLatLng(78.92, 11.93);
    mapInstance.flyTo([centerLat, centerLng], 4, { duration: 1.0 });
  }, [region, mapInstance]);

  // 3. ResizeObserver to keep tiles sharp upon container dimension updates
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstance) return;

    const observer = new ResizeObserver(() => {
      triggerInvalidateSize();
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [mapInstance, triggerInvalidateSize]);

  // 4. Tile Layer switcher
  useEffect(() => {
    if (!mapInstance) return;

    if (currentTileLayerRef.current) {
      try {
        mapInstance.removeLayer(currentTileLayerRef.current);
      } catch (e) {}
      currentTileLayerRef.current = null;
    }

    let tileUrl = '';
    let attribution = '';
    let maxZoom = 19;
    let subdomains: string[] | string = 'abc';

    if (mapType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri World Imagery</a> | Earthstar, USGS, NASA Polar Data';
    } else if (mapType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; OpenStreetMap contributors';
      subdomains = 'abcd';
    } else if (mapType === 'terrain') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; <a href="https://www.esri.com">Esri Topo</a>, DeLorme, USGS, NPS';
    } else if (mapType === 'google_hybrid' && googleMapsApiKey) {
      tileUrl = `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${encodeURIComponent(googleMapsApiKey)}`;
      attribution = '&copy; <a href="https://maps.google.com">Google Maps Platform</a> Imagery';
      maxZoom = 20;
    } else {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
      subdomains = 'abcd';
    }

    try {
      const newLayer = L.tileLayer(tileUrl, {
        maxZoom,
        attribution,
        subdomains,
        noWrap: false,
      }).addTo(mapInstance);

      currentTileLayerRef.current = newLayer;
      triggerInvalidateSize();
    } catch (err) {
      console.warn('Failed to attach tile layer:', err);
    }
  }, [mapInstance, mapType, googleMapsApiKey, triggerInvalidateSize]);

  // 5. Sync Focus Coordinates
  useEffect(() => {
    if (!mapInstance || !focusCoords) return;

    if (typeof focusCoords.lat === 'number' && typeof focusCoords.lng === 'number') {
      const [safeLat, safeLng] = safeMercatorLatLng(focusCoords.lat, focusCoords.lng);
      mapInstance.flyTo([safeLat, safeLng], Math.max(mapInstance.getZoom(), 7), {
        duration: 1.2,
      });
    }
  }, [focusCoords, mapInstance]);

  // 5.5. Auto-Center / Follow Mode Camera Tracking Effect
  useEffect(() => {
    if (!followMode || !mapInstance) return;

    // Find active expedition or primary asset
    const activeExp = expeditions.find(e => e.phase === 'in_progress' || e.phase === 'active' || e.status === 'active') || expeditions[0];
    if (activeExp && typeof activeExp.currentLat === 'number' && typeof activeExp.currentLng === 'number') {
      const [safeLat, safeLng] = safeMercatorLatLng(activeExp.currentLat, activeExp.currentLng);
      mapInstance.panTo([safeLat, safeLng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [followMode, expeditions, mapInstance]);

  // 6. Draw All Polar Entities (Stations, Expeditions, Assets, Hazards, Distress Beacon)
  useEffect(() => {
    if (!mapInstance) return;
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // 1. Research Stations
    stations.forEach((st) => {
      const [safeLat, safeLng] = safeMercatorLatLng(st.lat, st.lng);
      const weather = stationWeather?.[st.id];

      const markerHtml = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: ${weather?.isKatabaticStorm ? '#b91c1c' : '#0284c7'};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 12px ${weather?.isKatabaticStorm ? 'rgba(185,28,28,0.9)' : 'rgba(2,132,199,0.9)'};
            color: #ffffff;
            font-weight: bold;
            font-size: 10px;
            font-family: monospace;
          ">
            ${st.code.slice(0, 3)}
          </div>
          ${weather ? `
            <div style="
              background: ${weather.isKatabaticStorm ? '#7f1d1d' : 'rgba(15, 23, 42, 0.92)'};
              color: #e0f2fe;
              font-family: monospace;
              font-size: 9px;
              font-weight: bold;
              padding: 1px 4px;
              border-radius: 3px;
              margin-top: 2px;
              white-space: nowrap;
              border: 1px solid ${weather.isKatabaticStorm ? '#ef4444' : '#0284c7'};
            ">
              ${weather.tempC}°C • ${weather.windSpeedKts}kt
            </div>
          ` : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-station-pin',
        iconSize: [60, 48],
        iconAnchor: [30, 14],
      });

      const marker = L.marker([safeLat, safeLng], { icon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 240px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0369a1; margin-bottom: 2px;">${st.name}</div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 6px;">[${st.code}] • ${st.country}</div>
          
          ${weather ? `
            <div style="margin-bottom: 8px; padding: 6px; background: #0f172a; color: #f8fafc; border-radius: 6px; border: 1px solid #0284c7;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10.5px; margin-bottom: 4px;">
                <span style="color: #38bdf8;">LIVE AWOS SENSOR</span>
                <span style="color: #4ade80;">REAL-TIME</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; font-family: monospace;">
                <div>Air Temp: <strong style="color: #7dd3fc;">${weather.tempC}°C</strong></div>
                <div>Windchill: <strong style="color: #38bdf8;">${weather.apparentTempC}°C</strong></div>
                <div>Wind: <strong style="color: #fbbf24;">${weather.windSpeedKts} kts</strong></div>
                <div>Dir: <strong style="color: #f1f5f9;">${weather.windDirectionCardinal}</strong></div>
                <div>Baro: <strong>${weather.pressureHpa} hPa</strong></div>
                <div>Visibility: <strong>${weather.visibilityKm} km</strong></div>
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                ${weather.weatherDescription} • Freeze risk: <strong style="color: ${weather.frostbiteRiskLevel === 'Extreme' ? '#f87171' : '#fde047'}">${weather.frostbiteRiskTime}</strong>
              </div>
            </div>
          ` : ''}

          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Position:</strong> ${st.lat.toFixed(4)}°, ${st.lng.toFixed(4)}° (${st.elevationM}m AMSL)</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Personnel:</strong> ${st.winterPopulation} Winter / ${st.summerPopulation} Summer</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Runway:</strong> ${st.runwayType}</div>
          <div style="font-size: 11px; margin-bottom: 6px;"><strong>Fuel Reserve:</strong> ${(st.fuelReserveL / 1000).toFixed(0)}k Liters</div>
          <div style="font-size: 10px; background: #f1f5f9; padding: 4px 6px; border-radius: 4px; color: #0369a1; font-weight: bold;">
            STATUS: POWER ${st.powerStatus.toUpperCase()}
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(st);
      });

      layerGroup.addLayer(marker);
    });

    // 2. Active Expeditions and Waypoint Tracks with Traveled/Remaining Tracing
    expeditions.forEach((exp) => {
      // Evaluate live waypoint progress, sequential ETAs, and split paths
      const progress = evaluateWaypointProgress(
        exp.currentLat,
        exp.currentLng,
        exp.waypoints || [],
        arrivalRadiusKm
      );

      // Auto-trigger waypoint arrival callback if newly reached
      if (progress.newlyReachedWaypoint && onUpdateWaypoint) {
        onUpdateWaypoint(progress.newlyReachedWaypoint, exp.id);
      }

      // 2a. Actual Traveled Track History (GPS Breadcrumbs from telemetry/simulation)
      if (showGpsTrack && exp.actualTrack && exp.actualTrack.length > 1) {
        const actualLatLngs: [number, number][] = exp.actualTrack.map((pt) => safeMercatorLatLng(pt.lat, pt.lng));
        const actualTrackLine = L.polyline(actualLatLngs, {
          color: '#f59e0b',
          weight: 2.5,
          dashArray: '3, 4',
          opacity: 0.85,
        });
        actualTrackLine.bindTooltip(`Actual GPS Breadcrumbs: ${exp.name} (${exp.actualTrack.length} fixes)`, {
          sticky: true,
        });
        layerGroup.addLayer(actualTrackLine);
      }

      // 2b. Traveled / Completed Route Polyline (Solid Emerald / Cyan with glow)
      if (progress.traveledPathCoords.length > 1) {
        const safeTraveled: [number, number][] = progress.traveledPathCoords.map(([lat, lng]) => safeMercatorLatLng(lat, lng));
        // Glow underlayer
        const glowLine = L.polyline(safeTraveled, {
          color: '#059669',
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
        });
        layerGroup.addLayer(glowLine);

        // Core solid line
        const traveledLine = L.polyline(safeTraveled, {
          color: '#10b981',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
        });
        traveledLine.bindTooltip(`Traveled Route: ${exp.name}`, { sticky: true });
        layerGroup.addLayer(traveledLine);
      }

      // 2c. Remaining Planned Route Polyline (Dashed Sky / Amber)
      if (progress.remainingPathCoords.length > 1) {
        const safeRemaining: [number, number][] = progress.remainingPathCoords.map(([lat, lng]) => safeMercatorLatLng(lat, lng));
        const remainingLine = L.polyline(safeRemaining, {
          color: exp.phase === 'emergency_extraction' ? '#f43f5e' : '#38bdf8',
          weight: 3.5,
          dashArray: '8, 8',
          opacity: 0.85,
        });
        remainingLine.bindTooltip(`Remaining Path: ${exp.name}`, { sticky: true });
        layerGroup.addLayer(remainingLine);
      }

      // 2d. Gemini AI Proposed Route Polyline (Glowing Violet Dashed with comparative badge markers)
      if (
        activeProposedRoute &&
        activeProposedRoute.orderedWaypoints &&
        activeProposedRoute.orderedWaypoints.length > 1
      ) {
        const proposedLatLngs: [number, number][] = activeProposedRoute.orderedWaypoints.map((wp) =>
          safeMercatorLatLng(wp.lat, wp.lng)
        );

        // Violet outer glow
        const proposedGlow = L.polyline(proposedLatLngs, {
          color: '#a855f7',
          weight: 8,
          opacity: 0.4,
          lineCap: 'round',
        });
        layerGroup.addLayer(proposedGlow);

        // Violet core dashed line
        const proposedLine = L.polyline(proposedLatLngs, {
          color: '#c084fc',
          weight: 4.5,
          dashArray: '6, 6',
          opacity: 0.95,
          lineCap: 'round',
        });
        proposedLine.bindTooltip(
          `<b>🤖 PROPOSED AI ROUTE: ${activeProposedRoute.estimatedDistanceKm} km</b><br/>Risk: ${activeProposedRoute.riskLevel} (${activeProposedRoute.mode === 'gemini_ai_live' ? 'Gemini 3.8 Flash' : activeProposedRoute.mode === 'gemini_ai_cached' ? 'AI Cached' : 'Deterministic Heuristic'})<br/><i>Click "Accept & Apply" in panel to make active</i>`,
          { sticky: true }
        );
        layerGroup.addLayer(proposedLine);
      }

      // Render Numbered Waypoints along the convoy track
      progress.enrichedWaypoints.forEach((wp, wpIdx) => {
        const [wpLat, wpLng] = safeMercatorLatLng(wp.lat, wp.lng);
        const isCurrent = wp.status === 'current';
        const isCompleted = wp.status === 'completed';
        const seq = wp.sequence ?? (wpIdx + 1);
        const proposedIdx = activeProposedRoute ? activeProposedRoute.recommendedOrder.indexOf(wp.id) : -1;

        // Active waypoint arrival radius geofence ring
        if (isCurrent) {
          const arrivalRing = L.circle([wpLat, wpLng], {
            radius: (wp.arrivalRadiusKm || arrivalRadiusKm) * 1000,
            color: '#38bdf8',
            fillColor: '#0284c7',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 4',
          });
          arrivalRing.bindTooltip(`Arrival Radius: ${wp.arrivalRadiusKm || arrivalRadiusKm} km`, { sticky: true });
          layerGroup.addLayer(arrivalRing);
        }

        const bgColor = isCompleted ? '#10b981' : isCurrent ? '#0284c7' : '#0f172a';
        const borderColor = isCompleted ? '#059669' : isCurrent ? '#38bdf8' : wp.hazardNote ? '#f59e0b' : '#64748b';

        const wpPinHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            ${isCurrent ? `
              <div style="
                position: absolute;
                width: 32px;
                height: 32px;
                top: -3px;
                left: 24px;
                border-radius: 50%;
                background: rgba(56, 189, 248, 0.3);
                border: 1.5px solid #38bdf8;
                box-shadow: 0 0 14px rgba(56, 189, 248, 0.9);
              "></div>
            ` : ''}

            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              background: ${bgColor};
              border: 2px solid ${borderColor};
              border-radius: 50%;
              box-shadow: 0 2px 10px rgba(0,0,0,0.6);
              color: #ffffff;
              font-family: monospace;
              font-weight: 900;
              font-size: ${isCompleted ? '13px' : '11px'};
              z-index: 10;
            ">
              ${isCompleted ? '✓' : seq}

              ${proposedIdx !== -1 ? `
                <div style="
                  position: absolute;
                  top: -8px;
                  right: -10px;
                  background: #7c3aed;
                  border: 1.5px solid #e9d5ff;
                  border-radius: 999px;
                  padding: 1px 4px;
                  font-size: 8px;
                  font-weight: 900;
                  color: #ffffff;
                  white-space: nowrap;
                  box-shadow: 0 0 8px rgba(124, 58, 237, 0.9);
                  z-index: 25;
                ">
                  AI#${proposedIdx + 1}
                </div>
              ` : ''}
            </div>

            ${showWaypointLabels ? `
              <div style="
                margin-top: 2px;
                background: rgba(15, 23, 42, 0.94);
                border: 1px solid ${isCurrent ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'};
                border-radius: 4px;
                padding: 1px 5px;
                white-space: nowrap;
                font-family: monospace;
                font-size: 9.5px;
                font-weight: 700;
                color: ${isCurrent ? '#38bdf8' : isCompleted ? '#4ade80' : '#cbd5e1'};
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                pointer-events: none;
              ">
                ${wp.name || `WP-${seq}`}
              </div>
            ` : ''}
          </div>
        `;

        const wpIcon = L.divIcon({
          html: wpPinHtml,
          className: `custom-tactical-waypoint-marker wp-seq-${seq}`,
          iconSize: [80, 52],
          iconAnchor: [40, 13],
        });

        const wpMarker = L.marker([wpLat, wpLng], { icon: wpIcon });

        wpMarker.bindPopup(`
          <div style="font-family: ui-monospace, monospace; min-width: 260px; color: #0f172a; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div>
                <div style="font-weight: 900; font-size: 13px; color: #0284c7;">
                  WP-${String(seq).padStart(2, '0')}: ${wp.name}
                </div>
                <div style="font-size: 10px; color: #64748b;">
                  CONVOY: ${exp.name} (${exp.code})
                </div>
              </div>
              <span style="
                font-size: 9px;
                font-weight: 800;
                padding: 2px 6px;
                border-radius: 4px;
                background: ${isCompleted ? '#dcfce7' : isCurrent ? '#e0f2fe' : '#f1f5f9'};
                color: ${isCompleted ? '#15803d' : isCurrent ? '#0369a1' : '#475569'};
                border: 1px solid ${isCompleted ? '#86efac' : isCurrent ? '#7dd3fc' : '#cbd5e1'};
              ">
                ${(wp.status || 'pending').toUpperCase()}
              </span>
            </div>

            <div style="background: #0f172a; color: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; font-size: 11px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div>Coords: <strong style="color: #38bdf8;">${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}°</strong></div>
                <div>Elevation: <strong style="color: #7dd3fc;">${wp.elevationM || 0}m</strong></div>
                <div>Distance: <strong style="color: #fbbf24;">${wp.distanceFromCurrentKm !== undefined ? formatDistanceKm(wp.distanceFromCurrentKm) : 'N/A'}</strong></div>
                <div>ETA: <strong style="color: #4ade80;">${wp.eta || 'Calculating...'}</strong></div>
              </div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #334155; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                <span>Sequence: <strong>${seq} / ${progress.enrichedWaypoints.length}</strong></span>
                <span>Arrival Radius: <strong>${wp.arrivalRadiusKm || arrivalRadiusKm} km</strong></span>
              </div>
            </div>

            ${wp.hazardNote ? `
              <div style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px; border: 1px solid #fde68a;">
                ⚠️ <strong>HAZARD NOTE:</strong> ${wp.hazardNote}
              </div>
            ` : ''}

            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              <div style="display: flex; gap: 4px;">
                <button id="toggle-active-wp-${wp.id}" style="flex: 1; background: ${isCurrent ? '#64748b' : '#0284c7'}; color: #ffffff; border: none; padding: 5px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
                  ${isCurrent ? '● Active Target' : '🎯 Target This'}
                </button>
                <button id="toggle-complete-wp-${wp.id}" style="flex: 1; background: ${isCompleted ? '#d97706' : '#059669'}; color: #ffffff; border: none; padding: 5px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
                  ${isCompleted ? 'Mark Pending' : '✓ Mark Done'}
                </button>
              </div>
              <div style="display: flex; gap: 4px;">
                <button id="move-up-wp-${wp.id}" style="flex: 1; background: #334155; color: #ffffff; border: none; padding: 4px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; cursor: pointer;">
                  ▲ Move Up
                </button>
                <button id="move-down-wp-${wp.id}" style="flex: 1; background: #334155; color: #ffffff; border: none; padding: 4px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; cursor: pointer;">
                  ▼ Move Down
                </button>
                <button id="delete-wp-${wp.id}" style="background: #e11d48; color: #ffffff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 9.5px; font-weight: bold; cursor: pointer;">
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        `);

        wpMarker.on('popupopen', () => {
          const activeBtn = document.getElementById(`toggle-active-wp-${wp.id}`);
          const completeBtn = document.getElementById(`toggle-complete-wp-${wp.id}`);
          const upBtn = document.getElementById(`move-up-wp-${wp.id}`);
          const downBtn = document.getElementById(`move-down-wp-${wp.id}`);
          const deleteBtn = document.getElementById(`delete-wp-${wp.id}`);

          if (activeBtn && onUpdateWaypoint) {
            activeBtn.onclick = () => {
              onUpdateWaypoint({ ...wp, status: 'current', passed: false }, exp.id);
              mapInstance?.closePopup();
            };
          }

          if (completeBtn && onUpdateWaypoint) {
            completeBtn.onclick = () => {
              const nextStatus = isCompleted ? 'pending' : 'completed';
              onUpdateWaypoint({ ...wp, status: nextStatus, passed: !isCompleted }, exp.id);
              mapInstance?.closePopup();
            };
          }

          if (upBtn && onUpdateWaypoint && wpIdx > 0) {
            upBtn.onclick = () => {
              const prevWp = progress.enrichedWaypoints[wpIdx - 1];
              const curSeq = wp.sequence ?? (wpIdx + 1);
              const prevSeq = prevWp.sequence ?? wpIdx;
              onUpdateWaypoint({ ...wp, sequence: prevSeq }, exp.id);
              onUpdateWaypoint({ ...prevWp, sequence: curSeq }, exp.id);
              mapInstance?.closePopup();
            };
          }

          if (downBtn && onUpdateWaypoint && wpIdx < progress.enrichedWaypoints.length - 1) {
            downBtn.onclick = () => {
              const nextWp = progress.enrichedWaypoints[wpIdx + 1];
              const curSeq = wp.sequence ?? (wpIdx + 1);
              const nextSeq = nextWp.sequence ?? (wpIdx + 2);
              onUpdateWaypoint({ ...wp, sequence: nextSeq }, exp.id);
              onUpdateWaypoint({ ...nextWp, sequence: curSeq }, exp.id);
              mapInstance?.closePopup();
            };
          }

          if (deleteBtn && onDeleteWaypoint) {
            deleteBtn.onclick = () => {
              onDeleteWaypoint(wp.id, exp.id);
              mapInstance?.closePopup();
            };
          }
        });

        layerGroup.addLayer(wpMarker);
      });

      const [headLat, headLng] = safeMercatorLatLng(exp.currentLat, exp.currentLng);
      const isEmergency = exp.phase === 'emergency_extraction';
      const wLive = expeditionWeather?.[exp.id];

      const convoyHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: ${isEmergency ? '#e11d48' : '#d97706'};
          border: 2px solid #ffffff;
          border-radius: 6px;
          box-shadow: 0 0 14px ${isEmergency ? 'rgba(225,29,72,0.9)' : 'rgba(217,119,6,0.9)'};
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          font-family: monospace;
          cursor: pointer;
        ">
          ${exp.code.slice(0, 4)}
        </div>
      `;

      const convoyIcon = L.divIcon({
        html: convoyHtml,
        className: 'custom-convoy-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const convoyMarker = L.marker([headLat, headLng], { icon: convoyIcon });
      convoyMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 240px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #b45309; margin-bottom: 2px;">${exp.name}</div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 6px;">[${exp.code}] • Leader: ${exp.leader}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Current GPS:</strong> ${exp.currentLat.toFixed(4)}°, ${exp.currentLng.toFixed(4)}°</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Progress:</strong> ${exp.distanceCoveredKm} / ${exp.totalDistanceKm} km (${Math.round((exp.distanceCoveredKm / Math.max(exp.totalDistanceKm, 1)) * 100)}%)</div>
          
          ${wLive ? `
            <div style="margin-bottom: 6px; padding: 4px 6px; background: #0f172a; color: #f8fafc; border-radius: 4px; font-size: 11px; font-family: monospace;">
              <span style="color: #fbbf24;">FIELD AWOS:</span> <strong>${wLive.tempC}°C</strong> (Windchill: <strong>${wLive.apparentTempC}°C</strong>, Wind: <strong>${wLive.windSpeedKts} kts</strong>)
            </div>
          ` : `
            <div style="font-size: 11px; margin-bottom: 3px;"><strong>Weather:</strong> ${exp.currentWeather.tempC}°C (Wind: ${exp.currentWeather.windKnots} kts)</div>
          `}
          
          <div style="font-size: 11px; margin-bottom: 6px;"><strong>Rations Remaining:</strong> ${exp.rationsDaysRemaining} Days</div>
          <div style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 4px 6px; border-radius: 4px; font-weight: bold;">
            PHASE: ${exp.phase.toUpperCase().replace('_', ' ')}
          </div>
        </div>
      `);

      convoyMarker.on('click', () => {
        if (onSelectExpedition) onSelectExpedition(exp);
      });

      layerGroup.addLayer(convoyMarker);
    });

    // 3. Polar Assets (Snowcats, Twin Otters, LC-130s, Rigs)
    assets.forEach((asset) => {
      const [safeLat, safeLng] = safeMercatorLatLng(asset.currentLocation.lat, asset.currentLocation.lng);
      const isAir = asset.category === 'aviation';
      const isEmergency = asset.category === 'emergency_sar';

      const assetHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: ${isEmergency ? '#e11d48' : isAir ? '#059669' : '#475569'};
          border: 1.5px solid #ffffff;
          border-radius: ${isAir ? '50%' : '4px'};
          box-shadow: 0 0 8px rgba(0,0,0,0.6);
          color: #ffffff;
          font-weight: bold;
          font-size: 9px;
          font-family: monospace;
          cursor: pointer;
        ">
          ${asset.code.slice(0, 3)}
        </div>
      `;

      const assetIcon = L.divIcon({
        html: assetHtml,
        className: 'custom-asset-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const assetMarker = L.marker([safeLat, safeLng], { icon: assetIcon });
      assetMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${asset.name}</div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 6px;">[${asset.code}] • ${asset.model}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Location:</strong> ${asset.currentLocation.name}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Coordinates:</strong> ${asset.currentLocation.lat.toFixed(4)}°, ${asset.currentLocation.lng.toFixed(4)}°</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Energy / Fuel:</strong> ${asset.fuelOrBatteryPercent}% (${asset.fuelType})</div>
          <div style="font-size: 11px; margin-bottom: 6px;"><strong>Cold Rating:</strong> ${asset.coldRatingC}°C</div>
          <div style="font-size: 10px; background: #ecfdf5; color: #065f46; padding: 4px 6px; border-radius: 4px; font-weight: bold;">
            STATUS: ${asset.status.toUpperCase()}
          </div>
        </div>
      `);

      assetMarker.on('click', () => {
        if (onSelectAsset) onSelectAsset(asset);
      });

      layerGroup.addLayer(assetMarker);
    });

    // 4. Crevasse Fields & Katabatic Zones (Hazards)
    hazards.forEach((hz) => {
      const [safeLat, safeLng] = safeMercatorLatLng(hz.lat, hz.lng);
      const circle = L.circle([safeLat, safeLng], {
        radius: (hz.radiusKm || 15) * 1000,
        color: hz.dangerLevel === 'extreme' ? '#e11d48' : '#f97316',
        fillColor: hz.dangerLevel === 'extreme' ? '#e11d48' : '#f97316',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '4, 4',
      });

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 800; font-size: 12px; color: #e11d48; margin-bottom: 2px;">⚠️ ${hz.name}</div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 6px;">TYPE: ${hz.type.toUpperCase().replace('_', ' ')} • RADIUS: ${hz.radiusKm}km</div>
          <div style="font-size: 11px; margin-bottom: 6px;">${hz.notes}</div>
          <div style="font-size: 10px; background: #ffe4e6; color: #9f1239; padding: 4px 6px; border-radius: 4px; font-weight: bold;">
            THREAT LEVEL: ${hz.dangerLevel.toUpperCase()}
          </div>
        </div>
      `);

      layerGroup.addLayer(circle);
    });

    // 5. Active Distress Alert Emergency Beacon Pin
    if (activeDistress && activeDistress.active) {
      let rawDistressLat = -85.25;
      let rawDistressLng = 151.10;

      if (activeDistress.targetLat && activeDistress.targetLng) {
        rawDistressLat = activeDistress.targetLat;
        rawDistressLng = activeDistress.targetLng;
      } else if (activeDistress.coordinates) {
        const parts = activeDistress.coordinates.split(',').map((p) => parseFloat(p.trim()));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
          rawDistressLat = parts[0];
          rawDistressLng = parts[1];
        }
      }

      const [safeDistressLat, safeDistressLng] = safeMercatorLatLng(rawDistressLat, rawDistressLng);

      const distressHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #e11d48;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(225,29,72,1);
          color: #ffffff;
          font-weight: 900;
          font-size: 11px;
        ">
          SOS
        </div>
      `;

      const distressIcon = L.divIcon({
        html: distressHtml,
        className: 'custom-distress-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const distressMarker = L.marker([safeDistressLat, safeDistressLng], { icon: distressIcon });
      distressMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 250px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 900; font-size: 14px; color: #e11d48; margin-bottom: 2px;">🚨 ACTIVE POLAR MAYDAY DISTRESS</div>
          <div style="font-size: 11px; color: #475569; font-weight: bold; margin-bottom: 4px;">${activeDistress.incidentType}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Sector:</strong> ${activeDistress.location}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Coordinates:</strong> ${safeDistressLat.toFixed(5)}°, ${safeDistressLng.toFixed(5)}°</div>
          <div style="font-size: 11px; margin-bottom: 6px;"><strong>Summary:</strong> ${activeDistress.summary}</div>
          <div style="font-size: 10px; background: #fee2e2; color: #991b1b; padding: 4px 6px; border-radius: 4px; font-weight: bold;">
            ${activeDistress.acknowledgedByHQ ? `ACKNOWLEDGED (SAR DISPATCHED: ${activeDistress.dispatchedSARName || 'En Route'})` : 'AWAITING RESCUE DISPATCH'}
          </div>
        </div>
      `);

      layerGroup.addLayer(distressMarker);
    }

    // 7. Custom Tactical Waypoints / Ground Fixes
    if (customWaypoints && customWaypoints.length > 0) {
      customWaypoints.forEach((cwp) => {
        const [cLat, cLng] = safeMercatorLatLng(cwp.lat, cwp.lng);
        const cwpIcon = L.divIcon({
          html: `
            <div style="
              width: 22px;
              height: 22px;
              background: #d97706;
              border: 2px solid #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(217,119,6,0.85);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 900;
              font-size: 11px;
            ">
              ▲
            </div>
          `,
          className: 'custom-tactical-waypoint-pin',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const cwpMarker = L.marker([cLat, cLng], { icon: cwpIcon });
        cwpMarker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 190px; color: #0f172a; padding: 2px;">
            <div style="font-weight: 800; font-size: 12px; color: #b45309; margin-bottom: 2px;">🧭 TACTICAL FIX: ${cwp.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Standalone Navigation Landmark</div>
            <div style="font-size: 11px;"><strong>Coordinates:</strong> ${cwp.lat.toFixed(4)}°, ${cwp.lng.toFixed(4)}°</div>
            <div style="font-size: 11px; margin-bottom: 4px;"><strong>Elevation:</strong> ${cwp.elevationM}m</div>
            ${cwp.hazardNote ? `<div style="font-size: 10px; margin-bottom: 6px; background: #fef3c7; color: #92400e; padding: 3px 5px; border-radius: 4px;">⚠️ ${cwp.hazardNote}</div>` : ''}
            <button id="delete-cwp-${cwp.id}" style="width: 100%; background: #e11d48; color: #ffffff; border: none; padding: 6px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; margin-top: 4px;">
              🗑 DELETE WAYPOINT
            </button>
          </div>
        `);

        cwpMarker.on('popupopen', () => {
          const deleteBtn = document.getElementById(`delete-cwp-${cwp.id}`);
          if (deleteBtn && onDeleteWaypoint) {
            deleteBtn.onclick = () => {
              onDeleteWaypoint(cwp.id);
              mapInstance?.closePopup();
            };
          }
        });
        layerGroup.addLayer(cwpMarker);
      });
    }
  }, [mapInstance, stations, assets, expeditions, hazards, activeDistress, region, customWaypoints, onSelectStation, onSelectAsset, onSelectExpedition, showGpsTrack, arrivalRadiusKm, showWaypointLabels, onUpdateWaypoint, onDeleteWaypoint, activeProposedRoute]);

  // 6.5. Draw Sub-Zero Danger Zones Heatmap Overlay
  useEffect(() => {
    if (!mapInstance) return;
    const heatGroup = heatmapLayerGroupRef.current;
    if (!heatGroup) return;

    heatGroup.clearLayers();

    if (!isHeatmapActive) return;

    dangerZones.forEach((zone) => {
      const [safeLat, safeLng] = safeMercatorLatLng(zone.lat, zone.lng);
      const isLethal = zone.severityLevel === 'LETHAL';
      const isExtreme = zone.severityLevel === 'EXTREME';

      // 1. Outermost thermal diffusion halo
      const outerRing = L.circle([safeLat, safeLng], {
        radius: zone.radiusKm * 1000,
        fillColor: isLethal ? '#881337' : isExtreme ? '#312e81' : '#083344',
        fillOpacity: 0.16,
        stroke: false,
        interactive: false,
      });
      heatGroup.addLayer(outerRing);

      // 2. Mid-hazard isothermal gradient
      const midRing = L.circle([safeLat, safeLng], {
        radius: zone.radiusKm * 600,
        fillColor: isLethal ? '#e11d48' : isExtreme ? '#4f46e5' : '#0284c7',
        fillOpacity: 0.26,
        stroke: false,
        interactive: false,
      });
      heatGroup.addLayer(midRing);

      // 3. Core cryogenic threshold perimeter
      const coreRing = L.circle([safeLat, safeLng], {
        radius: zone.radiusKm * 300,
        fillColor: isLethal ? '#9f1239' : isExtreme ? '#6366f1' : '#06b6d4',
        fillOpacity: 0.42,
        color: isLethal ? '#f43f5e' : isExtreme ? '#818cf8' : '#38bdf8',
        weight: 2,
        dashArray: isLethal ? '4, 4' : '3, 3',
      });

      // Pin badge HTML
      const badgeHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; pointer-events:auto;">
          <div style="
            background: ${isLethal ? 'rgba(159,18,57,0.95)' : isExtreme ? 'rgba(49,46,129,0.95)' : 'rgba(8,51,68,0.95)'};
            border: 2px solid ${isLethal ? '#fda4af' : isExtreme ? '#818cf8' : '#38bdf8'};
            color: #ffffff;
            font-family: ui-monospace, monospace;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 6px;
            border-radius: 6px;
            box-shadow: 0 0 16px ${isLethal ? 'rgba(225,29,72,0.9)' : isExtreme ? 'rgba(79,70,229,0.8)' : 'rgba(2,132,199,0.7)'};
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>${isLethal ? '⚠️' : '❄️'}</span>
            <span>${zone.tempC}°C</span>
            <span style="
              background: ${isLethal ? '#e11d48' : isExtreme ? '#4f46e5' : '#0284c7'};
              color: #ffffff;
              font-size: 8.5px;
              padding: 1px 4px;
              border-radius: 3px;
            ">${zone.severityLevel}</span>
          </div>
          <div style="
            font-size: 8.5px;
            font-family: ui-monospace, monospace;
            color: ${isLethal ? '#fecdd3' : isExtreme ? '#c7d2fe' : '#bae6fd'};
            background: rgba(15, 23, 42, 0.85);
            padding: 1px 4px;
            border-radius: 2px;
            margin-top: 2px;
            border: 1px solid rgba(255,255,255,0.1);
          ">
            Wind: ${zone.windSpeedKts}kt • Feels ${zone.apparentTempC}°C
          </div>
        </div>
      `;

      const badgeIcon = L.divIcon({
        html: badgeHtml,
        className: 'danger-heatmap-pin',
        iconSize: [120, 36],
        iconAnchor: [60, 18],
      });

      const dangerMarker = L.marker([safeLat, safeLng], { icon: badgeIcon });

      const popupContent = `
        <div style="font-family: ui-monospace, monospace; min-width: 270px; color: #0f172a; padding: 4px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
            <span style="
              background: ${isLethal ? '#ffe4e6' : isExtreme ? '#e0e7ff' : '#e0f2fe'};
              color: ${isLethal ? '#9f1239' : isExtreme ? '#3730a3' : '#0369a1'};
              font-size: 9px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${isLethal ? '#f43f5e' : isExtreme ? '#6366f1' : '#0284c7'};
            ">
              SUB-ZERO DANGER ZONE // ${zone.severityLevel}
            </span>
            <span style="font-size: 10px; color: #64748b;">R: ${zone.radiusKm} km</span>
          </div>
          
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px;">${zone.name}</div>
          
          <div style="background: #0f172a; color: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 6px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span style="font-size: 18px; font-weight: 900; color: ${isLethal ? '#fb7185' : isExtreme ? '#a5b4fc' : '#38bdf8'};">
                ${zone.tempC}°C
              </span>
              <span style="font-size: 11px; color: #94a3b8;">
                Apparent Chill: <strong style="color:#ffffff;">${zone.apparentTempC}°C</strong>
              </span>
            </div>
            <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px; display:grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div>Wind: <strong>${zone.windSpeedKts} kts</strong></div>
              <div>Gusts: <strong>${zone.windGustsKts} kts</strong></div>
              <div>Pressure: <strong>${zone.pressureHpa} hPa</strong></div>
              <div>Rec. Min: <strong>${zone.historicalMinC}°C</strong></div>
            </div>
          </div>

          <div style="background: ${isLethal ? '#fff1f2' : '#f8fafc'}; border: 1px solid ${isLethal ? '#fecdd3' : '#e2e8f0'}; border-radius: 6px; padding: 6px; font-size: 10.5px; margin-bottom: 6px;">
            <div style="color: #be123c; font-weight: 800; margin-bottom: 2px;">⏱️ SURVIVAL TIME WINDOWS:</div>
            <div style="color: #334155;">• Unprotected Human Survival: <strong>< ${zone.survivalTimeMinutes} min</strong></div>
            <div style="color: #334155;">• Exposed Skin Frostbite: <strong>< ${zone.frostbiteTimeMinutes} min</strong></div>
            ${zone.fuelCloudPointHazard ? '<div style="color: #b91c1c; font-weight: 700; margin-top: 2px;">⚠️ Arctic Diesel Waxing / Cloud Point Warning</div>' : ''}
          </div>

          <div style="font-size: 10px; color: #475569; margin-bottom: 6px;">
            <strong>Advisory:</strong> ${zone.survivalAdvisory}
          </div>

          <div style="font-size: 9.5px; color: #64748b; background: #f1f5f9; padding: 4px; border-radius: 4px;">
            <strong>Equipment:</strong> ${zone.equipmentAdvisory}
          </div>
        </div>
      `;

      dangerMarker.bindPopup(popupContent);
      coreRing.bindPopup(popupContent);

      dangerMarker.on('click', () => {
        if (onSelectDangerZone) onSelectDangerZone(zone);
      });

      heatGroup.addLayer(coreRing);
      heatGroup.addLayer(dangerMarker);
    });
  }, [mapInstance, dangerZones, isHeatmapActive, onSelectDangerZone]);

  // 7. User Live GPS Pin
  useEffect(() => {
    if (!mapInstance) return;
    const userGroup = userGpsMarkerRef.current;
    if (!userGroup) return;

    userGroup.clearLayers();

    if (userLat !== null && userLng !== null) {
      const [safeLat, safeLng] = safeMercatorLatLng(userLat, userLng);

      const accCircle = L.circle([safeLat, safeLng], {
        radius: Math.max(userAccuracy || 10, 15),
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.2,
        weight: 1.5,
        dashArray: '4, 4',
      });
      userGroup.addLayer(accCircle);

      const weatherBadgeHtml = userLocationWeather ? `
        <div style="
          position: absolute;
          left: 36px;
          top: -2px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(4px);
          color: #38bdf8;
          border: 1px solid #0284c7;
          border-radius: 6px;
          padding: 3px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          pointer-events: none;
        ">
          <span style="color: #ffffff;">${userLocationWeather.tempC}°C</span>
          <span style="color: #94a3b8; margin: 0 4px;">•</span>
          <span style="color: #7dd3fc;">${userLocationWeather.windSpeedKts} kts</span>
        </div>
      ` : '';

      const gpsHtml = `
        <div style="position: relative;">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #0284c7;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 16px rgba(56,189,248,1);
            color: #ffffff;
          ">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          ${weatherBadgeHtml}
        </div>
      `;

      const gpsIcon = L.divIcon({
        html: gpsHtml,
        className: 'user-gps-live-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const weatherPopupSection = userLocationWeather ? `
        <div style="margin: 8px 0; padding: 8px; background: #082f49; color: #f0f9ff; border-radius: 6px; font-family: ui-monospace, monospace; border: 1px solid #0284c7;">
          <div style="font-size: 10px; color: #7dd3fc; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">REAL-TIME WEATHER AT THIS LOCATION</div>
          <div style="font-size: 14px; font-weight: 800; color: #38bdf8;">
            ${userLocationWeather.tempC}°C <span style="font-size: 11px; color: #bae6fd; font-weight: normal;">(Feels ${userLocationWeather.apparentTempC}°C)</span>
          </div>
          <div style="font-size: 11px; color: #e0f2fe; margin-top: 3px;"><strong>Condition:</strong> ${userLocationWeather.weatherDescription}</div>
          <div style="font-size: 11px; color: #e0f2fe;"><strong>Wind:</strong> ${userLocationWeather.windSpeedKts} kts (${userLocationWeather.windDirectionCardinal}) • Gusts: ${userLocationWeather.windGustsKts} kts</div>
          <div style="font-size: 10px; color: #93c5fd; margin-top: 3px;"><strong>Pressure:</strong> ${userLocationWeather.pressureHpa} hPa • <strong>Humidity:</strong> ${userLocationWeather.relativeHumidity}%</div>
          <div style="font-size: 10px; color: #86efac; margin-top: 3px;"><strong>Frostbite Safety:</strong> ${userLocationWeather.frostbiteRiskTime} (${userLocationWeather.frostbiteRiskLevel} Risk)</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Source: ${userLocationWeather.source}</div>
        </div>
      ` : '';

      const locationTitle = userLocationName || (userLocationWeather ? userLocationWeather.locationName : 'YOUR REAL-TIME POSITION');

      const userMarker = L.marker([safeLat, safeLng], { icon: gpsIcon });
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 250px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0284c7; margin-bottom: 2px;">📍 ${locationTitle.toUpperCase()}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Latitude:</strong> ${userLat.toFixed(6)}°</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Longitude:</strong> ${userLng.toFixed(6)}°</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Fix Precision:</strong> ${formattedAccuracy}</div>
          ${userAlt !== null ? `<div style="font-size: 11px; margin-bottom: 3px;"><strong>Altitude:</strong> ${Math.round(userAlt)}m AMSL</div>` : ''}
          ${userSpeed !== null ? `<div style="font-size: 11px; margin-bottom: 3px;"><strong>Ground Speed:</strong> ${(userSpeed * 3.6).toFixed(1)} km/h</div>` : ''}
          ${weatherPopupSection}
          <div style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 4px 6px; border-radius: 4px; font-weight: bold; margin-top: 4px;">
            ${isWatching ? 'CONTINUOUS SATELLITE LIVE TRACKING ACTIVE' : 'REAL-TIME LOCATION FIX ACTIVE'}
          </div>
        </div>
      `);

      userGroup.addLayer(userMarker);
    }
  }, [mapInstance, userLat, userLng, userAccuracy, userAlt, userSpeed, isWatching, formattedAccuracy, userLocationWeather, userLocationName]);

  // GPS Acquisition handler
  const handleAcquireAndFlyToGps = async () => {
    try {
      await onAcquireGps();
    } catch (e) {}
  };

  useEffect(() => {
    if (userLat !== null && userLng !== null && mapInstance) {
      const [safeLat, safeLng] = safeMercatorLatLng(userLat, userLng);
      mapInstance.flyTo([safeLat, safeLng], Math.max(mapInstance.getZoom(), 12), {
        duration: 1.2,
      });
    }
  }, [userLat, userLng, mapInstance]);

  // Quick jump presets with safe coordinates
  const handleFlyToSouthPole = () => {
    if (mapInstance) {
      const [safeLat, safeLng] = safeMercatorLatLng(-85.0, 0.0);
      mapInstance.flyTo([safeLat, safeLng], 5, { duration: 1.2 });
    }
  };

  const handleFlyToMcMurdo = () => {
    if (mapInstance) {
      const [safeLat, safeLng] = safeMercatorLatLng(-77.846, 166.668);
      mapInstance.flyTo([safeLat, safeLng], 7, { duration: 1.2 });
    }
  };

  const handleFlyToConcordia = () => {
    if (mapInstance) {
      const [safeLat, safeLng] = safeMercatorLatLng(-75.1, 123.33);
      mapInstance.flyTo([safeLat, safeLng], 7, { duration: 1.2 });
    }
  };

  const handleFlyToSvalbard = () => {
    if (mapInstance) {
      const [safeLat, safeLng] = safeMercatorLatLng(78.923, 11.928);
      mapInstance.flyTo([safeLat, safeLng], 6, { duration: 1.2 });
    }
  };

  const handleFitAllPoints = () => {
    if (!mapInstance) return;
    const points: [number, number][] = [];
    stations.forEach(s => points.push(safeMercatorLatLng(s.lat, s.lng)));
    expeditions.forEach(e => points.push(safeMercatorLatLng(e.currentLat, e.currentLng)));
    assets.forEach(a => points.push(safeMercatorLatLng(a.currentLocation.lat, a.currentLocation.lng)));

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  };

  // Helper for current active expedition route distance
  const currentExpedition = expeditions[0];
  const currentExpeditionDistanceKm = useMemo(() => {
    if (!currentExpedition || !currentExpedition.waypoints || currentExpedition.waypoints.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < currentExpedition.waypoints.length; i++) {
      const c = currentExpedition.waypoints[i];
      sum += c.distanceFromPrevKm || 0;
    }
    return Math.round(sum * 10) / 10;
  }, [currentExpedition]);

  // Run Gemini AI Waypoint Route Optimization
  const handleRunGeminiRouteOptimization = async () => {
    if (!currentExpedition || !currentExpedition.waypoints || currentExpedition.waypoints.length < 2) {
      setOptimizerError('At least 2 waypoints are required on active expedition for route optimization.');
      return;
    }

    setOptimizingRoute(true);
    setOptimizerError(null);

    const activeAsset = assets.find((a) => (currentExpedition.assignedAssetIds || []).includes(a.id)) || assets[0];

    const payload: WaypointOptimizationRequest = {
      waypoints: currentExpedition.waypoints,
      asset: activeAsset
        ? {
            id: activeAsset.id,
            name: activeAsset.name,
            lat: activeAsset.currentLocation.lat,
            lng: activeAsset.currentLocation.lng,
            speedKmh: activeAsset.telemetry?.speedKmh || 24.5,
            headingDeg: activeAsset.telemetry?.headingDeg || 0,
            vehicleType: activeAsset.type,
            fuelPercent: activeAsset.fuelLevelPercent,
            condition: activeAsset.condition,
          }
        : undefined,
      environment: {
        tempC: userLocationWeather?.tempC ?? (stationWeather && (Object.values(stationWeather)[0] as RealtimeWeatherReading | undefined)?.tempC) ?? -32,
        apparentTempC: userLocationWeather?.apparentTempC ?? -45,
        windSpeedKts: userLocationWeather?.windSpeedKts ?? 20,
        visibilityKm: userLocationWeather?.visibilityKm ?? 10,
        weatherDescription: userLocationWeather?.weatherDescription || 'Polar sub-zero traverse conditions',
        dangerZones: dangerZones.map((dz) => ({
          id: dz.id,
          name: dz.name,
          lat: dz.lat,
          lng: dz.lng,
          radiusKm: dz.radiusKm,
          severityLevel: dz.severityLevel,
        })),
        crevasses: [
          { id: 'CRV-01', name: 'Shear Crevasse C-104', lat: currentExpedition.currentLat - 0.15, lng: currentExpedition.currentLng + 0.12, dangerLevel: 'Critical' },
          { id: 'CRV-02', name: 'Stress Fracture F-88', lat: currentExpedition.currentLat - 0.35, lng: currentExpedition.currentLng + 0.28, dangerLevel: 'Severe' },
        ],
      },
      constraints: {
        mandatoryWaypointIds: currentExpedition.waypoints.filter((w) => w.isMandatory || w.priority === 'mandatory').map((w) => w.id),
        fuelLimitsKm: 450,
      },
      isSimulation,
    };

    try {
      emitAiActionBroadcast({
        category: 'logistics',
        message: `${isSimulation ? '[SIMULATION] ' : ''}Analyzing ${currentExpedition.waypoints.length} waypoints via Gemini 3.8 Flash AI...`,
        stationOrAsset: currentExpedition.name,
        impact: 'Hazard circumnavigation & sequence optimization',
      });

      const res = await fetch('/api/ai/waypoints/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'ok' && data.plan) {
        setLocalProposedRoute(data.plan);
        setShowProposedPanel(true);
        emitAiActionBroadcast({
          category: 'logistics',
          message: `${isSimulation ? '[SIMULATION] ' : ''}Gemini route proposed: ${data.plan.recommendedOrder.join(' → ')} (${data.plan.estimatedDistanceKm} km, Risk: ${data.plan.riskLevel}).`,
          stationOrAsset: currentExpedition.name,
          impact: `Pending operator approval. Mode: ${data.plan.mode}.`,
        });
      } else {
        setOptimizerError(data.message || 'Optimization request failed.');
      }
    } catch (err: any) {
      setOptimizerError(err.message || 'Network error during route optimization.');
    } finally {
      setOptimizingRoute(false);
    }
  };

  // Operator Approves & Applies Route
  const handleAcceptProposedRoute = () => {
    if (!activeProposedRoute) return;
    const targetExpId = currentExpedition?.id;

    if (onApplyProposedRoute) {
      onApplyProposedRoute(activeProposedRoute, targetExpId);
    } else if (onUpdateWaypoint && currentExpedition) {
      activeProposedRoute.orderedWaypoints.forEach((wp) => {
        onUpdateWaypoint(wp, targetExpId);
      });
    }

    emitAiActionBroadcast({
      category: 'logistics',
      message: `${isSimulation ? '[SIMULATION] ' : ''}OPERATOR APPROVED AI ROUTE: Waypoint sequence updated to ${activeProposedRoute.recommendedOrder.join(' → ')}.`,
      stationOrAsset: currentExpedition?.name || 'Convoy Traverse',
      impact: `Active path set to ${activeProposedRoute.estimatedDistanceKm} km (${activeProposedRoute.riskLevel} risk).`,
    });

    setLocalProposedRoute(null);
    if (onClearProposedRoute) onClearProposedRoute();
  };

  // Operator Rejects Proposed Route
  const handleRejectProposedRoute = () => {
    emitAiActionBroadcast({
      category: 'logistics',
      message: `${isSimulation ? '[SIMULATION] ' : ''}Operator REJECTED proposed AI route. Retained original waypoint sequence.`,
      stationOrAsset: currentExpedition?.name || 'Convoy Traverse',
      impact: 'Legacy path retained.',
    });
    setLocalProposedRoute(null);
    if (onClearProposedRoute) onClearProposedRoute();
  };

  return (
    <div className="relative w-full flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Map Toolbar */}
      <div className="p-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        {/* Layer Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${
              mapType === 'satellite'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite Aerial
          </button>
          <button
            type="button"
            onClick={() => setMapType('dark')}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${
              mapType === 'dark'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Dark
          </button>
          <button
            type="button"
            onClick={() => setMapType('terrain')}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${
              mapType === 'terrain'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Topographic
          </button>
          <button
            type="button"
            onClick={() => setMapType('osm')}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${
              mapType === 'osm'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cartographic
          </button>
          {googleMapsApiKey && (
            <button
              type="button"
              onClick={() => setMapType('google_hybrid')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                mapType === 'google_hybrid'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              Google Maps
            </button>
          )}
        </div>

        {/* Sub-Zero Danger Zones Heatmap Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              if (onToggleDangerHeatmap) onToggleDangerHeatmap();
              else setLocalHeatmapActive(!localHeatmapActive);
            }}
            className={`px-2.5 py-1 rounded font-bold font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
              isHeatmapActive
                ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Toggle Sub-Zero Danger Zones Thermal Heatmap"
          >
            <ThermometerSnowflake className="w-3.5 h-3.5" />
            <span>DANGER HEATMAP: {isHeatmapActive ? 'ON' : 'OFF'}</span>
          </button>

          {isHeatmapActive && (
            <div className="flex items-center gap-0.5 pl-1 border-l border-slate-800 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setDangerFilter('all')}
                className={`px-1.5 py-0.5 rounded ${
                  dangerFilter === 'all'
                    ? 'bg-sky-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL (&lt; -25°C)
              </button>
              <button
                type="button"
                onClick={() => setDangerFilter('extreme')}
                className={`px-1.5 py-0.5 rounded ${
                  dangerFilter === 'extreme'
                    ? 'bg-indigo-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EXTREME (&lt; -35°C)
              </button>
              <button
                type="button"
                onClick={() => setDangerFilter('lethal')}
                className={`px-1.5 py-0.5 rounded ${
                  dangerFilter === 'lethal'
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LETHAL (&lt; -45°C)
              </button>
            </div>
          )}
        </div>

        {/* Waypoint Tracing & Tracking Navigation Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {/* Follow Mode Toggle */}
          <button
            type="button"
            onClick={() => setFollowMode(!followMode)}
            className={`px-2.5 py-1 rounded font-bold font-mono text-[11px] flex items-center gap-1.5 transition-all ${
              followMode
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-400'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Auto-Center and Track Active Expedition Asset (Disables on manual pan)"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${followMode ? 'animate-spin text-emerald-200' : ''}`} />
            <span>FOLLOW ASSET: {followMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* GPS Track Breadcrumbs Toggle */}
          <button
            type="button"
            onClick={() => setShowGpsTrack(!showGpsTrack)}
            className={`px-2 py-1 rounded font-bold font-mono text-[10px] flex items-center gap-1 transition-colors ${
              showGpsTrack
                ? 'bg-amber-600/90 text-white border border-amber-500'
                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle Traveled GPS Breadcrumb History Track"
          >
            <Navigation className="w-3 h-3" />
            <span>GPS TRACK: {showGpsTrack ? 'ON' : 'OFF'}</span>
          </button>

          {/* Arrival Radius Selector */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 text-[10px]">
            <span className="text-slate-500 uppercase tracking-wider">RADIUS:</span>
            {[1, 3, 5, 10].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setArrivalRadiusKm(r)}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  arrivalRadiusKm === r
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
                title={`Set arrival detection radius to ${r}km`}
              >
                {r}km
              </button>
            ))}
          </div>

          {/* Waypoint Label Tags Toggle */}
          <button
            type="button"
            onClick={() => setShowWaypointLabels(!showWaypointLabels)}
            className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] border border-slate-800 transition-colors ${
              showWaypointLabels
                ? 'bg-sky-950 text-sky-300 border-sky-700'
                : 'bg-slate-900 text-slate-500'
            }`}
            title="Toggle Waypoint Labels on Map"
          >
            LABELS: {showWaypointLabels ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Gemini AI Route Optimizer Button & Status */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-purple-800/80 text-xs font-mono shadow-md">
          <button
            type="button"
            onClick={handleRunGeminiRouteOptimization}
            disabled={optimizingRoute}
            className={`px-3 py-1 rounded font-bold font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              optimizingRoute
                ? 'bg-purple-900/70 text-purple-200 animate-pulse border border-purple-500'
                : activeProposedRoute
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-[0_0_14px_rgba(168,85,247,0.6)] border border-purple-400'
                : 'bg-purple-950/90 text-purple-300 hover:bg-purple-900 hover:text-white border border-purple-800'
            }`}
            title="Analyze waypoints using Gemini 3.8 Flash AI and current polar hazard conditions"
          >
            {optimizingRoute ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            )}
            <span>
              {optimizingRoute
                ? 'GEMINI ANALYZING...'
                : activeProposedRoute
                ? 'AI PROPOSAL ACTIVE'
                : 'AI ROUTE OPTIMIZER'}
            </span>
          </button>

          {activeProposedRoute && (
            <button
              type="button"
              onClick={() => setShowProposedPanel(!showProposedPanel)}
              className="px-2 py-0.5 rounded text-[10px] text-purple-300 hover:text-white bg-purple-950 border border-purple-800 font-bold cursor-pointer"
              title="Toggle Recommendation Review Panel"
            >
              {showProposedPanel ? 'HIDE PANEL' : 'SHOW PANEL'}
            </button>
          )}

          {optimizerError && (
            <span className="text-rose-400 text-[10px] max-w-xs truncate" title={optimizerError}>
              {optimizerError}
            </span>
          )}
        </div>

        {/* Polar Quick Jump Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-mono text-[10px] uppercase">JUMP:</span>
          {region === 'antarctica' ? (
            <>
              <button
                type="button"
                onClick={handleFlyToSouthPole}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-mono"
              >
                South Pole (-90°)
              </button>
              <button
                type="button"
                onClick={handleFlyToMcMurdo}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-mono"
              >
                McMurdo (-77.8°)
              </button>
              <button
                type="button"
                onClick={handleFlyToConcordia}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-mono"
              >
                Concordia Dome C
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleFlyToSvalbard}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-mono"
            >
              Svalbard Ny-Ålesund (78.9°N)
            </button>
          )}

          <button
            type="button"
            onClick={handleFitAllPoints}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Fit All Active Assets & Bases"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* User Add Base & Add Waypoint Actions */}
          {onOpenAddBase && (
            <button
              type="button"
              onClick={onOpenAddBase}
              className="px-2 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-mono font-bold text-[11px] flex items-center gap-1 border border-sky-500 transition-colors"
              title="Commission New Research Base Location"
            >
              <Plus className="w-3 h-3" />
              <span>ADD BASE</span>
            </button>
          )}

          {onOpenAddWaypoint && (
            <button
              type="button"
              onClick={onOpenAddWaypoint}
              className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-mono font-bold text-[11px] flex items-center gap-1 border border-amber-500 transition-colors"
              title="Add Tactical Waypoint or Expedition Fix"
            >
              <Plus className="w-3 h-3" />
              <span>ADD WAYPOINT</span>
            </button>
          )}
        </div>

        {/* Real-time GPS Acquisition & Key Config Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                googleMapsApiKey 
                  ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-sky-300'
              }`}
              title="Configure Google Maps Platform Key & Gemini AI"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {googleMapsApiKey ? 'GMAPS KEY ACTIVE' : 'MAP KEY'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAcquireAndFlyToGps}
            disabled={geoLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
              userLat !== null
                ? 'bg-sky-600 hover:bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'bg-sky-950 hover:bg-sky-900 border-sky-600 text-sky-200'
            }`}
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
            ) : (
              <Crosshair className={`w-4 h-4 ${userLat !== null ? 'animate-pulse' : ''}`} />
            )}
            <span>{userLat !== null ? `LIVE GPS LOCK (${formattedAccuracy})` : 'LOCK LIVE DEVICE GPS'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[560px] min-h-[500px] bg-slate-950">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full absolute inset-0 z-0 bg-slate-950" 
          style={{ width: '100%', height: '100%', minHeight: '500px' }}
        />

        {/* Overlaid Real Geolocation Telemetry HUD */}
        {userLat !== null && userLng !== null && (
          <div className="absolute top-3 right-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-sky-500/60 p-3 rounded-lg shadow-2xl text-xs font-mono max-w-xs text-slate-200 pointer-events-none">
            <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-slate-800 pb-1.5 mb-2">
              <LocateFixed className="w-4 h-4 animate-pulse" />
              <span>AUTHENTIC REAL-TIME GPS FIX</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">LATITUDE:</span>
                <span className="text-white font-bold">{userLat.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LONGITUDE:</span>
                <span className="text-white font-bold">{userLng.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PRECISION:</span>
                <span className="text-emerald-400">{formattedAccuracy}</span>
              </div>
              {userAlt !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ALTITUDE:</span>
                  <span className="text-cyan-300">{Math.round(userAlt)}m AMSL</span>
                </div>
              )}
              {userSpeed !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">SPEED:</span>
                  <span className="text-amber-300">{(userSpeed * 3.6).toFixed(1)} km/h</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg shadow-xl text-[11px] font-mono text-slate-300 flex flex-col gap-2 pointer-events-none max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-600 border border-white inline-block"></span>
              <span>Research Base</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-600 border border-white inline-block"></span>
              <span>Traverse Convoy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white inline-block"></span>
              <span>Polar Aircraft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white inline-block"></span>
              <span>Crevasse Field</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-400 border border-white inline-block"></span>
              <span>Your Live GPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 bg-purple-500 border border-purple-300 inline-block"></span>
              <span>Proposed AI Route</span>
            </div>
          </div>

          {isHeatmapActive && (
            <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[10px]">
              <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                <ThermometerSnowflake className="w-3 h-3 text-rose-400" />
                SURVIVAL THRESHOLDS:
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-300 inline-block"></span>
                <span className="text-rose-300">&lt; -45°C Lethal (&lt;15m survival)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-indigo-300 inline-block"></span>
                <span className="text-indigo-300">-35°C to -45°C Extreme (&lt;10m frostbite)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-sky-300 inline-block"></span>
                <span className="text-sky-300">-25°C to -35°C High Cold Risk</span>
              </div>
            </div>
          )}
        </div>

        {/* Gemini AI Route Recommendation & Operator Approval Panel */}
        {activeProposedRoute && showProposedPanel && (
          <div className="absolute bottom-3 sm:bottom-4 right-3 z-[450] bg-slate-950/95 backdrop-blur-md border border-purple-500/80 p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.35)] text-xs font-mono max-w-md w-full text-slate-200 pointer-events-auto max-h-[85vh] overflow-y-auto">
            {/* Simulation Warning Banner */}
            {(isSimulation || activeProposedRoute.isSimulation) && (
              <div className="mb-2.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/80 text-amber-300 font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>SIMULATION — AI ROUTE RECOMMENDATION (TEST ENV ONLY)</span>
              </div>
            )}

            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-700 text-purple-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-purple-200 flex items-center gap-2">
                    <span>AI ROUTE ANALYSIS</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-300 text-[10px] font-mono uppercase tracking-wider">
                      PROPOSED
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>Status: Awaiting Operator Review</span>
                    <span>•</span>
                    <span
                      className={
                        activeProposedRoute.mode === 'gemini_ai_live'
                          ? 'text-emerald-400 font-bold'
                          : activeProposedRoute.mode === 'gemini_ai_cached'
                          ? 'text-sky-400 font-bold'
                          : 'text-amber-400 font-bold'
                      }
                    >
                      {activeProposedRoute.mode === 'gemini_ai_live'
                        ? 'GEMINI 3.8 FLASH'
                        : activeProposedRoute.mode === 'gemini_ai_cached'
                        ? 'AI CACHED'
                        : 'OFFLINE HEURISTIC'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProposedPanel(false)}
                className="text-slate-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Minimize panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sequence Comparison Box */}
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-2 mb-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">CURRENT TRAVERSE SEQUENCE:</div>
                <div className="text-slate-300 text-[11px] font-bold flex flex-wrap items-center gap-1">
                  {(currentExpedition?.waypoints || []).map((w, i) => (
                    <React.Fragment key={w.id}>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{w.name || w.id}</span>
                      {i < (currentExpedition?.waypoints?.length || 0) - 1 && <span className="text-slate-500">→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Est. Baseline: {currentExpeditionDistanceKm} km
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider font-bold mb-0.5 flex items-center justify-between">
                  <span>AI RECOMMENDED SEQUENCE:</span>
                  {currentExpeditionDistanceKm > 0 && (
                    <span
                      className={
                        activeProposedRoute.estimatedDistanceKm <= currentExpeditionDistanceKm
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {activeProposedRoute.estimatedDistanceKm <= currentExpeditionDistanceKm
                        ? `Δ -${(currentExpeditionDistanceKm - activeProposedRoute.estimatedDistanceKm).toFixed(1)} km saved`
                        : `Δ +${(activeProposedRoute.estimatedDistanceKm - currentExpeditionDistanceKm).toFixed(1)} km detour`}
                    </span>
                  )}
                </div>
                <div className="text-purple-200 text-[11px] font-bold flex flex-wrap items-center gap-1">
                  {activeProposedRoute.orderedWaypoints.map((w, i) => (
                    <React.Fragment key={w.id}>
                      <span className="bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-700 text-purple-200 font-mono">
                        {w.name || w.id}
                      </span>
                      {i < activeProposedRoute.orderedWaypoints.length - 1 && <span className="text-purple-400">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-[9.5px] text-slate-400 uppercase">EST. DISTANCE</div>
                <div className="text-sm font-bold text-white mt-0.5">{activeProposedRoute.estimatedDistanceKm} km</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-[9.5px] text-slate-400 uppercase">EST. DURATION</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{activeProposedRoute.estimatedDurationHours} hrs</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-[9.5px] text-slate-400 uppercase">RISK LEVEL</div>
                <div
                  className={`text-xs font-black mt-1 px-1.5 py-0.5 rounded inline-block ${
                    activeProposedRoute.riskLevel === 'LOW'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : activeProposedRoute.riskLevel === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {activeProposedRoute.riskLevel}
                </div>
              </div>
            </div>

            {/* AI Reasoning Bullets */}
            <div className="mb-3">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                ANALYSIS & REASONING:
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {activeProposedRoute.reasoning.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-400">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings if any */}
            {activeProposedRoute.warnings && activeProposedRoute.warnings.length > 0 && (
              <div className="mb-3 bg-rose-950/60 border border-rose-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-rose-300 font-bold uppercase mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>OPERATIONAL WARNINGS:</span>
                </div>
                <ul className="space-y-0.5 text-[10px] text-rose-200">
                  {activeProposedRoute.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Operator Approval Actions */}
            <div className="pt-2 border-t border-purple-900/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRunGeminiRouteOptimization}
                disabled={optimizingRoute}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Re-run optimization with latest telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${optimizingRoute ? 'animate-spin' : ''}`} />
                <span>Recalculate</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectProposedRoute}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reject proposed route and keep active path"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcceptProposedRoute}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Accept AI proposal and update active operational route"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept & Apply</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Geolocation Status / Error Bar */}
      {geoError && (
        <div className="p-2.5 bg-rose-950 border-t border-rose-800 text-xs font-mono text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={handleAcquireAndFlyToGps}
            className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-rose-100 text-xs"
          >
            Retry GPS
          </button>
        </div>
      )}
    </div>
  );
};
