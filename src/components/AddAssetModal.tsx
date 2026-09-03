import React, { useState } from 'react';
import { Truck, X, Plus, ThermometerSnowflake, Fuel, MapPin, Check } from 'lucide-react';
import { PolarAsset, AssetCategory } from '../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (newAsset: PolarAsset) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAddAsset,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<AssetCategory>('heavy_traverse');
  const [model, setModel] = useState('');
  const [locationName, setLocationName] = useState('McMurdo Base Logistics Yard');
  const [lat, setLat] = useState(-77.85);
  const [lng, setLng] = useState(166.67);
  const [coldRatingC, setColdRatingC] = useState(-65);
  const [fuelType, setFuelType] = useState<PolarAsset['fuelType']>('Arctic Diesel F-34');
  const [crewCapacity, setCrewCapacity] = useState(4);
  const [heatingSystem, setHeatingSystem] = useState('Dual Webasto Thermo Hydronic Block Heaters');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newAsset: PolarAsset = {
      id: `ast-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      model: model.trim() || 'Polar Heavy Rig',
      status: 'operational',
      currentLocation: {
        name: locationName.trim() || 'Polar Operations Hub',
        lat: Number(lat),
        lng: Number(lng),
        elevationM: 50,
      },
      coldRatingC: Number(coldRatingC),
      fuelOrBatteryPercent: 100,
      fuelType,
      crewCapacity: Number(crewCapacity),
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextServiceHours: 250,
      specifications: {
        weightKg: 8500,
        topSpeedKmh: 45,
        rangeKm: 900,
        heatingSystem: heatingSystem.trim(),
      },
      telemetry: {
        tempC: -28,
        engineHealthPercent: 100,
        satlinkSignal: 98,
      },
    };

    onAddAsset(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-700 rounded-xl max-w-xl w-full p-5 shadow-2xl text-xs font-mono text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white font-display uppercase tracking-wider">
              COMMISSION NEW POLAR EXPEDITION ASSET
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">ASSET CALLSIGN / CODE:</label>
              <input
                type="text"
                required
                placeholder="e.g. PB-BRAVO or TWIN-04"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">EQUIPMENT CATEGORY:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="heavy_traverse">Heavy Traverse Crawler</option>
                <option value="aviation">Ski-Equipped Aircraft</option>
                <option value="scientific_rig">Deep Coring / GPR Rig</option>
                <option value="power_habitat">Extreme Cold Shelter Pod</option>
                <option value="emergency_sar">Rapid Response / SAR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase text-[10px] mb-1">DESCRIPTIVE NAME:</label>
            <input
              type="text"
              required
              placeholder="e.g. Tucker Sno-Cat Extreme Recon Bravo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">MANUFACTURER / MODEL:</label>
              <input
                type="text"
                placeholder="e.g. Kässbohrer Polar 300 Custom"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">FUEL / POWER TYPE:</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="Arctic Diesel F-34">Arctic Diesel F-34</option>
                <option value="Jet-A1 Polar">Jet-A1 Polar Kerosene</option>
                <option value="Lithium-Cold Solid">Lithium-Cold Solid State</option>
                <option value="Micro-Nuclear">Micro-Nuclear Stirling</option>
                <option value="Manual/Pneumatic">Manual / Pneumatic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">COLD LIMIT (°C):</label>
              <input
                type="number"
                max="0"
                min="-95"
                value={coldRatingC}
                onChange={(e) => setColdRatingC(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">CREW CAPACITY:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={crewCapacity}
                onChange={(e) => setCrewCapacity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">BASE LOCATION:</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase text-[10px] mb-1">CABIN & ENGINE HEATING SYSTEM:</label>
            <input
              type="text"
              value={heatingSystem}
              onChange={(e) => setHeatingSystem(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors flex items-center gap-1.5 border border-sky-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>COMMISSION TO ACTIVE FLEET</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
