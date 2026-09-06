import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Plus
} from 'lucide-react';
import { PolarRegion, PolarAsset, Expedition, ResearchStation, HazardZone, ActiveDistressAlert, RealtimeWeatherReading, Waypoint } from '../types';

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
  activeDistress?: ActiveDistressAlert | null;
  focusCoords?: { lat: number; lng: number } | null;
  googleMapsApiKey?: string;
  onOpenApiKeyModal?: () => void;
  customWaypoints?: Waypoint[];
  onOpenAddBase?: () => void;
  onOpenAddWaypoint?: () => void;
  onAddWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
  onDeleteWaypoint?: (waypointId: string, expeditionId?: string) => void;
  onUpdateWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
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
  stationWeather,
  expeditionWeather,
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
  activeDistress,
  focusCoords,
  googleMapsApiKey = '',
  onOpenApiKeyModal,
  customWaypoints = [],
  onOpenAddBase,
  onOpenAddWaypoint,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const userGpsMarkerRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'satellite' | 'dark' | 'terrain' | 'osm' | 'google_hybrid'>('satellite');

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

    // Create data layers
    layerGroupRef.current = L.layerGroup().addTo(map);
    userGpsMarkerRef.current = L.layerGroup().addTo(map);

    // Map Click Listener to Set Waypoint
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      const targetEl = e.originalEvent?.target as HTMLElement | null;
      if (targetEl && (targetEl.closest('.leaflet-marker-icon') || targetEl.closest('.leaflet-popup'))) {
        return;
      }
      
      const popupContent = `
        <div style="font-family: ui-monospace, monospace; padding: 4px; color: #0f172a; min-width: 180px;">
          <div style="font-weight: 800; font-size: 11px; color: #d97706; margin-bottom: 3px;">📍 MAP CLICK LOCATION</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            Lat: <strong>${clickLat.toFixed(4)}°</strong><br/>
            Lng: <strong>${clickLng.toFixed(4)}°</strong>
          </div>
          <button id="map-quick-add-btn" style="
            width: 100%;
            background: #d97706;
            color: #ffffff;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 11px;
            font-family: ui-monospace, monospace;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            + SET WAYPOINT HERE
          </button>
        </div>
      `;

      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);

      setTimeout(() => {
        const btn = document.getElementById('map-quick-add-btn');
        if (btn) {
          btn.onclick = () => {
            map.closePopup();
            if (onAddWaypoint) {
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
      }, 100);
    });

    setMapInstance(map);

    // Staged size invalidations to ensure proper tile loading across layout renders
    const timer1 = setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 50);
    const timer2 = setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 250);
    const timer3 = setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      try {
        map.remove();
      } catch (e) {}
      setMapInstance(null);
    };
  }, []);

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

    // 2. Active Expeditions and Waypoint Tracks
    expeditions.forEach((exp) => {
      const latlngs: [number, number][] = exp.waypoints.map((wp) => safeMercatorLatLng(wp.lat, wp.lng));
      if (latlngs.length > 1) {
        const routeLine = L.polyline(latlngs, {
          color: exp.phase === 'emergency_extraction' ? '#f43f5e' : '#38bdf8',
          weight: 3.5,
          dashArray: '6, 6',
          opacity: 0.85,
        });
        layerGroup.addLayer(routeLine);
      }

      // Render Waypoints along the convoy track
      exp.waypoints.forEach((wp, wpIdx) => {
        const [wpLat, wpLng] = safeMercatorLatLng(wp.lat, wp.lng);
        const wpCircle = L.circleMarker([wpLat, wpLng], {
          radius: wp.passed ? 4 : 6,
          color: wp.passed ? '#10b981' : wp.hazardNote ? '#f59e0b' : '#38bdf8',
          fillColor: wp.passed ? '#059669' : '#0284c7',
          fillOpacity: 0.85,
          weight: 2,
        });

        wpCircle.bindPopup(`
          <div style="font-family: sans-serif; min-width: 190px; color: #0f172a; padding: 2px;">
            <div style="font-weight: bold; font-size: 12px; color: #0369a1; margin-bottom: 2px;">WP-${wpIdx + 1}: ${wp.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Convoy: ${exp.name} (${exp.code})</div>
            <div style="font-size: 11px;"><strong>GPS:</strong> ${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}°</div>
            <div style="font-size: 11px;"><strong>Elevation:</strong> ${wp.elevationM}m</div>
            <div style="font-size: 11px; margin-bottom: 3px;"><strong>Status:</strong> ${wp.passed ? '✅ CLEARED' : '⏳ PENDING'}</div>
            ${wp.hazardNote ? `<div style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 3px 5px; border-radius: 4px; margin-bottom: 6px;">⚠️ ${wp.hazardNote}</div>` : ''}
            <div style="display: flex; gap: 4px; margin-top: 6px;">
              <button id="toggle-wp-${wp.id}" style="flex: 1; background: ${wp.passed ? '#f59e0b' : '#10b981'}; color: #ffffff; border: none; padding: 5px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
                ${wp.passed ? 'Mark Pending' : 'Mark Cleared'}
              </button>
              <button id="delete-wp-${wp.id}" style="background: #e11d48; color: #ffffff; border: none; padding: 5px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">
                🗑 Delete
              </button>
            </div>
          </div>
        `);

        wpCircle.on('popupopen', () => {
          const toggleBtn = document.getElementById(`toggle-wp-${wp.id}`);
          const deleteBtn = document.getElementById(`delete-wp-${wp.id}`);
          if (toggleBtn && onUpdateWaypoint) {
            toggleBtn.onclick = () => {
              onUpdateWaypoint({ ...wp, passed: !wp.passed }, exp.id);
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
        layerGroup.addLayer(wpCircle);
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
  }, [mapInstance, stations, assets, expeditions, hazards, activeDistress, region, customWaypoints, onSelectStation, onSelectAsset, onSelectExpedition]);

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
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/85 backdrop-blur border border-slate-800 p-2.5 rounded-lg shadow-xl text-[11px] font-mono text-slate-300 flex flex-wrap items-center gap-3 pointer-events-none">
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
        </div>
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
