import React, { useState } from 'react';
import { 
  Truck, 
  Plane, 
  Compass, 
  Wrench, 
  BatteryCharging, 
  Fuel, 
  ThermometerSnowflake, 
  Plus, 
  Search, 
  Filter, 
  Radio, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  CheckCircle2,
  Zap,
  BatteryWarning,
  AlertTriangle
} from 'lucide-react';
import { PolarAsset, AssetCategory, AssetStatus } from '../types';
import { BatteryStatus } from './BatteryStatus';

interface AssetManagementProps {
  assets: PolarAsset[];
  onSelectAsset: (asset: PolarAsset) => void;
  onUpdateAssetStatus: (assetId: string, status: AssetStatus) => void;
  onRefuelAsset: (assetId: string) => void;
  onOpenAddModal: () => void;
  selectedAssetId?: string;
}

export const AssetManagement: React.FC<AssetManagementProps> = ({
  assets,
  onSelectAsset,
  onUpdateAssetStatus,
  onRefuelAsset,
  onOpenAddModal,
  selectedAssetId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyLowBattery, setOnlyLowBattery] = useState<boolean>(false);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.currentLocation.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    const matchesBattery = !onlyLowBattery || asset.fuelOrBatteryPercent < 25;

    return matchesSearch && matchesCategory && matchesStatus && matchesBattery;
  });

  // Calculate fleet power diagnostics
  const totalBatterySum = assets.reduce((sum, a) => sum + a.fuelOrBatteryPercent, 0);
  const avgFleetBattery = assets.length > 0 ? Math.round(totalBatterySum / assets.length) : 0;
  const lowBatteryCount = assets.filter((a) => a.fuelOrBatteryPercent < 25).length;
  const inTransitCount = assets.filter((a) => a.status === 'in_transit').length;

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'aviation':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'heavy_traverse':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'scientific_rig':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'power_habitat':
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case 'emergency_sar':
      default:
        return <ShieldCheck className="w-4 h-4 text-rose-400" />;
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'operational':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700">OPERATIONAL</span>;
      case 'in_transit':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-600 animate-pulse">IN TRANSIT</span>;
      case 'maintenance':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-600">MAINTENANCE</span>;
      case 'cold_soaked':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700">COLD SOAKED</span>;
      case 'standby':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">STANDBY</span>;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Header & New Asset Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              POLAR FLEET & ASSET TELEMETRY ({filteredAssets.length} / {assets.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Heavy tracked crawlers, ski-equipped aircraft, deep coring skids & mobile shelters
          </p>
        </div>

        <button
          id="commission-new-asset-btn"
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-mono tracking-wide transition-colors border border-sky-400/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>COMMISSION ASSET</span>
        </button>
      </div>

      {/* Fleet Battery Diagnostics Quick HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">FLEET AVG POWER</span>
            <span className="text-sm font-bold text-sky-400">{avgFleetBattery}%</span>
          </div>
          <Zap className="w-4 h-4 text-sky-400" />
        </div>

        <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
          lowBatteryCount > 0 ? 'bg-rose-950/40 border-rose-700/60' : 'bg-slate-950 border-slate-800'
        }`}>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">LOW BATTERY (&lt;25%)</span>
            <span className={`text-sm font-bold ${lowBatteryCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {lowBatteryCount} UNITS
            </span>
          </div>
          <BatteryWarning className={`w-4 h-4 ${lowBatteryCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">ACTIVE TRAVERSES</span>
            <span className="text-sm font-bold text-amber-400">{inTransitCount} HEAVY LOADS</span>
          </div>
          <Activity className="w-4 h-4 text-amber-400" />
        </div>

        <button
          type="button"
          onClick={() => setOnlyLowBattery((prev) => !prev)}
          className={`p-2.5 rounded-lg border flex items-center justify-between font-mono text-left transition-all ${
            onlyLowBattery
              ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase block opacity-80">FILTER CRITICAL POWER</span>
            <span className="text-xs font-bold">{onlyLowBattery ? 'SHOWING &lt;25% ONLY' : 'SHOW ALL UNITS'}</span>
          </div>
          <Filter className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search code, model, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 font-mono text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter asset category"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Categories ({assets.length})</option>
            <option value="heavy_traverse">Heavy Traverse & Tractors</option>
            <option value="aviation">Polar Aviation & Ski-planes</option>
            <option value="scientific_rig">Drilling & Radar Skids</option>
            <option value="power_habitat">Habitat & Power Pods</option>
            <option value="emergency_sar">Rapid Response / SAR</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter asset status"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Operational Statuses</option>
            <option value="operational">Operational</option>
            <option value="in_transit">In Transit (Active Drain)</option>
            <option value="maintenance">Maintenance (Recharging)</option>
            <option value="cold_soaked">Cold Soaked (Sub-zero Drain)</option>
            <option value="standby">Standby</option>
          </select>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
            NO POLAR ASSETS MATCH THE CURRENT FILTER QUERY.
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isSelected = selectedAssetId === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Code, Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">
                        {getCategoryIcon(asset.category)}
                      </div>
                      <span className="font-mono text-xs font-bold text-sky-400 tracking-wider">
                        {asset.code}
                      </span>
                    </div>
                    {getStatusBadge(asset.status)}
                  </div>

                  {/* Name & Model */}
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide font-display line-clamp-1">
                      {asset.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {asset.model}
                    </p>
                  </div>

                  {/* Location Coordinate Tag */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="text-slate-500 truncate max-w-[140px]">{asset.currentLocation.name}</span>
                    <span className="text-sky-300 font-semibold">
                      {asset.currentLocation.lat > 0 ? `${asset.currentLocation.lat.toFixed(1)}°N` : `${Math.abs(asset.currentLocation.lat).toFixed(1)}°S`}
                    </span>
                  </div>

                  {/* Battery Status Component Integration */}
                  <BatteryStatus
                    batteryPercent={asset.fuelOrBatteryPercent}
                    status={asset.status}
                    fuelType={asset.fuelType}
                    engineHealthPercent={asset.telemetry.engineHealthPercent}
                    tempC={asset.telemetry.tempC}
                    showHealthDetails={true}
                  />

                  {/* Cold Rating & Satlink Signal */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] uppercase">COLD LIMIT</span>
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <ThermometerSnowflake className="w-3 h-3" />
                        {asset.coldRatingC}°C
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] uppercase">SATCOM LINK</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        {asset.telemetry.satlinkSignal}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs font-mono">
                  {/* Status toggle selector */}
                  <select
                    value={asset.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateAssetStatus(asset.id, e.target.value as AssetStatus);
                    }}
                    aria-label={`Update status for ${asset.code}`}
                    className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-sky-500"
                  >
                    <option value="operational">Operational</option>
                    <option value="in_transit">In Transit</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="cold_soaked">Cold Soaked</option>
                    <option value="standby">Standby</option>
                  </select>

                  {/* Refuel / Recharge button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefuelAsset(asset.id);
                    }}
                    title="Charge battery & replenish fuel to 100%"
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 text-[10px] font-bold tracking-wider transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>RECHARGE 100%</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
