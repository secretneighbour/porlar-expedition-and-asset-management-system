import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  X, 
  Plus, 
  MapPin, 
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
  Loader2
} from 'lucide-react';
import { Waypoint, Expedition } from '../types';

interface AddWaypointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWaypoint: (waypoint: Waypoint, expeditionId?: string) => void;
  expeditions: Expedition[];
  selectedExpeditionId?: string | null;
  preselectedExpeditionId?: string | null;
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
    colorClass: 'bg-amber-950/60 border-amber-600/80 text-amber-300 hover:bg-amber-900',
  },
  {
    id: 'aws_station',
    label: 'AWS Weather Sensor',
    icon: <Radio className="w-4 h-4 text-sky-400" />,
    defaultName: 'AWS Sensor Node Bravo',
    defaultElevation: '1850',
    defaultDistance: '55',
    defaultHazard: 'Satellite telemetry node active. Avoid tower guy wires.',
    colorClass: 'bg-sky-950/60 border-sky-600/80 text-sky-300 hover:bg-sky-900',
  },
  {
    id: 'crevasse_bypass',
    label: 'Crevasse Bypass',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
    defaultName: 'Shear Zone Bypass Marker',
    defaultElevation: '1200',
    defaultDistance: '40',
    defaultHazard: 'Active shear crevasses! Maintain ground radar scan.',
    colorClass: 'bg-rose-950/60 border-rose-600/80 text-rose-300 hover:bg-rose-900',
  },
  {
    id: 'ice_core',
    label: 'Ice Core Drill Hole',
    icon: <Mountain className="w-4 h-4 text-cyan-400" />,
    defaultName: 'Firn Core Drill Site #4',
    defaultElevation: '2800',
    defaultDistance: '120',
    defaultHazard: '2500m thermal drill rig on site. Deep open borehole.',
    colorClass: 'bg-cyan-950/60 border-cyan-600/80 text-cyan-300 hover:bg-cyan-900',
  },
  {
    id: 'emergency_refuge',
    label: 'Emergency Refuge Pod',
    icon: <Snowflake className="w-4 h-4 text-emerald-400" />,
    defaultName: 'South Dome Survival Shelter',
    defaultElevation: '3100',
    defaultDistance: '95',
    defaultHazard: 'Stocked with 30-day rations, generator, and polar medical kit.',
    colorClass: 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300 hover:bg-emerald-900',
  },
  {
    id: 'skiway',
    label: 'Skiway Runway Strip',
    icon: <Plane className="w-4 h-4 text-indigo-400" />,
    defaultName: 'Forward Skiway Drop Zone',
    defaultElevation: '1450',
    defaultDistance: '60',
    defaultHazard: 'LC-130 Hercules snow landing strip. Flagged perimeter.',
    colorClass: 'bg-indigo-950/60 border-indigo-600/80 text-indigo-300 hover:bg-indigo-900',
  },
];

