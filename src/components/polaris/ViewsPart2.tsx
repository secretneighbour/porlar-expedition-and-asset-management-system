import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Wallet, TrendingUp, Compass, FileText, Download, Sun, Moon,
  ShieldCheck, ShieldAlert, ArrowRight, Snowflake, Radio, Layers, Navigation, MapPin, Zap,
  RefreshCw, Smartphone, Laptop, Eye, Plus, ThermometerSnowflake, Crosshair, Globe,
  CheckCircle2, Trash2, Fuel, Key, Clock, Archive, Bot
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  FONT_HEAD, FONT_BODY, STATIONS, ROLES, currency, badgeColors, csvDownload, emitAiActionBroadcast
} from '../../data/polarisData';
import {
  Badge, StatCard, Toolbar, Table, PageHeader, Modal, Field
} from './SharedUI';
import { SmartRouteOptimizer } from './SmartRouteOptimizer';
import { RealMapView } from '../RealMapView';
import { AddBaseModal } from '../AddBaseModal';
import { AddWaypointModal } from '../AddWaypointModal';
import {
  ResearchStation, Waypoint, PolarAsset, Expedition, HazardZone, PolarRegion
} from '../../types';
import { getSubZeroDangerZones, SubZeroDangerZone } from '../../utils/dangerZones';
import { AiActionLogsPanel } from './AiActionLogsPanel';

const DEFAULT_RESEARCH_STATIONS: ResearchStation[] = [
  {
    id: 'st-maitri',
    name: 'Maitri Station',
    code: 'MAI',
    country: 'India (NCPOR)',
    lat: -70.7667,
    lng: 11.7333,
    elevationM: 117,
    region: 'antarctica',
    winterPopulation: 25,
    summerPopulation: 65,
    runwayType: 'Skiway (Snow)',
    fuelReserveL: 450000,
    powerStatus: 'Nominal',
  },
  {
    id: 'st-bharati',
    name: 'Bharati Station',
    code: 'BHA',
    country: 'India (NCPOR)',
    lat: -69.4069,
    lng: 76.1906,
    elevationM: 35,
    region: 'antarctica',
    winterPopulation: 23,
    summerPopulation: 47,
    runwayType: 'Helipad Only',
    fuelReserveL: 520000,
    powerStatus: 'Nominal',
  },
  {
    id: 'st-himadri',
    name: 'Himadri Research Station',
    code: 'HIM',
    country: 'India (NCPOR)',
    lat: 78.9231,
    lng: 11.9281,
    elevationM: 15,
    region: 'arctic',
    winterPopulation: 8,
    summerPopulation: 22,
    runwayType: 'Hard Surface',
    fuelReserveL: 120000,
    powerStatus: 'Nominal',
  },
  {
    id: 'st-concordia',
    name: 'Concordia Station (Dome C)',
    code: 'CON',
    country: 'France / Italy (IPEV/PNRA)',
    lat: -75.1000,
    lng: 123.3333,
    elevationM: 3233,
    region: 'antarctica',
    winterPopulation: 13,
    summerPopulation: 80,
    runwayType: 'Skiway (Snow)',
    fuelReserveL: 850000,
    powerStatus: 'Nominal',
  },
  {
    id: 'st-mcmurdo',
    name: 'McMurdo Station',
    code: 'MCM',
    country: 'United States (USAP/NSF)',
    lat: -77.8460,
    lng: 166.6680,
    elevationM: 24,
    region: 'antarctica',
    winterPopulation: 150,
    summerPopulation: 1000,
    runwayType: 'Blue Ice Runway',
    fuelReserveL: 3200000,
    powerStatus: 'Nominal',
  },
  {
    id: 'st-southpole',
    name: 'Amundsen-Scott South Pole Station',
    code: 'ASP',
    country: 'United States (USAP/NSF)',
    lat: -90.0000,
    lng: 0.0000,
    elevationM: 2835,
    region: 'antarctica',
    winterPopulation: 45,
    summerPopulation: 150,
    runwayType: 'Skiway (Snow)',
    fuelReserveL: 1800000,
    powerStatus: 'Nominal',
  },
  {
    id: 'st-troll',
    name: 'Troll Research Station',
    code: 'TRL',
    country: 'Norway (NPI)',
    lat: -72.0117,
    lng: 2.5350,
    elevationM: 1275,
    region: 'antarctica',
    winterPopulation: 10,
    summerPopulation: 45,
    runwayType: 'Blue Ice Runway',
    fuelReserveL: 350000,
    powerStatus: 'Nominal',
  },
];

const DEFAULT_HAZARDS: HazardZone[] = [
  {
    id: 'hz-shear-1',
    name: 'Ross Ice Shelf Shear Zone',
    type: 'crevasse_field',
    lat: -78.2,
    lng: 165.4,
    radiusKm: 25,
    dangerLevel: 'extreme',
    notes: 'Severe active crevasse fields. Heavy ground-penetrating radar required before crawler advance.',
  },
  {
    id: 'hz-whiteout-1',
    name: 'Amery Basin Katabatic Throat',
    type: 'katabatic_pass',
    lat: -71.5,
    lng: 70.2,
    radiusKm: 40,
    dangerLevel: 'high',
    notes: 'Violent 85+ knot katabatic downslope winds during polar winter fronts.',
  },
  {
    id: 'hz-svalbard-crevasse',
    name: 'Kronebreen Glacier Terminus',
    type: 'crevasse_field',
    lat: 78.88,
    lng: 12.5,
    radiusKm: 15,
    dangerLevel: 'high',
    notes: 'Tidewater glacier calving and open crevasses near Kongsfjorden.',
  },
];

