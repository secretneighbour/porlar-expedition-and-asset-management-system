import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  X,
  Truck,
  Plane,
  HeartPulse
} from 'lucide-react';
import { PolarAsset, ConditionLevel } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: PolarAsset[];
  onTriggerEmergencyBroadcast: (incidentData: {
    incidentType: string;
    location: string;
    coordinates: string;
    summary: string;
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
  const [personnelCount, setPersonnelCount] = useState(4);
  const [medicalUrgency, setMedicalUrgency] = useState('Stage-2 Hypothermia / Immediate Evacuation');
  const [notes, setNotes] = useState('Snowcat lead track broke through concealed snow bridge into 25m slot void. Vehicle anchored, personnel secured in bivouac.');
  const [confirmedChecklist, setConfirmedChecklist] = useState({
    beaconActive: true,
    shelterSecured: true,
    engineShutdown: false,
    radioListeningWatch: true,
  });

  if (!isOpen) return null;

  // Filter nearest rescue-capable assets
  const sarCapableAssets = assets.filter(
    (a) => a.category === 'emergency_sar' || a.category === 'aviation' || a.category === 'heavy_traverse'
  );

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerEmergencyBroadcast({
      incidentType,
      location: locationName,
      coordinates: '85.25°S, 151.10°E',
      summary: notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border-2 border-rose-600 rounded-xl max-w-2xl w-full p-5 shadow-2xl shadow-rose-950/80 text-xs font-mono text-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-rose-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950 border border-rose-600 text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                COSPAS-SARSAT / POLAR INCIDENT COMMAND
              </div>
              <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">
                TACTICAL EMERGENCY DISTRESS & SAR PROTOCOL
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

        <form onSubmit={handleBroadcast} className="space-y-4">
          {/* Incident Type & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                INCIDENT NATURE:
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
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                MEDICAL STATUS:
              </label>
              <select
                value={medicalUrgency}
                onChange={(e) => setMedicalUrgency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Stable / No Immediate Life Threat">Stable / No Immediate Life Threat</option>
                <option value="Stage-2 Hypothermia / Immediate Evacuation">Stage-2 Hypothermia / Urgent Care</option>
                <option value="Critical Frostbite / Core Hypothermia">Critical Frostbite / Core Hypothermia</option>
                <option value="Trauma Fracture / Immobilized">Trauma Fracture / Immobilized</option>
              </select>
            </div>
          </div>

          {/* Location & Personnel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                LAST VERIFIED GPS / TERRAIN LOCATION:
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
                SOULS AT RISK:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={personnelCount}
                onChange={(e) => setPersonnelCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Tactical Notes */}
          <div>
            <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
              FIELD SITUATION REPORT:
            </label>
            <textarea
              rows={2}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Nearest Available SAR Extraction Assets */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px]">
              NEAREST SAR-CAPABLE ASSETS IN RANGE:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sarCapableAssets.slice(0, 4).map((asset) => (
                <div key={asset.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {asset.category === 'aviation' ? <Plane className="w-3 h-3 text-sky-400" /> : <Truck className="w-3 h-3 text-amber-400" />}
                      <span>{asset.code}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                      {asset.currentLocation.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-[11px] block">{asset.status.toUpperCase()}</span>
                    <span className="text-[10px] text-sky-300">Fuel: {asset.fuelOrBatteryPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/60 space-y-1.5 text-[11px]">
            <span className="text-rose-300 font-bold uppercase block text-[10px]">
              CRITICAL FIELD SAFETY CONFIRMATION:
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedChecklist.beaconActive}
                onChange={(e) => setConfirmedChecklist({ ...confirmedChecklist, beaconActive: e.target.checked })}
                className="accent-rose-500"
              />
              <span>Emergency 406 MHz COSPAS-SARSAT beacon transmitting</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedChecklist.shelterSecured}
                onChange={(e) => setConfirmedChecklist({ ...confirmedChecklist, shelterSecured: e.target.checked })}
                className="accent-rose-500"
              />
              <span>Personnel secured in survival bivouac shelter or heated cab</span>
            </label>
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
              <AlertTriangle className="w-4 h-4" />
              <span>TRANSMIT MAYDAY & DISPATCH SAR</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
