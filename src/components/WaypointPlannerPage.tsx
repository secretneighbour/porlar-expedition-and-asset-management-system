import React, { useState, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Plus, 
  Trash2, 
  Download, 
  Compass, 
  AlertTriangle, 
  Flag, 
  Fuel, 
  Radio, 
  Mountain, 
  Snowflake, 
  Plane, 
  CheckCircle2, 
  Sparkles, 
  Loader2,
  Search,
  SlidersHorizontal,
  Route,
  ShieldAlert,
  Ruler
} from 'lucide-react';
import { Expedition, Waypoint } from '../types';

interface WaypointPlannerPageProps {
  expeditions: Expedition[];
  onAddWaypoint: (waypoint: Waypoint, expeditionId?: string) => void;
  onDeleteWaypoint: (waypointId: string, expeditionId?: string) => void;
  onUpdateWaypoint: (waypoint: Waypoint, expeditionId?: string) => void;
  userLat?: number | null;
  userLng?: number | null;
  userCityName?: string | null;
}

interface WaypointPreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultName: string;
  defaultElevation: string;
  defaultDistance: string;
  defaultHazard: string;
  colorClass: string;
}

const PRESETS: WaypointPreset[] = [
  {
    id: 'fuel_cache',
    label: 'Fuel & Supply Cache',
    icon: <Fuel className="w-4 h-4 text-amber-400" />,
    defaultName: 'Fuel Depot Delta-3',
    defaultElevation: '2100',
    defaultDistance: '80',
    defaultHazard: '200x 208L drums Jet-A1 fuel buried in snow drift.',
    colorClass: 'bg-amber-950/60 border-amber-600/80 text-amber-300 hover:bg-amber-900/80',
  },
  {
    id: 'aws_station',
    label: 'AWS Weather Sensor',
    icon: <Radio className="w-4 h-4 text-sky-400" />,
    defaultName: 'AWS Sensor Node Bravo',
    defaultElevation: '1850',
    defaultDistance: '55',
    defaultHazard: 'Satellite telemetry node active. Avoid tower guy wires.',
    colorClass: 'bg-sky-950/60 border-sky-600/80 text-sky-300 hover:bg-sky-900/80',
  },
  {
    id: 'crevasse_bypass',
    label: 'Crevasse Bypass',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
    defaultName: 'Shear Zone Bypass Marker',
    defaultElevation: '1200',
    defaultDistance: '40',
    defaultHazard: 'Active shear crevasses! Maintain ground radar scan.',
    colorClass: 'bg-rose-950/60 border-rose-600/80 text-rose-300 hover:bg-rose-900/80',
  },
  {
    id: 'ice_core',
    label: 'Ice Core Drill Hole',
    icon: <Mountain className="w-4 h-4 text-cyan-400" />,
    defaultName: 'Firn Core Drill Site #4',
    defaultElevation: '2800',
    defaultDistance: '120',
    defaultHazard: '2500m thermal drill rig on site. Deep open borehole.',
    colorClass: 'bg-cyan-950/60 border-cyan-600/80 text-cyan-300 hover:bg-cyan-900/80',
  },
  {
    id: 'emergency_refuge',
    label: 'Emergency Refuge Pod',
    icon: <Snowflake className="w-4 h-4 text-emerald-400" />,
    defaultName: 'South Dome Survival Shelter',
    defaultElevation: '3100',
    defaultDistance: '95',
    defaultHazard: 'Stocked with 30-day rations, generator, and polar medical kit.',
    colorClass: 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300 hover:bg-emerald-900/80',
  },
  {
    id: 'skiway',
    label: 'Skiway Runway Strip',
    icon: <Plane className="w-4 h-4 text-indigo-400" />,
    defaultName: 'Forward Skiway Drop Zone',
    defaultElevation: '1450',
    defaultDistance: '60',
    defaultHazard: 'LC-130 Hercules snow landing strip. Flagged perimeter.',
    colorClass: 'bg-indigo-950/60 border-indigo-600/80 text-indigo-300 hover:bg-indigo-900/80',
  },
];

