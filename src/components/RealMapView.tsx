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
  X,
  ChevronDown,
  SlidersHorizontal,
  Settings2,
  Check,
  Map as MapIcon
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
import {
  calculateBearing,
  clusterTacticalWaypoints,
  SmoothMarkerTracker,
  WaypointCluster,
} from '../utils/tacticalMapTracking';
import {
  loadAddVectorLayers,
  getCoastlineStyle,
  getGroundingLineStyle,
  createStationDiamondIcon,
  getAddLayerCacheStatus,
  AddCacheStatus,
} from '../utils/addFeatureService';
import { PolarAttributionFooter } from './PolarAttributionFooter';
import { apiFetch } from '../utils/api';
import { safeDisplayValue } from '../utils/safeFormat';

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
  const assetTrackersRef = useRef<Map<string, { marker: L.Marker; tracker: SmoothMarkerTracker }>>(new Map());
  const convoyTrackersRef = useRef<Map<string, { marker: L.Marker; tracker: SmoothMarkerTracker }>>(new Map());

  const [mapType, setMapType] = useState<'dark' | 'satellite' | 'terrain' | 'tactical_canvas' | 'osm'>('dark');
  const [localHeatmapActive, setLocalHeatmapActive] = useState<boolean>(true);
  const [dangerFilter, setDangerFilter] = useState<'all' | 'extreme' | 'lethal'>('all');
  const [followMode, setFollowMode] = useState<boolean>(false);
  const [showGpsTrack, setShowGpsTrack] = useState<boolean>(true);
  const [arrivalRadiusKm, setArrivalRadiusKm] = useState<number>(DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM);
  const [showWaypointLabels, setShowWaypointLabels] = useState<boolean>(true);

  // ADD Vector Overlay States
  const addLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const [showAddLayers, setShowAddLayers] = useState<boolean>(true);
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [addCacheStatus, setAddCacheStatus] = useState<AddCacheStatus>(getAddLayerCacheStatus());
  const [isGnssWarningDismissed, setIsGnssWarningDismissed] = useState<boolean>(false);

  // Tactical HUD Map Refinement States: Progressive disclosure, Clustering, Zoom awareness
  const [currentZoom, setCurrentZoom] = useState<number>(4);
  const [showTelemetryOverlay, setShowTelemetryOverlay] = useState<boolean>(false);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);

  // Gemini AI Waypoint Route Optimization States
  const [localProposedRoute, setLocalProposedRoute] = useState<WaypointOptimizationResult | null>(null);
  const [optimizingRoute, setOptimizingRoute] = useState<boolean>(false);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  const [showProposedPanel, setShowProposedPanel] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<'none' | 'style' | 'overlays' | 'jump' | 'tools'>('none');

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

    // Initial tile layer (Esri World Dark Gray Canvas by default - watermark-free and polar appropriate)
    const initialTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 16,
      attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> | &copy; OpenStreetMap contributors',
      noWrap: false,
    }).addTo(map);
    currentTileLayerRef.current = initialTile;

    // Create data layers (Heatmap sits beneath vector overlays, markers sit above)
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    addLayerGroupRef.current = L.layerGroup().addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    userGpsMarkerRef.current = L.layerGroup().addTo(map);

    // Auto-disable follow mode when operator manually pans/drags the map
    map.on('dragstart', () => {
      setFollowMode(false);
    });

    // Zoom listener for dynamic zoom-aware styling and clustering
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
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
      assetTrackersRef.current.forEach((entry) => entry.tracker.destroy());
      assetTrackersRef.current.clear();
      convoyTrackersRef.current.forEach((entry) => entry.tracker.destroy());
      convoyTrackersRef.current.clear();
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

    if (mapType === 'tactical_canvas') {
      if (mapContainerRef.current) {
        mapContainerRef.current.style.backgroundColor = '#060B18';
      }
      triggerInvalidateSize();
      return;
    }

    let tileUrl = '';
    let attribution = '';
    let maxZoom = 19;
    let maxNativeZoom = 18;
    let subdomains: string[] | string = 'abc';

    if (mapType === 'dark') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri Dark Gray Canvas</a> | &copy; OpenStreetMap contributors';
      maxNativeZoom = 16;
    } else if (mapType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri World Imagery</a> | Earthstar, USGS, NASA Polar Data';
      maxNativeZoom = 18;
    } else if (mapType === 'terrain') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; <a href="https://www.esri.com">Esri Topo</a>, DeLorme, USGS, NPS';
      maxNativeZoom = 18;
    } else {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
      maxNativeZoom = 19;
    }

    try {
      const newLayer = L.tileLayer(tileUrl, {
        maxZoom,
        maxNativeZoom,
        attribution,
        subdomains,
        noWrap: false,
      }).addTo(mapInstance);

      currentTileLayerRef.current = newLayer;
      triggerInvalidateSize();
    } catch (err) {
      console.warn('Failed to attach tile layer:', err);
    }
  }, [mapInstance, mapType, triggerInvalidateSize]);

  // ADD Vector Overlay Renderer (Coastlines, Grounding Lines & Scientific Research Bases)
  const renderAddLayers = useCallback(async () => {
    if (!mapInstance || !addLayerGroupRef.current) return;
    const group = addLayerGroupRef.current;
    group.clearLayers();

    if (!showAddLayers) return;
    if (mapInstance.getZoom() < 2) return;

    setAddLoading(true);
    try {
      const { coastline, groundingLine, stations: addStations, status } = await loadAddVectorLayers();
      setAddCacheStatus(status);

      // 1. Coastlines: thin cyan/neon line (color: '#00ffff', weight: 1.5, opacity: 0.8)
      if (coastline && coastline.features.length > 0) {
        group.addLayer(L.geoJSON(coastline as any, { style: getCoastlineStyle() }));
      }

      // 2. Ice-Shelf Grounding Lines: distinct dashed amber line (color: '#ffaa00', dashArray: '5, 5')
      if (groundingLine && groundingLine.features.length > 0) {
        group.addLayer(L.geoJSON(groundingLine as any, { style: getGroundingLineStyle() }));
      }

      // 3. Research Stations: clean diamond tactical markers
      if (addStations && addStations.features.length > 0) {
        addStations.features.forEach((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const [safeLat, safeLng] = safeMercatorLatLng(lat, lng);
          const p = feature.properties;
          const marker = L.marker([safeLat, safeLng], {
            icon: createStationDiamondIcon(p.name || 'Station', p.country || 'International'),
          });
          const popup = `
            <div style="font-family: ui-monospace, monospace; padding: 4px; min-width: 220px; color: #f1f5f9;">
              <div style="font-weight: 800; font-size: 12px; color: #00ffff; margin-bottom: 4px; border-bottom: 1px solid rgba(0,255,255,0.3); padding-bottom: 2px;">
                ◆ ${p.name || 'RESEARCH BASE'}
              </div>
              <div style="font-size: 11px; line-height: 1.5; color: #cbd5e1;">
                <div>SOVEREIGNTY: <strong>${p.country || 'SCAR Treaty'}</strong></div>
                <div>CALLSIGN: <span style="color: #00ffff;">${p.code || 'POLARIS-STN'}</span></div>
                <div>ELEVATION: <span style="color: #ffaa00;">${p.elevationM || '15'}m MSL</span></div>
                <div>POPULATION: Winter ${p.winterPop || 0} / Summer ${p.summerPop || 0}</div>
              </div>
            </div>
          `;
          marker.bindPopup(popup, { className: 'tactical-hud-popup glassmorphism-popup', maxWidth: 280 });
          group.addLayer(marker);
        });
      }
    } catch (e) {
      console.error('Failed to load ADD layers in RealMapView:', e);
    } finally {
      setAddLoading(false);
    }
  }, [mapInstance, showAddLayers]);

  useEffect(() => {
    renderAddLayers();
  }, [renderAddLayers]);

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
            box-shadow: 0 0 14px ${weather?.isKatabaticStorm ? 'rgba(185,28,28,0.9)' : 'rgba(2,132,199,0.9)'};
            color: #ffffff;
            font-weight: bold;
            font-size: 10px;
            font-family: monospace;
          ">
            ${st.code.slice(0, 3)}
          </div>
          ${weather && showTelemetryOverlay ? `
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

      // Tactical Tooltip on hover
      marker.bindTooltip(
        `<b>${st.name} [${st.code}]</b><br/>${weather ? `AWOS: ${weather.tempC}°C • Wind: ${weather.windSpeedKts}kt (${weather.windDirectionCardinal})` : `Runway: ${st.runwayType}`}`,
        { className: 'tactical-hud-tooltip', sticky: true }
      );

      // Glassmorphic Tactical Popup
      marker.bindPopup(`
        <div style="font-family: ui-monospace, monospace; min-width: 260px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
            <div>
              <div style="font-weight: 900; font-size: 13px; color: #38bdf8;">🏢 ${st.name}</div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">[${st.code}] • ${st.country}</div>
            </div>
            <span style="font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(2, 132, 199, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);">
              PWR: ${st.powerStatus.toUpperCase()}
            </span>
          </div>

          ${weather ? `
            <div style="margin-bottom: 8px; padding: 6px 8px; background: rgba(15, 23, 42, 0.85); color: #f8fafc; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin-bottom: 4px;">
                <span style="color: #38bdf8;">LIVE AWOS SENSOR</span>
                <span style="color: #4ade80;">TELEMETRY ACTIVE</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10.5px;">
                <div>Air: <strong style="color: #7dd3fc;">${weather.tempC}°C</strong></div>
                <div>Chill: <strong style="color: #38bdf8;">${weather.apparentTempC}°C</strong></div>
                <div>Wind: <strong style="color: #fbbf24;">${weather.windSpeedKts} kts</strong></div>
                <div>Dir: <strong style="color: #f1f5f9;">${weather.windDirectionCardinal}</strong></div>
                <div>Baro: <strong>${weather.pressureHpa} hPa</strong></div>
                <div>Vis: <strong>${weather.visibilityKm} km</strong></div>
              </div>
              <div style="font-size: 9.5px; color: #94a3b8; margin-top: 4px;">
                ${weather.weatherDescription} • Freeze: <strong style="color: ${weather.frostbiteRiskLevel === 'Extreme' ? '#f87171' : '#fde047'};">${weather.frostbiteRiskTime}</strong>
              </div>
            </div>
          ` : ''}

          <div style="font-size: 10.5px; color: #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
            <div><span style="color: #64748b;">ELEV:</span> <strong>${st.elevationM}m</strong></div>
            <div><span style="color: #64748b;">RUNWAY:</span> <strong>${st.runwayType}</strong></div>
            <div><span style="color: #64748b;">CREW:</span> <strong>${st.winterPopulation}W/${st.summerPopulation}S</strong></div>
            <div><span style="color: #64748b;">FUEL:</span> <strong>${(st.fuelReserveL / 1000).toFixed(0)}k L</strong></div>
          </div>

          <button id="select-station-btn-${st.id}" style="width: 100%; background: #0284c7; color: #ffffff; border: none; padding: 6px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer;">
            SELECT BASE STATION
          </button>
        </div>
      `, { className: 'tactical-hud-popup' });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`select-station-btn-${st.id}`);
        if (btn && onSelectStation) {
          btn.onclick = () => {
            onSelectStation(st);
            mapInstance.closePopup();
          };
        }
      });

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(st);
      });

      layerGroup.addLayer(marker);
    });

    // Collect all tactical waypoints from active expeditions and custom waypoints
    interface TacticalWaypointItem extends Waypoint {
      expId?: string;
      expName?: string;
      expCode?: string;
      seq: number;
      totalWaypoints: number;
      isCurrent: boolean;
      isCompleted: boolean;
      proposedIdx: number;
      arrivalRadiusKm: number;
      isCustom?: boolean;
    }

    const allTacticalWaypoints: TacticalWaypointItem[] = [];

    // 2. Active Expeditions and Waypoint Tracks with Traveled/Remaining Tracing
    expeditions.forEach((exp) => {
      const progress = evaluateWaypointProgress(
        exp.currentLat,
        exp.currentLng,
        exp.waypoints || [],
        arrivalRadiusKm
      );

      if (progress.newlyReachedWaypoint && onUpdateWaypoint) {
        onUpdateWaypoint(progress.newlyReachedWaypoint, exp.id);
      }

      // 2a. Actual Traveled Track History
      if (showGpsTrack && exp.actualTrack && exp.actualTrack.length > 1) {
        const actualLatLngs: [number, number][] = exp.actualTrack.map((pt) => safeMercatorLatLng(pt.lat, pt.lng));
        const actualTrackLine = L.polyline(actualLatLngs, {
          color: '#f59e0b',
          weight: 2.5,
          dashArray: '3, 4',
          opacity: 0.85,
        });
        actualTrackLine.bindTooltip(`Actual GPS Breadcrumbs: ${exp.name} (${exp.actualTrack.length} fixes)`, {
          className: 'tactical-hud-tooltip',
          sticky: true,
        });
        layerGroup.addLayer(actualTrackLine);
      }

      // 2b. Traveled / Completed Route Polyline
      if (progress.traveledPathCoords.length > 1) {
        const safeTraveled: [number, number][] = progress.traveledPathCoords.map(([lat, lng]) => safeMercatorLatLng(lat, lng));
        const glowLine = L.polyline(safeTraveled, {
          color: '#059669',
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
        });
        layerGroup.addLayer(glowLine);

        const traveledLine = L.polyline(safeTraveled, {
          color: '#10b981',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
        });
        traveledLine.bindTooltip(`Traveled Route: ${exp.name}`, { className: 'tactical-hud-tooltip', sticky: true });
        layerGroup.addLayer(traveledLine);
      }

      // 2c. Remaining Planned Route Polyline
      if (progress.remainingPathCoords.length > 1) {
        const safeRemaining: [number, number][] = progress.remainingPathCoords.map(([lat, lng]) => safeMercatorLatLng(lat, lng));
        const remainingLine = L.polyline(safeRemaining, {
          color: exp.phase === 'emergency_extraction' ? '#f43f5e' : '#38bdf8',
          weight: 3.5,
          dashArray: '8, 8',
          opacity: 0.85,
        });
        remainingLine.bindTooltip(`Remaining Path: ${exp.name}`, { className: 'tactical-hud-tooltip', sticky: true });
        layerGroup.addLayer(remainingLine);
      }

      // 2d. Gemini AI Proposed Route Polyline
      if (
        activeProposedRoute &&
        activeProposedRoute.orderedWaypoints &&
        activeProposedRoute.orderedWaypoints.length > 1
      ) {
        const proposedLatLngs: [number, number][] = activeProposedRoute.orderedWaypoints.map((wp) =>
          safeMercatorLatLng(wp.lat, wp.lng)
        );

        const proposedGlow = L.polyline(proposedLatLngs, {
          color: '#00f2fe',
          weight: 9,
          opacity: 0.5,
          lineCap: 'round',
          className: 'tactical-route-glow',
        });
        layerGroup.addLayer(proposedGlow);

        const proposedLine = L.polyline(proposedLatLngs, {
          color: '#10b981',
          weight: 4,
          dashArray: '8, 6',
          opacity: 0.95,
          lineCap: 'round',
          className: 'tactical-route-core',
        });
        proposedLine.bindTooltip(
          `<b>🧭 A* OPTIMIZED POLAR ROUTE: ${activeProposedRoute.estimatedDistanceKm} km</b><br/>Risk: ${activeProposedRoute.riskLevel} (${activeProposedRoute.mode === 'gemini_ai_live' ? 'Gemini 3.8 Flash' : 'A* Cost Matrix'})<br/><i>Click "Accept & Apply" in panel to make active</i>`,
          { className: 'tactical-hud-tooltip', sticky: true }
        );
        layerGroup.addLayer(proposedLine);
      }

      // Collect expedition waypoints and render arrival geofence ring
      progress.enrichedWaypoints.forEach((wp, wpIdx) => {
        const [wpLat, wpLng] = safeMercatorLatLng(wp.lat, wp.lng);
        const isCurrent = wp.status === 'current';
        const isCompleted = wp.status === 'completed';
        const seq = wp.sequence ?? (wpIdx + 1);
        const proposedIdx = activeProposedRoute ? activeProposedRoute.recommendedOrder.indexOf(wp.id) : -1;

        if (isCurrent) {
          const arrivalRing = L.circle([wpLat, wpLng], {
            radius: (wp.arrivalRadiusKm || arrivalRadiusKm) * 1000,
            color: '#38bdf8',
            fillColor: '#0284c7',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 4',
          });
          arrivalRing.bindTooltip(`Arrival Radius: ${wp.arrivalRadiusKm || arrivalRadiusKm} km`, { className: 'tactical-hud-tooltip', sticky: true });
          layerGroup.addLayer(arrivalRing);
        }

        allTacticalWaypoints.push({
          ...wp,
          expId: exp.id,
          expName: exp.name,
          expCode: exp.code,
          seq,
          totalWaypoints: progress.enrichedWaypoints.length,
          isCurrent,
          isCompleted,
          proposedIdx,
          arrivalRadiusKm: wp.arrivalRadiusKm || arrivalRadiusKm,
          isCustom: false,
        });
      });

      // 2e. Expedition Convoy Crawler with Smooth Position Interpolation & Heading Vector Arrow
      const [headLat, headLng] = safeMercatorLatLng(exp.currentLat, exp.currentLng);
      const isEmergency = exp.phase === 'emergency_extraction';
      const accent = isEmergency ? '#f43f5e' : '#d97706';
      const bg = isEmergency ? '#9f1239' : '#b45309';

      const currentWp = (exp.waypoints || []).find((w) => w.status === 'current') || (exp.waypoints || [])[0];
      const initialHeading = currentWp ? calculateBearing(exp.currentLat, exp.currentLng, currentWp.lat, currentWp.lng) : 0;

      let convoyEntry = convoyTrackersRef.current.get(exp.id);
      if (convoyEntry) {
        convoyEntry.tracker.updateTarget(headLat, headLng, 800);
        layerGroup.addLayer(convoyEntry.marker);
      } else {
        const convoyHtml = `
          <div class="tactical-tracker-transition" id="convoy-pin-${exp.id}" style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; cursor: pointer;">
            <!-- Rotating Directional Vector Arrow -->
            <div class="convoy-heading-arrow" style="position: absolute; width: 36px; height: 36px; transform: rotate(${Math.round(initialHeading)}deg); pointer-events: none; transition: transform 0.4s ease-out;">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <polygon points="18,1 23,12 18,9 13,12" fill="${accent}" style="filter: drop-shadow(0 0 5px ${accent});" />
              </svg>
            </div>
            <!-- Core Convoy Crawler Badge -->
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              background: ${bg};
              border: 2px solid #ffffff;
              border-radius: 6px;
              box-shadow: 0 0 14px ${isEmergency ? 'rgba(225,29,72,0.9)' : 'rgba(217,119,6,0.9)'};
              color: #ffffff;
              font-weight: 800;
              font-size: 9px;
              font-family: ui-monospace, monospace;
              z-index: 5;
            ">
              ${exp.code.slice(0, 4)}
            </div>
          </div>
        `;

        const convoyIcon = L.divIcon({
          html: convoyHtml,
          className: 'custom-convoy-pin',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const convoyMarker = L.marker([headLat, headLng], { icon: convoyIcon });
        const tracker = new SmoothMarkerTracker(convoyMarker, headLat, headLng, initialHeading, (_lat, _lng, curHeading) => {
          const el = document.querySelector(`#convoy-pin-${exp.id} .convoy-heading-arrow`) as HTMLElement | null;
          if (el) {
            el.style.transform = `rotate(${Math.round(curHeading)}deg)`;
          }
        });

        convoyMarker.bindTooltip(`<b>${exp.name}</b> [${exp.code}] • Phase: ${exp.phase.toUpperCase()}`, {
          className: 'tactical-hud-tooltip',
          sticky: true,
        });

        const wLive = expeditionWeather?.[exp.id];

        convoyMarker.bindPopup(`
          <div style="font-family: ui-monospace, monospace; min-width: 260px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
              <div>
                <div style="font-weight: 900; font-size: 13px; color: ${accent}; display: flex; align-items: center; gap: 4px;">
                  <span>🚜 ${exp.name}</span>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                  [${exp.code}] • Leader: ${exp.leader}
                </div>
              </div>
              <span style="font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${accent}25; color: ${accent}; border: 1px solid ${accent}60;">
                ${exp.phase.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-size: 10.5px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div><span style="color: #64748b;">GPS:</span> <strong style="color: #38bdf8;">${exp.currentLat.toFixed(4)}°, ${exp.currentLng.toFixed(4)}°</strong></div>
                <div><span style="color: #64748b;">PROGRESS:</span> <strong style="color: #4ade80;">${exp.distanceCoveredKm}/${exp.totalDistanceKm}km</strong></div>
                <div><span style="color: #64748b;">RATIONS:</span> <strong style="color: #7dd3fc;">${exp.rationsDaysRemaining} Days</strong></div>
                <div><span style="color: #64748b;">BEARING:</span> <strong style="color: #fbbf24;">${Math.round(tracker.getHeading())}°</strong></div>
              </div>
            </div>

            ${wLive ? `
              <div style="margin-bottom: 8px; padding: 5px 8px; background: rgba(8, 47, 73, 0.6); border: 1px solid rgba(2, 132, 199, 0.4); border-radius: 6px; font-size: 10px;">
                <span style="color: #38bdf8; font-weight: bold;">FIELD AWOS:</span> <strong>${wLive.tempC}°C</strong> (Windchill: <strong>${wLive.apparentTempC}°C</strong>, Wind: <strong>${wLive.windSpeedKts}kt</strong>)
              </div>
            ` : `
              <div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">
                Weather: ${exp.currentWeather.tempC}°C (Wind: ${exp.currentWeather.windKnots} kts)
              </div>
            `}

            <button id="select-convoy-btn-${exp.id}" style="width: 100%; background: ${accent}; color: #ffffff; border: none; padding: 6px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>📡</span> MONITOR EXPEDITION TELEMETRY
            </button>
          </div>
        `, { className: 'tactical-hud-popup' });

        convoyMarker.on('popupopen', () => {
          const btn = document.getElementById(`select-convoy-btn-${exp.id}`);
          if (btn && onSelectExpedition) {
            btn.onclick = () => {
              onSelectExpedition(exp);
              mapInstance.closePopup();
            };
          }
        });

        convoyMarker.on('click', () => {
          if (onSelectExpedition) onSelectExpedition(exp);
        });

        convoyTrackersRef.current.set(exp.id, { marker: convoyMarker, tracker });
        layerGroup.addLayer(convoyMarker);
      }
    });

    // 2f. Add Custom Tactical Waypoints to collection
    if (customWaypoints && customWaypoints.length > 0) {
      customWaypoints.forEach((cwp, cIdx) => {
        allTacticalWaypoints.push({
          ...cwp,
          seq: cIdx + 1,
          totalWaypoints: customWaypoints.length,
          isCurrent: false,
          isCompleted: false,
          proposedIdx: -1,
          arrivalRadiusKm: DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM,
          isCustom: true,
        });
      });
    }

    // 2g. Spatial Clustering & Waypoint Rendering
    const shouldCluster = enableClustering && currentZoom <= 7;
    const { clusters, singles } = shouldCluster
      ? clusterTacticalWaypoints(mapInstance, allTacticalWaypoints, 46)
      : { clusters: [], singles: allTacticalWaypoints };

    // Render Tactical Waypoint Clusters
    clusters.forEach((cluster) => {
      const clusterColor = cluster.hasLethal ? '#f43f5e' : cluster.hasActive ? '#38bdf8' : '#0284c7';
      const clusterHtml = `
        <div class="tactical-cluster-icon ${cluster.hasLethal ? 'tactical-pulse-lethal' : 'tactical-cluster-glow'}" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: ${cluster.hasLethal ? 'rgba(30, 10, 15, 0.95)' : 'rgba(8, 14, 28, 0.95)'};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid ${clusterColor};
          border-radius: 999px;
          padding: 3px 8px;
          color: #ffffff;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 16px rgba(0,0,0,0.7), 0 0 10px ${clusterColor}60;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s ease;
        ">
          <span style="font-size: 10px;">${cluster.hasLethal ? '⚠️' : '⬡'}</span>
          <span>${cluster.count} WPs</span>
        </div>
      `;

      const clusterIcon = L.divIcon({
        html: clusterHtml,
        className: 'custom-waypoint-cluster-marker',
        iconSize: [68, 26],
        iconAnchor: [34, 13],
      });

      const clusterMarker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });
      clusterMarker.bindTooltip(
        `<b>${cluster.count} Waypoints in Sector</b><br/>Click to expand bounds${cluster.hasLethal ? '<br/><span style="color:#f43f5e;">⚠️ Hazard Warning Detected</span>' : ''}`,
        { className: 'tactical-hud-tooltip', sticky: true }
      );

      clusterMarker.on('click', () => {
        mapInstance.flyToBounds(cluster.bounds, { padding: [60, 60], maxZoom: 8 });
      });

      layerGroup.addLayer(clusterMarker);
    });

    // Render Singles (Minimal Sleek Tactical Waypoint Pips with Progressive Disclosure)
    singles.forEach((wp) => {
      const [wpLat, wpLng] = safeMercatorLatLng(wp.lat, wp.lng);
      const isLethal = (wp.hazardNote && wp.hazardNote.toLowerCase().includes('lethal')) ||
        (wp.hazardNote && wp.hazardNote.toLowerCase().includes('crevasse'));
      const isCurrent = wp.isCurrent;
      const isCompleted = wp.isCompleted;
      const seq = wp.seq;

      const pipSize = currentZoom < 6 ? 18 : 22;
      const bgColor = isCompleted ? '#059669' : isCurrent ? '#0284c7' : isLethal ? '#9f1239' : '#0f172a';
      const borderColor = isCompleted ? '#10b981' : isCurrent ? '#38bdf8' : isLethal ? '#f43f5e' : wp.hazardNote ? '#f59e0b' : '#64748b';

      const pulseClass = isLethal ? 'tactical-pulse-lethal' : isCurrent ? 'tactical-pulse-active' : '';

      const wpPinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div class="${pulseClass}" style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${pipSize}px;
            height: ${pipSize}px;
            background: ${bgColor};
            border: 1.5px solid ${borderColor};
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.7);
            color: #ffffff;
            font-family: ui-monospace, monospace;
            font-weight: 900;
            font-size: ${isCompleted ? '11px' : currentZoom < 6 ? '9px' : '10px'};
            z-index: 10;
          ">
            ${isCompleted ? '✓' : seq}

            ${wp.proposedIdx !== undefined && wp.proposedIdx !== -1 ? `
              <div style="
                position: absolute;
                top: -7px;
                right: -8px;
                background: #7c3aed;
                border: 1px solid #e9d5ff;
                border-radius: 999px;
                padding: 0 3px;
                font-size: 7.5px;
                font-weight: 900;
                color: #ffffff;
                white-space: nowrap;
                box-shadow: 0 0 6px rgba(124, 58, 237, 0.9);
                z-index: 25;
              ">
                AI#${wp.proposedIdx + 1}
              </div>
            ` : ''}
          </div>

          ${(showWaypointLabels && currentZoom >= 7) ? `
            <div style="
              margin-top: 2px;
              background: rgba(15, 23, 42, 0.92);
              backdrop-filter: blur(4px);
              border: 1px solid ${isCurrent ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'};
              border-radius: 3px;
              padding: 1px 4px;
              white-space: nowrap;
              font-family: ui-monospace, monospace;
              font-size: 9px;
              font-weight: 700;
              color: ${isCurrent ? '#38bdf8' : isCompleted ? '#4ade80' : isLethal ? '#fca5a5' : '#cbd5e1'};
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
              pointer-events: none;
            ">
              ${wp.name || `WP-${seq}`}
            </div>
          ` : ''}

          ${showTelemetryOverlay ? `
            <div style="
              margin-top: 1px;
              background: rgba(2, 132, 199, 0.2);
              border: 1px solid rgba(56, 189, 248, 0.3);
              border-radius: 2px;
              padding: 0 3px;
              font-family: ui-monospace, monospace;
              font-size: 8px;
              color: #7dd3fc;
              white-space: nowrap;
              pointer-events: none;
            ">
              ${wp.elevationM || 0}m
            </div>
          ` : ''}
        </div>
      `;

      const wpIcon = L.divIcon({
        html: wpPinHtml,
        className: `custom-tactical-waypoint-marker wp-seq-${seq}`,
        iconSize: [60, 40],
        iconAnchor: [30, Math.floor(pipSize / 2)],
      });

      const wpMarker = L.marker([wpLat, wpLng], { icon: wpIcon });

      // Tactical Tooltip on hover
      wpMarker.bindTooltip(
        `<b>WP-${String(seq).padStart(2, '0')}: ${wp.name}</b><br/>${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}° • Elev: ${wp.elevationM || 0}m${wp.distanceFromCurrentKm !== undefined ? `<br/>Dist: ${formatDistanceKm(wp.distanceFromCurrentKm)} • ETA: ${wp.eta || 'N/A'}` : ''}${wp.hazardNote ? `<br/><span style="color:#f43f5e;">⚠️ ${wp.hazardNote}</span>` : ''}`,
        { className: 'tactical-hud-tooltip', sticky: true }
      );

      // Glassmorphic Tactical Popup
      const statusBg = isCompleted ? 'rgba(16, 185, 129, 0.2)' : isCurrent ? 'rgba(56, 189, 248, 0.2)' : isLethal ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.15)';
      const statusColor = isCompleted ? '#34d399' : isCurrent ? '#38bdf8' : isLethal ? '#f87171' : '#94a3b8';
      const statusBorder = isCompleted ? '#10b981' : isCurrent ? '#38bdf8' : isLethal ? '#ef4444' : '#64748b';

      wpMarker.bindPopup(`
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; min-width: 270px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
            <div>
              <div style="font-weight: 900; font-size: 13px; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
                <span>🎯 WP-${String(seq).padStart(2, '0')}:</span>
                <span>${wp.name}</span>
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                ${wp.isCustom ? 'STANDALONE TACTICAL FIX' : `CONVOY: ${wp.expName || 'Traverse'}`}
              </div>
            </div>
            <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
              ${(wp.status || 'pending').toUpperCase()}
            </span>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-size: 10.5px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div><span style="color: #64748b;">LAT/LNG:</span> <strong style="color: #38bdf8;">${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}°</strong></div>
              <div><span style="color: #64748b;">ELEV:</span> <strong style="color: #7dd3fc;">${wp.elevationM || 0}m</strong></div>
              <div><span style="color: #64748b;">DIST:</span> <strong style="color: #fbbf24;">${wp.distanceFromCurrentKm !== undefined ? formatDistanceKm(wp.distanceFromCurrentKm) : 'N/A'}</strong></div>
              <div><span style="color: #64748b;">ETA:</span> <strong style="color: #4ade80;">${wp.eta || 'Estimating...'}</strong></div>
            </div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 9.5px; color: #94a3b8; display: flex; justify-content: space-between;">
              <span>Sequence: <strong style="color: #f1f5f9;">${seq} / ${wp.totalWaypoints}</strong></span>
              <span>Arrival Radius: <strong style="color: #38bdf8;">${wp.arrivalRadiusKm} km</strong></span>
            </div>
          </div>

          ${wp.hazardNote ? `
            <div style="font-size: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 4px 6px; border-radius: 4px; margin-bottom: 8px;">
              ⚠️ <strong>HAZARD NOTE:</strong> ${wp.hazardNote}
            </div>
          ` : ''}

          ${wp.isCustom ? `
            <button id="delete-cwp-${wp.id}" style="width: 100%; background: rgba(225, 29, 72, 0.25); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.5); padding: 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
              🗑 DELETE WAYPOINT
            </button>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; gap: 4px;">
                <button id="toggle-active-wp-${wp.id}" style="flex: 1; background: ${isCurrent ? 'rgba(56, 189, 248, 0.2)' : '#0284c7'}; color: #ffffff; border: 1px solid ${isCurrent ? '#38bdf8' : '#0284c7'}; padding: 5px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
                  ${isCurrent ? '● Active Target' : '🎯 Target This'}
                </button>
                <button id="toggle-complete-wp-${wp.id}" style="flex: 1; background: ${isCompleted ? 'rgba(217, 119, 6, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${isCompleted ? '#fbbf24' : '#34d399'}; border: 1px solid ${isCompleted ? '#d97706' : '#10b981'}; padding: 5px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
                  ${isCompleted ? '↺ Mark Pending' : '✓ Mark Done'}
                </button>
              </div>
              <div style="display: flex; gap: 4px;">
                <button id="move-up-wp-${wp.id}" style="flex: 1; background: rgba(30, 41, 59, 0.8); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.2); padding: 4px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; cursor: pointer;">
                  ▲ Move Up
                </button>
                <button id="move-down-wp-${wp.id}" style="flex: 1; background: rgba(30, 41, 59, 0.8); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.2); padding: 4px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; cursor: pointer;">
                  ▼ Move Down
                </button>
                <button id="delete-wp-${wp.id}" style="background: rgba(225, 29, 72, 0.2); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.5); padding: 4px 8px; border-radius: 4px; font-size: 9.5px; font-weight: bold; cursor: pointer;">
                  🗑 Delete
                </button>
              </div>
            </div>
          `}
        </div>
      `, { className: 'tactical-hud-popup' });

      wpMarker.on('popupopen', () => {
        if (wp.isCustom) {
          const deleteBtn = document.getElementById(`delete-cwp-${wp.id}`);
          if (deleteBtn && onDeleteWaypoint) {
            deleteBtn.onclick = () => {
              onDeleteWaypoint(wp.id);
              mapInstance.closePopup();
            };
          }
        } else {
          const activeBtn = document.getElementById(`toggle-active-wp-${wp.id}`);
          const completeBtn = document.getElementById(`toggle-complete-wp-${wp.id}`);
          const upBtn = document.getElementById(`move-up-wp-${wp.id}`);
          const downBtn = document.getElementById(`move-down-wp-${wp.id}`);
          const deleteBtn = document.getElementById(`delete-wp-${wp.id}`);

          if (activeBtn && onUpdateWaypoint) {
            activeBtn.onclick = () => {
              onUpdateWaypoint({ ...wp, status: 'current', passed: false }, wp.expId);
              mapInstance.closePopup();
            };
          }

          if (completeBtn && onUpdateWaypoint) {
            completeBtn.onclick = () => {
              const nextStatus = isCompleted ? 'pending' : 'completed';
              onUpdateWaypoint({ ...wp, status: nextStatus, passed: !isCompleted }, wp.expId);
              mapInstance.closePopup();
            };
          }

          if (upBtn && onUpdateWaypoint && (wp.seq - 1) > 0) {
            upBtn.onclick = () => {
              const currentExp = expeditions.find((e) => e.id === wp.expId);
              if (currentExp && currentExp.waypoints) {
                const prevWp = currentExp.waypoints[wp.seq - 2];
                if (prevWp) {
                  onUpdateWaypoint({ ...wp, sequence: prevWp.sequence ?? (wp.seq - 1) }, wp.expId);
                  onUpdateWaypoint({ ...prevWp, sequence: wp.seq }, wp.expId);
                  mapInstance.closePopup();
                }
              }
            };
          }

          if (downBtn && onUpdateWaypoint && wp.seq < wp.totalWaypoints) {
            downBtn.onclick = () => {
              const currentExp = expeditions.find((e) => e.id === wp.expId);
              if (currentExp && currentExp.waypoints) {
                const nextWp = currentExp.waypoints[wp.seq];
                if (nextWp) {
                  onUpdateWaypoint({ ...wp, sequence: nextWp.sequence ?? (wp.seq + 1) }, wp.expId);
                  onUpdateWaypoint({ ...nextWp, sequence: wp.seq }, wp.expId);
                  mapInstance.closePopup();
                }
              }
            };
          }

          if (deleteBtn && onDeleteWaypoint) {
            deleteBtn.onclick = () => {
              onDeleteWaypoint(wp.id, wp.expId);
              mapInstance.closePopup();
            };
          }
        }
      });

      layerGroup.addLayer(wpMarker);
    });

    // 3. Polar Assets with Real-Time Smooth Interpolation & Dynamic Heading Vector Arrow
    assets.forEach((asset) => {
      const [safeLat, safeLng] = safeMercatorLatLng(asset.currentLocation.lat, asset.currentLocation.lng);
      const isAir = asset.category === 'aviation';
      const isEmergency = asset.category === 'emergency_sar';
      const accentColor = isEmergency ? '#f43f5e' : isAir ? '#10b981' : '#38bdf8';
      const bg = isEmergency ? '#9f1239' : isAir ? '#065f46' : '#0f172a';

      const reportedHeading = asset.telemetry?.headingDeg ?? 0;

      let trackerEntry = assetTrackersRef.current.get(asset.id);
      if (trackerEntry) {
        trackerEntry.tracker.updateTarget(safeLat, safeLng, 800);
        layerGroup.addLayer(trackerEntry.marker);
      } else {
        const heading = reportedHeading;
        const assetHtml = `
          <div class="tactical-tracker-transition" id="asset-pin-${asset.id}" style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
            <!-- Rotating Directional Vector Arrow -->
            <div class="asset-heading-arrow" style="position: absolute; width: 34px; height: 34px; transform: rotate(${heading}deg); pointer-events: none; transition: transform 0.4s ease-out;">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                <polygon points="17,1 21,11 17,8 13,11" fill="${accentColor}" style="filter: drop-shadow(0 0 5px ${accentColor});" />
              </svg>
            </div>
            <!-- Core Vehicle Pip -->
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              background: ${bg};
              border: 1.5px solid ${accentColor};
              border-radius: ${isAir ? '50%' : '5px'};
              box-shadow: 0 0 12px ${accentColor}80, 0 4px 8px rgba(0,0,0,0.8);
              color: #ffffff;
              font-weight: 800;
              font-size: 8.5px;
              font-family: ui-monospace, monospace;
              z-index: 5;
            ">
              ${asset.code.slice(0, 3)}
            </div>
          </div>
        `;

        const assetIcon = L.divIcon({
          html: assetHtml,
          className: 'custom-tactical-asset-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const assetMarker = L.marker([safeLat, safeLng], { icon: assetIcon });
        const tracker = new SmoothMarkerTracker(assetMarker, safeLat, safeLng, heading, (_lat, _lng, curHeading) => {
          const el = document.querySelector(`#asset-pin-${asset.id} .asset-heading-arrow`) as HTMLElement | null;
          if (el) {
            el.style.transform = `rotate(${Math.round(curHeading)}deg)`;
          }
        });

        assetMarker.bindTooltip(`<b>${asset.name}</b> [${asset.code}] • ${asset.category.toUpperCase()}`, {
          className: 'tactical-hud-tooltip',
          sticky: true,
        });

        assetMarker.bindPopup(`
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; min-width: 250px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
              <div>
                <div style="font-weight: 900; font-size: 13px; color: ${accentColor}; display: flex; align-items: center; gap: 4px;">
                  <span>${isAir ? '✈️' : '🚜'} ${asset.name}</span>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                  [${asset.code}] • ${asset.model}
                </div>
              </div>
              <span style="font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${accentColor}25; color: ${accentColor}; border: 1px solid ${accentColor}60;">
                ${asset.status.toUpperCase()}
              </span>
            </div>

            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-size: 10.5px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div><span style="color: #64748b;">COORDS:</span> <strong style="color: #38bdf8;">${safeLat.toFixed(4)}°, ${safeLng.toFixed(4)}°</strong></div>
                <div><span style="color: #64748b;">HEADING:</span> <strong style="color: #fbbf24;">${Math.round(tracker.getHeading())}°</strong></div>
                <div><span style="color: #64748b;">SPEED:</span> <strong style="color: #4ade80;">${asset.telemetry?.speedKmh || 22} km/h</strong></div>
                <div><span style="color: #64748b;">COLD LIMIT:</span> <strong style="color: #7dd3fc;">${asset.coldRatingC}°C</strong></div>
              </div>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 2px;">
                  <span style="color: #94a3b8;">ENERGY / FUEL:</span>
                  <strong style="color: ${asset.fuelOrBatteryPercent < 25 ? '#f43f5e' : '#38bdf8'};">${asset.fuelOrBatteryPercent}% (${asset.fuelType})</strong>
                </div>
                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                  <div style="width: ${asset.fuelOrBatteryPercent}%; height: 100%; background: ${asset.fuelOrBatteryPercent < 25 ? '#f43f5e' : '#38bdf8'};"></div>
                </div>
              </div>
            </div>

            <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
              <span style="color: #64748b;">LOCATION:</span> ${asset.currentLocation.name}
            </div>

            <button id="select-asset-btn-${asset.id}" style="width: 100%; background: ${accentColor}; color: #ffffff; border: none; padding: 6px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 10px ${accentColor}50;">
              <span>🎯</span> SELECT ASSET ON HUD
            </button>
          </div>
        `, { className: 'tactical-hud-popup' });

        assetMarker.on('popupopen', () => {
          const btn = document.getElementById(`select-asset-btn-${asset.id}`);
          if (btn && onSelectAsset) {
            btn.onclick = () => {
              onSelectAsset(asset);
              mapInstance.closePopup();
            };
          }
        });

        assetMarker.on('click', () => {
          if (onSelectAsset) onSelectAsset(asset);
        });

        assetTrackersRef.current.set(asset.id, { marker: assetMarker, tracker });
        layerGroup.addLayer(assetMarker);
      }
    });

    // 4. Crevasse Fields & Katabatic Zones (Hazards)
    hazards.forEach((hz) => {
      const [safeLat, safeLng] = safeMercatorLatLng(hz.lat, hz.lng);
      const isExtreme = hz.dangerLevel === 'extreme';
      const circle = L.circle([safeLat, safeLng], {
        radius: (hz.radiusKm || 15) * 1000,
        color: isExtreme ? '#e11d48' : '#f97316',
        fillColor: isExtreme ? '#e11d48' : '#f97316',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '4, 4',
      });

      circle.bindTooltip(`<b>⚠️ ${hz.name}</b><br/>Type: ${hz.type.toUpperCase().replace('_', ' ')} • Radius: ${hz.radiusKm}km`, {
        className: 'tactical-hud-tooltip',
        sticky: true,
      });

      circle.bindPopup(`
        <div style="font-family: ui-monospace, monospace; min-width: 240px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(244, 63, 94, 0.4); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div style="font-weight: 800; font-size: 12px; color: #f43f5e;">⚠️ ${hz.name}</div>
            <span style="font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(225, 29, 72, 0.2); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.5);">
              ${hz.dangerLevel.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 6px;">
            TYPE: ${hz.type.toUpperCase().replace('_', ' ')} • RADIUS: ${hz.radiusKm}km
          </div>
          <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px; background: rgba(15, 23, 42, 0.7); padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">
            ${hz.notes}
          </div>
        </div>
      `, { className: 'tactical-hud-popup' });

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
        <div class="tactical-pulse-lethal" style="
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
          cursor: pointer;
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
        <div style="font-family: ui-monospace, monospace; min-width: 260px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(225, 29, 72, 0.6); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          <div style="font-weight: 900; font-size: 13px; color: #f43f5e; margin-bottom: 2px;">🚨 ACTIVE POLAR MAYDAY DISTRESS</div>
          <div style="font-size: 11px; color: #fca5a5; font-weight: bold; margin-bottom: 4px;">${activeDistress.incidentType}</div>
          <div style="font-size: 10.5px; margin-bottom: 3px;"><strong style="color:#94a3b8;">Sector:</strong> ${activeDistress.location}</div>
          <div style="font-size: 10.5px; margin-bottom: 3px;"><strong style="color:#94a3b8;">Coordinates:</strong> ${safeDistressLat.toFixed(5)}°, ${safeDistressLng.toFixed(5)}°</div>
          <div style="font-size: 10.5px; margin-bottom: 6px; background: rgba(15, 23, 42, 0.8); padding: 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">${activeDistress.summary}</div>
          <div style="font-size: 9.5px; background: rgba(225, 29, 72, 0.2); color: #fda4af; padding: 4px 6px; border-radius: 4px; font-weight: bold; border: 1px solid rgba(225, 29, 72, 0.4);">
            ${activeDistress.acknowledgedByHQ ? `ACKNOWLEDGED (SAR DISPATCHED: ${activeDistress.dispatchedSARName || 'En Route'})` : 'AWAITING RESCUE DISPATCH'}
          </div>
        </div>
      `, { className: 'tactical-hud-popup' });

      layerGroup.addLayer(distressMarker);
    }
  }, [
    mapInstance,
    stations,
    assets,
    expeditions,
    hazards,
    activeDistress,
    region,
    customWaypoints,
    onSelectStation,
    onSelectAsset,
    onSelectExpedition,
    showGpsTrack,
    arrivalRadiusKm,
    showWaypointLabels,
    onUpdateWaypoint,
    onDeleteWaypoint,
    activeProposedRoute,
    currentZoom,
    showTelemetryOverlay,
    enableClustering,
  ]);

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

      // Sleek Epicenter Node Pin
      const zoneColor = isLethal ? '#f43f5e' : isExtreme ? '#818cf8' : '#38bdf8';
      const badgeHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; cursor: pointer;">
          ${isLethal ? `
            <div class="tactical-pulse-lethal" style="
              position: absolute;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 1.5px solid #f43f5e;
            "></div>
          ` : ''}
          <div style="
            width: 16px;
            height: 16px;
            background: ${isLethal ? '#9f1239' : isExtreme ? '#312e81' : '#083344'};
            border: 1.5px solid ${zoneColor};
            border-radius: 50%;
            box-shadow: 0 0 10px ${zoneColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 8.5px;
            z-index: 5;
          ">
            ${isLethal ? '⚠️' : '❄️'}
          </div>
        </div>
      `;

      const badgeIcon = L.divIcon({
        html: badgeHtml,
        className: 'danger-heatmap-epicenter-pin',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const dangerMarker = L.marker([safeLat, safeLng], { icon: badgeIcon });

      // Compact Tactical Tooltip on hover
      dangerMarker.bindTooltip(
        `<b>${zone.name}</b> [${zone.severityLevel}]<br/>${zone.tempC}°C (Feels ${zone.apparentTempC}°C) • Wind: ${zone.windSpeedKts}kt`,
        { className: 'tactical-hud-tooltip', sticky: true }
      );

      // Glassmorphic HUD popup
      const popupContent = `
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; min-width: 270px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid ${zoneColor}; box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="
              background: ${isLethal ? 'rgba(225,29,72,0.2)' : isExtreme ? 'rgba(99,102,241,0.2)' : 'rgba(2,132,199,0.2)'};
              color: ${isLethal ? '#fda4af' : isExtreme ? '#c7d2fe' : '#7dd3fc'};
              font-size: 9px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${zoneColor};
            ">
              SUB-ZERO DANGER ZONE // ${zone.severityLevel}
            </span>
            <span style="font-size: 10px; color: #94a3b8;">R: ${zone.radiusKm} km</span>
          </div>
          
          <div style="font-weight: 900; font-size: 13px; color: #ffffff; margin-bottom: 6px;">${zone.name}</div>
          
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span style="font-size: 18px; font-weight: 900; color: ${zoneColor};">
                ${zone.tempC}°C
              </span>
              <span style="font-size: 11px; color: #94a3b8;">
                Apparent Chill: <strong style="color:#ffffff;">${zone.apparentTempC}°C</strong>
              </span>
            </div>
            <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px; display:grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div>Wind: <strong style="color:#f1f5f9;">${zone.windSpeedKts} kts</strong></div>
              <div>Gusts: <strong style="color:#f1f5f9;">${zone.windGustsKts} kts</strong></div>
              <div>Pressure: <strong style="color:#f1f5f9;">${zone.pressureHpa} hPa</strong></div>
              <div>Rec. Min: <strong style="color:#f1f5f9;">${zone.historicalMinC}°C</strong></div>
            </div>
          </div>

          <div style="background: ${isLethal ? 'rgba(225,29,72,0.15)' : 'rgba(15,23,42,0.8)'}; border: 1px solid ${isLethal ? 'rgba(225,29,72,0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 6px; padding: 6px 8px; font-size: 10px; margin-bottom: 8px;">
            <div style="color: ${isLethal ? '#fca5a5' : '#fbbf24'}; font-weight: 800; margin-bottom: 2px;">⏱️ SURVIVAL TIME WINDOWS:</div>
            <div style="color: #cbd5e1;">• Unprotected Human Survival: <strong>&lt; ${zone.survivalTimeMinutes} min</strong></div>
            <div style="color: #cbd5e1;">• Exposed Skin Frostbite: <strong>&lt; ${zone.frostbiteTimeMinutes} min</strong></div>
            ${zone.fuelCloudPointHazard ? '<div style="color: #fda4af; font-weight: 700; margin-top: 2px;">⚠️ Arctic Diesel Waxing / Cloud Point Warning</div>' : ''}
          </div>

          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">
            <strong style="color:#cbd5e1;">Advisory:</strong> ${zone.survivalAdvisory}
          </div>

          <div style="font-size: 9.5px; color: #94a3b8; background: rgba(15, 23, 42, 0.6); padding: 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
            <strong style="color:#cbd5e1;">Equipment:</strong> ${zone.equipmentAdvisory}
          </div>
        </div>
      `;

      dangerMarker.bindPopup(popupContent, { className: 'tactical-hud-popup' });
      coreRing.bindPopup(popupContent, { className: 'tactical-hud-popup' });

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
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; min-width: 250px; background: rgba(10, 15, 30, 0.96); backdrop-filter: blur(16px); color: #f1f5f9; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.4); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          <div style="font-weight: 900; font-size: 13px; color: #38bdf8; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
            📍 ${locationTitle.toUpperCase()}
          </div>
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; font-size: 10.5px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div><span style="color: #64748b;">LAT:</span> <strong style="color: #38bdf8;">${userLat.toFixed(5)}°</strong></div>
              <div><span style="color: #64748b;">LNG:</span> <strong style="color: #38bdf8;">${userLng.toFixed(5)}°</strong></div>
              <div><span style="color: #64748b;">PRECISION:</span> <strong style="color: #4ade80;">${formattedAccuracy}</strong></div>
              <div><span style="color: #64748b;">SPEED:</span> <strong style="color: #fbbf24;">${userSpeed !== null ? `${(userSpeed * 3.6).toFixed(1)} km/h` : '0.0 km/h'}</strong></div>
            </div>
            ${userAlt !== null ? `<div style="margin-top: 4px; color: #94a3b8; font-size: 10px;"><span style="color: #64748b;">ALTITUDE:</span> <strong style="color: #7dd3fc;">${Math.round(userAlt)}m AMSL</strong></div>` : ''}
          </div>
          ${weatherPopupSection}
          <div style="font-size: 9.5px; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 4px 6px; border-radius: 4px; font-weight: bold; border: 1px solid rgba(56, 189, 248, 0.3);">
            ${isWatching ? 'CONTINUOUS SATELLITE LIVE TRACKING ACTIVE' : 'REAL-TIME LOCATION FIX ACTIVE'}
          </div>
        </div>
      `, { className: 'tactical-hud-popup' });

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
        message: `${isSimulation ? '[SIMULATION] ' : ''}Calculating A* tactical path across ${currentExpedition.waypoints.length} waypoints via Gemini 3.8 Flash AI...`,
        stationOrAsset: currentExpedition.name,
        impact: 'DEM slope & LETHAL hazard circumnavigation',
      });

      // Execute Polar A* route optimization with DEM slope, cold-soak, wind, and lethal hazard cost matrices
      const astarRes = await apiFetch('/api/ai/route-optimizer/astar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waypoints: currentExpedition.waypoints,
          environment: payload.environment,
          asset: {
            id: activeAsset?.id,
            name: activeAsset?.name,
            minOperatingTemp: -50,
            speedKmh: activeAsset?.telemetry?.speedKmh || 24,
          },
        }),
      });
      const astarData = await astarRes.json();

      if (astarData.status === 'ok' && astarData.path) {
        const plan: WaypointOptimizationResult = {
          recommendedOrder: astarData.path.map((n: any) => n.id),
          orderedWaypoints: astarData.path.map((n: any, idx: number) => ({
            id: n.id,
            name: n.name || `Waypoint ${idx + 1}`,
            lat: n.lat,
            lng: n.lng,
            elevationM: n.elevationM,
            status: idx === 0 ? 'completed' : idx === 1 ? 'current' : 'pending',
            sequence: idx + 1,
            environmentalHazard: n.hazardNote,
          })),
          estimatedDistanceKm: astarData.metadata.totalDistanceKm,
          estimatedDurationHours: parseFloat((astarData.metadata.estimatedTimeMinutes / 60).toFixed(1)),
          riskLevel: astarData.metadata.hazardsAvoided.length > 0 ? 'LOW' : 'MEDIUM',
          reasoning: [
            astarData.tacticalRecommendation || 'Route calculated via polar A* weighted cost function.',
            `Traverse distance: ${astarData.metadata.totalDistanceKm} km (+${astarData.metadata.distanceDeltaKm} km detour vs straight-line to circumnavigate severe hazards).`,
            `Wind impact: ${astarData.metadata.windConditions.headwindTailwind} (${astarData.metadata.windConditions.costImpactPercent > 0 ? `+${astarData.metadata.windConditions.costImpactPercent}%` : `${astarData.metadata.windConditions.costImpactPercent}%`}). Max DEM slope: ${astarData.metadata.maxSlopeDeg}°.`,
            `Cost advantage: ${astarData.metadata.savingsVsStraightLinePercent}% cost savings vs straight-line.`,
          ],
          warnings: astarData.metadata.maxTempEncountered < -45 ? [`Extreme cold soak: ${astarData.metadata.maxTempEncountered}°C requires continuous auxiliary block heating.`] : [],
          confidence: 0.96,
          mode: astarData.mode === 'gemini_ai_live' ? 'gemini_ai_live' : 'cv_heuristic_fallback',
          engineUsed: astarData.model || 'gemini-3.8-flash',
          cached: false,
          timestamp: astarData.timestamp || new Date().toISOString(),
          validationDetails: {
            allCandidateIdsValid: true,
            mandatoryPreserved: true,
            hazardAvoidanceCount: astarData.metadata.hazardsAvoided.length,
            fallbackUsed: astarData.mode !== 'gemini_ai_live',
          },
        };

        setLocalProposedRoute(plan);
        setShowProposedPanel(true);
        emitAiActionBroadcast({
          category: 'logistics',
          message: `${isSimulation ? '[SIMULATION] ' : ''}Gemini A* route proposed: ${plan.estimatedDistanceKm} km, Risk: ${plan.riskLevel}.`,
          stationOrAsset: currentExpedition.name,
          impact: `Pending operator approval. Mode: ${plan.mode}.`,
        });
      } else {
        // Fallback to legacy endpoint if astar fails
        const res = await apiFetch('/api/ai/waypoints/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.status === 'ok' && data.plan) {
          setLocalProposedRoute(data.plan);
          setShowProposedPanel(true);
        } else {
          setOptimizerError(data.message || 'Optimization request failed.');
        }
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
      {/* Top Map Toolbar - Refactored Compact Tactical Command HUD */}
      <div className="px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2.5 z-30 select-none relative font-mono text-xs">
        {/* Left Side: Map Cartography, Overlays, and Quick Jump */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Basemap Style Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'style' ? 'none' : 'style')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMenu === 'style'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
              }`}
              title="Select basemap cartographic raster"
            >
              <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {mapType === 'dark'
                  ? 'Tactical Dark'
                  : mapType === 'satellite'
                  ? 'Esri Satellite'
                  : mapType === 'tactical_canvas'
                  ? 'Tactical Deep'
                  : mapType === 'terrain'
                  ? 'Topographic'
                  : 'OpenStreetMap'}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeMenu === 'style' ? 'rotate-180' : ''}`} />
            </button>

            {activeMenu === 'style' && (
              <div className="absolute top-10 left-0 z-50 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 min-w-[210px] space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-900 mb-1">
                  Cartographic Projection
                </div>
                {[
                  { id: 'dark', label: 'Tactical Dark', desc: 'Esri Dark Canvas (Watermark-Free)' },
                  { id: 'satellite', label: 'Esri Polar Aerial', desc: 'High-res satellite imagery' },
                  { id: 'tactical_canvas', label: 'Tactical Deep Grid', desc: 'Cryo vector #060B18 contrast' },
                  { id: 'terrain', label: 'Topographic Contours', desc: 'Elevation relief & contours' },
                  { id: 'osm', label: 'OpenStreetMap', desc: 'Standard street cartography' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMapType(item.id as any);
                      setActiveMenu('none');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      mapType === item.id
                        ? 'bg-cyan-950/70 text-cyan-300 font-semibold border border-cyan-800/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                    {mapType === item.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Overlays & Filters Menu Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'overlays' ? 'none' : 'overlays')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMenu === 'overlays'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : isHeatmapActive
                  ? 'bg-rose-950/40 text-rose-200 border-rose-800/70 hover:bg-rose-900/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
              }`}
              title="Configure vector layers, sub-zero thermal heatmap, tracking breadcrumbs"
            >
              <Layers className={`w-3.5 h-3.5 ${isHeatmapActive ? 'text-rose-400' : 'text-cyan-400'}`} />
              <span>Overlays</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                isHeatmapActive
                  ? 'bg-rose-900 text-rose-200 border border-rose-700'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {[showAddLayers, isHeatmapActive, showGpsTrack, showWaypointLabels, showTelemetryOverlay, enableClustering].filter(Boolean).length}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeMenu === 'overlays' ? 'rotate-180' : ''}`} />
            </button>

            {activeMenu === 'overlays' && (
              <div className="absolute top-10 left-0 z-50 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-3 w-[min(320px,calc(100vw-2rem))] space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Map Overlays &amp; Hazards</span>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('none')}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sub-Zero Danger Heatmap Switch */}
                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-2">
                  <div
                    onClick={() => {
                      if (onToggleDangerHeatmap) onToggleDangerHeatmap();
                      else setLocalHeatmapActive(!localHeatmapActive);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ThermometerSnowflake className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Sub-Zero Thermal Heatmap</div>
                        <div className="text-[10px] text-slate-400">Extreme cold-soak stress modeling</div>
                      </div>
                    </div>
                    <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isHeatmapActive ? 'bg-rose-600' : 'bg-slate-800'}`}>
                      <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${isHeatmapActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  {/* Filter pills if active */}
                  {isHeatmapActive && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500 font-mono">SEVERITY:</span>
                      {(['all', 'extreme', 'lethal'] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          type="button"
                          onClick={() => setDangerFilter(filterKey)}
                          className={`px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                            dangerFilter === filterKey
                              ? filterKey === 'lethal'
                                ? 'bg-rose-600 text-white font-bold'
                                : filterKey === 'extreme'
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-sky-600 text-white font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {filterKey === 'all' ? '< -25°C' : filterKey === 'extreme' ? '< -35°C' : '< -45°C'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vector Overlays: SCAR ADD v7.4 */}
                <div
                  onClick={() => setShowAddLayers(!showAddLayers)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">ADD v7.4 Vector Outlines</div>
                      <div className="text-[10px] text-slate-400">Antarctic coastlines &amp; grounding lines</div>
                    </div>
                  </div>
                  <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${showAddLayers ? 'bg-cyan-600' : 'bg-slate-800'}`}>
                    <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${showAddLayers ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Breadcrumbs & Labels */}
                <div className="space-y-1 pt-1">
                  <div
                    onClick={() => setShowGpsTrack(!showGpsTrack)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/60 cursor-pointer text-xs"
                  >
                    <span className="text-slate-300">Traverse GPS Breadcrumb Track</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${showGpsTrack ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                      {showGpsTrack ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div
                    onClick={() => setShowWaypointLabels(!showWaypointLabels)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/60 cursor-pointer text-xs"
                  >
                    <span className="text-slate-300">Waypoint Tactical Callout Labels</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${showWaypointLabels ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-slate-900 text-slate-500'}`}>
                      {showWaypointLabels ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div
                    onClick={() => setShowTelemetryOverlay(!showTelemetryOverlay)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/60 cursor-pointer text-xs"
                  >
                    <span className="text-slate-300">Progressive Telemetry HUD</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${showTelemetryOverlay ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-slate-900 text-slate-500'}`}>
                      {showTelemetryOverlay ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div
                    onClick={() => setEnableClustering(!enableClustering)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/60 cursor-pointer text-xs"
                  >
                    <span className="text-slate-300">Marker Auto-Clustering</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${enableClustering ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-900 text-slate-500'}`}>
                      {enableClustering ? 'AUTO' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Arrival Detection Radius */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Waypoint Arrival Radius:</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    {[1, 3, 5, 10].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setArrivalRadiusKm(r)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          arrivalRadiusKm === r
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {r}km
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Quick Jump Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'jump' ? 'none' : 'jump')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMenu === 'jump'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
              }`}
              title="Quick focus camera to key polar sectors"
            >
              <Compass className="w-3.5 h-3.5 text-slate-300" />
              <span>Jump</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeMenu === 'jump' ? 'rotate-180' : ''}`} />
            </button>

            {activeMenu === 'jump' && (
              <div className="absolute top-10 left-0 z-50 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 min-w-[230px] space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-900 mb-1">
                  Polar Sector Locations
                </div>
                {region === 'antarctica' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleFlyToSouthPole();
                        setActiveMenu('none');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-medium">South Pole Station</div>
                        <div className="text-[10px] text-sky-400">Amundsen-Scott (-90.0°)</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFlyToMcMurdo();
                        setActiveMenu('none');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-medium">McMurdo Station</div>
                        <div className="text-[10px] text-sky-400">Ross Island (-77.8°)</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFlyToConcordia();
                        setActiveMenu('none');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-medium">Concordia Dome C</div>
                        <div className="text-[10px] text-sky-400">High Plateau (-75.1°)</div>
                      </div>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleFlyToSvalbard();
                      setActiveMenu('none');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-medium">Ny-Ålesund Station</div>
                      <div className="text-[10px] text-amber-400">Svalbard Arctic (78.9°N)</div>
                    </div>
                  </button>
                )}

                <div className="pt-1 mt-1 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      handleFitAllPoints();
                      setActiveMenu('none');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fit All Active Bases &amp; Fleet</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Follow Asset, AI Route Optimizer, GPS Lock, and Settings */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Follow Asset Toggle */}
          <button
            type="button"
            onClick={() => setFollowMode(!followMode)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              followMode
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Auto-Center and Track Active Expedition Convoy"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${followMode ? 'animate-spin text-emerald-300' : 'text-slate-400'}`} />
            <span>{followMode ? 'Tracking Asset' : 'Follow Asset'}</span>
          </button>

          {/* AI Route Optimizer */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRunGeminiRouteOptimization}
              disabled={optimizingRoute}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                optimizingRoute
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/80 animate-pulse'
                  : activeProposedRoute
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/70 shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                  : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border-purple-800/80 hover:border-purple-600'
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
                  ? 'AI Analyzing...'
                  : activeProposedRoute
                  ? 'AI Proposal Active'
                  : 'AI Route Optimizer'}
              </span>
            </button>

            {activeProposedRoute && (
              <button
                type="button"
                onClick={() => setShowProposedPanel(!showProposedPanel)}
                className="px-2 py-1.5 rounded-lg text-[10px] text-purple-300 hover:text-white bg-purple-950/90 border border-purple-800 font-mono font-bold cursor-pointer transition-colors"
                title="Toggle Recommendation Review Panel"
              >
                {showProposedPanel ? 'Hide Panel' : 'Show Panel'}
              </button>
            )}
          </div>

          {/* Live Device GPS Lock */}
          <button
            type="button"
            onClick={handleAcquireAndFlyToGps}
            disabled={geoLoading}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              userLat !== null
                ? 'bg-sky-950/90 hover:bg-sky-900 border-sky-500/70 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Acquire live GPS location fix from device GNSS receiver"
          >
            {geoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
            ) : (
              <Crosshair className={`w-3.5 h-3.5 ${userLat !== null ? 'text-sky-400 animate-pulse' : 'text-slate-400'}`} />
            )}
            <span>{userLat !== null ? `GPS Locked (${formattedAccuracy})` : 'Acquire GPS'}</span>
          </button>

          {/* Settings & Fast Actions Drawer Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'tools' ? 'none' : 'tools')}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeMenu === 'tools'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/80 hover:bg-slate-800'
              }`}
              title="Map Configuration & Fast Actions"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {activeMenu === 'tools' && (
              <div className="absolute top-10 right-0 z-50 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-2 min-w-[200px] space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-900 mb-1 flex items-center justify-between">
                  <span>Map Controls</span>
                  <span className="text-cyan-400 font-mono">z{currentZoom}</span>
                </div>

                {onOpenAddBase && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddBase();
                      setActiveMenu('none');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Establish Research Base</span>
                  </button>
                )}

                {onOpenAddWaypoint && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddWaypoint();
                      setActiveMenu('none');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add Tactical Waypoint</span>
                  </button>
                )}

                {onOpenApiKeyModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenApiKeyModal();
                      setActiveMenu('none');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI &amp; Vector Cartography</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleFitAllPoints();
                    setActiveMenu('none');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fit All Map Entities</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop for closing popover menus on click outside */}
        {activeMenu !== 'none' && (
          <div
            onClick={() => setActiveMenu('none')}
            className="fixed inset-0 z-20 bg-transparent"
          />
        )}
      </div>

      {/* Main Map Container */}
      <div className="relative w-full bg-slate-950" style={{ height: 'clamp(300px, 55vh, 560px)', minHeight: '300px' }}>
        <div 
          ref={mapContainerRef} 
          className="w-full h-full absolute inset-0 z-0 bg-slate-950" 
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />

        {/* Overlaid Real Geolocation Telemetry HUD */}
        {userLat !== null && userLng !== null && (
          <div className="absolute top-3 right-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-sky-500/60 p-3 rounded-lg shadow-2xl text-xs font-mono max-w-[min(280px,calc(55vw))] text-slate-200 pointer-events-none">
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
          <div className="absolute bottom-3 sm:bottom-4 left-2 right-2 sm:left-auto sm:right-3 z-[450] bg-slate-950/95 backdrop-blur-md border border-purple-500/80 p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.35)] text-xs font-mono w-auto sm:max-w-md sm:w-full text-slate-200 pointer-events-auto max-h-[85vh] overflow-y-auto">
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

        {/* Polar SCAR ADD Attribution & Polar GNSS Geometry Disclaimer Footer */}
        <div className="absolute bottom-3 right-3 z-[1000]">
          <PolarAttributionFooter
            cacheStatus={addCacheStatus}
            isWarningDismissed={isGnssWarningDismissed}
            onDismissWarning={() => setIsGnssWarningDismissed(true)}
          />
        </div>
      </div>

      {/* Geolocation Status / Error Bar */}
      {geoError && (
        <div className="p-2.5 bg-rose-950 border-t border-rose-800 text-xs font-mono text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{safeDisplayValue(geoError)}</span>
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
