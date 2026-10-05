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
  CheckCircle2,
  Zap
} from 'lucide-react';
import { PolarAsset } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';

interface EmergencyModalProps {
  isOpen?: boolean;
  onClose: () => void;
  assets?: PolarAsset[];
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
  onTriggerEmergencyBroadcast,
  onTriggerDistress,
}) => {
  const [mode, setMode] = useState<'rapid' | 'detailed'>('rapid');
  const [incidentType, setIncidentType] = useState('Crevasse Fall / Structural Ice Breach');
  const [locationName, setLocationName] = useState('Leverett Glacier Approach (85.2°S, 151.1°E)');
  const [coordinates, setCoordinates] = useState('-85.25, 151.10');
  const [reporterCallsign, setReporterCallsign] = useState('EXP-701 FIELD MOBILE');
  const [reportedByDevice, setReportedByDevice] = useState<'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ'>('Mobile Phone Field Unit');
  const [personnelCount, setPersonnelCount] = useState(4);
  const [medicalUrgency, setMedicalUrgency] = useState('Stage-2 Hypothermia / Immediate Evacuation');
  const [notes, setNotes] = useState('Snowcat lead track broke through concealed snow bridge into 25m slot void. Vehicle anchored, personnel secured in bivouac.');
  const [geoFixAcquired, setGeoFixAcquired] = useState<string | null>(null);
  const [rapidSent, setRapidSent] = useState(false);

  const { acquireSingleFix, loading: geoLoading, error: geoError, formattedAccuracy } = useGeolocation();

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

  const nowTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';

  interface BroadcastPayload {
    incidentType: string;
    location: string;
    coordinates: string;
    summary: string;
    reporterCallsign: string;
    reportedByDevice: string;
  }

  const handleBroadcast = (eOrPayload?: React.FormEvent | BroadcastPayload) => {
    const isEvent = eOrPayload && 'preventDefault' in (eOrPayload as any);
    if (isEvent) (eOrPayload as React.FormEvent).preventDefault();
    
    const payload: BroadcastPayload = (!isEvent && eOrPayload) ? (eOrPayload as BroadcastPayload) : {
      incidentType,
      location: locationName.trim(),
      coordinates: coordinates.trim(),
      summary: `${notes.trim()} (Urgency: ${medicalUrgency}, Souls: ${personnelCount})`,
      reporterCallsign: reporterCallsign.trim() || 'FIELD UNIT',
      reportedByDevice,
    };

    if (onTriggerEmergencyBroadcast) {
      onTriggerEmergencyBroadcast(payload);
    } else if (onTriggerDistress) {
      onTriggerDistress(payload.incidentType, payload.summary);
    }
    onClose();
  };

  const handleRapidBroadcast = async () => {
    setRapidSent(true);
    try {
      const fixPromise = acquireSingleFix();
      // Timeout after 3 seconds
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 3000));
      const fix = await Promise.race([fixPromise, timeoutPromise]) as any;
      
      const coordStr = `${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}`;
      setCoordinates(coordStr);
      const locName = `Real-Time GPS Fix (${fix.lat > 0 ? 'Arctic/North' : 'Antarctica/South'})`;
      setLocationName(locName);
      setGeoFixAcquired(`Fix: ${coordStr} (Accuracy: ±${Math.round(fix.accuracy)}m)`);
      
      handleBroadcast({
        incidentType,
        location: locName,
        coordinates: coordStr,
        summary: `${notes.trim()} (Urgency: ${medicalUrgency}, Souls: ${personnelCount})`,
        reporterCallsign: reporterCallsign.trim() || 'FIELD UNIT',
        reportedByDevice
      });
    } catch (e) {
      // Failed to get fresh GPS fix or timed out, proceed with existing coordinates explicitly marked as unverified
      const staleLocation = locationName.trim() ? `[UNVERIFIED] ${locationName.trim()}` : 'LOCATION UNVERIFIED';
      const staleCoords = coordinates.trim() ? `${coordinates.trim()} (STALE/UNVERIFIED)` : 'UNKNOWN (STALE/UNVERIFIED)';
      
      handleBroadcast({
        incidentType,
        location: staleLocation,
        coordinates: staleCoords,
        summary: `${notes.trim()} (Urgency: ${medicalUrgency}, Souls: ${personnelCount})`,
        reporterCallsign: reporterCallsign.trim() || 'FIELD UNIT',
        reportedByDevice
      });
    }
  };

  const setPresetCoords = (type: 'leverett' | 'southpole' | 'wilkes' | 'svalbard') => {
    setGeoFixAcquired(null);
    switch (type) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        style={{
          background: 'rgba(21, 11, 46, 0.94)',
          border: '1px solid rgba(239, 68, 68, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.25)'
        }}
        className="rounded-2xl max-w-2xl w-full text-xs font-mono text-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
      >
        
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-rose-800/50 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950 border border-rose-600 text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span>POLAR MAYDAY DISTRESS PROTOCOL</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px]">LIVE BASE SYNC</span>
              </div>
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide">
                TRANSMIT DISTRESS BEACON TO BASE HQ
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-slate-800/50 shrink-0">
          <button
            type="button"
            onClick={() => setMode('rapid')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === 'rapid'
                ? 'bg-rose-600/30 text-rose-200 border border-rose-500/50'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>Rapid Mayday</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('detailed')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === 'detailed'
                ? 'bg-rose-600/30 text-rose-200 border border-rose-500/50'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>Detailed Form</span>
          </button>
          <span className="ml-auto text-[10px] text-slate-500">
            {mode === 'rapid' ? 'One-click broadcast with auto-populated context' : 'Full control over all broadcast fields'}
          </span>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-3">

        {/* AI AUTO-SAR badge (shared between both modes) */}
        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-[11px] text-emerald-200">
          <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs">AI AUTO-S.A.R.</span>
          <span>
            <strong>Zero-Click Dispatch Active:</strong> AI autonomously calculates nearest base, samples micro-weather, and dispatches the nearest S.A.R. drone and rescue team.
          </span>
        </div>

        {mode === 'rapid' ? (
          /* =================== RAPID MAYDAY MODE =================== */
          <div className="space-y-3">
            {/* Auto-populated summary */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">AUTO-POPULATED BROADCAST CONTEXT:</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Incident:</span>
                  <span className="text-rose-300 font-semibold text-right">{incidentType.split(' / ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device:</span>
                  <span className="text-sky-300 font-semibold">{reportedByDevice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Callsign:</span>
                  <span className="text-white font-semibold">{reporterCallsign}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Urgency:</span>
                  <span className="text-amber-300 font-semibold">{medicalUrgency.split(' / ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GPS Fix:</span>
                  <span className="text-cyan-300 font-semibold">{coordinates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200 font-semibold">{nowTimestamp}</span>
                </div>
                <div className="col-span-2 flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-white font-semibold">{locationName}</span>
                </div>
              </div>
            </div>

            {/* GPS acquisition in rapid mode */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcquireDeviceGps}
                disabled={geoLoading}
                className="px-3 py-1.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-600 flex items-center gap-1.5 font-bold transition-all disabled:opacity-50 text-[11px]"
              >
                {geoLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>UPDATE GPS FROM DEVICE</span>
              </button>
              {geoFixAcquired && (
                <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{geoFixAcquired}</span>
                </span>
              )}
            </div>

            {/* Nearest SAR Assets Preview (compact) */}
            {sarCapableAssets.length > 0 && (
              <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px]">
                  NEAREST RESCUE ASSETS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sarCapableAssets.slice(0, 3).map((asset) => (
                    <div key={asset.id} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-[10px]">
                      {asset.category === 'aviation' ? <Plane className="w-3 h-3 text-sky-400" /> : <Truck className="w-3 h-3 text-amber-400" />}
                      <span className="font-bold text-white">{asset.code}</span>
                      <span className="text-emerald-400">{asset.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RAPID BROADCAST BUTTON */}
            <button
              type="button"
              onClick={handleRapidBroadcast}
              disabled={rapidSent}
              className={`w-full py-4 rounded-xl text-white font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-3 text-sm ${
                rapidSent
                  ? 'bg-emerald-700 border-2 border-emerald-400'
                  : 'bg-rose-600 hover:bg-rose-500 border-2 border-rose-400 shadow-lg shadow-rose-950/80 cursor-pointer'
              }`}
            >
              {rapidSent ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>MAYDAY TRANSMITTED — DISPATCHING S.A.R.</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>BROADCAST MAYDAY NOW</span>
                </>
              )}
            </button>
            {!rapidSent && (
              <p className="text-center text-[10px] text-slate-500">
                Broadcasts to all connected terminals, triggers AI Zero-Click S.A.R. dispatch
              </p>
            )}
          </div>
        ) : (
          /* =================== DETAILED FORM MODE =================== */
          <>
          {/* Cross-device sync badge */}
          <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-600/40 flex items-center gap-2 text-[10px] text-sky-200">
            <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
            <span>
              <strong>Cross-Device Mesh Sync:</strong> Broadcasts to all connected field mobiles, base laptops, and telemetry radars instantly via WebSocket.
            </span>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-3">
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
                  MEDICAL STATUS & SEVERITY:
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-bold uppercase text-[10px]">
                    GPS FIX (LAT, LNG):
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  placeholder="-85.25, 151.10"
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
                  onClick={() => setPresetCoords('leverett')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
                >
                  Leverett Glacier
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCoords('southpole')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
                >
                  South Pole
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCoords('svalbard')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                >
                  Svalbard Arctic
                </button>
              </div>

              <button
                type="button"
                onClick={handleAcquireDeviceGps}
                disabled={geoLoading}
                className="px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-600 flex items-center gap-1.5 font-bold transition-all disabled:opacity-50"
              >
                {geoLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>ACQUIRE DEVICE REAL-TIME GPS FIX</span>
              </button>
            </div>

            {geoFixAcquired && (
              <div className="p-2 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Live GPS Lock:</strong> {geoFixAcquired}</span>
              </div>
            )}

            {geoError && (
              <div className="p-2 rounded bg-rose-950/60 border border-rose-700 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{geoError}</span>
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

            {/* Nearest SAR Assets Preview */}
            <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px]">
                AVAILABLE RESCUE ASSETS READY AT BASE HQ:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sarCapableAssets.slice(0, 4).map((asset) => (
                  <div key={asset.id} className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                        {asset.category === 'aviation' ? <Plane className="w-3 h-3 text-sky-400" /> : <Truck className="w-3 h-3 text-amber-400" />}
                        <span>{asset.code}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[170px]">
                        {asset.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold text-[10px] block">{asset.status.toUpperCase()}</span>
                      <span className="text-[9px] text-sky-300">Fuel: {asset.fuelOrBatteryPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wider uppercase transition-colors border border-rose-400 flex items-center gap-2 shadow-lg shadow-rose-950/80"
              >
                <Send className="w-4 h-4" />
                <span>BROADCAST MAYDAY</span>
              </button>
            </div>
          </form>
          </>
        )}

        </div>

      </div>
    </div>
  );
};