export const WaypointPlannerPage: React.FC<WaypointPlannerPageProps> = ({
  expeditions,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
  userLat,
  userLng,
  userCityName,
}) => {
  const [targetType, setTargetType] = useState<'expedition' | 'standalone'>('expedition');
  const [activeTab, setActiveTab] = useState<'all' | 'form' | 'list'>('all');
  const [selectedExpId, setSelectedExpId] = useState<string>(expeditions[0]?.id || '');
  const [name, setName] = useState('');
  const [latInput, setLatInput] = useState<string>('-81.25');
  const [lngInput, setLngInput] = useState<string>('142.50');
  const [elevationInput, setElevationInput] = useState<string>('2100');
  const [distanceInput, setDistanceInput] = useState<string>('65');
  const [hazardNote, setHazardNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeExpedition = expeditions.find((e) => e.id === selectedExpId) || expeditions[0];

  const filteredWaypoints = activeExpedition?.waypoints.filter((wp) =>
    wp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (wp.hazardNote && wp.hazardNote.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const totalDistanceKm = activeExpedition?.waypoints.reduce((acc, wp) => acc + (wp.distanceFromPrevKm || 0), 0) || 0;
  const clearedCount = activeExpedition?.waypoints.filter((wp) => wp.passed).length || 0;
  const hazardCount = activeExpedition?.waypoints.filter((wp) => !!wp.hazardNote).length || 0;

  const handleApplyPreset = (preset: WaypointPreset) => {
    setValidationError(null);
    setName(preset.defaultName);
    setElevationInput(preset.defaultElevation);
    setDistanceInput(preset.defaultDistance);
    setHazardNote(preset.defaultHazard);

    if (activeExpedition && activeExpedition.waypoints.length > 0) {
      const lastWp = activeExpedition.waypoints[activeExpedition.waypoints.length - 1];
      setLatInput((lastWp.lat - 0.2).toFixed(4));
      setLngInput((lastWp.lng + 0.3).toFixed(4));
    }
  };

  const handleAcquireGps = () => {
    setValidationError(null);
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      setLatInput(Number(userLat).toFixed(4));
      setLngInput(Number(userLng).toFixed(4));
      if (!name) setName(userCityName ? `${userCityName} Fix` : 'GPS Position Fix');
      return;
    }

    if (!navigator.geolocation) {
      setValidationError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setLatInput(pos.coords.latitude.toFixed(4));
        setLngInput(pos.coords.longitude.toFixed(4));
        if (pos.coords.altitude) setElevationInput(Math.round(pos.coords.altitude).toString());
        if (!name) setName('Live GPS Fix');
      },
      (err) => {
        setGpsLoading(false);
        setValidationError(`GPS error: ${err.message || 'Location access denied'}`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleClearAllRouteWaypoints = () => {
    if (!activeExpedition || activeExpedition.waypoints.length === 0) return;
    activeExpedition.waypoints.forEach((wp) => {
      onDeleteWaypoint(wp.id, activeExpedition.id);
    });
    setSuccessToast(`All ${activeExpedition.waypoints.length} waypoints removed from ${activeExpedition.name}.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleClearClearedWaypoints = () => {
    if (!activeExpedition) return;
    const cleared = activeExpedition.waypoints.filter((wp) => wp.passed);
    if (cleared.length === 0) return;
    cleared.forEach((wp) => {
      onDeleteWaypoint(wp.id, activeExpedition.id);
    });
    setSuccessToast(`Removed ${cleared.length} cleared waypoints.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleQuickStepNextWaypoint = () => {
    let baseLat = parseFloat(latInput) || -81.25;
    let baseLng = parseFloat(lngInput) || 142.50;
    let baseElev = parseFloat(elevationInput) || 2000;

    if (activeExpedition && activeExpedition.waypoints.length > 0) {
      const lastWp = activeExpedition.waypoints[activeExpedition.waypoints.length - 1];
      baseLat = lastWp.lat;
      baseLng = lastWp.lng;
      baseElev = lastWp.elevationM;
    }

    const nextLat = Number((baseLat - 0.25).toFixed(4));
    const nextLng = Number((baseLng + 0.35).toFixed(4));
    const nextNum = (activeExpedition?.waypoints.length || 0) + 1;
    const nextName = `Waypoint Fix #${nextNum}`;

    const newWp: Waypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: nextName,
      lat: nextLat,
      lng: nextLng,
      elevationM: baseElev,
      distanceFromPrevKm: 50,
      passed: false,
    };

    const expId = targetType === 'expedition' && selectedExpId ? selectedExpId : undefined;
    onAddWaypoint(newWp, expId);
    setLatInput(nextLat.toFixed(4));
    setLngInput(nextLng.toFixed(4));
    setSuccessToast(`Quick WP "${nextName}" set at ${nextLat}°, ${nextLng}°!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Please enter a Waypoint Name or select a Quick Preset template.');
      nameInputRef.current?.focus();
      return;
    }

    const parsedLat = parseFloat(latInput);
    const parsedLng = parseFloat(lngInput);
    const parsedElev = parseFloat(elevationInput);
    const parsedDist = parseFloat(distanceInput);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setValidationError('Latitude must be a valid number between -90 and +90.');
      return;
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setValidationError('Longitude must be a valid number between -180 and +180.');
      return;
    }

    const newWp: Waypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      lat: parsedLat,
      lng: parsedLng,
      elevationM: isNaN(parsedElev) ? 1800 : parsedElev,
      distanceFromPrevKm: isNaN(parsedDist) ? 50 : parsedDist,
      passed: false,
      hazardNote: hazardNote.trim() || undefined,
    };

    const expId = targetType === 'expedition' && selectedExpId ? selectedExpId : undefined;
    onAddWaypoint(newWp, expId);
    setSuccessToast(`Waypoint "${newWp.name}" successfully registered!`);
    setName('');
    setHazardNote('');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const exportWaypointsGpx = (expName: string, waypoints: Waypoint[]) => {
    let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PolarOps Route Studio" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${expName} Route</name>
  </metadata>
  <rte>
    <name>${expName} Traverse Route</name>\n`;

    waypoints.forEach((wp, i) => {
      gpxContent += `    <rtept lat="${wp.lat}" lon="${wp.lng}">
      <ele>${wp.elevationM || 0}</ele>
      <name>WP-${i + 1}: ${wp.name}</name>
      ${wp.hazardNote ? `<cmt>${wp.hazardNote}</cmt>` : ''}
    </rtept>\n`;
    });

    gpxContent += `  </rte>\n</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${expName.replace(/\s+/g, '_')}_Waypoints.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16 font-mono text-xs max-w-7xl mx-auto px-2 sm:px-4">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-400 shrink-0">
            <Navigation className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
                TACTICAL ROUTE STUDIO
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 text-[9px] font-bold">
                STANDALONE & EXPEDITION
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white font-display uppercase tracking-wide mt-0.5">
              WAYPOINT REGISTRY & PLANNER
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Mobile View Switcher */}
          <div className="flex lg:hidden bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                activeTab === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                activeTab === 'form' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pin Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                activeTab === 'list' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registry ({filteredWaypoints.length})
            </button>
          </div>

          {activeExpedition && activeExpedition.waypoints.length > 0 && (
            <button
              type="button"
              onClick={() => exportWaypointsGpx(activeExpedition.name, activeExpedition.waypoints)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
            >
              <Download className="w-4 h-4 text-sky-400 shrink-0" />
              <span>EXPORT GPX ({activeExpedition.waypoints.length} WPs)</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Strip */}
      {activeExpedition && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">TOTAL DISTANCE</span>
              <span className="text-sm font-bold text-white">{totalDistanceKm} km</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">REGISTERED WPs</span>
              <span className="text-sm font-bold text-white">{activeExpedition.waypoints.length}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">CLEARED / REACHED</span>
              <span className="text-sm font-bold text-white">{clearedCount} / {activeExpedition.waypoints.length}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">HAZARD NOTICES</span>
              <span className="text-sm font-bold text-white">{hazardCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Split-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Entry Studio */}
        <div className={`lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 ${
          activeTab === 'list' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>PIN NEW WAYPOINT</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">FORM STUDIO</span>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold text-[11px]">{validationError}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-[11px]">{successToast}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target Category Selection */}
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase font-bold text-[10px] sm:text-[11px] block">
                WAYPOINT TARGET CATEGORY:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('expedition')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                    targetType === 'expedition'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Flag className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase truncate">Expedition Route</span>
                    <span className="text-[9px] text-slate-400 truncate block">Attach to traverse</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('standalone')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                    targetType === 'standalone'
                      ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase truncate">Standalone Fix</span>
                    <span className="text-[9px] text-slate-400 truncate block">Independent pin</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Target Expedition Selector */}
            {targetType === 'expedition' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold text-[10px] sm:text-[11px] block">
                  TARGET EXPEDITION TRAVERSE:
                </label>
                <select
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer text-xs min-h-[44px]"
                >
                  {expeditions.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      [{exp.code}] {exp.name} ({exp.waypoints.length} WPs)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase font-bold text-[10px] sm:text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                QUICK PRESET TEMPLATES:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${preset.colorClass}`}
                  >
                    <div className="p-1.5 rounded bg-black/40 shrink-0">
                      {preset.icon}
                    </div>
                    <span className="text-[11px] font-bold truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Waypoint Name */}
            <div className="space-y-1.5">
              <label className="text-slate-300 uppercase font-bold text-[10px] sm:text-[11px] block">
                WAYPOINT IDENTIFIER / NAME *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. Fuel Depot Delta-3"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold text-xs min-h-[44px]"
              />
            </div>

            {/* Coordinates & Elevation Matrix */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-amber-400 font-bold uppercase text-[10px] sm:text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  COORDINATES & ELEVATION
                </span>
                <button
                  type="button"
                  onClick={handleAcquireGps}
                  disabled={gpsLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/80 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[32px]"
                >
                  {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                  <span>{userLat !== null ? 'USE MY GPS' : 'GET GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px] font-bold block mb-1">LATITUDE:</label>
                  <input
                    type="text"
                    required
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold block mb-1">LONGITUDE:</label>
                  <input
                    type="text"
                    required
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold block mb-1">ELEV (M):</label>
                  <input
                    type="text"
                    value={elevationInput}
                    onChange={(e) => setElevationInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Leg Distance & Hazard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 uppercase font-bold text-[10px] sm:text-[11px] block mb-1">LEG DIST (KM):</label>
                <input
                  type="text"
                  value={distanceInput}
                  onChange={(e) => setDistanceInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-slate-300 uppercase font-bold text-[10px] sm:text-[11px] block mb-1">HAZARD NOTE:</label>
                <input
                  type="text"
                  value={hazardNote}
                  onChange={(e) => setHazardNote(e.target.value)}
                  placeholder="e.g. Crevasse zone"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 text-xs min-h-[40px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-amber-400 shadow-lg cursor-pointer text-xs min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>PIN WAYPOINT</span>
              </button>

              <button
                type="button"
                onClick={handleQuickStepNextWaypoint}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-sky-600/80 cursor-pointer text-xs min-h-[44px]"
                title="Automatically calculate and pin next sequential waypoint +50km ahead"
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>+STEP NEXT WP (+50KM)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Registered Waypoints & Inspection */}
        <div className={`lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 ${
          activeTab === 'form' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ROUTE WAYPOINTS REGISTRY</span>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase font-display">
                {activeExpedition ? activeExpedition.name : 'Select Expedition'} ({filteredWaypoints.length} WPs)
              </h2>
            </div>

            {activeExpedition && (
              <div className="flex flex-wrap items-center gap-2">
                {clearedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearClearedWaypoints}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Remove all cleared waypoints"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Clear Cleared ({clearedCount})</span>
                  </button>
                )}

                {activeExpedition.waypoints.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllRouteWaypoints}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Clear all waypoints for this expedition route"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Clear All Route ({activeExpedition.waypoints.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search Filter input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search waypoints by name or hazard note..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 min-h-[42px]"
            />
          </div>

          {filteredWaypoints.length > 0 ? (
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredWaypoints.map((wp, idx) => (
                <div
                  key={wp.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-3 transition-all ${
                    wp.passed
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-slate-300'
                      : wp.hazardNote
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
                    <button
                      type="button"
                      onClick={() => onUpdateWaypoint({ ...wp, passed: !wp.passed }, activeExpedition?.id)}
                      className="mt-0.5 p-1 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                      title={wp.passed ? 'Mark as pending' : 'Mark as reached'}
                    >
                      {wp.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-amber-400 inline-block transition-colors"></span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                          <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                          <span>{wp.name}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {wp.elevationM}m AMSL
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span>Lat: {wp.lat.toFixed(4)}°, Lng: {wp.lng.toFixed(4)}°</span>
                        {wp.distanceFromPrevKm > 0 && (
                          <span className="text-sky-400 font-bold">Leg: +{wp.distanceFromPrevKm}km</span>
                        )}
                      </div>

                      {wp.hazardNote && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1.5 mt-2 bg-amber-950/60 p-2 rounded-lg border border-amber-800/60">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span className="font-medium">{wp.hazardNote}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteWaypoint(wp.id, activeExpedition?.id);
                      setSuccessToast(`Waypoint "${wp.name}" removed.`);
                      setTimeout(() => setSuccessToast(null), 3000);
                    }}
                    className="p-2.5 rounded-lg bg-rose-950/40 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors shrink-0 cursor-pointer self-end sm:self-start min-w-[38px] min-h-[38px] flex items-center justify-center border border-rose-800/60"
                    title="Instant remove waypoint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 italic space-y-2 border border-dashed border-slate-800 rounded-2xl">
              <MapPin className="w-8 h-8 mx-auto text-slate-600" />
              <p>No waypoints registered matching current filter.</p>
              <p className="text-[11px] text-slate-600">Use the studio form on the left to pin your first tactical waypoint.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
