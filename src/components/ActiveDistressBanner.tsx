import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  CheckCircle2, 
  ShieldAlert,
  Send,
  Truck,
  Zap,
  Bot,
  Wind,
  Thermometer,
  Eye,
  Navigation,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ActiveDistressAlert, PolarAsset } from '../types';

export interface ActiveDistressBannerProps {
  distress?: ActiveDistressAlert;
  activeDistress?: ActiveDistressAlert;
  assets?: PolarAsset[];
  isMuted?: boolean;
  isAlarmMuted?: boolean;
  autoSarDispatchEnabled?: boolean;
  onToggleMute: () => void;
  onAcknowledge: (data: { acknowledgedBy: string; dispatchedSARAssetId?: string; dispatchedSARName?: string }) => void;
  onResolve: () => void;
  onLocateOnMap?: (lat: number, lng: number) => void;
  onTriggerCrevasseFall?: () => void;
  onToggleAutoSar?: () => void;
}

export const ActiveDistressBanner: React.FC<ActiveDistressBannerProps> = ({
  distress: propDistress,
  activeDistress: propActiveDistress,
  assets = [],
  isMuted: propIsMuted,
  isAlarmMuted: propIsAlarmMuted,
  autoSarDispatchEnabled = true,
  onToggleMute,
  onAcknowledge,
  onResolve,
  onLocateOnMap,
  onTriggerCrevasseFall,
  onToggleAutoSar,
}) => {
  const [showAcknowledgeForm, setShowAcknowledgeForm] = useState(false);
  const [dispatcherName, setDispatcherName] = useState('Operations Desk Lead');
  const [showReasoningDetail, setShowReasoningDetail] = useState(true);
  const [isExecutingAutoSar, setIsExecutingAutoSar] = useState(false);

  const distress = propDistress || propActiveDistress;
  const isMuted = propIsMuted ?? propIsAlarmMuted ?? false;

  if (!distress) return null;

  // Find SAR capable assets
  const sarAssets = assets.filter((a) => a.category === 'emergency_sar' || a.category === 'aviation' || a.status === 'operational');
  const [selectedSarId, setSelectedSarId] = useState(sarAssets[0]?.id || '');

  // Parse coords for radar lock
  const handleLocate = () => {
    if (distress.targetLat && distress.targetLng && onLocateOnMap) {
      onLocateOnMap(distress.targetLat, distress.targetLng);
    } else if (distress.coordinates && onLocateOnMap) {
      const parts = distress.coordinates.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        onLocateOnMap(parts[0], parts[1]);
      }
    }
  };

  const handleConfirmAcknowledge = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenAsset = assets.find((a) => a.id === selectedSarId);
    onAcknowledge({
      acknowledgedBy: dispatcherName.trim() || 'HQ Director',
      dispatchedSARAssetId: chosenAsset?.id,
      dispatchedSARName: chosenAsset ? `${chosenAsset.code} (${chosenAsset.name})` : 'Rapid Response Team Alpha',
    });
    setShowAcknowledgeForm(false);
  };

  // Immediate AI autonomous dispatch trigger if alert was received in legacy mode
  const handleTriggerAutonomousDispatchNow = async () => {
    setIsExecutingAutoSar(true);
    try {
      if (onTriggerCrevasseFall) {
        await onTriggerCrevasseFall();
      } else {
        const res = await fetch('/api/ai/sar/dispatch-crevasse-fall', { method: 'POST' });
        await res.json();
      }
    } catch (err) {
      console.error('Failed to trigger autonomous SAR dispatch', err);
    } finally {
      setIsExecutingAutoSar(false);
    }
  };

  const hasAutonomousSAR = Boolean(distress.autonomousSAR);
  const autoSar = distress.autonomousSAR;
  const isAcknowledged = distress.acknowledgedByHQ;

  return (
    <div
      id="distress-active-banner"
      className={`w-full rounded-xl border font-mono transition-all shadow-2xl overflow-hidden my-3 ${
        hasAutonomousSAR
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/50 border-emerald-500/80 text-slate-100 ring-1 ring-emerald-500/30'
          : isAcknowledged
          ? 'bg-amber-950/40 border-amber-600/80 text-amber-100'
          : 'bg-rose-950/90 border-rose-600 text-rose-100 animate-pulse-border'
      }`}
    >
      {/* Top Banner Notice: What it was vs What AI does */}
      <div className="px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            AI AUTOMATED S.A.R. DISPATCH SYSTEM
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">
            Zero-Click Autonomous Response: Nearest Base Calculated • Weather Assessed • Rescue Dispatched Instantly
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleAutoSar && (
            <button
              type="button"
              onClick={onToggleAutoSar}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                autoSarDispatchEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Mode: {autoSarDispatchEnabled ? '⚡ Autonomous (Zero-Click)' : 'Manual Operator'}
            </button>
          )}

          {onTriggerCrevasseFall && (
            <button
              type="button"
              onClick={onTriggerCrevasseFall}
              className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 transition-colors shadow-sm"
              title="Re-simulate Crevasse Fall Mayday beacon with autonomous zero-click dispatch"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Re-Test Crevasse Fall</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Banner Content */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Indicator & Headline */}
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                hasAutonomousSAR
                  ? 'bg-emerald-600/90 text-white ring-2 ring-emerald-400/50'
                  : isAcknowledged
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white animate-bounce'
              }`}
            >
              {hasAutonomousSAR ? (
                <Zap className="w-7 h-7 animate-pulse text-amber-300" />
              ) : isAcknowledged ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm ${
                    hasAutonomousSAR
                      ? 'bg-emerald-500 text-slate-950 font-extrabold'
                      : isAcknowledged
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {hasAutonomousSAR ? (
                    <>
                      <Zap className="w-3 h-3" />
                      AUTONOMOUSLY DISPATCHED BY AI (ZERO-CLICK)
                    </>
                  ) : isAcknowledged ? (
                    'STATUS: ACKNOWLEDGED BY HQ (SAR IN TRANSIT)'
                  ) : (
                    '🚨 LIVE FIELD MAYDAY BEACON ACTIVE'
                  )}
                </span>

                <span className="text-xs text-slate-300">
                  Origin: <span className="font-bold text-white">{distress.reportedByDevice}</span> ({distress.reporterCallsign})
                </span>
                <span className="text-[11px] text-slate-400">
                  at {new Date(distress.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white tracking-wide mt-1.5 flex items-center gap-2">
                <span>{distress.incidentType}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({distress.location})
                </span>
              </h3>

              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                <span className="text-rose-400 font-bold uppercase tracking-wider">Field Report: </span>
                {distress.summary}
              </p>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute siren' : 'Mute siren'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              )}
              <span>{isMuted ? 'MUTED' : 'ALARM ON'}</span>
            </button>

            {onLocateOnMap && (
              <button
                type="button"
                onClick={handleLocate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                <Crosshair className="w-4 h-4" />
                <span>RADAR LOCK</span>
              </button>
            )}

            {!hasAutonomousSAR && !isAcknowledged ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerAutonomousDispatchNow}
                  disabled={isExecutingAutoSar}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors border border-emerald-400 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{isExecutingAutoSar ? 'CALCULATING...' : 'EXECUTE ZERO-CLICK SAR NOW'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAcknowledgeForm(!showAcknowledgeForm)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/50 transition-colors border border-rose-400 cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>MANUAL HQ DISPATCH</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onResolve}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow transition-colors border border-emerald-400 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>FIELD PARTY SAFE (STAND DOWN)</span>
              </button>
            )}
          </div>
        </div>

        {/* AUTONOMOUS AI S.A.R. DISPATCH TELEMETRY (What AI Automation Did) */}
        {hasAutonomousSAR && autoSar && (
          <div className="mt-4 pt-4 border-t border-emerald-500/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Nearest Base */}
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase">
                    <Navigation className="w-3 h-3" />
                    1. NEAREST BASE CALCULATED
                  </span>
                  <span className="text-emerald-300 font-mono font-bold">{autoSar.nearestBaseDistanceKm} km</span>
                </div>
                <div className="text-sm font-bold text-white truncate" title={autoSar.nearestBaseName}>
                  {autoSar.nearestBaseName}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>Coords: {autoSar.nearestBaseCoords}</span>
                </div>
                <div className="mt-2 text-[10px] text-emerald-400 font-medium">
                  ✓ Geodesic minimum range verified
                </div>
              </div>

              {/* Card 2: Weather at Nearest Base */}
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className="flex items-center gap-1 text-sky-400 font-bold uppercase">
                    <Wind className="w-3 h-3" />
                    2. BASE WEATHER ASSESSED
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${autoSar.weatherFlyable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {autoSar.weatherFlyable ? 'FLIGHT CLEAR' : 'EXTREME'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sky-300">
                    <Thermometer className="w-3.5 h-3.5" />
                    {autoSar.tempC}°C
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Wind className="w-3.5 h-3.5" />
                    {autoSar.windSpeedKt} kt
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>Visibility: {autoSar.visibilityKm} km</span>
                </div>
                <div className="mt-2 text-[10px] text-sky-400 font-medium truncate" title={autoSar.weatherSummary}>
                  ✓ Sub-zero thermal corridor open
                </div>
              </div>

              {/* Card 3: Autonomous Drone Dispatched */}
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className="flex items-center gap-1 text-amber-400 font-bold uppercase">
                    <Bot className="w-3 h-3" />
                    3. DRONE FALCON-X DISPATCHED
                  </span>
                  <span className="text-amber-300 font-mono font-bold">ETA ~{autoSar.droneEtaMinutes}m</span>
                </div>
                <div className="text-sm font-bold text-white truncate" title={autoSar.dispatchedDroneName}>
                  Falcon-X S.A.R. Drone
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>Role: Forward FLIR & Winch Locator</span>
                </div>
                <div className="mt-2 text-[10px] text-amber-300 font-medium">
                  ✓ Autonomous flight plan uploaded
                </div>
              </div>

              {/* Card 4: Ground Team Scrambled */}
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className="flex items-center gap-1 text-rose-400 font-bold uppercase">
                    <Truck className="w-3 h-3" />
                    4. TRACKED RESCUE TEAM SCRAMBLED
                  </span>
                  <span className="text-rose-300 font-mono font-bold">ETA ~{autoSar.groundEtaMinutes}m</span>
                </div>
                <div className="text-sm font-bold text-white truncate" title={autoSar.dispatchedGroundTeamName}>
                  P300 Crevasse Rescue Team
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>Payload: 30m Winch + Medical Pod</span>
                </div>
                <div className="mt-2 text-[10px] text-rose-300 font-medium">
                  ✓ Heavy crawler departed station
                </div>
              </div>
            </div>

            {/* AI Decision Reasoning & Execution Timeline */}
            <div className="mt-3 bg-slate-950/80 rounded-lg p-3 border border-emerald-500/20 text-xs">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowReasoningDetail(!showReasoningDetail)}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-300">AUTONOMOUS S.A.R. EXECUTION TELEMETRY & DECISION TRACE</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Execution: {autoSar.executionTimeMs}ms (0 Human Clicks)
                  </span>
                </div>
                <button type="button" className="text-slate-400 hover:text-white">
                  {showReasoningDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showReasoningDetail && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2">
                  {/* Sequence Milestones */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-rose-400 font-bold block">T+0.00s BEACON DETECTED</span>
                      <span>Crevasse Fall signal from {distress.reporterCallsign}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold block">T+0.38s NEAREST BASE LOCKED</span>
                      <span>{autoSar.nearestBaseName} ({autoSar.nearestBaseDistanceKm}km)</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-sky-400 font-bold block">T+0.72s WEATHER SAMPLED</span>
                      <span>{autoSar.tempC}°C, Wind {autoSar.windSpeedKt}kt, Corridor CLEAR</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold block">T+1.12s ZERO-CLICK DISPATCH</span>
                      <span>Falcon-X Drone & P300 Crawler in transit</span>
                    </div>
                  </div>

                  {/* AI Synthetic Explanation */}
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans bg-emerald-950/20 p-2.5 rounded border border-emerald-500/20">
                    <strong className="text-emerald-300 font-mono">System Audit: </strong>
                    {autoSar.autonomousDecisionReasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legacy / Manual Form if AI is turned off */}
        {showAcknowledgeForm && !isAcknowledged && !hasAutonomousSAR && (
          <form
            onSubmit={handleConfirmAcknowledge}
            className="mt-3 p-3.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs space-y-3 animate-fade-in"
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <Truck className="w-4 h-4" />
              <span>MANUAL DISPATCH RESCUE MISSION (LEGACY OPERATOR MODE)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">
                  DISPATCHER / HQ DIRECTOR SIGN-OFF:
                </label>
                <input
                  type="text"
                  required
                  value={dispatcherName}
                  onChange={(e) => setDispatcherName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">
                  DEPLOY RAPID RESPONSE / AVIATION ASSET:
                </label>
                <select
                  value={selectedSarId}
                  onChange={(e) => setSelectedSarId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
                >
                  {sarAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.code} — {asset.name} ({asset.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAcknowledgeForm(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors flex items-center gap-1.5 border border-rose-400 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>TRANSMIT CONFIRMATION TO FIELD PHONE</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
