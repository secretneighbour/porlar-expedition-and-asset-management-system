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
  Layers
} from 'lucide-react';
import { Expedition, ExpeditionPhase, Waypoint } from '../types';

interface ExpeditionTrackerProps {
  expeditions: Expedition[];
  selectedExpeditionId?: string;
  onSelectExpedition: (expedition: Expedition) => void;
  onAdvanceWaypoint: (expeditionId: string) => void;
  onUpdateExpeditionPhase: (expeditionId: string, phase: ExpeditionPhase) => void;
  onOpenAddModal: () => void;
}

export const ExpeditionTracker: React.FC<ExpeditionTrackerProps> = ({
  expeditions,
  selectedExpeditionId,
  onSelectExpedition,
  onAdvanceWaypoint,
  onUpdateExpeditionPhase,
  onOpenAddModal,
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

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              TRAVERSE MISSIONS & EXPEDITIONS ({expeditions.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Overland ice traverses, core drilling missions, and high-latitude reconnaissance
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
                className="p-3.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                      <span>LEADER: <strong className="text-slate-200">{exp.leader}</strong></span>
                      <span className="hidden md:inline">CREW: <strong className="text-slate-200">{exp.crew.length} OPERATORS</strong></span>
                      <span>REGION: <strong className="text-sky-300 uppercase">{exp.region}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Progress bar and expand chevron */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right w-36">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">PROGRESS</span>
                      <span className="text-sky-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {exp.distanceCoveredKm} / {exp.totalDistanceKm} km
                    </div>
                  </div>

                  <div className="p-1 rounded bg-slate-900 text-slate-400">
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

                  {/* Weather & Survival Reserves */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">AIR TEMP & WINDCHILL</span>
                      <span className="text-sky-300 font-bold text-sm">
                        {exp.currentWeather.tempC}°C ({exp.currentWeather.windchillC}°C)
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">KATABATIC WIND</span>
                      <span className="text-cyan-300 font-bold text-sm">
                        {exp.currentWeather.windKnots} knots
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">RATIONS ENDURANCE</span>
                      <span className={exp.rationsDaysRemaining < 15 ? 'text-amber-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
                        {exp.rationsDaysRemaining} Days Reserve
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">DAILY FUEL BURN</span>
                      <span className="text-amber-300 font-bold text-sm">
                        {exp.fuelBurnPerDayL} L / 24h
                      </span>
                    </div>
                  </div>

                  {/* Waypoints Sequence & Advance Button */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        WAYPOINT TRANSIT CHECKLIST ({exp.waypoints.filter(w => w.passed).length} / {exp.waypoints.length} CLEARED)
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdvanceWaypoint(exp.id)}
                        disabled={exp.waypoints.every((w) => w.passed)}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-mono font-bold tracking-wide transition-colors"
                      >
                        CONFIRM NEXT WAYPOINT REACHED
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {exp.waypoints.map((wp, idx) => (
                        <div
                          key={wp.id}
                          className={`p-2 rounded border flex items-start gap-2 ${
                            wp.passed
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-300'
                              : wp.hazardNote
                              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="mt-0.5">
                            {wp.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white truncate">
                                WP-{idx + 1}: {wp.name}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1 shrink-0">
                                {wp.elevationM}m
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {wp.lat.toFixed(2)}°, {wp.lng.toFixed(2)}°
                              {wp.distanceFromPrevKm > 0 && ` (+${wp.distanceFromPrevKm}km)`}
                            </div>
                            {wp.hazardNote && (
                              <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{wp.hazardNote}</span>
                              </div>
                            )}
                          </div>
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