export const AddWaypointModal: React.FC<AddWaypointModalProps> = ({
  isOpen,
  onClose,
  onAddWaypoint,
  expeditions,
  selectedExpeditionId,
  preselectedExpeditionId,
  userLat,
  userLng,
  userCityName,
}) => {
  const activeExpeditionProp = selectedExpeditionId || preselectedExpeditionId;

  const [targetType, setTargetType] = useState<'expedition' | 'standalone'>('expedition');
  const [targetExpeditionId, setTargetExpeditionId] = useState<string>('');
  
  const [name, setName] = useState('');
  const [latInput, setLatInput] = useState<string>('-81.25');
  const [lngInput, setLngInput] = useState<string>('142.50');
  const [elevationInput, setElevationInput] = useState<string>('2100');
  const [distanceInput, setDistanceInput] = useState<string>('65');
  const [hazardNote, setHazardNote] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);

  // Initialize and reset form only when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setName('');
      setHazardNote('');
      setValidationError(null);
      setSuccessToast(null);

      if (activeExpeditionProp) {
        setTargetType('expedition');
        setTargetExpeditionId(activeExpeditionProp);
      } else if (expeditions.length > 0) {
        setTargetType('expedition');
        setTargetExpeditionId(expeditions[0].id);
      } else {
        setTargetType('standalone');
        setTargetExpeditionId('');
      }

      // Default coordinates from selected expedition or GPS
      const targetExp = expeditions.find((e) => e.id === (activeExpeditionProp || expeditions[0]?.id));
      if (targetExp && targetExp.waypoints.length > 0) {
        const lastWp = targetExp.waypoints[targetExp.waypoints.length - 1];
        setLatInput(lastWp.lat.toFixed(4));
        setLngInput(lastWp.lng.toFixed(4));
        setElevationInput(lastWp.elevationM.toString());
      } else if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
        setLatInput(Number(userLat).toFixed(4));
        setLngInput(Number(userLng).toFixed(4));
      } else {
        setLatInput('-81.2500');
        setLngInput('142.5000');
      }

      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, activeExpeditionProp, expeditions, userLat, userLng]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: WaypointPreset) => {
    setValidationError(null);
    setName(preset.defaultName);
    setElevationInput(preset.defaultElevation);
    setDistanceInput(preset.defaultDistance);
    setHazardNote(preset.defaultHazard);

    // If an expedition is selected, adjust coordinates
    const selectedExp = expeditions.find((e) => e.id === targetExpeditionId);
    if (selectedExp && selectedExp.waypoints.length > 0) {
      const lastWp = selectedExp.waypoints[selectedExp.waypoints.length - 1];
      const nextLat = (lastWp.lat - (Math.random() * 0.3 + 0.1)).toFixed(4);
      const nextLng = (lastWp.lng + (Math.random() * 0.5 + 0.1)).toFixed(4);
      setLatInput(nextLat);
      setLngInput(nextLng);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Please enter a Waypoint Name or select a Quick Preset template above.');
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

    const safeElev = isNaN(parsedElev) ? 1800 : parsedElev;
    const safeDist = isNaN(parsedDist) ? 50 : parsedDist;

    const newWp: Waypoint = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      lat: parsedLat,
      lng: parsedLng,
      elevationM: safeElev,
      distanceFromPrevKm: safeDist,
      passed: false,
      hazardNote: hazardNote.trim() || undefined,
    };

    const expId = targetType === 'expedition' && targetExpeditionId ? targetExpeditionId : undefined;

    onAddWaypoint(newWp, expId);

    setSuccessToast(`Waypoint "${newWp.name}" successfully registered!`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 700);
  };

  const selectedExpedition = expeditions.find((e) => e.id === targetExpeditionId);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-8 text-slate-100 font-mono text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-600 text-amber-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase block">
                TACTICAL NAVIGATION DESK
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white font-display tracking-wide uppercase">
                REGISTER POLAR WAYPOINT
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 flex items-center justify-between gap-2 animate-shake">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold text-xs">{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="p-1 hover:bg-rose-900 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success Confirmation Toast */}
        {successToast && (
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 flex items-center gap-2.5 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{successToast}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Category: Expedition Route vs Standalone Field Pin */}
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold text-[11px] block">
              WAYPOINT TARGET CATEGORY:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType('expedition');
                  if (!targetExpeditionId && expeditions.length > 0) {
                    setTargetExpeditionId(expeditions[0].id);
                  }
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  targetType === 'expedition'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Flag className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="block text-xs font-bold uppercase">Attach to Expedition</span>
                  <span className="text-[10px] text-slate-400 font-normal">Add to active traverse route</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('standalone')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  targetType === 'standalone'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold shadow-lg shadow-sky-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0 text-sky-400" />
                <div>
                  <span className="block text-xs font-bold uppercase">Standalone Field Fix</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pin independent map marker</span>
                </div>
              </button>
            </div>
          </div>

          {/* Expedition Picker */}
          {targetType === 'expedition' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 uppercase font-bold text-[11px]">
                  SELECT TARGET EXPEDITION TRAVERSE:
                </label>
                {selectedExpedition && (
                  <span className="text-[10px] text-sky-400 font-bold">
                    Currently has {selectedExpedition.waypoints.length} waypoints
                  </span>
                )}
              </div>
              
              {expeditions.length > 0 ? (
                <select
                  value={targetExpeditionId}
                  onChange={(e) => setTargetExpeditionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                >
                  {expeditions.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      [{exp.code}] {exp.name} — {exp.leader} ({exp.waypoints.length} WPs, {exp.distanceCoveredKm}/{exp.totalDistanceKm}km)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs italic">
                  No active expeditions found. Waypoint will be registered as a Standalone Field Fix.
                </div>
              )}
            </div>
          )}

          {/* Quick Preset Template Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 uppercase font-bold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                QUICK PRESET AUTO-FILL:
              </label>
              <span className="text-[10px] text-slate-500">Click to fill standard polar preset</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${preset.colorClass}`}
                >
                  <div className="p-1.5 rounded-lg bg-black/40 shrink-0">
                    {preset.icon}
                  </div>
                  <span className="text-[11px] font-bold truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Waypoint Name Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 uppercase font-bold text-[11px] block">
              WAYPOINT IDENTIFIER CODE / NAME *
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
              placeholder="e.g. Fuel Cache Delta-3 or Crevasse Shear Bypass"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold text-sm"
            />
          </div>

          {/* GPS Coordinates & Elevation Matrix */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <span className="text-amber-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                COORDINATES & ELEVATION MATRIX
              </span>

              <button
                type="button"
                onClick={handleAcquireGps}
                disabled={gpsLoading}
                className="px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/80 text-[10px] font-bold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Compass className="w-3.5 h-3.5" />
                )}
                <span>
                  {userLat !== null && userLat !== undefined
                    ? `USE DEVICE GPS (${Number(userLat).toFixed(2)}°, ${Number(userLng).toFixed(2)}°)`
                    : 'ACQUIRE DEVICE GPS'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">
                  LATITUDE (°N / °S):
                </label>
                <input
                  type="text"
                  required
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="-81.25"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">
                  LONGITUDE (°E / °W):
                </label>
                <input
                  type="text"
                  required
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="142.50"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">
                  ELEVATION (METERS):
                </label>
                <input
                  type="text"
                  value={elevationInput}
                  onChange={(e) => setElevationInput(e.target.value)}
                  placeholder="2100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Leg Distance & Hazard Warning */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 uppercase font-bold text-[11px] block mb-1">
                LEG DISTANCE (KM):
              </label>
              <input
                type="text"
                value={distanceInput}
                onChange={(e) => setDistanceInput(e.target.value)}
                placeholder="65"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 uppercase font-bold text-[11px] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                HAZARD WARNING NOTE (OPTIONAL):
              </label>
              <input
                type="text"
                value={hazardNote}
                onChange={(e) => setHazardNote(e.target.value)}
                placeholder="e.g. Sastrugi ridge zone, maintain GPR radar on 500m"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Live Waypoint Preview Card */}
          {name.trim() && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                LIVE WAYPOINT BADGE PREVIEW:
              </span>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <strong className="text-white text-sm">{name}</strong>
                  {hazardNote && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[9px] font-bold">
                      HAZARD
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {latInput}°, {lngInput}° • {elevationInput}m elev • +{distanceInput}km leg
                </div>
              </div>
              {hazardNote && (
                <p className="text-[10px] text-amber-300 italic pt-1">
                  "{hazardNote}"
                </p>
              )}
            </div>
          )}

          {/* Footer Control Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors text-xs cursor-pointer"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-amber-400 shadow-xl shadow-amber-950/60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>PIN WAYPOINT TO ROUTE</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
