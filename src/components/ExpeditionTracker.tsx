import React, { useState } from 'react';
import { 
  Navigation, 
  Users, 
  MapPin, 
  Clock, 
  Thermometer, 
  Wind, 
  Fuel, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Shield,
  Layers,
  Zap,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Truck,
  Download,
  Trash2,
  Edit3,
  Check
} from 'lucide-react';
import { Expedition, ExpeditionPhase, Waypoint, PolarAsset, RealtimeWeatherReading } from '../types';
import { BatteryStatus, calculateBatteryHealth } from './BatteryStatus';

interface ExpeditionTrackerProps {
  expeditions: Expedition[];
  assets?: PolarAsset[];
  expeditionWeather?: Record<string, RealtimeWeatherReading>;
  selectedExpeditionId?: string;
  onSelectExpedition: (expedition: Expedition) => void;
  onAdvanceWaypoint: (expeditionId: string) => void;
  onUpdateExpeditionPhase: (expeditionId: string, phase: ExpeditionPhase) => void;
  onRefuelAsset?: (assetId: string) => void;
  onOpenAddModal: () => void;
  onOpenAddWaypoint?: (expeditionId?: string) => void;
  onDeleteWaypoint?: (waypointId: string, expeditionId?: string) => void;
  onUpdateWaypoint?: (waypoint: Waypoint, expeditionId?: string) => void;
}

