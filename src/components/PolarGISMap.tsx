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
  X,
  Satellite,
  Eye,
  EyeOff,
  Database,
  Wind,
  Route,
  AlertOctagon,
  Check
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
} from '../types';
import {
  AStarOptimizationResult,
  AStarNode,
  AStarEnvironment,
  AStarAsset,
} from '../utils/polarRouteAStar';
import { getSubZeroDangerZones, SubZeroDangerZone } from '../utils/dangerZones';
import { evaluateWaypointProgress, formatDistanceKm, DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM } from '../utils/waypointTracing';
import { emitAiActionBroadcast } from '../data/polarisData';
import {
  calculateBearing,
  clusterTacticalWaypoints,
  WaypointCluster,
} from '../utils/tacticalMapTracking';
import {
  loadAddVectorLayers,
  getCoastlineStyle,
  getGroundingLineStyle,
  createStationDiamondIcon,
  getAddLayerCacheStatus,
  AddCacheStatus,
  ADD_ATTRIBUTION_TEXT,
  ADD_DISCLAIMER_TEXT,
} from '../utils/addFeatureService';
import { useDynamicTracking, PolarGnssTelemetry, DynamicTrackedAsset } from '../hooks/useDynamicTracking';
import { PolarAttributionFooter } from './PolarAttributionFooter';
import { apiFetch } from '../utils/api';

