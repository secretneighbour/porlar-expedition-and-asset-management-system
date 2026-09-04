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
  Navigation
} from 'lucide-react';
import { PolarAsset } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: PolarAsset[];
  onTriggerEmergencyBroadcast: (incidentData: {
    incidentType: string;
    location: string;
    coordinates: string;
    summary: string;
    reporterCallsign?: string;
    reportedByDevice?: 'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ';
  }) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  assets,
  onTriggerEmergencyBroadcast,
}) => {
  const [incidentType, setIncidentType] = useState('Crevasse Fall / Structural Ice Breach');
  const [locationName, setLocationName] = useState('Leverett Glacier Approach (85.2°S, 151.1°E)');
  const [coordinates, setCoordinates] = useState('-85.25, 151.10');
  const [reporterCallsign, setReporterCallsign] = useState('EXP-701 FIELD MOBILE');
  const [reportedByDevice, setReportedByDevice] = useState<'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ'>('Mobile Phone Field Unit');
  const [personnelCount, setPersonnelCount] = useState(4);
  const [medicalUrgency, setMedicalUrgency] = useState('Stage-2 Hypothermia / Immediate Evacuation');
  const [notes, setNotes] = useState('Snowcat lead track broke through concealed snow bridge into 25m slot void. Vehicle anchored, personnel secured in bivouac.');
  const [confirmedChecklist, setConfirmedChecklist] = useState({
    beaconActive: true,
    shelterSecured: true,
    radioListeningWatch: true,
  });

  if (!isOpen) return null;

  const sarCapableAssets = assets.filter(
    (a) => a.category === 'emergency_sar' || a.category === 'aviation' || a.category === 'heavy_traverse'
  );

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerEmergencyBroadcast({
      incidentType,
      location: locationName.trim(),
      coordinates: coordinates.trim(),
      summary: `${notes.trim()} (Urgency: ${medicalUrgency}, Souls: ${personnelCount})`,
      reporterCallsign: reporterCallsign.trim() || 'FIELD UNIT',
      reportedByDevice,
    });
    onClose();
  };

  const setPresetCoords = (type: 'leverett' | 'southpole' | 'wilkes' | 'svalbard') => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border-2 border-rose-600 rounded-xl max-w-2xl w-full p-5 shadow-2xl shadow-rose-950/80 text-xs font-mono text-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-rose-800/80 mb-3">
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
                TRANSMIT DISTRESS BEACON TO BASE HQ LAPTOP
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

        {/* Live sync disclaimer badge */}
        <div className="mb-3 p-2.5 rounded-lg bg-sky-950/40 border border-sky-600/40 flex items-center gap-2 text-[11px] text-sky-200">
          <Smartphone className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
          <span>
            <strong>Instant Multi-Device Alert:</strong> Triggering this distress beacon immediately flashes the operations screen on the base manager's laptop, sounds an emergency audio klaxon, and queues SAR scramble.
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
              <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                GPS FIX (LAT, LNG):
              </label>
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

          {/* Quick preset coordinate buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-slate-400 uppercase">PRESET POLAR SECTORS:</span>
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
              South Pole Vicinity
            </button>
            <button
              type="button"
              onClick={() => setPresetCoords('wilkes')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
            >
              Wilkes Basin
            </button>
            <button
              type="button"
              onClick={() => setPresetCoords('svalbard')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
            >
              Svalbard Arctic
            </button>
          </div>

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
              <span>BROADCAST MAYDAY OVER MOBILE DATA</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