/* ============================== MAP VIEW ============================== */
export function MapView({
  t,
  db,
  setDb,
  activeDistress,
  updateDistressLocation,
  googleMapsApiKey,
  onOpenApiKeyModal,
}: {
  t: any;
  db: any;
  setDb?: React.Dispatch<React.SetStateAction<any>>;
  activeDistress?: any;
  updateDistressLocation?: (lat: number, lng: number) => void;
  googleMapsApiKey?: string;
  onOpenApiKeyModal?: () => void;
}) {
  const [selected, setSelected] = useState<any>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'radar' | 'smart_route'>('satellite');
  const [filterRegion, setFilterRegion] = useState<'all' | 'antarctica' | 'arctic'>('all');
  const [showShipments, setShowShipments] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [sideTab, setSideTab] = useState<'telemetry' | 'waypoints' | 'bases' | 'danger_zones'>('telemetry');

  // Modal states with map coordinate passing
  const [isAddBaseOpen, setIsAddBaseOpen] = useState(false);
  const [isAddWaypointOpen, setIsAddWaypointOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Local state for custom stations and custom waypoints if not in db
  const [customStations, setCustomStations] = useState<ResearchStation[]>(() => {
    return db?.customStations || [];
  });
  const [customWaypoints, setCustomWaypoints] = useState<Waypoint[]>(() => {
    return db?.customWaypoints || [
      {
        id: 'wp-pre-1',
        name: 'Princess Astrid Crevasse Bypass',
        lat: -71.25,
        lng: 12.4,
        elevationM: 850,
        passed: true,
        distanceFromPrevKm: 45,
        hazardNote: 'Deep blue-ice fissures. Scan with GPR before heavy traverse.',
      },
      {
        id: 'wp-pre-2',
        name: 'Dome Fuji Staging Depot #2',
        lat: -77.3,
        lng: 39.7,
        elevationM: 3810,
        passed: false,
        distanceFromPrevKm: 110,
        hazardNote: 'High plateau thin atmosphere. Arctic diesel wax inhibitor required.',
      },
    ];
  });

  // Danger zones state
  const [isHeatmapActive, setIsHeatmapActive] = useState(true);

  // Real-time GPS state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [userAlt, setUserAlt] = useState<number | null>(null);
  const [userSpeed, setUserSpeed] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-lock and center on active distress when entering MapView after Mayday
  useEffect(() => {
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
        setUserLat(lat);
        setUserLng(lng);
        setUserAccuracy(3.2);
        setUserAlt(40.0);
        setUserSpeed(0.0);
        setFocusCoords({ lat, lng });
        setSelected({
          kind: 'distress',
          id: activeDistress.id || 'active-mayday',
          name: `🚨 MAYDAY: ${activeDistress.incidentType || 'Emergency'}`,
          label: activeDistress.incidentType || 'Emergency',
          lat,
          lng,
          ...activeDistress,
        });
        setSideTab('telemetry');
      }
    }
  }, [activeDistress]);

  const handleAcquireGps = async () => {
    setGeoLoading(true);
    setGeoError(null);

    if (!('geolocation' in navigator)) {
      setTimeout(() => {
        const fallbackLat = -77.846;
        const fallbackLng = 166.668;
        setUserLat(fallbackLat);
        setUserLng(fallbackLng);
        setUserAccuracy(4.2);
        setUserAlt(35.0);
        setUserSpeed(0.0);
        setFocusCoords({ lat: fallbackLat, lng: fallbackLng });
        if (activeDistress && updateDistressLocation) {
          updateDistressLocation(fallbackLat, fallbackLng);
        }
        setGeoLoading(false);
      }, 400);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setUserAccuracy(pos.coords.accuracy);
        setUserAlt(pos.coords.altitude);
        setUserSpeed(pos.coords.speed);
        setFocusCoords({ lat, lng });
        if (activeDistress && updateDistressLocation) {
          updateDistressLocation(lat, lng);
        }
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation fallback triggered:', err);
        setTimeout(() => {
          const fallbackLat = -77.846;
          const fallbackLng = 166.668;
          setUserLat(fallbackLat);
          setUserLng(fallbackLng);
          setUserAccuracy(3.5);
          setUserAlt(35.0);
          setUserSpeed(0.0);
          setFocusCoords({ lat: fallbackLat, lng: fallbackLng });
          if (activeDistress && updateDistressLocation) {
            updateDistressLocation(fallbackLat, fallbackLng);
          }
          setGeoLoading(false);
        }, 400);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Combine default and custom stations
  const allStations: ResearchStation[] = [
    ...DEFAULT_RESEARCH_STATIONS,
    ...customStations,
  ];

  // Convert db assets into PolarAsset models for RealMapView
  const mappedAssets: PolarAsset[] = (db.assets || []).map((a: any, i: number) => ({
    id: a.id,
    name: a.name,
    code: a.id,
    category: a.category === 'Vehicles' ? 'heavy_traverse' : a.category === 'Communication Devices' ? 'scientific_rig' : 'heavy_traverse',
    model: a.name,
    status: a.status === 'In Use' ? 'operational' : a.status === 'Needs Repair' ? 'maintenance' : 'operational',
    currentLocation: {
      name: a.location || 'Field Traverse',
      lat: a.location === 'Maitri' ? -70.7667 : a.location === 'Bharati' ? -69.4069 : a.location === 'Himadri' ? 78.9231 : -72.0 - (i * 0.8),
      lng: a.location === 'Maitri' ? 11.7333 : a.location === 'Bharati' ? 76.1906 : a.location === 'Himadri' ? 11.9281 : 15.0 + (i * 3.5),
      elevationM: 350,
    },
    coldRatingC: -60,
    fuelOrBatteryPercent: 88,
    fuelType: 'Arctic Diesel F-34',
    crewCapacity: 6,
    lastMaintenanceDate: '2026-02-15',
    nextServiceHours: 120,
    specifications: { weightKg: 12500, topSpeedKmh: 45, rangeKm: 850, heatingSystem: 'Dual Hydronic Eberspächer' },
    telemetry: { tempC: -34, engineHealthPercent: 96, satlinkSignal: 94 },
  }));

  // Convert db expeditions into Expedition models
  const mappedExpeditions: Expedition[] = (db.expeditions || []).map((e: any, i: number) => {
    const isAntarctica = e.region === 'Antarctica';
    return {
      id: e.id,
      code: e.id,
      name: e.name,
      region: (isAntarctica ? 'antarctica' : 'arctic') as PolarRegion,
      objective: e.objectives || e.name,
      phase: e.status === 'Active' ? 'in_progress' : 'planning',
      leader: e.manager || 'Dr. Field Leader',
      crew: [],
      assignedAssetIds: [],
      departureDate: e.startDate || '2026-01-10',
      estimatedReturnDate: e.endDate || '2026-03-20',
      totalDistanceKm: 650,
      distanceCoveredKm: 280,
      currentLat: isAntarctica ? -71.2 - (i * 1.5) : 79.1 + (i * 0.3),
      currentLng: isAntarctica ? 12.5 + (i * 4.0) : 12.2 + (i * 0.5),
      waypoints: [],
      fuelBurnPerDayL: 85,
      rationsDaysRemaining: 24,
      currentWeather: {
        tempC: -38,
        windchillC: -52,
        windKnots: 28,
        condition: 'COND-2_CAUTION',
      },
    };
  });

  // Calculate danger zones for the inspector
  const dangerZonesList = getSubZeroDangerZones(allStations, filterRegion === 'arctic' ? 'arctic' : 'antarctica');

  // Modal callbacks
  const handleOpenAddBaseWithCoords = (lat: number, lng: number) => {
    setClickCoords({ lat, lng });
    setIsAddBaseOpen(true);
  };

  const handleOpenAddWaypointWithCoords = (lat: number, lng: number) => {
    setClickCoords({ lat, lng });
    setIsAddWaypointOpen(true);
  };

  const handleAddStation = (newStation: ResearchStation) => {
    setCustomStations((prev) => [...prev, newStation]);
    if (setDb) {
      setDb((prev: any) => ({
        ...prev,
        customStations: [...(prev.customStations || []), newStation],
        alerts: [
          {
            id: `alt-st-${Date.now()}`,
            title: `New Base Commissioned: ${newStation.name}`,
            severity: 'LOW',
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...(prev.alerts || []),
        ],
      }));
    }
    setFocusCoords({ lat: newStation.lat, lng: newStation.lng });
    setIsAddBaseOpen(false);
    setSelected({
      kind: 'station',
      label: newStation.name,
      ...newStation,
    });
  };

  const handleAddWaypoint = (newWaypoint: Waypoint, expeditionId?: string) => {
    setCustomWaypoints((prev) => [...prev, newWaypoint]);
    if (setDb) {
      setDb((prev: any) => ({
        ...prev,
        customWaypoints: [...(prev.customWaypoints || []), newWaypoint],
      }));
    }
    setFocusCoords({ lat: newWaypoint.lat, lng: newWaypoint.lng });
    setIsAddWaypointOpen(false);
    setSelected({
      kind: 'waypoint',
      label: newWaypoint.name,
      ...newWaypoint,
    });
  };

  const handleDeleteWaypoint = (id: string) => {
    setCustomWaypoints((prev) => prev.filter((w) => w.id !== id));
    if (setDb) {
      setDb((prev: any) => ({
        ...prev,
        customWaypoints: (prev.customWaypoints || []).filter((w: any) => w.id !== id),
      }));
    }
    if (selected?.id === id) {
      setSelected(null);
    }
  };

  // Convert stations for radar SVG
  const stationMarkers = allStations.map((s, i) => ({
    ...s,
    kind: 'station',
    label: s.name,
    coords: `${s.lat.toFixed(2)}°, ${s.lng.toFixed(2)}°`,
    x: s.region === 'antarctica' ? 30 + (i * 12) % 40 : 65 + (i * 8) % 25,
    y: s.region === 'antarctica' ? 60 + (i * 8) % 25 : 25 + (i * 8) % 20,
  }));

  const expeditionMarkers = mappedExpeditions.map((e, i) => ({
    ...e,
    kind: 'expedition',
    label: e.name,
    coords: `${e.currentLat.toFixed(2)}°, ${e.currentLng.toFixed(2)}°`,
    x: e.region === 'antarctica' ? 35 + (i * 10) : 70 + (i * 5),
    y: e.region === 'antarctica' ? 65 - (i * 8) : 28 + (i * 6),
  }));

  const assetMarkers = showAssets
    ? mappedAssets.slice(0, 6).map((a, i) => ({
        ...a,
        kind: 'asset',
        label: `${a.name} (${a.code})`,
        coords: `${a.currentLocation.lat.toFixed(2)}°, ${a.currentLocation.lng.toFixed(2)}°`,
        x: 25 + (i * 12) % 65,
        y: 35 + (i * 15) % 50,
      }))
    : [];

  const distressMarker = activeDistress
    ? [
        {
          id: activeDistress.id || 'distress-active',
          kind: 'distress',
          label: `MAYDAY: ${activeDistress.incidentType || 'General Emergency'}`,
          location: activeDistress.location,
          reporter: activeDistress.reporterCallsign,
          device: activeDistress.reportedByDevice,
          x: 48,
          y: 68,
          coords: activeDistress.coordinates || '-78.00°, 166.00°',
          summary: activeDistress.summary,
          acknowledged: activeDistress.acknowledgedByHQ,
        },
      ]
    : [];

  const allMarkers = [
    ...stationMarkers,
    ...expeditionMarkers,
    ...assetMarkers,
    ...distressMarker,
  ].filter((m) => filterRegion === 'all' || (m as any).region?.toLowerCase() === filterRegion);

  return (
    <div>
      <PageHeader
        t={t}
        title="Live Operations Map & Radar"
        subtitle="Real-time polar geospatial projection displaying research stations, mobile field teams, asset tracking, sub-zero danger heatmaps, and emergency beacons."
      />

      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMapMode('satellite')}
            style={{
              background: mapMode === 'satellite' ? t.accentSoft : t.bgAlt,
              color: mapMode === 'satellite' ? t.accent : t.textDim,
              border: `1px solid ${mapMode === 'satellite' ? t.accent : t.border}`,
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Interactive Real Map</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-sky-950 text-sky-400 rounded font-mono border border-sky-800/60">
              LEAFLET + HEATMAP
            </span>
          </button>

          <button
            onClick={() => setMapMode('radar')}
            style={{
              background: mapMode === 'radar' ? t.accentSoft : t.bgAlt,
              color: mapMode === 'radar' ? t.accent : t.textDim,
              border: `1px solid ${mapMode === 'radar' ? t.accent : t.border}`,
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vector Radar View</span>
          </button>

          <button
            onClick={() => setMapMode('smart_route')}
            style={{
              background: mapMode === 'smart_route' ? 'rgba(16, 185, 129, 0.2)' : t.bgAlt,
              color: mapMode === 'smart_route' ? '#34d399' : t.textDim,
              border: `1px solid ${mapMode === 'smart_route' ? '#10b981' : t.border}`,
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Route (Satellite CV)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Actions */}
          <button
            type="button"
            onClick={() => {
              setClickCoords(null);
              setIsAddWaypointOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white flex items-center gap-1.5 border border-emerald-500/60 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Set Waypoint</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setClickCoords(null);
              setIsAddBaseOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-700/80 hover:bg-sky-600 text-white flex items-center gap-1.5 border border-sky-500/60 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Establish Base</span>
          </button>

          {/* Sector filter */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-bold px-1 uppercase">SECTOR:</span>
            {(['all', 'antarctica', 'arctic'] as const).map((reg) => (
              <button
                key={reg}
                onClick={() => setFilterRegion(reg)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase cursor-pointer ${
                  filterRegion === reg
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Route Optimizer full panel if active */}
      {mapMode === 'smart_route' && (
        <div className="mb-4">
          <SmartRouteOptimizer t={t} db={db} setDb={setDb} />
        </div>
      )}

      {/* Main Grid: Map canvas + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Map Canvas / Container (Span 2 cols on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {mapMode === 'satellite' ? (
            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              <RealMapView
                stations={allStations}
                assets={mappedAssets}
                expeditions={mappedExpeditions}
                hazards={DEFAULT_HAZARDS}
                customWaypoints={customWaypoints}
                activeDistress={activeDistress}
                region={filterRegion === 'arctic' ? 'arctic' : 'antarctica'}
                googleMapsApiKey={googleMapsApiKey}
                onOpenApiKeyModal={onOpenApiKeyModal}
                userLat={userLat}
                userLng={userLng}
                userAccuracy={userAccuracy}
                userAlt={userAlt}
                userSpeed={userSpeed}
                geoLoading={geoLoading}
                geoError={geoError}
                onAcquireGps={handleAcquireGps}
                focusCoords={focusCoords}
                onSelectStation={(st) => {
                  setSelected({ ...st, kind: 'station', label: st.name });
                  setSideTab('telemetry');
                }}
                onSelectAsset={(as) => {
                  setSelected({ ...as, kind: 'asset', label: as.name });
                  setSideTab('telemetry');
                }}
                onSelectExpedition={(ex) => {
                  setSelected({ ...ex, kind: 'expedition', label: ex.name });
                  setSideTab('telemetry');
                }}
                onSelectDangerZone={(dz) => {
                  setSelected({ ...dz, kind: 'danger_zone', label: dz.name });
                  setSideTab('telemetry');
                }}
                onOpenAddBaseWithCoords={handleOpenAddBaseWithCoords}
                onOpenAddWaypointWithCoords={handleOpenAddWaypointWithCoords}
                onDeleteWaypoint={handleDeleteWaypoint}
                showDangerHeatmap={isHeatmapActive}
                onToggleDangerHeatmap={() => setIsHeatmapActive(!isHeatmapActive)}
              />
            </div>
          ) : (
            <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[520px]">
              <svg viewBox="0 0 100 100" className="w-full h-[470px] select-none">
                {/* Background Map Projection */}
                <rect x="0" y="0" width="100" height="100" fill={t.bgAlt} rx="4" />
                
                {/* Radar Grid Rings */}
                <circle cx="50" cy="50" r="45" fill="none" stroke={t.border} strokeWidth="0.3" strokeDasharray="1,1" />
                <circle cx="50" cy="50" r="30" fill="none" stroke={t.border} strokeWidth="0.3" strokeDasharray="1,1" />
                <circle cx="50" cy="50" r="15" fill="none" stroke={t.border} strokeWidth="0.3" strokeDasharray="1,1" />
                <line x1="50" y1="5" x2="50" y2="95" stroke={t.border} strokeWidth="0.3" strokeDasharray="1,1" />
                <line x1="5" y1="50" x2="95" y2="50" stroke={t.border} strokeWidth="0.3" strokeDasharray="1,1" />

                {/* Continent Landmass Shapes */}
                {/* Antarctica */}
                <circle cx="34" cy="68" r="22" fill={t.panelAlt} stroke={t.border} strokeWidth="0.5" />
                <text x="34" y="68" textAnchor="middle" fontSize="3" fill={t.textFaint} fontFamily={FONT_HEAD} fontWeight="bold">
                  ANTARCTICA SECTOR
                </text>

                {/* Arctic */}
                <circle cx="70" cy="28" r="17" fill={t.panelAlt} stroke={t.border} strokeWidth="0.5" />
                <text x="70" y="28" textAnchor="middle" fontSize="3" fill={t.textFaint} fontFamily={FONT_HEAD} fontWeight="bold">
                  ARCTIC SECTOR
                </text>

                {/* Render Markers */}
                {allMarkers.map((m: any) => {
                  const isSelected = selected?.id === m.id;
                  
                  if (m.kind === 'distress') {
                    return (
                      <g key={m.id} onClick={() => { setSelected(m); setSideTab('telemetry'); }} style={{ cursor: 'pointer' }}>
                        <circle cx={m.x} cy={m.y} r="6" fill="rgba(225, 91, 91, 0.25)" className="animate-ping" />
                        <circle cx={m.x} cy={m.y} r="3.5" fill="#E15B5B" stroke="#FFFFFF" strokeWidth="0.8" />
                        <text x={m.x} y={m.y - 4.5} textAnchor="middle" fontSize="2.8" fill="#E15B5B" fontFamily={FONT_HEAD} fontWeight="bold">
                          🚨 MAYDAY
                        </text>
                      </g>
                    );
                  }

                  if (m.kind === 'station') {
                    return (
                      <g key={m.id} onClick={() => { setSelected(m); setSideTab('telemetry'); }} style={{ cursor: 'pointer' }}>
                        {isSelected && <circle cx={m.x} cy={m.y} r="4" fill="none" stroke={t.accent} strokeWidth="0.5" className="animate-ping" />}
                        <circle cx={m.x} cy={m.y} r="2.4" fill={t.accent} stroke="#FFFFFF" strokeWidth="0.6" />
                        <text x={m.x} y={m.y - 3.5} textAnchor="middle" fontSize="2.6" fill={t.text} fontFamily={FONT_BODY} fontWeight="600">
                          {m.name}
                        </text>
                      </g>
                    );
                  }

                  if (m.kind === 'expedition') {
                    return (
                      <g key={m.id} onClick={() => { setSelected(m); setSideTab('telemetry'); }} style={{ cursor: 'pointer' }}>
                        {isSelected && <circle cx={m.x} cy={m.y} r="3.5" fill="none" stroke={t.amber} strokeWidth="0.5" className="animate-ping" />}
                        <polygon
                          points={`${m.x},${m.y - 2} ${m.x + 1.8},${m.y + 1.5} ${m.x - 1.8},${m.y + 1.5}`}
                          fill={t.amber}
                          stroke="#000000"
                          strokeWidth="0.4"
                        />
                        <text x={m.x} y={m.y - 3} textAnchor="middle" fontSize="2.4" fill={t.amber} fontFamily={FONT_BODY}>
                          {m.label.length > 14 ? m.label.slice(0, 13) + '..' : m.label}
                        </text>
                      </g>
                    );
                  }

                  if (m.kind === 'asset') {
                    return (
                      <g key={m.id} onClick={() => { setSelected(m); setSideTab('telemetry'); }} style={{ cursor: 'pointer' }}>
                        <rect x={m.x - 1.2} y={m.y - 1.2} width="2.4" height="2.4" fill={t.blue} stroke="#FFFFFF" strokeWidth="0.3" rx="0.4" />
                      </g>
                    );
                  }

                  return null;
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Right Info Sidebar / Multi-Tab Detail Card */}
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4 flex flex-col justify-between min-h-[520px]">
          <div>
            {/* Sidebar Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 mb-3">
              <button
                type="button"
                onClick={() => setSideTab('telemetry')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded cursor-pointer transition-colors text-center ${
                  sideTab === 'telemetry'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Telemetry
              </button>
              <button
                type="button"
                onClick={() => setSideTab('danger_zones')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded cursor-pointer transition-colors text-center flex items-center justify-center gap-0.5 ${
                  sideTab === 'danger_zones'
                    ? 'bg-rose-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ThermometerSnowflake className="w-3 h-3 text-rose-400" />
                <span>Heatmap</span>
              </button>
              <button
                type="button"
                onClick={() => setSideTab('waypoints')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded cursor-pointer transition-colors text-center ${
                  sideTab === 'waypoints'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Waypoints ({customWaypoints.length})
              </button>
              <button
                type="button"
                onClick={() => setSideTab('bases')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded cursor-pointer transition-colors text-center ${
                  sideTab === 'bases'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bases ({allStations.length})
              </button>
            </div>

            {/* TAB 1: TELEMETRY / INSPECTOR */}
            {sideTab === 'telemetry' && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xs font-bold uppercase tracking-wider">
                    {selected ? selected.label : 'ENTITY TELEMETRY'}
                  </h3>
                  {selected && (
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {selected ? (
                  selected.kind === 'distress' ? (
                    <div className="space-y-3 text-xs bg-rose-950/40 p-3 rounded-xl border border-rose-800/80">
                      <div className="flex items-center gap-2 text-rose-400 font-bold">
                        <ShieldAlert className="w-4 h-4" />
                        <span>EMERGENCY DISTRESS BEACON</span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <p><strong>Incident:</strong> {selected.incidentType || selected.label}</p>
                        <p><strong>Sector / Location:</strong> {selected.location}</p>
                        <p><strong>GPS Coordinates:</strong> <span className="font-mono text-amber-300">{selected.coords || `${selected.lat}, ${selected.lng}`}</span></p>
                        <p><strong>Reporter Callsign:</strong> {selected.reporter || 'FIELD MOBILE'}</p>
                        <p><strong>Reporting Device:</strong> {selected.device || 'Mobile Phone'}</p>
                        {selected.summary && <p className="text-slate-400 pt-1 italic">{selected.summary}</p>}
                      </div>
                      <div className="pt-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold block text-center ${selected.acknowledged ? 'bg-amber-900 text-amber-200 border border-amber-600' : 'bg-rose-600 text-white animate-pulse'}`}>
                          {selected.acknowledged ? 'ACKNOWLEDGED BY HQ DISPATCH' : 'UNACKNOWLEDGED EMERGENCY'}
                        </span>
                      </div>
                    </div>
                  ) : selected.kind === 'danger_zone' ? (
                    <div className="space-y-2.5 text-xs bg-rose-950/40 p-3 rounded-xl border border-rose-800/80">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300 uppercase">{selected.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-rose-200 border border-rose-700">
                          {selected.severity?.toUpperCase()} DANGER
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 text-[9px] block">AIR TEMP</span>
                          <span className="text-rose-400 font-bold text-sm">{selected.tempC}°C</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 text-[9px] block">APPARENT CHILL</span>
                          <span className="text-purple-300 font-bold text-sm">{selected.windchillC}°C</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-slate-300 pt-1">
                        <p><strong>Wind Speed:</strong> {selected.windKnots} knots katabatic</p>
                        <p><strong>Radius:</strong> {selected.radiusKm} km danger perimeter</p>
                        <p><strong>Human Survival Window:</strong> <span className="text-rose-400 font-bold">{selected.survivalTimeMinutes ? `< ${selected.survivalTimeMinutes} mins` : '< 10 mins'}</span></p>
                        <p><strong>Frostbite Risk:</strong> <span className="text-amber-300 font-bold">{selected.frostbiteRiskTimeMinutes ? `< ${selected.frostbiteRiskTimeMinutes} mins` : '< 5 mins'}</span></p>
                      </div>
                      {selected.recommendation && (
                        <div className="p-2 bg-rose-900/40 rounded border border-rose-800 text-[11px] text-rose-200">
                          <strong>Advisory:</strong> {selected.recommendation}
                        </div>
                      )}
                    </div>
                  ) : selected.kind === 'station' ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-bold block mb-1">STATION DATA</span>
                        <p className="text-slate-200"><strong>Name:</strong> {selected.name} ({selected.code})</p>
                        <p className="text-slate-200"><strong>Country / Agency:</strong> {selected.country || 'Polar Logistics'}</p>
                        <p className="text-slate-200"><strong>Region:</strong> <span className="capitalize">{selected.region}</span></p>
                        <p className="text-slate-200"><strong>Elevation:</strong> {selected.elevationM}m MSL</p>
                        <p className="text-slate-200"><strong>Coordinates:</strong> <span className="font-mono text-sky-400">{selected.lat?.toFixed(4)}°, {selected.lng?.toFixed(4)}°</span></p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">CREW (W / S)</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {selected.winterPopulation || 15} / {selected.summerPopulation || 50}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">FUEL RESERVE</span>
                          <span className="text-sm font-bold text-amber-400 font-mono">
                            {((selected.fuelReserveL || 350000) / 1000).toFixed(0)}k L
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-bold block mb-1">RUNWAY & POWER</span>
                        <p className="text-slate-200"><strong>Runway:</strong> {selected.runwayType || 'Skiway (Snow)'}</p>
                        <p className="text-slate-200"><strong>Power Status:</strong> <span className="text-emerald-400 font-bold">{selected.powerStatus || 'Nominal'}</span></p>
                      </div>
                    </div>
                  ) : selected.kind === 'waypoint' ? (
                    <div className="space-y-2.5 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 uppercase">{selected.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${selected.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                          {selected.passed ? 'PASSED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <p><strong>Coordinates:</strong> <span className="font-mono text-sky-400">{selected.lat?.toFixed(4)}°, {selected.lng?.toFixed(4)}°</span></p>
                        <p><strong>Elevation:</strong> {selected.elevationM || 0}m</p>
                        <p><strong>Distance from Prev:</strong> {selected.distanceFromPrevKm || 0} km</p>
                        {selected.hazardNote && (
                          <div className="p-2 bg-amber-950/40 rounded border border-amber-800 text-[11px] text-amber-200 mt-2">
                            <strong>Hazard Advisory:</strong> {selected.hazardNote}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteWaypoint(selected.id)}
                          className="px-2.5 py-1 text-[11px] bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Waypoint</span>
                        </button>
                      </div>
                    </div>
                  ) : selected.kind === 'expedition' ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-bold block mb-1">EXPEDITION TRAVERSE</span>
                        <p className="text-slate-200"><strong>Code:</strong> {selected.code}</p>
                        <p className="text-slate-200"><strong>Region:</strong> <span className="capitalize">{selected.region}</span></p>
                        <p className="text-slate-200"><strong>Leader:</strong> {selected.leader}</p>
                        <p className="text-slate-200"><strong>Coordinates:</strong> <span className="font-mono text-sky-400">{selected.currentLat?.toFixed(4)}°, {selected.currentLng?.toFixed(4)}°</span></p>
                      </div>
                      {selected.currentWeather && (
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-bold block mb-1">LOCAL WEATHER</span>
                          <p className="text-slate-200"><strong>Temp:</strong> {selected.currentWeather.tempC}°C (Chill: {selected.currentWeather.windchillC}°C)</p>
                          <p className="text-slate-200"><strong>Wind:</strong> {selected.currentWeather.windKnots} kts</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <p><strong>Asset:</strong> {selected.label}</p>
                      <p><strong>Status:</strong> {selected.status}</p>
                      <p><strong>Location:</strong> {selected.location || selected.currentLocation?.name}</p>
                    </div>
                  )
                ) : (
                  <div className="p-6 text-center text-slate-500 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-slate-600 animate-spin" />
                    <p className="text-xs">
                      Click any station, danger zone heatmap badge, waypoint, or distress beacon on the map to load live telemetry.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SUB-ZERO DANGER ZONES */}
            {sideTab === 'danger_zones' && (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <ThermometerSnowflake className="w-3.5 h-3.5" />
                    SUB-ZERO DANGER ZONES ({dangerZonesList.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsHeatmapActive(!isHeatmapActive)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${isHeatmapActive ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {isHeatmapActive ? 'LAYER ON' : 'LAYER OFF'}
                  </button>
                </div>

                {dangerZonesList.map((dz) => (
                  <div
                    key={dz.id}
                    onClick={() => {
                      setSelected({ ...dz, kind: 'danger_zone', label: dz.name });
                      setFocusCoords({ lat: dz.lat, lng: dz.lng });
                    }}
                    className="p-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-rose-900/60 hover:border-rose-600 rounded-xl cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{dz.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        dz.severityLevel === 'LETHAL'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : dz.severityLevel === 'EXTREME'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {dz.severityLevel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-rose-400 font-bold">{dz.tempC}°C (Chill: {dz.apparentTempC}°C)</span>
                      <span className="text-slate-400">{dz.radiusKm}km radius</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Survival window: <strong className="text-rose-300">{dz.survivalTimeMinutes ? `< ${dz.survivalTimeMinutes}m` : '< 15m'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: CUSTOM WAYPOINTS */}
            {sideTab === 'waypoints' && (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    TACTICAL WAYPOINTS ({customWaypoints.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setClickCoords(null);
                      setIsAddWaypointOpen(true);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                {customWaypoints.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No waypoints established yet. Click on the map or use the + Set Waypoint button to add one.
                  </div>
                ) : (
                  customWaypoints.map((wp) => (
                    <div
                      key={wp.id}
                      onClick={() => {
                        setSelected({ ...wp, kind: 'waypoint', label: wp.name });
                        setFocusCoords({ lat: wp.lat, lng: wp.lng });
                      }}
                      className="p-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-900/60 hover:border-emerald-600 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{wp.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWaypoint(wp.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{wp.lat.toFixed(3)}°, {wp.lng.toFixed(3)}°</span>
                        <span>{wp.elevationM}m MSL</span>
                      </div>
                      {wp.hazardNote && (
                        <p className="text-[10px] text-amber-400/90 line-clamp-1">{wp.hazardNote}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: RESEARCH BASES */}
            {sideTab === 'bases' && (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    RESEARCH STATIONS ({allStations.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setClickCoords(null);
                      setIsAddBaseOpen(true);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-700 hover:bg-sky-600 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                {allStations.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelected({ ...st, kind: 'station', label: st.name });
                      setFocusCoords({ lat: st.lat, lng: st.lng });
                    }}
                    className="p-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-sky-900/60 hover:border-sky-500 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300">{st.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 font-mono">
                        {st.code}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{st.lat.toFixed(2)}°, {st.lng.toFixed(2)}°</span>
                      <span className="capitalize">{st.region}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Crew: {st.winterPopulation || 15}w / {st.summerPopulation || 50}s</span>
                      <span className="text-emerald-400 font-mono">{st.powerStatus || 'Nominal'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400 mt-4 font-mono flex items-center justify-between">
            <span>OPS FREQ: 142.800 MHz // SATCOM ACTIVE</span>
            <span className="text-emerald-400">STATUS: NOMINAL</span>
          </div>
        </div>

      </div>

      {/* MODALS */}
      <AddBaseModal
        isOpen={isAddBaseOpen}
        onClose={() => setIsAddBaseOpen(false)}
        onAddStation={handleAddStation}
        userLat={userLat}
        userLng={userLng}
        initialLat={clickCoords?.lat}
        initialLng={clickCoords?.lng}
      />

      <AddWaypointModal
        isOpen={isAddWaypointOpen}
        onClose={() => setIsAddWaypointOpen(false)}
        onAddWaypoint={handleAddWaypoint}
        expeditions={mappedExpeditions}
        userLat={userLat}
        userLng={userLng}
        initialLat={clickCoords?.lat}
        initialLng={clickCoords?.lng}
      />
    </div>
  );
}

/* ============================== ALERTS ============================== */
export function Alerts({ t, db, setDb }: { t: any; db: any; setDb: React.Dispatch<React.SetStateAction<any>> }) {
  const [filter, setFilter] = useState("All");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const autoResolvedCount = db.alerts.filter((a: any) => a.autoResolved).length;
  const activeCriticalCount = db.alerts.filter((a: any) => !a.autoResolved && a.severity === "CRITICAL").length;
  const activeTotalCount = db.alerts.filter((a: any) => !a.autoResolved).length;

  const rows = db.alerts.filter((a: any) => {
    if (filter === "All") return true;
    if (filter === "AUTO_RESOLVED") return a.autoResolved;
    if (filter === "ACTIVE") return !a.autoResolved;
    return a.severity === filter;
  });

  const markRead = (id: string) => {
    setDb((d: any) => ({
      ...d,
      alerts: d.alerts.map((a: any) => a.id === id ? { ...a, read: true } : a)
    }));
  };

  const [clearingAlerts, setClearingAlerts] = useState(false);
  const [toastAlertMsg, setToastAlertMsg] = useState<string | null>(null);

  const handleAutoResolveNow = (id: string) => {
    setResolvingId(id);
    const targetAlert = db.alerts.find((a: any) => a.id === id);
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTimeout(() => {
      const newCompletedEntry = {
        id: `CWL-${Date.now().toString().slice(-4)}`,
        timestamp: nowIso,
        timeStr: nowTimeStr,
        category: 'alert' as const,
        title: targetAlert ? `Resolved: ${targetAlert.type} - ${targetAlert.id}` : `Resolved Alert ${id}`,
        entityId: id,
        entityName: targetAlert?.type || "System Alert",
        stationOrExpedition: targetAlert?.relatedId || "Polar Ops Network",
        assignedToOrOperator: "AI Autonomous Janitor",
        clearedBy: "AI Autonomous Janitor" as const,
        actionTaken: targetAlert ? `AI resolved alert "${targetAlert.type}": ${targetAlert.description}` : `AI closed alert ${id}`,
        resolutionNotes: "Autonomous closed-loop mitigation successful. Telemetry normalized to nominal baselines.",
        avertedImpactOrSavings: "Averted operational downtime and restored system reliability.",
        status: "Archived & Verified" as const
      };

      setDb((d: any) => ({
        ...d,
        alerts: d.alerts.map((a: any) => {
          if (a.id !== id) return a;
          return {
            ...a,
            autoResolved: true,
            autoResolvedTag: "Auto-Resolved by AI",
            autoResolvedAt: nowIso,
            autoResolvedReason: "AI autonomous agent executed corrective telemetry routine & closed operational feedback loop.",
            impactAverted: "Averted operational stoppage without requiring human manual intervention.",
            read: true
          };
        }),
        auditLog: [
          {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            user: "Polar AI Autonomous Agent",
            action: "ALERT_AUTO_RESOLVED",
            entity: "Alert",
            details: `Alert ${id} was automatically resolved by AI background process.`
          },
          ...d.auditLog
        ],
        completedWorkLogs: [newCompletedEntry, ...(d.completedWorkLogs || [])]
      }));

      emitAiActionBroadcast({
        category: 'maintenance',
        message: `Auto-resolved alert: ${targetAlert?.type || id}. Mitigation telemetry applied.`,
        impact: 'Auto-Resolved'
      });

      setResolvingId(null);
    }, 600);
  };

  const handleBulkClearResolvedAlerts = () => {
    const resolvedList = db.alerts.filter((a: any) => a.autoResolved || a.read);
    if (resolvedList.length === 0) return;

    setClearingAlerts(true);
    setTimeout(() => {
      const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newWorkEntries = resolvedList.map((a: any, idx: number) => ({
        id: `CWL-ALT-${Date.now().toString().slice(-4)}-${idx}`,
        timestamp: nowIso,
        timeStr: nowTimeStr,
        category: 'alert' as const,
        title: `Auto-Cleared Alert: ${a.type} (${a.id})`,
        entityId: a.id,
        entityName: a.type,
        stationOrExpedition: a.relatedId || "Polar Stations",
        assignedToOrOperator: "AI Autonomous Janitor",
        clearedBy: "AI Autonomous Janitor" as const,
        actionTaken: `Archived resolved alert "${a.type}". Description: ${a.description}`,
        resolutionNotes: a.autoResolvedReason || "Alert verified and cleared from active notifications board.",
        avertedImpactOrSavings: a.impactAverted || "Cleaned operational alert feed.",
        status: "Archived & Verified" as const
      }));

      setDb((d: any) => ({
        ...d,
        alerts: d.alerts.filter((a: any) => !a.autoResolved && !a.read),
        auditLog: [
          {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            user: "Polar AI Autonomous Janitor",
            action: "BULK_ALERTS_AUTO_CLEARED",
            entity: "Alerts Queue",
            details: `Auto-cleared ${resolvedList.length} resolved alerts into permanent Work Done logs.`
          },
          ...d.auditLog
        ],
        completedWorkLogs: [...newWorkEntries, ...(d.completedWorkLogs || [])]
      }));

      emitAiActionBroadcast({
        category: 'logistics',
        message: `AI Auto-Cleared ${resolvedList.length} resolved alerts from notification queue. Filed to Work Done archive.`,
        impact: `+${resolvedList.length} Cleared`
      });

      setClearingAlerts(false);
      setToastAlertMsg(`Successfully cleared ${resolvedList.length} resolved alerts into Work Done Logs!`);
      setTimeout(() => setToastAlertMsg(null), 4000);
    }, 450);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        t={t}
        title="Alerts & Autonomous AI Resolutions"
        subtitle="Centralized operational alerts with autonomous AI problem detection, mitigation, and self-resolution."
      />

      {/* Top Metrics Row */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p style={{ color: t.textFaint }} className="text-[11px] font-medium uppercase tracking-wider">Total Alerts</p>
            <p style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xl font-bold mt-0.5">{db.alerts.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <AlertTriangle size={17} />
          </div>
        </div>

        <div style={{ background: t.panel, border: `1px solid rgba(16, 185, 129, 0.4)` }} className="p-3.5 rounded-xl flex items-center justify-between shadow-sm shadow-emerald-950/40">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Auto-Resolved by AI</p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-xl font-bold text-emerald-300 font-mono mt-0.5">{autoResolvedCount} Issues</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Zap size={17} />
          </div>
        </div>

        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p style={{ color: t.textFaint }} className="text-[11px] font-medium uppercase tracking-wider">Active Open Alerts</p>
            <p style={{ color: t.amber, fontFamily: FONT_HEAD }} className="text-xl font-bold mt-0.5">{activeTotalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={17} />
          </div>
        </div>

        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p style={{ color: t.textFaint }} className="text-[11px] font-medium uppercase tracking-wider">Autonomous AI Rate</p>
            <p className="text-xl font-bold text-cyan-300 font-mono mt-0.5">
              {Math.round((autoResolvedCount / (db.alerts.length || 1)) * 100)}%
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <ShieldCheck size={17} />
          </div>
        </div>
      </div>

      {/* AI Action Logs Continuous Streaming Panel */}
      <AiActionLogsPanel t={t} maxHeight={200} />

      {/* Toast Notification */}
      {toastAlertMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/60 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium">
            <Zap size={14} className="text-emerald-400 shrink-0" />
            <span>{toastAlertMsg}</span>
          </div>
          <button onClick={() => setToastAlertMsg(null)} className="text-emerald-400 hover:text-white text-xs cursor-pointer font-bold px-1.5 py-0.5">
            &times;
          </button>
        </div>
      )}

      {/* Filter Tabs & Bulk Clear Action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap items-center">
          <span style={{ color: t.textFaint }} className="text-xs font-mono mr-1">FILTER:</span>
          {[
            { key: "All", label: "All Records" },
            { key: "AUTO_RESOLVED", label: "⚡ Auto-Resolved by AI" },
            { key: "ACTIVE", label: "Active Open" },
            { key: "CRITICAL", label: "CRITICAL" },
            { key: "HIGH", label: "HIGH" },
            { key: "MEDIUM", label: "MEDIUM" },
            { key: "LOW", label: "LOW" },
          ].map(f => {
            const isSelected = filter === f.key;
            const isAuto = f.key === "AUTO_RESOLVED";
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  background: isSelected ? (isAuto ? 'rgba(16, 185, 129, 0.2)' : t.accentSoft) : "transparent",
                  color: isSelected ? (isAuto ? '#34D399' : t.accent) : t.textDim,
                  border: isSelected ? (isAuto ? '1px solid #10B981' : `1px solid ${t.accent}`) : `1px solid ${t.border}`
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isAuto && <Zap size={12} className="text-emerald-400" />}
                <span>{f.label}</span>
                {isAuto && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {autoResolvedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {autoResolvedCount > 0 && (
          <button
            onClick={handleBulkClearResolvedAlerts}
            disabled={clearingAlerts}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34D399'
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 shadow-sm"
            title="Automatically sweeps and logs all resolved alerts into the permanent Work Done Archive"
          >
            {clearingAlerts ? (
              <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Zap size={13} className="text-emerald-400" />
            )}
            <span>AI Auto-Clear Resolved Alerts ({autoResolvedCount})</span>
          </button>
        )}
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {rows.map((a: any) => {
          const isAuto = Boolean(a.autoResolved);

          return (
            <div
              key={a.id}
              style={{
                background: isAuto 
                  ? `linear-gradient(135deg, ${t.panel} 0%, rgba(16, 185, 129, 0.05) 100%)`
                  : t.panel,
                border: isAuto ? `1px solid rgba(16, 185, 129, 0.4)` : `1px solid ${t.border}`,
                opacity: (!isAuto && a.read) ? 0.75 : 1
              }}
              className="rounded-xl p-4 transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Left Icon */}
                  <div
                    style={{
                      background: isAuto ? 'rgba(16, 185, 129, 0.15)' : badgeColors(a.severity, t).bg,
                      color: isAuto ? '#34D399' : badgeColors(a.severity, t).fg,
                      border: isAuto ? '1px solid rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  >
                    {isAuto ? <CheckCircle2 size={16} /> : <AlertTriangle size={15} />}
                  </div>

                  {/* Main Alert Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">
                        {a.type}
                      </span>

                      {/* Green "Auto-Resolved by AI" Tag */}
                      {isAuto ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/60 font-mono">
                          <Zap size={12} className="text-emerald-400" />
                          <span>Auto-Resolved by AI</span>
                          <CheckCircle2 size={11} className="text-emerald-400 ml-0.5" />
                        </span>
                      ) : (
                        <Badge status={a.severity} t={t} />
                      )}

                      <span className="text-[10px] font-mono text-slate-500">
                        {a.id}
                      </span>
                    </div>

                    <p style={{ color: t.textDim }} className="text-xs sm:text-sm leading-relaxed">
                      {a.description}
                    </p>

                    {/* Auto-Resolved Detail Sub-box */}
                    {isAuto && a.autoResolvedReason && (
                      <div className="mt-2.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1 text-emerald-200">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <Zap size={13} className="text-emerald-400" />
                          <span>Autonomous AI Resolution Breakdown</span>
                          {a.autoResolvedAt && (
                            <span className="text-[10px] font-mono font-normal text-emerald-400/80 ml-auto">
                              Resolved: {a.autoResolvedAt}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 text-xs font-sans leading-relaxed">
                          <strong className="text-emerald-300">Action:</strong> {a.autoResolvedReason}
                        </p>
                        {a.impactAverted && (
                          <p className="text-emerald-300/90 text-[11px] font-sans">
                            <strong>Impact Averted:</strong> {a.impactAverted}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs pt-1 flex-wrap" style={{ color: t.textFaint }}>
                      <span>Date Logged: {a.date}</span>
                      {a.relatedId && <span>Entity: {a.relatedId}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  {!isAuto && (
                    <button
                      onClick={() => handleAutoResolveNow(a.id)}
                      disabled={resolvingId === a.id}
                      style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34D399' }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-500/25 transition-all flex items-center gap-1.5"
                    >
                      {resolvingId === a.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                          <span>Resolving...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          <span>AI Auto-Resolve</span>
                        </>
                      )}
                    </button>
                  )}

                  {!a.read && !isAuto && (
                    <button
                      onClick={() => markRead(a.id)}
                      style={{ color: t.accent }}
                      className="text-xs font-medium cursor-pointer hover:underline px-2 py-1"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <p style={{ color: t.textFaint }} className="text-sm text-center py-12">
            No alerts found matching filter "{filter}".
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================== EXPENSES ============================== */
export function Expenses({ t, db }: { t: any; db: any }) {
  const totals = db.expenses.map((e: any) => ({ id: e.expeditionId, name: db.expeditions.find((x: any) => x.id === e.expeditionId)?.name.slice(0, 18) + "...", total: e.transportation + e.equipment + e.maintenance + e.inventory + e.shipment + e.other }));
  const grand = totals.reduce((s: number, x: any) => s + x.total, 0);
  const categoryTotals = ["transportation", "equipment", "maintenance", "inventory", "shipment", "other"].map(cat => ({ name: cat[0].toUpperCase() + cat.slice(1), value: db.expenses.reduce((s: number, e: any) => s + (e[cat] || 0), 0) }));
  const colors = [t.accent, t.blue, t.amber, t.green, t.red, t.textFaint];

  return (
    <div>
      <PageHeader t={t} title="Expenses" subtitle="Cost tracking across transportation, equipment, maintenance and supplies." />
      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))" }}>
        <StatCard t={t} icon={Wallet} label="Total Spend (All Expeditions)" value={currency(grand)} accent />
        <StatCard t={t} icon={TrendingUp} label="Avg. Cost / Expedition" value={currency(Math.round(grand / (totals.length || 1)))} />
        <StatCard t={t} icon={Compass} label="Expeditions Tracked" value={totals.length} />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4">
          <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold mb-3">Cost Comparison Between Expeditions</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={totals}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: t.textFaint, fontSize: 10 }} axisLine={{ stroke: t.border }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 100000}L`} />
              <Tooltip formatter={(v: any) => currency(Number(v))} contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" fill={t.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4">
          <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold mb-3">Cost by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryTotals} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                {categoryTotals.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => currency(Number(v))} contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: t.textDim }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ============================== REPORTS ============================== */
export function Reports({ t, db }: { t: any; db: any }) {
  const [expFilter, setExpFilter] = useState("All");
  const reportTypes = [
    { key: "expeditions", label: "Expedition Report", data: db.expeditions },
    { key: "assets", label: "Asset Report", data: db.assets },
    { key: "inventory", label: "Inventory Report", data: db.inventory },
    { key: "shipments", label: "Shipment Report", data: db.shipments },
    { key: "maintenance", label: "Maintenance Report", data: db.maintenance },
    { key: "expenses", label: "Expense Report", data: db.expenses },
  ];

  return (
    <div>
      <PageHeader t={t} title="Reports" subtitle="Generate and export operational reports filtered by expedition, status or category." />
      <div className="mb-4">
        <select value={expFilter} onChange={e => setExpFilter(e.target.value)} style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text, fontFamily: FONT_BODY }} className="px-3 py-2 rounded-lg text-sm outline-none">
          <option value="All">All Expeditions</option>
          {db.expeditions.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" }}>
        {reportTypes.map(r => {
          const filtered = expFilter === "All" ? r.data : r.data.filter((x: any) => x.expeditionId === expFilter || x.id === expFilter);
          return (
            <div key={r.key} style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><FileText size={16} color={t.accent} /><span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">{r.label}</span></div>
              <p style={{ color: t.textFaint }} className="text-xs">{filtered.length} records match current filter</p>
              <button onClick={() => csvDownload(`${r.key}_report.csv`, filtered)} style={{ background: t.bgAlt, color: t.text }} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/10"><Download size={13} /> Export CSV</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== AUDIT LOG ============================== */
export function AuditLog({ t, db }: { t: any; db: any }) {
  const [tab, setTab] = useState<'audit' | 'work_done'>('work_done');
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'task' | 'maintenance' | 'alert' | 'route' | 'inventory'>('all');
  const [inspectModalData, setInspectModalData] = useState<any | null>(null);

  const completedWorkList = db.completedWorkLogs || [];
  
  const auditRows = db.auditLog.filter((a: any) => 
    (a.user + a.action + a.entity + (a.details || "")).toLowerCase().includes(search.toLowerCase())
  );

  const workDoneRows = completedWorkList.filter((cw: any) => {
    const matchesSearch = (cw.title + cw.category + cw.actionTaken + cw.stationOrExpedition + (cw.assignedToOrOperator || "")).toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || cw.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      <PageHeader 
        t={t} 
        title="Audit Trail &amp; AI Cleared Work Logs" 
        subtitle="Immutable operational records, system state transitions, and detailed forensic dossiers for all work completed and cleared by AI." 
      />

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('work_done')}
            style={{
              background: tab === 'work_done' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: tab === 'work_done' ? '#34D399' : t.textDim,
              border: tab === 'work_done' ? '1px solid #10B981' : `1px solid ${t.border}`
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Zap size={13} className="text-emerald-400" />
            <span>⚡ AI Cleared Work &amp; Resolution Dossier</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              {completedWorkList.length} Archived
            </span>
          </button>

          <button
            onClick={() => setTab('audit')}
            style={{
              background: tab === 'audit' ? t.accentSoft : 'transparent',
              color: tab === 'audit' ? t.accent : t.textDim,
              border: tab === 'audit' ? `1px solid ${t.accent}` : `1px solid ${t.border}`
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText size={13} />
            <span>System Audit Trail</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-900 text-slate-300 border border-slate-700">
              {db.auditLog.length} Records
            </span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Cryptographic Hash Ledger: VERIFIED</span>
        </div>
      </div>

      <Toolbar t={t} search={search} setSearch={setSearch} />

      {/* Tab 1: AI Cleared Work & Resolution Dossier */}
      {tab === 'work_done' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex gap-2 flex-wrap items-center">
            <span style={{ color: t.textFaint }} className="text-xs font-mono mr-1">CATEGORY:</span>
            {[
              { key: 'all', label: 'All Work Done' },
              { key: 'task', label: 'Tasks' },
              { key: 'maintenance', label: 'Maintenance' },
              { key: 'alert', label: 'Alerts' },
              { key: 'route', label: 'Routes & Sastrugi' },
              { key: 'inventory', label: 'Supplies' }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key as any)}
                style={{
                  background: categoryFilter === cat.key ? t.accentSoft : 'transparent',
                  color: categoryFilter === cat.key ? t.accent : t.textDim,
                  border: categoryFilter === cat.key ? `1px solid ${t.accent}` : `1px solid ${t.border}`
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* List of Cleared Work Cards */}
          <div className="grid gap-3">
            {workDoneRows.map((cw: any) => (
              <div
                key={cw.id}
                style={{ background: t.panel, border: `1px solid ${t.border}` }}
                className="rounded-xl p-4 hover:border-emerald-500/40 transition-all space-y-2 relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                        <Zap size={10} className="text-emerald-400" />
                        <span>{cw.clearedBy}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        [{cw.timestamp}]
                      </span>
                      <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.2 rounded bg-sky-950/60 border border-sky-800/40 uppercase">
                        {cw.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {cw.id}
                      </span>
                    </div>

                    <h4 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">
                      {cw.title}
                    </h4>

                    <p style={{ color: t.textDim }} className="text-xs leading-relaxed">
                      <strong className="text-slate-300">Action Taken:</strong> {cw.actionTaken}
                    </p>

                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 space-y-0.5">
                      <p><strong className="text-emerald-300">Forensic Resolution:</strong> {cw.resolutionNotes}</p>
                      {cw.avertedImpactOrSavings && (
                        <p className="text-emerald-400 text-[11px] font-medium pt-0.5">
                          <strong>Averted Risk:</strong> {cw.avertedImpactOrSavings}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                      <span>Location: <strong className="text-slate-400">{cw.stationOrExpedition || "Central Operations"}</strong></span>
                      {cw.assignedToOrOperator && (
                        <span>Operator/Lead: <strong className="text-slate-400">{cw.assignedToOrOperator}</strong></span>
                      )}
                      <span className="text-emerald-400 font-mono font-semibold">Status: {cw.status}</span>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => setInspectModalData(cw)}
                      style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:border-sky-400 transition-colors flex items-center gap-1.5"
                    >
                      <Eye size={12} className="text-sky-400" />
                      <span>Inspect Dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {workDoneRows.length === 0 && (
              <p style={{ color: t.textFaint }} className="text-xs text-center py-12">
                No archived work records found matching search query "{search}".
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: System Audit Trail Table */}
      {tab === 'audit' && (
        <Table 
          t={t} 
          rows={auditRows} 
          columns={[
            { key: "timestamp", label: "Timestamp" }, 
            { key: "user", label: "User / Agent" }, 
            { key: "action", label: "Action" },
            { key: "entity", label: "Entity" }, 
            { key: "details", label: "Details" },
          ]} 
        />
      )}

      {/* Modal: Full Forensic Dossier Inspection */}
      {inspectModalData && (
        <Modal 
          title={`Forensic Work Done Dossier: ${inspectModalData.id}`} 
          onClose={() => setInspectModalData(null)} 
          t={t} 
          wide
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Work Item Title</span>
                <h3 className="text-sm font-bold text-slate-100">{inspectModalData.title}</h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                Status: {inspectModalData.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Timestamp</span>
                <p className="text-slate-200 font-bold font-mono">{inspectModalData.timestamp}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Cleared &amp; Logged By</span>
                <p className="text-emerald-400 font-bold">{inspectModalData.clearedBy}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Assigned / Operator</span>
                <p className="text-slate-200 font-semibold">{inspectModalData.assignedToOrOperator || "Autonomous Agent"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Station / Expedition</span>
                <p className="text-slate-200 font-semibold">{inspectModalData.stationOrExpedition || "All Polar Stations"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Category</span>
                <p className="text-sky-400 font-semibold uppercase">{inspectModalData.category}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Entity ID</span>
                <p className="text-slate-300 font-mono">{inspectModalData.entityId || "N/A"}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-bold text-xs uppercase font-mono flex items-center gap-1.5">
                <FileText size={12} className="text-sky-400" />
                <span>Action Taken Breakdown:</span>
              </span>
              <p className="text-slate-200 leading-relaxed">{inspectModalData.actionTaken}</p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1.5 text-emerald-200">
              <span className="font-bold text-xs uppercase font-mono text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Technical Resolution &amp; Forensic Verification:</span>
              </span>
              <p className="text-slate-200 leading-relaxed">{inspectModalData.resolutionNotes}</p>
              {inspectModalData.avertedImpactOrSavings && (
                <p className="text-emerald-300 text-[11px] font-bold pt-1">
                  Impact Averted: {inspectModalData.avertedImpactOrSavings}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setInspectModalData(null)} 
                style={{ background: t.accent, color: "#04222A" }} 
                className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== USERS ============================== */
export function UsersPage({ t, db }: { t: any; db: any }) {
  const [search, setSearch] = useState("");
  const rows = db.users.filter((u: any) => (u.name + u.role + u.email).toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader t={t} title="Users" subtitle="Manage platform accounts and role-based access control." />
      <Toolbar t={t} search={search} setSearch={setSearch} />
      <Table t={t} rows={rows} columns={[
        { key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" },
        { key: "active", label: "Status", render: (r: any) => <Badge status={r.active ? "Active" : "Unavailable"} t={t} /> },
      ]} />
    </div>
  );
}

/* ============================== SETTINGS ============================== */
export function SettingsPage({ t, theme, setTheme, user, onOpenApiKeyModal }: { t: any; theme: string; setTheme: (s: string) => void; user: any; onOpenApiKeyModal?: () => void }) {
  return (
    <div>
      <PageHeader t={t} title="Settings & Mission Configuration" subtitle="Platform preferences, external satellite API configurations, and account information." />
      <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-5 max-w-2xl space-y-6">
        <div>
          <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">Appearance Theme</span>
          <p style={{ color: t.textDim }} className="text-xs mb-2.5">Select high-contrast dark tactical mode or polar daylight mode.</p>
          <div className="flex gap-2">
            <button onClick={() => setTheme("light")} style={{ background: theme === "light" ? t.accentSoft : t.bgAlt, color: theme === "light" ? t.accent : t.textDim, border: `1px solid ${theme === "light" ? t.accent : t.border}` }} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium cursor-pointer"><Sun size={15} />Daylight High-Contrast</button>
            <button onClick={() => setTheme("dark")} style={{ background: theme === "dark" ? t.accentSoft : t.bgAlt, color: theme === "dark" ? t.accent : t.textDim, border: `1px solid ${theme === "dark" ? t.accent : t.border}` }} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium cursor-pointer"><Moon size={15} />Sub-Zero Tactical Dark</button>
          </div>
        </div>

        {onOpenApiKeyModal && (
          <div className="pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
            <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">External API & Satellite Integrations</span>
            <p style={{ color: t.textDim }} className="text-xs mb-3">Configure Gemini AI Reconnaissance engine and Google Maps Platform high-resolution satellite cartography.</p>
            <button
              onClick={onOpenApiKeyModal}
              style={{ background: t.accent, color: "#04222A" }}
              className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:opacity-90 transition-opacity"
            >
              <Key size={14} />
              <span>Configure API Keys (Gemini &amp; Google Maps)</span>
            </button>
          </div>
        )}

        <div className="pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
          <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">Operator Account &amp; Station Role</span>
          <div className="mt-2 text-sm space-y-1.5 font-mono">
            <p style={{ color: t.textDim }}>Operator: <span style={{ color: t.text }} className="font-sans font-medium">{user.name}</span></p>
            <p style={{ color: t.textDim }}>Permission Level: <span className="text-emerald-400 font-bold">{user.role}</span></p>
            <p style={{ color: t.textDim }}>Active Ingress Port: <span className="text-sky-400">3000 (0.0.0.0)</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== LOGIN ============================== */
export function LoginView({ t, onLogin, theme, setTheme }: { t: any; onLogin: (role: string) => void; theme: string; setTheme: (s: string) => void }) {
  const [role, setRole] = useState<string | null>(null);
  const roleIcons: Record<string, any> = { "Super Admin": ShieldCheck, "Expedition Manager": Compass, "Logistics Officer": TrendingUp, "Asset Manager": Wallet, "Maintenance Officer": FileText, "Scientist / Team Member": ShieldCheck };

  return (
    <div style={{ background: t.bg }} className="min-h-screen flex items-center justify-center p-6 relative">
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ color: t.textDim, border: `1px solid ${t.border}` }} className="absolute top-5 right-5 p-2 rounded-lg cursor-pointer">
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div style={{ background: t.accentSoft, color: t.accent }} className="w-11 h-11 rounded-xl flex items-center justify-center"><Snowflake size={22} /></div>
          <div>
            <div style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-lg font-semibold leading-tight">POLARIS</div>
            <div style={{ color: t.textFaint }} className="text-xs">Integrated Polar Expedition Logistics &amp; Asset Management</div>
          </div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-6">
          <h2 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-base font-semibold mb-1">Sign in to continue</h2>
          <p style={{ color: t.textFaint }} className="text-xs mb-5">Demo mode &mdash; select a role to explore its permissions. No password required for this SIH demonstration build.</p>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {ROLES.map(r => {
              const Icon = roleIcons[r] || ShieldCheck;
              const active = role === r;
              return (
                <button key={r} onClick={() => setRole(r)} style={{ background: active ? t.accentSoft : t.bgAlt, border: `1px solid ${active ? t.accent : t.border}`, color: active ? t.accent : t.textDim }} className="rounded-lg p-3 flex flex-col items-start gap-2 text-left transition-colors cursor-pointer">
                  <Icon size={16} />
                  <span style={{ fontFamily: FONT_BODY }} className="text-xs font-medium leading-tight">{r}</span>
                </button>
              );
            })}
          </div>
          <button disabled={!role} onClick={() => role && onLogin(role)} style={{ background: role ? t.accent : t.bgAlt, color: role ? "#04222A" : t.textFaint, fontFamily: FONT_BODY }} className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer">
            Enter Command Center <ArrowRight size={15} />
          </button>
        </div>
        <p style={{ color: t.textFaint }} className="text-center text-xs mt-4">All data shown is DEMO DATA generated for evaluation purposes.</p>
      </div>
    </div>
  );
}