export interface PolarGISMapProps {
  region?: PolarRegion;
  stations?: ResearchStation[];
  assets?: PolarAsset[];
  expeditions?: Expedition[];
  hazards?: HazardZone[];
  stationWeather?: Record<string, RealtimeWeatherReading>;
  expeditionWeather?: Record<string, RealtimeWeatherReading>;
  userLat?: number | null;
  userLng?: number | null;
  userAccuracy?: number | null;
  userAlt?: number | null;
  userSpeed?: number | null;
  isWatching?: boolean;
  formattedAccuracy?: string;
  geoLoading?: boolean;
  geoError?: string | null;
  onAcquireGps?: () => Promise<void>;
  userLocationWeather?: RealtimeWeatherReading | null;
  userLocationName?: string | null;
  onSelectStation?: (station: ResearchStation) => void;
  onSelectAsset?: (asset: PolarAsset) => void;
  onSelectExpedition?: (expedition: Expedition) => void;
  onSelectDangerZone?: (zone: SubZeroDangerZone) => void;
  activeDistress?: ActiveDistressAlert | null;
  focusCoords?: { lat: number; lng: number } | null;
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
 * Clamps coordinates safely so Leaflet formulas never encounter Infinity/NaN.
 */
function safeMercatorLatLng(lat: number, lng: number): [number, number] {
  const safeLat = Math.max(-85.0, Math.min(85.0, Number(lat) || 0));
  let safeLng = Number(lng) || 0;
  while (safeLng > 180) safeLng -= 360;
  while (safeLng < -180) safeLng += 360;
  return [safeLat, safeLng];
}

/**
 * Polar Basemap Type Definition (100% Google-Free)
 */
export type PolarBasemapType = 'dark' | 'satellite' | 'tactical_canvas' | 'osm';

export const PolarGISMap: React.FC<PolarGISMapProps> = ({
  region = 'antarctica',
  stations = [],
  assets = [],
  expeditions = [],
  hazards = [],
  stationWeather = {},
  expeditionWeather = {},
  userLat = null,
  userLng = null,
  userAccuracy = null,
  userAlt = null,
  userSpeed = null,
  isWatching = false,
  formattedAccuracy = '±12m',
  geoLoading = false,
  geoError = null,
  onAcquireGps,
  userLocationWeather = null,
  userLocationName = null,
  onSelectStation,
  onSelectAsset,
  onSelectExpedition,
  onSelectDangerZone,
  activeDistress = null,
  focusCoords = null,
  customWaypoints = [],
  onOpenAddBase,
  onOpenAddWaypoint,
  onOpenAddBaseWithCoords,
  onOpenAddWaypointWithCoords,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
  showDangerHeatmap = false,
  onToggleDangerHeatmap,
  isSimulation = false,
  proposedRoute = null,
  onApplyProposedRoute,
  onClearProposedRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Basemap selection - Default is polar-appropriate CartoDB Dark Matter
  const [basemapType, setBasemapType] = useState<PolarBasemapType>('dark');
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Leaflet layer groups
  const addLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const telemetryLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userGpsMarkerRef = useRef<L.LayerGroup | null>(null);
  const aStarPolylineRef = useRef<L.LayerGroup | null>(null);

  // A* Tactical Route Optimization State
  const [aStarResult, setAStarResult] = useState<AStarOptimizationResult | null>(null);
  const [optimizingAStar, setOptimizingAStar] = useState<boolean>(false);
  const [aStarError, setAStarError] = useState<string | null>(null);
  const [showAStarPanel, setShowAStarPanel] = useState<boolean>(false);

  // Dynamic Asset Marker Refs for direct 60fps transform updating
  const assetMarkerMapRef = useRef<Map<string, L.Marker>>(new Map());

  // ADD Vector Overlay State
  const [showAddLayers, setShowAddLayers] = useState<boolean>(true);
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [addCacheStatus, setAddCacheStatus] = useState<AddCacheStatus>(getAddLayerCacheStatus());
  const [currentZoom, setCurrentZoom] = useState<number>(3);

  // Tactical Telemetry HUD Toggles
  const [showAllTelemetryPips, setShowAllTelemetryPips] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);

  // Use Dynamic Tracking Hook for 60fps smooth interpolation & polar GNSS compensation
  const { 
    trackedAssets, 
    gnssTelemetry, 
    isWarningDismissed, 
    dismissWarning 
  } = useDynamicTracking(assets);

  // Danger zones calculation
  const dangerZones = useMemo(() => getSubZeroDangerZones(stationWeather, region as 'antarctica' | 'arctic' | 'all'), [stationWeather, region]);

  // Aggregate all waypoints across expeditions & custom list
  const allWaypoints = useMemo(() => {
    const list: Array<Waypoint & { expeditionId?: string; expeditionName?: string }> = [];
    expeditions.forEach((exp) => {
      (exp.waypoints || []).forEach((wp) => {
        list.push({ ...wp, expeditionId: exp.id, expeditionName: exp.name });
      });
    });
    customWaypoints.forEach((wp) => {
      list.push(wp);
    });
    return list;
  }, [expeditions, customWaypoints]);

  // Screen-space waypoint clustering
  const waypointClusters = useMemo(() => {
    if (!clusteringEnabled || currentZoom >= 8) {
      return allWaypoints.map((wp) => ({
        id: `single-${wp.id}`,
        lat: wp.lat,
        lng: wp.lng,
        waypoints: [wp],
        isCluster: false,
      }));
    }
    return clusterTacticalWaypoints(allWaypoints, currentZoom, 65);
  }, [allWaypoints, currentZoom, clusteringEnabled]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance) return;

    // Centered over Antarctica with polar bounds
    const defaultCenter: [number, number] = region === 'arctic' ? [78.22, 15.65] : [-75.0, 0.0];
    const initialZoom = region === 'arctic' ? 4 : 3;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false, // Attribution managed via custom PolarAttributionFooter
      worldCopyJump: false,
    });

    // Custom Layer Groups
    const addGroup = L.layerGroup().addTo(map);
    const telemetryGroup = L.layerGroup().addTo(map);
    const heatmapGroup = L.layerGroup().addTo(map);
    const gpsGroup = L.layerGroup().addTo(map);
    const aStarGroup = L.layerGroup().addTo(map);

    addLayerGroupRef.current = addGroup;
    telemetryLayerGroupRef.current = telemetryGroup;
    heatmapLayerGroupRef.current = heatmapGroup;
    userGpsMarkerRef.current = gpsGroup;
    aStarPolylineRef.current = aStarGroup;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    setMapInstance(map);

    return () => {
      map.remove();
    };
  }, [region]);

  // Basemap Tile Management (Strictly Non-Google)
  useEffect(() => {
    if (!mapInstance) return;

    if (currentTileLayerRef.current) {
      mapInstance.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }

    if (basemapType === 'tactical_canvas') {
      // Solid dark polar canvas (#060B18) with ADD vector overlays
      if (mapContainerRef.current) {
        mapContainerRef.current.style.backgroundColor = '#060B18';
      }
      return;
    }

    let tileUrl = '';
    let attribution = '';
    let maxZoom = 16;

    if (basemapType === 'dark') {
      // Esri World Dark Gray Canvas - Watermark-free polar-appropriate dark basemap
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri | &copy; OpenStreetMap contributors';
      maxZoom = 16;
    } else if (basemapType === 'satellite') {
      // ESRI Polar Antarctic Imagery / World Imagery
      tileUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, USGS, NOAA';
      maxZoom = 16;
    } else if (basemapType === 'osm') {
      // OpenStreetMap Polar Contrast
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxZoom = 18;
    }

    const tileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom,
      subdomains: 'abcd',
    });

    tileLayer.addTo(mapInstance);
    currentTileLayerRef.current = tileLayer;
  }, [mapInstance, basemapType]);

  // Load and Render ADD Vector Overlays (Coastline, Grounding Lines, Research Stations)
  const renderAddLayers = useCallback(async () => {
    if (!mapInstance || !addLayerGroupRef.current) return;
    const group = addLayerGroupRef.current;
    group.clearLayers();

    if (!showAddLayers) return;

    // Performance optimization: only render full vector geometries when zoom > 2
    if (mapInstance.getZoom() < 2) return;

    setAddLoading(true);

    try {
      const { coastline, groundingLine, stations: addStations, status } = await loadAddVectorLayers();
      setAddCacheStatus(status);

      // 1. Coastlines: thin cyan/neon line (color: '#00ffff', weight: 1.5, opacity: 0.8)
      if (coastline && coastline.features.length > 0) {
        const coastlineLayer = L.geoJSON(coastline as any, {
          style: getCoastlineStyle(),
        });
        group.addLayer(coastlineLayer);
      }

      // 2. Ice-Shelf Grounding Lines: distinct dashed amber line (color: '#ffaa00', dashArray: '5, 5')
      if (groundingLine && groundingLine.features.length > 0) {
        const groundingLayer = L.geoJSON(groundingLine as any, {
          style: getGroundingLineStyle(),
        });
        group.addLayer(groundingLayer);
      }

      // 3. Research Stations: clean diamond tactical markers with glassmorphic popup
      if (addStations && addStations.features.length > 0) {
        addStations.features.forEach((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const [safeLat, safeLng] = safeMercatorLatLng(lat, lng);
          const p = feature.properties;

          const marker = L.marker([safeLat, safeLng], {
            icon: createStationDiamondIcon(p.name || 'Station', p.country || 'International'),
          });

          // Glassmorphic Station Popup
          const popupContent = document.createElement('div');
          popupContent.className = 'p-3 text-xs font-mono text-slate-100 min-w-[220px]';
          popupContent.innerHTML = `
            <div class="flex items-center gap-1.5 pb-2 mb-2 border-b border-cyan-500/30">
              <span class="w-2 h-2 rotate-45 bg-cyan-400"></span>
              <span class="font-bold text-cyan-300 text-sm tracking-wide">${p.name || 'Research Base'}</span>
            </div>
            <div class="space-y-1 text-[11px] text-slate-300">
              <div class="flex justify-between">
                <span class="text-slate-400">SOVEREIGNTY:</span>
                <span class="font-semibold text-white">${p.country || 'SCAR Treaty'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">CALLSIGN:</span>
                <span class="text-cyan-300">${p.code || 'POLARIS-STN'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">ELEVATION:</span>
                <span class="text-amber-300">${p.elevationM || '15'}m MSL</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">POPULATION:</span>
                <span class="text-slate-200">W: ${p.winterPop || '0'} | S: ${p.summerPop || '0'}</span>
              </div>
              <div class="pt-1.5 mt-1.5 border-t border-slate-800 text-[10px] text-cyan-400/80 flex items-center justify-between">
                <span>SCAR ADD v7.4 GEODETIC</span>
                <span class="text-emerald-400">VERIFIED</span>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            className: 'glassmorphism-popup tactical-hud-popup',
            maxWidth: 280,
          });

          group.addLayer(marker);
        });
      }
    } catch (err) {
      console.error('[PolarGISMap] Failed to render ADD layers:', err);
    } finally {
      setAddLoading(false);
    }
  }, [mapInstance, showAddLayers]);

  // Trigger ADD layer render on map ready, zoom, or toggle
  useEffect(() => {
    renderAddLayers();
  }, [renderAddLayers]);

  // Dynamic Asset Tracking Render Loop (Smooth Marker Position Updates)
  useEffect(() => {
    if (!mapInstance || !telemetryLayerGroupRef.current) return;
    const group = telemetryLayerGroupRef.current;

    // Track active IDs to prune stale markers
    const currentActiveIds = new Set<string>();

    trackedAssets.forEach((asset) => {
      currentActiveIds.add(asset.id);
      const [safeLat, safeLng] = safeMercatorLatLng(asset.interpolatedLat, asset.interpolatedLng);

      let marker = assetMarkerMapRef.current.get(asset.id);

      const isMoving = asset.isMoving;
      const statusColor = isMoving ? '#10b981' : '#06b6d4'; // Shift from cyan to bright green when moving
      const pulseClass = isMoving ? 'tactical-pulse-active' : '';

      // High-tech Tactical Asset Icon with Directional Bearing Arrow
      const customIcon = L.divIcon({
        className: 'tactical-asset-marker-container',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        html: `
          <div class="relative flex items-center justify-center w-9 h-9">
            <!-- Outer Glow Ring -->
            <div class="absolute inset-0 rounded-full ${pulseClass} transition-colors duration-300" 
                 style="background: radial-gradient(circle, ${isMoving ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.25)'} 0%, transparent 70%);">
            </div>

            <!-- Rotating Heading Indicator Arrow -->
            <div class="absolute -top-1 w-2.5 h-2.5 transition-transform duration-300 pointer-events-none"
                 style="transform: rotate(${asset.bearing}deg); transform-origin: 50% 19px;">
              <svg viewBox="0 0 10 10" class="w-full h-full fill-current" style="color: ${statusColor};">
                <polygon points="5,0 10,10 5,7 0,10"/>
              </svg>
            </div>

            <!-- Central Tactical Pip -->
            <div class="relative z-10 w-7 h-7 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-md transition-all duration-300"
                 style="background: rgba(10, 15, 30, 0.9); border-color: ${statusColor};">
              <span class="text-[10px] font-bold font-mono tracking-tighter" style="color: ${statusColor};">
                ${asset.type === 'Crawler' ? 'CRW' : asset.type === 'Snowcat' ? 'CAT' : 'AST'}
              </span>
            </div>
          </div>
        `,
      });

      if (!marker) {
        marker = L.marker([safeLat, safeLng], { icon: customIcon });
        marker.on('click', () => {
          const originalAsset = assets.find(a => a.id === asset.id);
          if (originalAsset && onSelectAsset) onSelectAsset(originalAsset);
        });

        // Glassmorphic Telemetry Popup
        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 text-xs font-mono text-slate-100 min-w-[240px]';
        popupContent.innerHTML = `
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <div class="flex items-center gap-1.5 font-bold" style="color: ${statusColor}">
              <span class="w-2 h-2 rounded-full" style="background: ${statusColor}"></span>
              <span>${asset.name.toUpperCase()}</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded ${isMoving ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'}">
              ${isMoving ? 'MOVING' : 'STATIONARY'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
            <div><span class="text-slate-400">BEARING:</span> <span class="text-white font-bold">${Math.round(asset.bearing)}°</span></div>
            <div><span class="text-slate-400">SPEED:</span> <span class="text-cyan-300 font-bold">${asset.speedKmh.toFixed(1)} km/h</span></div>
            <div><span class="text-slate-400">KALMAN ACC:</span> <span class="text-emerald-400 font-bold">±${asset.smoothedAccuracyMeters}m</span></div>
            <div><span class="text-slate-400">GNSS QUAL:</span> <span class="${asset.gpsQuality === 'GOOD' ? 'text-emerald-400' : 'text-amber-400'} font-bold">${asset.gpsQuality}</span></div>
          </div>
          <div class="pt-1.5 border-t border-slate-800 text-[10px] flex justify-between text-slate-400">
            <span>HDOP: ${asset.hdop} | VDOP: ${asset.vdop}</span>
            <span>${asset.satellites} Sats</span>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'glassmorphism-popup tactical-hud-popup',
          maxWidth: 280,
        });

        group.addLayer(marker);
        assetMarkerMapRef.current.set(asset.id, marker);
      } else {
        // Direct transform update
        marker.setLatLng([safeLat, safeLng]);
        marker.setIcon(customIcon);
      }
    });

    // Cleanup markers for removed assets
    for (const [id, marker] of assetMarkerMapRef.current.entries()) {
      if (!currentActiveIds.has(id)) {
        group.removeLayer(marker);
        assetMarkerMapRef.current.delete(id);
      }
    }
  }, [trackedAssets, mapInstance, assets, onSelectAsset]);

  // Render Waypoint Clusters & Progressive Disclosure Markers
  useEffect(() => {
    if (!mapInstance || !telemetryLayerGroupRef.current) return;
    const group = telemetryLayerGroupRef.current;

    // Temporary container to track waypoint elements
    const waypointElements: L.Layer[] = [];

    waypointClusters.forEach((cluster) => {
      const [safeLat, safeLng] = safeMercatorLatLng(cluster.lat, cluster.lng);

      if (cluster.isCluster) {
        // Waypoint Cluster Bubble with Glow & Count
        const count = cluster.waypoints.length;
        const hasLethal = cluster.waypoints.some(w => w.environmentalHazard === 'LETHAL' || (w.elevationM && w.elevationM > 3000));

        const clusterIcon = L.divIcon({
          className: 'tactical-cluster-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110 ${
              hasLethal 
                ? 'tactical-pulse-lethal bg-red-950/90 border border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.7)]' 
                : 'tactical-cluster-glow bg-cyan-950/90 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
            }">
              <span class="text-xs font-mono font-bold">${count}</span>
            </div>
          `,
        });

        const clusterMarker = L.marker([safeLat, safeLng], { icon: clusterIcon });
        clusterMarker.on('click', () => {
          mapInstance.setView([safeLat, safeLng], Math.min(12, currentZoom + 2), { animate: true });
        });

        group.addLayer(clusterMarker);
        waypointElements.push(clusterMarker);
      } else {
        // Individual Waypoint Pip (Progressive Disclosure)
        const wp = cluster.waypoints[0];
        const isLethal = wp.environmentalHazard === 'LETHAL' || (wp.elevationM && wp.elevationM > 3500);
        const isCustom = !wp.expeditionId;

        const pipIcon = L.divIcon({
          className: 'tactical-waypoint-pip-wrapper',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
          html: `
            <div class="relative flex items-center justify-center w-6 h-6 group cursor-pointer">
              <!-- Pulsing Red Ring for LETHAL conditions -->
              ${isLethal ? '<div class="absolute inset-0 rounded-full tactical-pulse-lethal border border-red-500 pointer-events-none"></div>' : ''}
              
              <!-- Core Minimal Pip -->
              <div class="w-3.5 h-3.5 rounded-full border shadow-md transition-transform duration-200 group-hover:scale-125 ${
                isLethal
                  ? 'bg-red-500 border-white shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                  : isCustom
                  ? 'bg-purple-500 border-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.7)]'
                  : 'bg-cyan-400 border-cyan-100 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
              }">
              </div>
            </div>
          `,
        });

        const pipMarker = L.marker([safeLat, safeLng], { icon: pipIcon });

        // Glassmorphic Telemetry Popup (Hover or Click)
        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 text-xs font-mono text-slate-100 min-w-[230px]';
        popupContent.innerHTML = `
          <div class="flex items-center justify-between pb-1.5 mb-2 border-b ${isLethal ? 'border-red-500/40 text-red-400' : 'border-cyan-500/40 text-cyan-300'}">
            <span class="font-bold tracking-wide">${wp.name || 'WAYPOINT'}</span>
            <span class="text-[10px] px-1 py-0.5 rounded ${isLethal ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-300'}">
              ${isLethal ? 'LETHAL HAZARD' : wp.type || 'NAV POINT'}
            </span>
          </div>
          <div class="space-y-1 text-[11px] text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">COORDS:</span>
              <span class="text-white">${wp.lat.toFixed(3)}°, ${wp.lng.toFixed(3)}°</span>
            </div>
            ${wp.elevationM ? `
            <div class="flex justify-between">
              <span class="text-slate-400">ELEVATION:</span>
              <span class="text-amber-300 font-bold">${wp.elevationM}m</span>
            </div>` : ''}
            ${wp.iceThicknessM ? `
            <div class="flex justify-between">
              <span class="text-slate-400">ICE THICKNESS:</span>
              <span class="text-cyan-300">${wp.iceThicknessM}m</span>
            </div>` : ''}
            ${wp.environmentalHazard ? `
            <div class="flex justify-between">
              <span class="text-slate-400">CONDITIONS:</span>
              <span class="${isLethal ? 'text-red-400 font-bold' : 'text-slate-200'}">${wp.environmentalHazard}</span>
            </div>` : ''}
          </div>
        `;

        pipMarker.bindPopup(popupContent, {
          className: 'glassmorphism-popup tactical-hud-popup',
          maxWidth: 280,
        });

        group.addLayer(pipMarker);
        waypointElements.push(pipMarker);
      }
    });

    return () => {
      waypointElements.forEach(el => group.removeLayer(el));
    };
  }, [waypointClusters, mapInstance, currentZoom]);

  // Run Polar A* Pathfinding + Gemini AI Decision Layer
  const handleRunAStarOptimizer = async () => {
    if (!mapInstance) return;
    setOptimizingAStar(true);
    setAStarError(null);

    try {
      let startNode: AStarNode | null = null;
      let goalNode: AStarNode | null = null;
      let waypointsPayload: AStarNode[] = [];

      if (customWaypoints && customWaypoints.length >= 2) {
        waypointsPayload = customWaypoints.map((w) => ({
          id: w.id,
          lat: w.lat,
          lng: w.lng,
          name: w.name,
          elevationM: w.elevationM,
        }));
      } else if (allWaypoints.length >= 2) {
        waypointsPayload = allWaypoints.slice(0, 8).map((w) => ({
          id: w.id,
          lat: w.lat,
          lng: w.lng,
          name: w.name,
          elevationM: w.elevationM,
        }));
      } else {
        // High-latitude Antarctic Research Corridor: McMurdo Station -> South Pole Station
        startNode = {
          id: 'mcmurdo-base',
          name: 'McMurdo Logistics Hub',
          lat: -77.848,
          lng: 166.666,
          elevationM: 24,
        };
        goalNode = {
          id: 'south-pole-station',
          name: 'Amundsen-Scott South Pole Station',
          lat: -90.0,
          lng: 0.0,
          elevationM: 2835,
        };
      }

      const activeAsset = assets[0] || {
        id: 'AST-01',
        name: 'PistenBully 600 Polar',
        coldRatingC: -50,
        minOperatingTemp: -50,
        speedKmh: 24,
      };

      const reading = Object.values(stationWeather)[0] as RealtimeWeatherReading | undefined;
      const envPayload: AStarEnvironment = {
        tempC: userLocationWeather?.tempC ?? reading?.tempC ?? -32,
        apparentTempC: userLocationWeather?.apparentTempC ?? reading?.apparentTempC ?? -45,
        windSpeedKts: userLocationWeather?.windSpeedKts ?? reading?.windSpeedKts ?? 22,
        windDirectionDeg: 45,
        dangerZones: dangerZones.map((dz) => ({
          id: dz.id,
          name: dz.name,
          lat: dz.lat,
          lng: dz.lng,
          radiusKm: dz.radiusKm,
          severityLevel: dz.severityLevel,
        })),
      };

      emitAiActionBroadcast({
        category: 'logistics',
        message: 'Calculating optimal polar traverse using A* graph search & Gemini AI decision engine...',
        stationOrAsset: activeAsset.name || 'Polar Fleet',
        impact: 'Hazard circumnavigation & slope minimization',
      });

      const res = await apiFetch('/api/ai/route-optimizer/astar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startNode,
          goalNode,
          waypoints: waypointsPayload,
          environment: envPayload,
          asset: {
            id: activeAsset.id,
            name: activeAsset.name,
            minOperatingTemp: (activeAsset as any).minOperatingTemp ?? (activeAsset as any).coldRatingC ?? -50,
            speedKmh: activeAsset.telemetry?.speedKmh ?? 24,
          },
        }),
      });

      const data = await res.json();
      if (data.status === 'ok' && data.coordinates && data.coordinates.length > 0) {
        setAStarResult(data);
        setShowAStarPanel(true);

        // Render glowing double-layer polyline on Leaflet map
        if (aStarPolylineRef.current) {
          aStarPolylineRef.current.clearLayers();

          const safeCoordinates = data.coordinates.map(([lat, lng]: [number, number]) =>
            safeMercatorLatLng(lat, lng)
          );

          // 1. Fat Outer Neon Glow Polyline
          const outerGlow = L.polyline(safeCoordinates, {
            color: '#00f2fe',
            weight: 9,
            opacity: 0.5,
            lineCap: 'round',
            className: 'tactical-route-glow',
          });
          aStarPolylineRef.current.addLayer(outerGlow);

          // 2. High-contrast Inner Core Dashed Trajectory
          const innerCore = L.polyline(safeCoordinates, {
            color: '#10b981',
            weight: 3.5,
            dashArray: '8, 6',
            opacity: 0.95,
            lineCap: 'round',
            className: 'tactical-route-core',
          });
          innerCore.bindTooltip(
            `<b>🧭 A* OPTIMIZED POLAR ROUTE: ${data.metadata.totalDistanceKm} km</b><br/>Detour: +${data.metadata.distanceDeltaKm} km | Est: ${Math.round(data.metadata.estimatedTimeMinutes / 60)} hrs<br/><i>${data.metadata.hazardsAvoided.length} Lethal Zones Avoided</i>`,
            { className: 'tactical-hud-tooltip', sticky: true }
          );
          aStarPolylineRef.current.addLayer(innerCore);

          // 3. Detour / Waypoint Nodes
          data.path.forEach((node: any, idx: number) => {
            const [sLat, sLng] = safeMercatorLatLng(node.lat, node.lng);
            const isStart = idx === 0;
            const isEnd = idx === data.path.length - 1;

            const nodeIcon = L.divIcon({
              className: 'tactical-astar-node-pin',
              iconSize: [22, 22],
              iconAnchor: [11, 11],
              html: `
                <div class="relative flex items-center justify-center w-5 h-5">
                  <div class="absolute inset-0 rounded-full ${isStart ? 'bg-cyan-400' : isEnd ? 'bg-emerald-400' : 'bg-purple-400'} opacity-75 animate-ping"></div>
                  <div class="relative w-4 h-4 rounded-full border-2 border-slate-950 ${isStart ? 'bg-cyan-300' : isEnd ? 'bg-emerald-300' : 'bg-purple-300'} shadow-[0_0_10px_rgba(0,242,254,0.9)] flex items-center justify-center">
                    <span class="text-[8px] font-black text-slate-950">${isStart ? 'A' : isEnd ? 'B' : idx}</span>
                  </div>
                </div>
              `,
            });

            const marker = L.marker([sLat, sLng], { icon: nodeIcon });
            marker.bindTooltip(
              `<b>${node.name || `Waypoint ${idx}`}</b><br/>Lat: ${node.lat.toFixed(2)}°, Lng: ${node.lng.toFixed(2)}°<br/>Elev: ${node.elevationM ?? 'N/A'}m`,
              { className: 'tactical-hud-tooltip' }
            );
            aStarPolylineRef.current?.addLayer(marker);
          });

          // Fit map to route bounds
          mapInstance.fitBounds(safeCoordinates, { padding: [60, 60], maxZoom: 8 });
        }

        emitAiActionBroadcast({
          category: 'logistics',
          message: `A* Route optimized: ${data.metadata.totalDistanceKm}km, ${data.metadata.savingsVsStraightLinePercent}% cost savings vs straight line.`,
          stationOrAsset: activeAsset.name || 'Polar Fleet',
          impact: 'Gemini decision recommendation active',
        });
      } else {
        setAStarError(data.message || 'Route calculation failed.');
      }
    } catch (err: any) {
      setAStarError(err.message || 'Failed to connect to A* route optimizer.');
    } finally {
      setOptimizingAStar(false);
    }
  };

  const handleClearAStarRoute = () => {
    if (aStarPolylineRef.current) {
      aStarPolylineRef.current.clearLayers();
    }
    setAStarResult(null);
    setShowAStarPanel(false);
    setAStarError(null);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-[#060B18] overflow-hidden select-none">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Gemini AI Tactical Route Recommendation Card (Glassmorphic HUD) */}
      {aStarResult && showAStarPanel && (
        <div className="absolute top-16 left-3 z-30 w-[420px] max-w-[calc(100vw-24px)] tactical-astar-glass rounded-xl p-4 text-xs font-mono shadow-2xl border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-cyan-500/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.35)]">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="font-bold text-white text-xs tracking-wider flex items-center gap-1.5">
                  <span>AI ROUTE OPTIMIZER</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    A* ENGINE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {aStarResult.mode === 'gemini_ai_live' ? '🤖 Gemini 3.8 Flash Decision Layer' : '⚡ Polar Cost Heuristic Decision'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAStarPanel(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close panel (route remains visible on map)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Sentence Tactical Recommendation Box */}
          <div className="mb-3 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(0,242,254,0.05)]">
            <div className="text-[9.5px] uppercase font-bold text-cyan-400 tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>TACTICAL COMMAND RECOMMENDATION:</span>
            </div>
            <p className="text-[11.5px] text-slate-100 leading-relaxed font-sans font-medium italic">
              "{aStarResult.tacticalRecommendation}"
            </p>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Total Distance</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {aStarResult.metadata.totalDistanceKm} <span className="text-[10px] text-slate-400 font-normal">km</span>
              </div>
              <div className="text-[9.5px] text-amber-400 font-medium">
                +{aStarResult.metadata.distanceDeltaKm} km detour
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Est. Duration</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {Math.floor(aStarResult.metadata.estimatedTimeMinutes / 60)}h {aStarResult.metadata.estimatedTimeMinutes % 60}m
              </div>
              <div className="text-[9.5px] text-slate-400 font-medium">
                @ {assets[0]?.telemetry?.speedKmh || 24} km/h
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Cost Advantage</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {aStarResult.metadata.savingsVsStraightLinePercent > 0 ? `-${aStarResult.metadata.savingsVsStraightLinePercent}%` : 'Optimal'}
              </div>
              <div className="text-[9.5px] text-slate-400 font-medium">
                vs straight-line
              </div>
            </div>
          </div>

          {/* Environmental Factors Pill Breakdown */}
          <div className="space-y-1.5 mb-3.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <ThermometerSnowflake className="w-3 h-3 text-cyan-400" /> Ambient Temp:
              </span>
              <span className="font-bold text-white">{aStarResult.metadata.maxTempEncountered}°C (Windchill {aStarResult.metadata.minTempEncountered}°C)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Wind className="w-3 h-3 text-sky-400" /> Wind Direction:
              </span>
              <span className={`font-bold ${aStarResult.metadata.windConditions.costImpactPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {aStarResult.metadata.windConditions.headwindTailwind} ({aStarResult.metadata.windConditions.costImpactPercent > 0 ? `+${aStarResult.metadata.windConditions.costImpactPercent}% cost` : `${aStarResult.metadata.windConditions.costImpactPercent}% cost`})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-rose-400" /> Hazards Avoided:
              </span>
              <span className="font-bold text-rose-300 truncate max-w-[200px]" title={aStarResult.metadata.hazardsAvoided.join(', ')}>
                {aStarResult.metadata.hazardsAvoided.length > 0 ? aStarResult.metadata.hazardsAvoided.join(', ') : 'Direct corridor clear'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={handleClearAStarRoute}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
            >
              Clear Route
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRunAStarOptimizer}
                disabled={optimizingAStar}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${optimizingAStar ? 'animate-spin' : ''}`} />
                <span>Recalculate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onApplyProposedRoute && aStarResult) {
                    onApplyProposedRoute({
                      id: `ASTAR-${Date.now()}`,
                      recommendedOrder: aStarResult.path.map(n => n.id),
                      orderedWaypoints: aStarResult.path.map((n, i) => ({
                        id: n.id,
                        name: n.name || `Waypoint ${i + 1}`,
                        lat: n.lat,
                        lng: n.lng,
                        elevationM: n.elevationM,
                        status: i === 0 ? 'completed' : i === 1 ? 'current' : 'pending',
                        sequence: i + 1,
                      })),
                      estimatedDistanceKm: aStarResult.metadata.totalDistanceKm,
                      estimatedDurationHours: parseFloat((aStarResult.metadata.estimatedTimeMinutes / 60).toFixed(1)),
                      riskLevel: aStarResult.metadata.hazardsAvoided.length > 0 ? 'LOW' : 'MEDIUM',
                      reasoning: [aStarResult.tacticalRecommendation || 'Route calculated via A* cost matrix.'],
                      mode: aStarResult.mode || 'gemini_ai_live',
                      timestamp: aStarResult.timestamp || new Date().toISOString(),
                    });
                  }
                  setShowAStarPanel(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-400 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Route</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Left: Basemap & ADD Controls Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        {/* Basemap Selector Dropdown / Pills */}
        <div className="flex items-center p-1 rounded-lg bg-slate-950/85 border border-slate-800 backdrop-blur-md text-xs font-mono shadow-xl">
          <Layers className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-1" />
          <button
            type="button"
            onClick={() => setBasemapType('dark')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              basemapType === 'dark' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Dark
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('satellite')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              basemapType === 'satellite' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ESRI Polar
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('tactical_canvas')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              basemapType === 'tactical_canvas' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Deep
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('osm')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              basemapType === 'osm' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OSM
          </button>
        </div>

        {/* ADD Vector Layer Toggle */}
        <button
          type="button"
          onClick={() => setShowAddLayers(!showAddLayers)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md transition-all shadow-xl ${
            showAddLayers
              ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle Antarctic Digital Database (ADD v7.4) coastline & grounding line vector overlays"
        >
          {addLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>ADD VECTOR</span>
          <span className={`w-2 h-2 rounded-full ${showAddLayers ? 'bg-cyan-400' : 'bg-slate-600'}`} />
        </button>

        {/* Waypoint Clustering Toggle */}
        <button
          type="button"
          onClick={() => setClusteringEnabled(!clusteringEnabled)}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md transition-all shadow-xl ${
            clusteringEnabled
              ? 'bg-slate-900/85 border-slate-700 text-slate-200'
              : 'bg-slate-950/80 border-slate-800 text-slate-500'
          }`}
          title="Toggle Waypoint Spatial Clustering"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>CLUSTERING</span>
          <span className={`text-[10px] ${clusteringEnabled ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
            {clusteringEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Gemini AI Route Optimizer Button & Status */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-lg border border-purple-800/80 text-xs font-mono shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleRunAStarOptimizer}
            disabled={optimizingAStar}
            className={`px-3 py-1 rounded font-bold font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              optimizingAStar
                ? 'bg-purple-900/70 text-purple-200 animate-pulse border border-purple-500'
                : aStarResult
                ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-cyan-700 text-white shadow-[0_0_14px_rgba(168,85,247,0.7)] border border-cyan-400'
                : 'bg-purple-950/90 text-purple-300 hover:bg-purple-900 hover:text-white border border-purple-800'
            }`}
            title="Analyze waypoints using A* cost engine & Gemini 3.8 Flash tactical decision AI"
          >
            {optimizingAStar ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            )}
            <span>
              {optimizingAStar
                ? 'A* CALCULATING...'
                : aStarResult
                ? 'AI ROUTE ACTIVE'
                : 'AI ROUTE OPTIMIZER'}
            </span>
          </button>

          {aStarResult && (
            <button
              type="button"
              onClick={() => setShowAStarPanel(!showAStarPanel)}
              className="px-2 py-0.5 rounded text-[10px] text-cyan-300 hover:text-white bg-cyan-950 border border-cyan-800 font-bold cursor-pointer"
              title="Toggle Recommendation Review Panel"
            >
              {showAStarPanel ? 'HIDE' : 'SHOW'}
            </button>
          )}

          {aStarError && (
            <span className="text-rose-400 text-[10px] max-w-[140px] truncate" title={aStarError}>
              {aStarError}
            </span>
          )}
        </div>
      </div>

      {/* Top Right: Zoom & Navigation Tools */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <div className="flex flex-col bg-slate-950/85 border border-slate-800 rounded-lg p-1 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => mapInstance?.zoomIn()}
            className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <button
            type="button"
            onClick={() => mapInstance?.zoomOut()}
            className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <span className="text-base font-bold leading-none block text-center">−</span>
          </button>
        </div>

        {/* GPS Re-center */}
        {onAcquireGps && (
          <button
            type="button"
            onClick={() => onAcquireGps()}
            className="p-2.5 rounded-lg bg-slate-950/85 border border-slate-800 text-slate-400 hover:text-cyan-300 backdrop-blur-md shadow-xl transition-all"
            title="Acquire GNSS Position"
            aria-label="Acquire GNSS Position"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>
        )}
      </div>

      {/* Bottom Right: Persistent Polar Attribution & GPS Disclaimer Footer */}
      <div className="absolute bottom-3 right-3 z-10">
        <PolarAttributionFooter 
          cacheStatus={addCacheStatus}
          gnssTelemetry={gnssTelemetry}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={dismissWarning}
        />
      </div>
    </div>
  );
};

export default PolarGISMap;
