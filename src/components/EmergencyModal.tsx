import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  MapPin, 
  X,
  Truck,
  Plane,
  Smartphone,
  Send,
  Navigation,
  Crosshair,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PolarAsset } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';

interface EmergencyModalProps {
  isOpen?: boolean;
  onClose: () => void;
  assets?: PolarAsset[];
  user?: { name: string; role: string; id?: string; email?: string } | null;
  currentStation?: string;
  activeExpeditionName?: string;
  onTriggerEmergencyBroadcast?: (incidentData: {
    incidentType: string;
    location: string;
    coordinates: string;
    summary: string;
    reporterCallsign?: string;
    reportedByDevice?: 'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ';
  }) => void;
  onTriggerDistress?: (type: string, description: string) => void;
  activeDistress?: any;
  onAcknowledge?: any;
  onResolve?: any;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen = true,
  onClose,
  assets = [],
  user,
  currentStation = 'Maitri',
  activeExpeditionName = 'EXP-701 Queen Maud Traverse',
  onTriggerEmergencyBroadcast,
  onTriggerDistress,
  activeDistress,
  onAcknowledge,
  onResolve,
}) => {
  const [incidentType, setIncidentType] = useState('Crevasse Fall / Structural Ice Breach');
  const [locationName, setLocationName] = useState(`${currentStation} Station Sector (Outer Perimeter)`);
  const [coordinates, setCoordinates] = useState('-70.7667, 11.7333');
  const [reporterCallsign, setReporterCallsign] = useState(user?.name ? `${user.name.toUpperCase()} (LEAD)` : 'EXP-701 FIELD MOBILE');
  const [reportedByDevice, setReportedByDevice] = useState<'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ'>('Mobile Phone Field Unit');
  const [personnelCount, setPersonnelCount] = useState(4);
  const [medicalUrgency, setMedicalUrgency] = useState('Stage-2 Hypothermia / Immediate Evacuation');
  const [notes, setNotes] = useState('Lead tracked unit encountered structural ice rift. Personnel secured in survival capsule. Immediate SAR scramble requested.');
  const [geoFixAcquired, setGeoFixAcquired] = useState<string | null>(null);
  const [showCustomDetails, setShowCustomDetails] = useState(false);

  const { acquireSingleFix, loading: geoLoading, error: geoError } = useGeolocation();

  if (!isOpen) return null;

  const handleAcquireDeviceGps = async () => {
    try {
      const fix = await acquireSingleFix();
      const coordStr = `${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}`;
      setCoordinates(coordStr);
      setLocationName(`Real-Time GPS Fix (${fix.lat > 0 ? 'Arctic/North' : 'Antarctica/South'})`);
      setGeoFixAcquired(`Fix: ${coordStr} (Accuracy: ±${Math.round(fix.accuracy)}m)`);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const sarCapableAssets = assets.filter(
    (a) => a.category === 'emergency_sar' || a.category === 'aviation' || a.category === 'heavy_traverse'
  );

  // Fast 1-Tap Mayday: zero manual form filling
  const handleFastOneTapMayday = () => {
    const payload = {
      incidentType: 'CRITICAL EMERGENCY: MAYDAY DISTRESS BEACON',
      location: locationName.trim() || `${currentStation} Operations Sector`,
      coordinates: coordinates.trim() || '-70.7667, 11.7333',
      summary: `ONE-TAP EMERGENCY SOS: Field Mayday broadcast initiated by ${user?.name || 'Field Operator'} at ${currentStation} sector. Telemetry: -48.2°C ambient, 45kt gale. Party: ${activeExpeditionName}. Automated SAR scramble required.`,
      reporterCallsign: reporterCallsign.trim() || (user?.name ? user.name.toUpperCase() : 'EXP-701 LEAD'),
      reportedByDevice,
    };

    if (onTriggerEmergencyBroadcast) {
      onTriggerEmergencyBroadcast(payload);
    } else if (onTriggerDistress) {
      onTriggerDistress(payload.incidentType, payload.summary);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      incidentType,
      location: locationName.trim(),
      coordinates: coordinates.trim(),
      summary: `${notes.trim()} (Urgency: ${medicalUrgency}, Souls: ${personnelCount}, Mission: ${activeExpeditionName})`,
      reporterCallsign: reporterCallsign.trim() || 'FIELD UNIT',
      reportedByDevice,
    };

    if (onTriggerEmergencyBroadcast) {
      onTriggerEmergencyBroadcast(payload);
    } else if (onTriggerDistress) {
      onTriggerDistress(incidentType, payload.summary);
    }
    onClose();
  };

  const setPresetCoords = (type: 'leverett' | 'southpole' | 'wilkes' | 'svalbard' | 'maitri') => {
    setGeoFixAcquired(null);
    switch (type) {
      case 'maitri':
        setLocationName('Maitri Station Perimeter (-70.76°S, 11.73°E)');
        setCoordinates('-70.7667, 11.7333');
        break;
      case 'leverett':
        setLocationName('Leverett Glacier Ascent Zone');
        setCoordinates('-85.25, 151.10');
        break;
      case 'southpole':
        setLocationName('Amundsen-Scott Outer Perimeter (12km S)');
        setCoordinates('-89.92, 0.00');
        break;
      case 'wilkes':
        setLocationName('Wilkes Subglacial Basin Firn Edge');
        setCoordinates('-74.20, 132.80');
        break;
      case 'svalbard':
        setLocationName('Kongsvegen Glacier High Plateau');
        setCoordinates('78.85, 12.90');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div 
        style={{
          background: 'rgba(15, 8, 30, 0.96)',
          border: '1px solid rgba(239, 68, 68, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(239, 68, 68, 0.25)'
        }}
        className="rounded-2xl max-w-2xl w-full text-xs text-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-rose-800/50 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950 border border-rose-600 text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span>POLAR MAYDAY DISTRESS SYSTEM</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">406 MHz COSPAS-SARSAT</span>
              </div>
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                TACTICAL EMERGENCY MAYDAY CONSOLE
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* ACTIVE DISTRESS STATUS FEEDBACK (IF MAYDAY IS ALREADY TRANSMITTING) */}
          {activeDistress ? (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/80 text-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    MAYDAY BROADCAST ACTIVE &amp; TRANSMITTING
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-600/80 text-white text-[10px] font-bold">
                  {activeDistress.acknowledgedByHQ ? 'HQ ACKNOWLEDGED' : 'AWAITING HQ'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/40 p-3 rounded-lg border border-rose-500/20">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Transmission Status</span>
                  <span className="text-emerald-400 font-bold">LIVE SATCOM MESH BROADCAST</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Origin Device &amp; Callsign</span>
                  <span className="text-white font-bold">{activeDistress.reportedByDevice || 'Field Unit'} ({activeDistress.reporterCallsign || 'FIELD'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Coordinates &amp; Location</span>
                  <span className="text-cyan-300 font-bold">{activeDistress.coordinates} • {activeDistress.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Transmission Timestamp</span>
                  <span className="text-amber-300 font-bold">{new Date(activeDistress.timestamp).toLocaleTimeString()} ({new Date(activeDistress.timestamp).toISOString().slice(11, 19)} UTC)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-300 italic">
                  Emergency klaxon broadcasting on base stations. Autonomous SAR algorithms analyzing nearest rescue craft.
                </p>
                {onResolve && (
                  <button
                    type="button"
                    onClick={onResolve}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Resolve / Stand Down
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* FAST 1-TAP MAYDAY HERO BUTTON */
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/70 via-black/60 to-purple-950/40 border border-rose-600/70 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-rose-300 uppercase tracking-wider text-xs">
                    Zero-Latency Emergency Distress
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Context: <strong className="text-white">{currentStation}</strong> • <strong className="text-cyan-300">{activeExpeditionName}</strong>
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                In an extreme situation, do not fill forms. Click the button below to instantly transmit your callsign, station sector, device telemetry, and coordinates to all polar stations and trigger zero-click Auto-SAR.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleFastOneTapMayday}
                  style={{
                    background: 'linear-gradient(135deg, #DC2626, #9333EA)',
                    boxShadow: '0 8px 25px rgba(220, 38, 38, 0.45)',
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 hover:opacity-95 transition-all cursor-pointer ring-2 ring-rose-400/50 animate-pulse"
                >
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <span>TRANSMIT 1-TAP MAYDAY SOS NOW</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                <span>Auto-packaged: Callsign: <strong>{reporterCallsign}</strong> • Coords: <strong>{coordinates}</strong></span>
                <span className="text-emerald-400 font-bold">AUTO-SAR: ARMED</span>
              </div>
            </div>
          )}

          {/* Expandable Manual Incident Details Customization */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowCustomDetails(!showCustomDetails)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showCustomDetails ? 'Hide Detailed Incident Editor' : 'Customize Incident Details & Field Situation Report (Optional)'}</span>
              </div>
              <span className="text-[10px] text-cyan-400 uppercase font-mono">
                {showCustomDetails ? '[- COLLAPSE]' : '[+ EXPAND FORM]'}
              </span>
            </button>

            {showCustomDetails && (
              <form onSubmit={handleBroadcast} className="p-4 pt-2 space-y-3 border-t border-slate-800/80">
                {/* Transmitting Device & Caller Callsign */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                      TRANSMITTING DEVICE ORIGIN:
                    </label>
                    <select
                      value={reportedByDevice}
                      onChange={(e) => setReportedByDevice(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Mobile Phone Field Unit">📱 Mobile Phone Field Unit (Cellular/Satellite)</option>
                      <option value="Satellite Handheld">🛰️ Handheld Iridium Satellite Beacon</option>
                      <option value="Crawler Console">🚜 Heavy Crawler Cabin Console</option>
                      <option value="Station HQ">🏢 Base Station Secondary Radio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                      FIELD CALLSIGN / SENDER NAME:
                    </label>
                    <input
                      type="text"
                      required
                      value={reporterCallsign}
                      onChange={(e) => setReporterCallsign(e.target.value)}
                      placeholder="e.g. EXP-701 FIELD MOBILE"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Incident Type & Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                      NATURE OF EMERGENCY:
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Crevasse Fall / Structural Ice Breach">Crevasse Fall / Structural Ice Breach</option>
                      <option value="Total Engine Cold-Seizure / Stranding">Total Engine Cold-Seizure / Stranding</option>
                      <option value="Severe Blizzard Hypothermia Crisis">Severe Blizzard Hypothermia Crisis</option>
                      <option value="Critical Traumatic Injury (MEDEVAC)">Critical Traumatic Injury (MEDEVAC)</option>
                      <option value="Whiteout Navigation Loss / Bivouac">Whiteout Navigation Loss / Bivouac</option>
                      <option value="Fuel Freezing / Habitat Power Failure">Fuel Freezing / Habitat Power Failure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                      MEDICAL STATUS &amp; SEVERITY:
                    </label>
                    <select
                      value={medicalUrgency}
                      onChange={(e) => setMedicalUrgency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Stage-2 Hypothermia / Immediate Evacuation">Stage-2 Hypothermia / Urgent Care</option>
                      <option value="Critical Frostbite / Core Hypothermia">Critical Frostbite / Core Hypothermia</option>
                      <option value="Trauma Fracture / Immobilized">Trauma Fracture / Immobilized</option>
                      <option value="Stable / Stranded with Rations">Stable / Stranded with Rations</option>
                    </select>
                  </div>
                </div>

                {/* Location & GPS Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                      SECTOR / TERRAIN LOCATION:
                    </label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                      GPS FIX (LAT, LNG):
                    </label>
                    <input
                      type="text"
                      required
                      value={coordinates}
                      onChange={(e) => setCoordinates(e.target.value)}
                      placeholder="-70.7667, 11.7333"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Quick preset coordinate buttons & Live GPS acquisition */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 uppercase">PRESETS:</span>
                    <button
                      type="button"
                      onClick={() => setPresetCoords('maitri')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
                    >
                      Maitri Base
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCoords('leverett')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
                    >
                      Leverett Glacier
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCoords('southpole')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
                    >
                      South Pole
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCoords('svalbard')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                    >
                      Svalbard Arctic
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAcquireDeviceGps}
                    disabled={geoLoading}
                    className="px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-600 flex items-center gap-1.5 font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {geoLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : (
                      <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span>ACQUIRE GPS FIX</span>
                  </button>
                </div>

                {geoFixAcquired && (
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Live GPS Lock:</strong> {geoFixAcquired}</span>
                  </div>
                )}

                {/* Situation description */}
                <div>
                  <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                    FIELD SITUATION REPORT:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wider uppercase transition-colors border border-rose-400 flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>BROADCAST CUSTOM MAYDAY</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
