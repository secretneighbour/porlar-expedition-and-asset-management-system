import React, { useState } from 'react';
import { Building2, X, Plus, MapPin, Radio, Shield, Plane, Zap, Users, Compass, Check } from 'lucide-react';
import { ResearchStation, PolarRegion } from '../types';

interface AddBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStation: (station: ResearchStation) => void;
  defaultRegion?: PolarRegion;
  userLat?: number | null;
  userLng?: number | null;
  userCityName?: string | null;
}

export const AddBaseModal: React.FC<AddBaseModalProps> = ({
  isOpen,
  onClose,
  onAddStation,
  defaultRegion = 'antarctica',
  userLat,
  userLng,
  userCityName,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('International Consortium');
  const [region, setRegion] = useState<PolarRegion>(defaultRegion);
  const [latInput, setLatInput] = useState<string>(defaultRegion === 'antarctica' ? '-78.5' : '78.5');
  const [lngInput, setLngInput] = useState<string>('100.0');
  const [elevationInput, setElevationInput] = useState<string>('1200');
  const [runwayType, setRunwayType] = useState<ResearchStation['runwayType']>('Skiway (Snow)');
  const [fuelReserveInput, setFuelReserveInput] = useState<string>('250000');
  const [powerStatus, setPowerStatus] = useState<ResearchStation['powerStatus']>('Nominal');
  const [winterPopInput, setWinterPopInput] = useState<string>('18');
  const [summerPopInput, setSummerPopInput] = useState<string>('65');

  if (!isOpen) return null;

  const handleUseGps = () => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      setLatInput(userLat.toFixed(4));
      setLngInput(userLng.toFixed(4));
      if (userLat < 0) {
        setRegion('antarctica');
      } else {
        setRegion('arctic');
      }
      if (!name && userCityName) {
        setName(`${userCityName} Forward Field Base`);
        setCode(userCityName.slice(0, 3).toUpperCase());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const newStation: ResearchStation = {
      id: `st-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      country: country.trim() || 'International',
      lat: parseFloat(latInput) || -78.5,
      lng: parseFloat(lngInput) || 100.0,
      elevationM: parseFloat(elevationInput) || 0,
      region,
      winterPopulation: parseInt(winterPopInput, 10) || 0,
      summerPopulation: parseInt(summerPopInput, 10) || 0,
      runwayType,
      fuelReserveL: parseFloat(fuelReserveInput) || 100000,
      powerStatus,
    };

    onAddStation(newStation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white font-display tracking-wide uppercase">
              COMMISSION NEW POLAR BASE / AWOS STATION
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Base Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-400 uppercase">Station Name *</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amundsen Sea Forward Hub"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Callsign / Code *</label>
              <input
                type="text"
                required
                maxLength={5}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ASH"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>
          </div>

          {/* Region & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Polar Sector</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as PolarRegion)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="antarctica">Antarctica (South Pole Sector)</option>
                <option value="arctic">Arctic (North Pole / High Arctic Basin)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Operator / Nation</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States / International"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* GPS Coordinates with Quick-Use Real-time GPS Fix */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sky-400 font-bold uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                GEOGRAPHICAL COORDINATES
              </span>
              {userLat !== null && userLat !== undefined && (
                <button
                  type="button"
                  onClick={handleUseGps}
                  className="px-2 py-0.5 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-300 border border-sky-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Compass className="w-3 h-3" />
                  <span>USE MY REAL-TIME GPS ({userLat.toFixed(2)}°, {userLng?.toFixed(2)}°)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px]">LATITUDE (DEG)</label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="-78.5"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px]">LONGITUDE (DEG)</label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="100.0"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px]">ELEVATION (M)</label>
                <input
                  type="text"
                  value={elevationInput}
                  onChange={(e) => setElevationInput(e.target.value)}
                  placeholder="1200"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Runway & Power Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Runway / Aerodrome</label>
              <select
                value={runwayType}
                onChange={(e) => setRunwayType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Skiway (Snow)">Skiway (Snow Compacted)</option>
                <option value="Blue Ice Runway">Blue Ice Runway (Wheeled Heavy Transport)</option>
                <option value="Hard Surface">Hard Surface (Asphalt / Permafrost Tarmac)</option>
                <option value="Helipad Only">Helipad Only (SAR Extraction Point)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Power Grid Status</label>
              <select
                value={powerStatus}
                onChange={(e) => setPowerStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Nominal">Nominal (Full Thermal / Microgrid Active)</option>
                <option value="Auxiliary">Auxiliary (Backup Generators Active)</option>
                <option value="Emergency">Emergency (Life Support Only)</option>
              </select>
            </div>
          </div>

          {/* Logistics & Population */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Fuel Reserve (L)</label>
              <input
                type="text"
                value={fuelReserveInput}
                onChange={(e) => setFuelReserveInput(e.target.value)}
                placeholder="250000"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Winter Crew</label>
              <input
                type="text"
                value={winterPopInput}
                onChange={(e) => setWinterPopInput(e.target.value)}
                placeholder="18"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 uppercase">Summer Crew</label>
              <input
                type="text"
                value={summerPopInput}
                onChange={(e) => setSummerPopInput(e.target.value)}
                placeholder="65"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold tracking-wide transition-colors border border-sky-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>COMMISSION BASE LOCATION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