const exportWaypointsGpx = (expeditionName: string, waypoints: Waypoint[]) => {
  let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PolarOps" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${expeditionName} Route</name>
  </metadata>
  <rte>
    <name>${expeditionName} Traverse Route</name>\n`;

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
  a.download = `${expeditionName.replace(/\s+/g, '_')}_Waypoints.gpx`;
  a.click();
  URL.revokeObjectURL(url);
};

export const ExpeditionTracker: React.FC<ExpeditionTrackerProps> = ({
  expeditions,
  assets = [],
  expeditionWeather = {},
  selectedExpeditionId,
  onSelectExpedition,
  onAdvanceWaypoint,
  onUpdateExpeditionPhase,
  onRefuelAsset,
  onOpenAddModal,
  onOpenAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(expeditions[0]?.id || null);

  const toggleExpand = (id: string, exp: Expedition) => {
    onSelectExpedition(exp);
    setExpandedId(expandedId === id ? null : id);
  };

  const getPhaseBadge = (phase: ExpeditionPhase) => {
    switch (phase) {
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-600 animate-pulse font-bold">IN PROGRESS</span>;
      case 'staging':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-600 font-bold">STAGING</span>;
      case 'weather_hold':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-600 font-bold">WEATHER HOLD</span>;
      case 'emergency_extraction':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-red-600 text-white font-bold animate-bounce">EMERGENCY SAR</span>;
      case 'completed':
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">COMPLETED</span>;
    }
  };

  // Helper to get assigned assets and calculate traverse battery power
  const getTraverseAssetsAndBattery = (exp: Expedition) => {
    let assigned = assets.filter(
      (a) => exp.assignedAssetIds?.includes(a.id) || a.assignedExpeditionId === exp.id
    );

    // Fallback: if no assets assigned, find heavy traverses in the same region
    if (assigned.length === 0) {
      assigned = assets.filter(
        (a) => a.category === 'heavy_traverse' && ((exp.region === 'antarctica' && a.currentLocation.lat < 0) || (exp.region === 'arctic' && a.currentLocation.lat > 0))
      );
    }

    const totalBattery = assigned.reduce((sum, a) => sum + a.fuelOrBatteryPercent, 0);
    const avgBattery = assigned.length > 0 ? Math.round(totalBattery / assigned.length) : 78;
    const minBattery = assigned.length > 0 ? Math.min(...assigned.map((a) => a.fuelOrBatteryPercent)) : avgBattery;

    return {
      assignedAssets: assigned,
      avgBattery,
      minBattery,
    };
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              OVERLAND TRAVERSE MISSIONS & POWER TELEMETRY ({expeditions.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Heavy ice traverses, deep-field resupply convoys, and sub-zero battery diagnostics
          </p>
        </div>

        <button
          id="launch-new-expedition-btn"
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono tracking-wide transition-colors border border-indigo-400/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>LAUNCH EXPEDITION</span>
        </button>
      </div>

      {/* Expeditions Accordion / Cards List */}
      <div className="space-y-3 mt-3">
        {expeditions.map((exp) => {
          const isExpanded = expandedId === exp.id;
          const isSelected = selectedExpeditionId === exp.id;
          const progressPercent = Math.min(100, Math.round((exp.distanceCoveredKm / exp.totalDistanceKm) * 100));
          const { assignedAssets, avgBattery, minBattery } = getTraverseAssetsAndBattery(exp);
          const batteryHealth = calculateBatteryHealth(avgBattery, 92, exp.currentWeather.tempC);

          return (
            <div
              key={exp.id}
              className={`rounded-lg border transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Summary Header Row */}
              <div
                className="p-3.5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                onClick={() => toggleExpand(exp.id, exp)}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80">
                        {exp.code}
                      </span>
                      <span className="font-display font-bold text-white text-sm sm:text-base">
                        {exp.name}
                      </span>
                      {getPhaseBadge(exp.phase)}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1 flex-wrap">
                      <span>LEADER: <strong className="text-slate-200">{exp.leader}</strong></span>
                      <span className="hidden md:inline">CREW: <strong className="text-slate-200">{exp.crew.length} OPERATORS</strong></span>
                      <span>REGION: <strong className="text-sky-300 uppercase">{exp.region}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right side: Traverse Battery HUD & Progress Bar */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end flex-wrap sm:flex-nowrap">
                  {/* Real-time Traverse Battery Gauge on Mission Card */}
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2.5 font-mono text-xs shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Zap className={`w-4 h-4 ${avgBattery < 25 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                      <div>
                        <span className="text-[9px] text-slate-400 block leading-tight uppercase">TRAVERSE BATTERY</span>
                        <span className={`text-xs font-bold ${avgBattery < 25 ? 'text-rose-400' : 'text-slate-100'}`}>
                          {avgBattery}%
                        </span>
                      </div>
                    </div>

                    <div className="w-16">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            avgBattery < 25 ? 'bg-rose-500' : avgBattery < 50 ? 'bg-amber-500' : 'bg-sky-400'
                          }`}
                          style={{ width: `${avgBattery}%` }}
                        />
                      </div>
                      <span className={`text-[8px] font-bold block mt-0.5 ${batteryHealth.color}`}>
                        {batteryHealth.healthState}
                      </span>
                    </div>
                  </div>

                  {/* Route progress */}
                  <div className="text-right w-32 shrink-0">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400 text-[10px]">ROUTE</span>
                      <span className="text-sky-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                      {exp.distanceCoveredKm}/{exp.totalDistanceKm}km
                    </div>
                  </div>

                  <div className="p-1 rounded bg-slate-900 text-slate-400 shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                  {/* Objective */}
                  <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800 text-xs font-mono text-slate-300">
                    <span className="text-slate-500 font-bold block mb-0.5 text-[10px] uppercase">EXPEDITION OBJECTIVE:</span>
                    <p>{exp.objective}</p>
                  </div>

                  {/* DEDICATED EXPEDITION TRAVERSE BATTERY TELEMETRY SECTION */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-900/40 space-y-3 font-mono">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          TRAVERSE POWER CELLS & SUB-ZERO BATTERY TELEMETRY
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                          ACTIVE CONVOY LOAD
                        </span>
                      </div>

                      {onRefuelAsset && assignedAssets.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            assignedAssets.forEach((a) => onRefuelAsset(a.id));
                          }}
                          className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/60 text-[10px] font-bold transition-colors flex items-center gap-1.5"
                        >
                          <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                          <span>TOP OFF ALL TRAVERSE BATTERIES (100%)</span>
                        </button>
                      )}
                    </div>

                    {/* Integrated Battery Status Component for the Traverse */}
                    <BatteryStatus
                      batteryPercent={avgBattery}
                      status={exp.phase === 'in_progress' ? 'in_transit' : exp.phase === 'weather_hold' ? 'cold_soaked' : 'operational'}
                      fuelType="Lithium-Cold Solid & Arctic Diesel Hybrid"
                      engineHealthPercent={94}
                      tempC={exp.currentWeather.tempC}
                      showHealthDetails={true}
                    />

                    {/* Assigned Vehicles in this Traverse Convoy */}
                    {assignedAssets.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                          ASSIGNED TRAVERSE CONVOY UNITS ({assignedAssets.length} VEHICLES):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {assignedAssets.map((asset) => (
                            <div
                              key={asset.id}
                              className="p-2 rounded bg-slate-900/80 border border-slate-800 text-xs flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="font-bold text-white text-[11px] truncate">{asset.code}</span>
                                </div>
                                <span className={`text-[10px] font-bold ${
                                  asset.fuelOrBatteryPercent < 25 ? 'text-rose-400 animate-pulse' : 'text-sky-300'
                                }`}>
                                  {asset.fuelOrBatteryPercent}%
                                </span>
                              </div>

                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    asset.fuelOrBatteryPercent < 25 ? 'bg-rose-500' : 'bg-sky-400'
                                  }`}
                                  style={{ width: `${asset.fuelOrBatteryPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                <span className="truncate max-w-[120px]">{asset.model}</span>
                                <span className="text-cyan-400">{asset.coldRatingC}°C</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time Weather & Survival Reserves */}
                  {(() => {
                    const liveW = expeditionWeather[exp.id];
                    const temp = liveW ? liveW.tempC : exp.currentWeather.tempC;
                    const chill = liveW ? liveW.apparentTempC : exp.currentWeather.windchillC;
                    const wind = liveW ? liveW.windSpeedKts : exp.currentWeather.windKnots;
                    const desc = liveW ? liveW.weatherDescription : 'Drifting Polar Snowpack';
                    const windDir = liveW ? liveW.windDirectionCardinal : '180° S';

                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                              <span>AIR & WINDCHILL</span>
                              {liveW && <span className="text-[9px] text-emerald-400 font-bold">LIVE AWOS</span>}
                            </div>
                            <span className="text-sky-300 font-bold text-sm">
                              {temp}°C <span className="text-cyan-400 font-normal text-xs">({chill}°C)</span>
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                              <span>WIND & BEARING</span>
                              <span className="text-[9px] text-slate-400">{windDir}</span>
                            </div>
                            <span className="text-amber-300 font-bold text-sm">
                              {wind} knots
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block mb-0.5">RATIONS ENDURANCE</span>
                            <span className={exp.rationsDaysRemaining < 15 ? 'text-amber-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
                              {exp.rationsDaysRemaining} Days Reserve
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block mb-0.5">DAILY FUEL BURN</span>
                            <span className="text-amber-300 font-bold text-sm">
                              {exp.fuelBurnPerDayL} L / 24h
                            </span>
                          </div>
                        </div>

                        {liveW && (
                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-300">
                            <span>ATMOSPHERE: <strong className="text-cyan-300">{desc}</strong></span>
                            <span>EXPOSURE SAFETY: <strong className={liveW.frostbiteRiskLevel === 'Extreme' ? 'text-rose-400' : 'text-amber-300'}>{liveW.frostbiteRiskTime} ({liveW.frostbiteRiskLevel} Risk)</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Waypoints Sequence & Advance Button */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        WAYPOINT TRANSIT CHECKLIST ({exp.waypoints.filter(w => w.passed).length} / {exp.waypoints.length} CLEARED)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {exp.waypoints.length > 0 && (
                          <button
                            type="button"
                            onClick={() => exportWaypointsGpx(exp.name, exp.waypoints)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1 border border-slate-700"
                            title="Export route waypoints as GPX for handheld Garmin GPS"
                          >
                            <Download className="w-3 h-3 text-sky-400" />
                            <span>GPX EXPORT</span>
                          </button>
                        )}

                        {onOpenAddWaypoint && (
                          <button
                            type="button"
                            onClick={() => onOpenAddWaypoint(exp.id)}
                            className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1 border border-amber-500 shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ ADD WAYPOINT</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onAdvanceWaypoint(exp.id)}
                          disabled={exp.waypoints.every((w) => w.passed)}
                          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-mono font-bold tracking-wide transition-colors shadow-md"
                        >
                          CONFIRM NEXT WAYPOINT REACHED
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {exp.waypoints.map((wp, idx) => (
                        <div
                          key={wp.id}
                          className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 transition-all ${
                            wp.passed
                              ? 'bg-emerald-950/40 border-emerald-800/80 text-slate-300'
                              : wp.hazardNote
                              ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateWaypoint) {
                                  onUpdateWaypoint({ ...wp, passed: !wp.passed }, exp.id);
                                }
                              }}
                              className="mt-0.5 p-0.5 rounded hover:bg-slate-800 transition-colors shrink-0"
                              title={wp.passed ? 'Mark as pending' : 'Mark as reached/passed'}
                            >
                              {wp.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border-2 border-slate-600 hover:border-amber-400 inline-block transition-colors"></span>
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-white truncate text-xs">
                                  WP-{idx + 1}: {wp.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {wp.elevationM}m
                                </span>
                              </div>

                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{wp.lat.toFixed(2)}°, {wp.lng.toFixed(2)}°</span>
                                {wp.distanceFromPrevKm > 0 && (
                                  <span className="text-sky-400 font-bold">(+{wp.distanceFromPrevKm}km)</span>
                                )}
                              </div>

                              {wp.hazardNote && (
                                <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 bg-amber-950/60 p-1 rounded border border-amber-800/60">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{wp.hazardNote}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions (Delete) */}
                          {onDeleteWaypoint && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove waypoint "${wp.name}" from expedition?`)) {
                                  onDeleteWaypoint(wp.id, exp.id);
                                }
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                              title="Delete waypoint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crew Manifest Table */}
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      EXPEDITION SPECIALIST CREW ({exp.crew.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {exp.crew.map((member) => (
                        <div
                          key={member.id}
                          className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono flex items-center gap-2.5"
                        >
                          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white truncate">{member.name}</div>
                            <div className="text-[11px] text-sky-400">{member.role}</div>
                            <div className="text-[10px] text-slate-500">
                              Callsign: {member.callsign} | {member.experienceSeasons} Seasons
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phase Control Selector */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-500 uppercase">CHANGE MISSION PHASE:</span>
                      <select
                        value={exp.phase}
                        onChange={(e) => onUpdateExpeditionPhase(exp.id, e.target.value as ExpeditionPhase)}
                        aria-label="Change mission phase"
                        className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="in_progress">In Progress</option>
                        <option value="weather_hold">Weather Hold (Blizzard)</option>
                        <option value="staging">Staging / Preparation</option>
                        <option value="completed">Mission Completed</option>
                        <option value="emergency_extraction">Emergency Extraction SAR</option>
                      </select>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500">
                      Departure: {exp.departureDate} | Est. Return: {exp.estimatedReturnDate}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

