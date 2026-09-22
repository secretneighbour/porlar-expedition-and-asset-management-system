import React, { useState } from 'react';
import {
  Building2, Radio, Compass, Users, Plane, Fuel, Zap, ThermometerSnowflake,
  ShieldCheck, AlertTriangle, ExternalLink, MapPin, Search, Plus, Filter,
  Wind, CheckCircle2, Globe
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY } from '../../data/polarisData';
import { INITIAL_STATIONS } from '../../data/polarData';
import { ResearchStation } from '../../types';
import { PageHeader, Badge, Modal, Field, inputClass, inputStyle } from './SharedUI';

interface StationsViewProps {
  t: any;
  db?: any;
  setDb?: React.Dispatch<React.SetStateAction<any>>;
  onNavigateToMap?: (coords?: { lat: number; lng: number }) => void;
  onNavigateToWeather?: (stationId: string) => void;
}

export function StationsView({
  t,
  db,
  setDb,
  onNavigateToMap,
  onNavigateToWeather
}: StationsViewProps) {
  const [filterRegion, setFilterRegion] = useState<'ALL' | 'ANTARCTICA' | 'ARCTIC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<ResearchStation | null>(null);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);

  // Combine initial stations and any custom stations in DB
  const stationsList: ResearchStation[] = [
    ...INITIAL_STATIONS,
    ...(db?.customStations || [])
  ];

  const filteredStations = stationsList.filter(s => {
    const matchesRegion = filterRegion === 'ALL' ||
      (filterRegion === 'ANTARCTICA' && s.region === 'antarctica') ||
      (filterRegion === 'ARCTIC' && s.region === 'arctic');
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRegion && matchesSearch;
  });

  const totalPersonnel = stationsList.reduce((acc, s) => acc + (s.winterPopulation || 0), 0);
  const totalSummerCapacity = stationsList.reduce((acc, s) => acc + (s.summerPopulation || 0), 0);
  const nominalStationsCount = stationsList.filter(s => s.powerStatus === 'Nominal').length;

  // Form for custom outpost
  const [newStation, setNewStation] = useState({
    name: '',
    code: '',
    country: 'International',
    lat: -75.0,
    lng: 15.0,
    elevationM: 1200,
    region: 'antarctica' as const,
    winterPopulation: 12,
    summerPopulation: 45,
    runwayType: 'Skiway (Snow)',
    fuelReserveL: 150000,
    powerStatus: 'Nominal' as const
  });

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name.trim()) return;

    const created: ResearchStation = {
      id: `st-custom-${Date.now()}`,
      name: newStation.name,
      code: newStation.code || newStation.name.slice(0, 3).toUpperCase(),
      country: newStation.country,
      lat: Number(newStation.lat),
      lng: Number(newStation.lng),
      elevationM: Number(newStation.elevationM),
      region: newStation.region,
      winterPopulation: Number(newStation.winterPopulation),
      summerPopulation: Number(newStation.summerPopulation),
      runwayType: newStation.runwayType,
      fuelReserveL: Number(newStation.fuelReserveL),
      powerStatus: newStation.powerStatus
    };

    if (setDb) {
      setDb(prev => ({
        ...prev,
        customStations: [...(prev.customStations || []), created],
        auditLog: [
          {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            user: 'Base Operations Director',
            action: 'OUTPOST_ESTABLISHED',
            entity: 'ResearchStation',
            details: `Commissioned new polar research outpost: ${created.name} (${created.code}) in ${created.region.toUpperCase()}.`
          },
          ...(prev.auditLog || [])
        ]
      }));
    }

    setIsAddStationOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        t={t}
        title="Research Stations & Outposts"
        subtitle="Global Polar Operations Network: Permanent Antarctic & Arctic research bases, scientific outposts, runways, and lifelines."
        action={
          <button
            onClick={() => setIsAddStationOpen(true)}
            style={{
              background: t.btnGradient,
              boxShadow: t.btnShadow,
              color: '#FFFFFF'
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all hover:opacity-90 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Commission Outpost</span>
          </button>
        }
      />

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-4 rounded-xl border backdrop-blur-md flex items-center gap-3"
        >
          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Bases</p>
            <p className="text-xl font-bold font-mono text-white">{stationsList.length}</p>
          </div>
        </div>

        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-4 rounded-xl border backdrop-blur-md flex items-center gap-3"
        >
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Winter Crew</p>
            <p className="text-xl font-bold font-mono text-white">{totalPersonnel} <span className="text-xs text-slate-400 font-normal">/ {totalSummerCapacity} summer</span></p>
          </div>
        </div>

        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-4 rounded-xl border backdrop-blur-md flex items-center gap-3"
        >
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Power Grid</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{nominalStationsCount} Nominal <span className="text-xs text-amber-400 font-normal">({stationsList.length - nominalStationsCount} aux)</span></p>
          </div>
        </div>

        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-4 rounded-xl border backdrop-blur-md flex items-center gap-3"
        >
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Sectors</p>
            <p className="text-xl font-bold font-mono text-white">
              {stationsList.filter(s => s.region === 'antarctica').length} South <span className="text-xs text-cyan-400">/ {stationsList.filter(s => s.region === 'arctic').length} North</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
        className="p-3 rounded-xl border flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2">
          {(['ALL', 'ANTARCTICA', 'ARCTIC'] as const).map(reg => (
            <button
              key={reg}
              onClick={() => setFilterRegion(reg)}
              style={{
                background: filterRegion === reg ? t.accentSoft : 'transparent',
                borderColor: filterRegion === reg ? t.accent : 'rgba(255,255,255,0.1)',
                color: filterRegion === reg ? t.accent : t.textDim
              }}
              className="px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              {reg === 'ALL' ? 'All Stations' : reg === 'ANTARCTICA' ? 'Antarctic Bases' : 'Arctic Stations'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, nation, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.35)',
              borderColor: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF'
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStations.map(station => {
          const isAntarctic = station.region === 'antarctica';
          return (
            <div
              key={station.id}
              style={{
                background: t.cardBg,
                borderColor: t.cardBorder,
                boxShadow: t.cardShadow
              }}
              className="p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/50 transition-all group relative overflow-hidden"
            >
              {/* Corner Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2.5 rounded-xl ${isAntarctic ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white font-mono">{station.name}</h3>
                      {station.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {station.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{station.country}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  isAntarctic ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                }`}>
                  {station.region}
                </span>
              </div>

              {/* Coordinates & Elevation */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-black/25 border border-white/5 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">COORDINATES</span>
                  <span className="text-slate-300 font-semibold">{station.lat.toFixed(2)}°, {station.lng.toFixed(2)}°</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ELEVATION</span>
                  <span className="text-slate-300 font-semibold">{station.elevationM} m MSL</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">WINTER / SUMMER</span>
                  <span className="text-emerald-400 font-semibold">{station.winterPopulation || 0} / {station.summerPopulation || 0} souls</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">RUNWAY</span>
                  <span className="text-sky-300 font-semibold truncate block">{station.runwayType || 'Skiway'}</span>
                </div>
              </div>

              {/* Status and Logistics */}
              <div className="space-y-1.5 text-xs font-mono my-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" /> Microgrid Power:
                  </span>
                  <span className={station.powerStatus === 'Nominal' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {station.powerStatus || 'Nominal'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Fuel className="w-3 h-3 text-rose-400" /> Fuel Reserve:
                  </span>
                  <span className="text-slate-200">
                    {station.fuelReserveL ? `${(station.fuelReserveL / 1000).toLocaleString()} kL` : '180 kL'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-2">
                <button
                  onClick={() => onNavigateToMap && onNavigateToMap({ lat: station.lat, lng: station.lng })}
                  style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}
                  className="flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-mono text-cyan-300 hover:bg-cyan-500/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pin Map</span>
                </button>
                <button
                  onClick={() => setSelectedStation(station)}
                  style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
                  className="py-1.5 px-3 rounded-lg border text-[11px] font-mono text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Specs</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Station Details Modal */}
      {selectedStation && (
        <Modal
          t={t}
          title={`Tactical Station Specification: ${selectedStation.name}`}
          onClose={() => setSelectedStation(null)}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nation / Authority:</span>
                <span className="text-white font-bold">{selectedStation.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Geographic Coordinates:</span>
                <span className="text-cyan-400">{selectedStation.lat.toFixed(4)}° S, {selectedStation.lng.toFixed(4)}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Surface Altitude:</span>
                <span className="text-slate-200">{selectedStation.elevationM} meters above sea level</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runway Classification:</span>
                <span className="text-sky-300">{selectedStation.runwayType || 'Snow Skiway'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Polar Region:</span>
                <span className="text-emerald-400 uppercase">{selectedStation.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fuel Reserve Capacity:</span>
                <span className="text-rose-400 font-bold">{selectedStation.fuelReserveL ? `${selectedStation.fuelReserveL.toLocaleString()} Litres` : '180,000 Litres'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Microgrid Power State:</span>
                <span className="text-emerald-400 font-bold">{selectedStation.powerStatus || 'Nominal'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const coords = { lat: selectedStation.lat, lng: selectedStation.lng };
                  setSelectedStation(null);
                  if (onNavigateToMap) onNavigateToMap(coords);
                }}
                style={{ background: t.btnGradient, color: '#FFFFFF' }}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <MapPin className="w-4 h-4" />
                <span>Fly to Location on Polar GIS</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Outpost Modal */}
      {isAddStationOpen && (
        <Modal
          t={t}
          title="Commission Polar Research Outpost"
          onClose={() => setIsAddStationOpen(false)}
        >
          <form onSubmit={handleCreateStation} className="space-y-4">
            <Field t={t} label="Station / Outpost Name">
              <input
                type="text"
                placeholder="e.g. Larsemann Deep Drilling Depot"
                value={newStation.name}
                onChange={e => setNewStation({ ...newStation, name: e.target.value })}
                required
                style={inputStyle(t)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field t={t} label="Code">
                <input
                  type="text"
                  placeholder="e.g. LDD"
                  value={newStation.code}
                  onChange={e => setNewStation({ ...newStation, code: e.target.value.toUpperCase() })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
              <Field t={t} label="Operating Authority / Country">
                <input
                  type="text"
                  placeholder="e.g. India / International"
                  value={newStation.country}
                  onChange={e => setNewStation({ ...newStation, country: e.target.value })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field t={t} label="Latitude (°)">
                <input
                  type="number"
                  step="0.001"
                  value={newStation.lat}
                  onChange={e => setNewStation({ ...newStation, lat: parseFloat(e.target.value) })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
              <Field t={t} label="Longitude (°)">
                <input
                  type="number"
                  step="0.001"
                  value={newStation.lng}
                  onChange={e => setNewStation({ ...newStation, lng: parseFloat(e.target.value) })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field t={t} label="Elevation (m)">
                <input
                  type="number"
                  value={newStation.elevationM}
                  onChange={e => setNewStation({ ...newStation, elevationM: parseInt(e.target.value) })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
              <Field t={t} label="Region">
                <select
                  value={newStation.region}
                  onChange={e => setNewStation({ ...newStation, region: e.target.value as any })}
                  style={inputStyle(t)}
                  className={inputClass}
                >
                  <option value="antarctica">Antarctica</option>
                  <option value="arctic">Arctic</option>
                </select>
              </Field>
              <Field t={t} label="Runway Type">
                <select
                  value={newStation.runwayType}
                  onChange={e => setNewStation({ ...newStation, runwayType: e.target.value })}
                  style={inputStyle(t)}
                  className={inputClass}
                >
                  <option value="Skiway (Snow)">Skiway (Snow)</option>
                  <option value="Blue Ice Runway">Blue Ice Runway</option>
                  <option value="Hard Surface">Hard Surface</option>
                  <option value="Helipad Only">Helipad Only</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field t={t} label="Winter Crew Size">
                <input
                  type="number"
                  value={newStation.winterPopulation}
                  onChange={e => setNewStation({ ...newStation, winterPopulation: parseInt(e.target.value) })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
              <Field t={t} label="Fuel Capacity (Litres)">
                <input
                  type="number"
                  value={newStation.fuelReserveL}
                  onChange={e => setNewStation({ ...newStation, fuelReserveL: parseInt(e.target.value) })}
                  style={inputStyle(t)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsAddStationOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: t.btnGradient, color: '#FFFFFF' }}
                className="px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wider shadow-lg"
              >
                Commission Base
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
