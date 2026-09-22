import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Radio, AlertTriangle, Play, CheckCircle2,
  Clock, Navigation, Compass, MapPin, Zap, Flame, Wind, Eye, Users,
  Plane, Truck, ArrowRight, RefreshCw, Volume2, VolumeX, AlertOctagon,
  FileText, Activity, Layers, CornerDownRight, Check
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY, STATIONS } from '../../data/polarisData';
import { INITIAL_ASSETS } from '../../data/polarData';
import { ActiveDistressAlert } from '../../types';
import { PageHeader, Badge, Modal } from './SharedUI';
import { startEmergencyAlarm, stopEmergencyAlarm, playTacticalChirp, playSuccessChime } from '../../utils/audioAlert';

interface SarConsoleViewProps {
  t: any;
  activeDistress: ActiveDistressAlert | null;
  autoSarDispatchEnabled: boolean;
  isAlarmMuted: boolean;
  onToggleAutoSar: () => void;
  onToggleMuteAlarm: () => void;
  onTriggerCrevasseFall: () => void;
  onAcknowledgeDistress: () => void;
  onResolveDistress: () => void;
  onNavigateToMap: (coords?: { lat: number; lng: number }) => void;
  onOpenEmergencyModal: () => void;
}

export function SarConsoleView({
  t,
  activeDistress,
  autoSarDispatchEnabled,
  isAlarmMuted,
  onToggleAutoSar,
  onToggleMuteAlarm,
  onTriggerCrevasseFall,
  onAcknowledgeDistress,
  onResolveDistress,
  onNavigateToMap,
  onOpenEmergencyModal
}: SarConsoleViewProps) {
  const [sarStatusDetails, setSarStatusDetails] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchSarStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/ai/sar/status');
      if (res.ok) {
        const data = await res.json();
        setSarStatusDetails(data);
      }
    } catch (e) {
      console.warn('Failed to fetch SAR status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSarStatus();
  }, [activeDistress, autoSarDispatchEnabled]);

  // Extract coordinates for display
  const targetCoords = activeDistress?.targetLat !== undefined && activeDistress?.targetLng !== undefined
    ? `${activeDistress.targetLat.toFixed(3)}°, ${activeDistress.targetLng.toFixed(3)}°`
    : activeDistress?.coordinates || '-85.250°, 151.100°';

  // SAR Asset recommendations
  const sarAssets = INITIAL_ASSETS.filter(a =>
    a.category === 'aviation' || a.category === 'heavy_traverse' || a.category === 'emergency_sar'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        t={t}
        title="Search & Rescue (S.A.R.) Mission Console"
        subtitle="Tactical Mayday Command Center: Zero-click autonomous distress triangulation, extreme-weather dispatch, and rescue team synchronization."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleAutoSar}
              style={{
                background: autoSarDispatchEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: autoSarDispatchEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                color: autoSarDispatchEnabled ? '#10B981' : t.textDim
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              title="Toggle Autonomous SAR mode"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${autoSarDispatchEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>MODE: {autoSarDispatchEnabled ? 'AI AUTONOMOUS (ZERO-CLICK)' : 'MANUAL OPERATOR'}</span>
            </button>

            <button
              onClick={onOpenEmergencyModal}
              style={{
                background: 'linear-gradient(135deg, #EF4444, #9333EA)',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)'
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-mono font-bold uppercase tracking-wider transition-all hover:opacity-90 cursor-pointer shadow-lg animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Broadcast Mayday</span>
            </button>
          </div>
        }
      />

      {/* ACTIVE DISTRESS STATUS BAR */}
      {activeDistress ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.25), rgba(15, 23, 42, 0.95))',
            borderColor: '#EF4444',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.35)'
          }}
          className="p-6 rounded-2xl border-2 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 text-rose-500 pointer-events-none">
            <ShieldAlert className="w-64 h-64" />
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-rose-600/30 border border-rose-500/50 text-rose-400 animate-bounce">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono text-xs font-black tracking-widest animate-pulse">
                    MAYDAY ACTIVE
                  </span>
                  <span className="text-sm font-mono text-rose-200">
                    {activeDistress.incidentType || 'Severe Structural Breach / Trauma'}
                  </span>
                  {activeDistress.autonomousSAR && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                      ⚡ ZERO-CLICK AUTO DISPATCHED
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold font-mono text-white mt-1">
                  {activeDistress.summary || 'Field party emergency beacon transmitting over SATCOM frequency 406.025 MHz.'}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <MapPin className="w-3.5 h-3.5" /> {activeDistress.location} ({targetCoords})
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Radio className="w-3.5 h-3.5" /> Callsign: <strong>{activeDistress.reporterCallsign || 'EXP-701'}</strong>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5" /> Initiated: {new Date(activeDistress.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical Control Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMuteAlarm}
                style={{
                  background: isAlarmMuted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.25)',
                  borderColor: isAlarmMuted ? 'rgba(255, 255, 255, 0.15)' : '#EF4444',
                  color: isAlarmMuted ? t.textDim : '#FDA4AF'
                }}
                className="p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-all"
                title={isAlarmMuted ? 'Unmute Klaxon' : 'Mute Klaxon'}
              >
                {isAlarmMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
                <span className="hidden sm:inline">{isAlarmMuted ? 'UNMUTE' : 'MUTE'}</span>
              </button>

              <button
                onClick={() => {
                  let lat = activeDistress.targetLat;
                  let lng = activeDistress.targetLng;
                  if ((lat === undefined || lng === undefined) && activeDistress.coordinates) {
                    const p = activeDistress.coordinates.split(',').map(s => parseFloat(s.trim()));
                    if (!isNaN(p[0]) && !isNaN(p[1])) {
                      lat = p[0];
                      lng = p[1];
                    }
                  }
                  onNavigateToMap(lat !== undefined && lng !== undefined ? { lat, lng } : undefined);
                }}
                style={{ borderColor: 'rgba(56, 189, 248, 0.5)' }}
                className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Locate on GIS</span>
              </button>

              {!activeDistress.acknowledgedByHQ && (
                <button
                  onClick={onAcknowledgeDistress}
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderColor: '#F59E0B',
                    color: '#FDE68A'
                  }}
                  className="px-4 py-2 rounded-xl border text-xs font-mono font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>HQ Acknowledge</span>
                </button>
              )}

              <button
                onClick={onResolveDistress}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF'
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>FIELD PARTY SAFE — STAND DOWN</span>
              </button>
            </div>
          </div>

          {/* Autonomous SAR Execution Summary Card */}
          {activeDistress.autonomousSAR && (
            <div className="mt-5 p-4 rounded-xl bg-black/40 border border-emerald-500/30 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> AI AUTONOMOUS S.A.R. MISSION MANIFEST
                </span>
                <span className="text-slate-400">
                  Target Station: <strong className="text-white">{activeDistress.autonomousSAR.nearestBaseName}</strong> ({activeDistress.autonomousSAR.nearestBaseDistanceKm} km)
                </span>
              </div>
              <p className="text-slate-200">
                {activeDistress.autonomousSAR.autonomousDecisionReasoning}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                  <span className="text-slate-400 block text-[10px]">SCRAMBLED RECON DRONE</span>
                  <span className="text-emerald-300 font-bold">{activeDistress.autonomousSAR.dispatchedDroneName || 'DJI Matrice 300 Polar FLIR'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">ETA: {activeDistress.autonomousSAR.droneEtaMinutes || 18} mins (Thermal scanning)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                  <span className="text-slate-400 block text-[10px]">EXTRACTION TRACK TEAM</span>
                  <span className="text-emerald-300 font-bold">{activeDistress.autonomousSAR.dispatchedGroundTeamName || 'PistenBully 300 Polar Track Alpha'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">ETA: {activeDistress.autonomousSAR.groundEtaMinutes || 65} mins (Hydraulic winch & litter)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                  <span className="text-slate-400 block text-[10px]">SECTOR WEATHER ASSESSMENT</span>
                  <span className="text-amber-300 font-bold">{activeDistress.autonomousSAR.weatherSummary || 'COND-1 Heavy Blizzard'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Temp: {activeDistress.autonomousSAR.tempC || -48}°C | Wind: {activeDistress.autonomousSAR.windSpeedKt || 42} kt</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-6 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-lg font-bold font-mono text-white">ALL SECTORS SECURED — ZERO ACTIVE MAYDAY BEACONS</h3>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SATCOM 406 MHz and AIS distress frequencies clear. AI autonomous emergency watcher running at 1000ms polling rate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerCrevasseFall}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                color: '#FDA4AF'
              }}
              className="px-4 py-2.5 rounded-xl border text-xs font-mono font-bold hover:bg-rose-950/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Test Crevasse Fall distress scenario"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>SIM CREVASSE FALL (AUTO S.A.R.)</span>
            </button>
          </div>
        </div>
      )}

      {/* 8-STEP AUTONOMOUS WORKFLOW VISUALIZER */}
      <div
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
        className="p-6 rounded-2xl border backdrop-blur-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm font-mono text-white uppercase tracking-wider">
              Autonomous Closed-Loop S.A.R. Architecture
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {autoSarDispatchEnabled ? 'Status: Active Background Daemon' : 'Status: Manual Awaiting Human'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-[11px]">
          {[
            { step: '01', title: 'Distress Rx', desc: 'SATCOM 406MHz ingested' },
            { step: '02', title: 'Geocoding', desc: 'GPS & elevation locked' },
            { step: '03', title: 'Haversine', desc: 'Nearest base calculated' },
            { step: '04', title: 'AWOS Met', desc: 'Katabatic wind modeled' },
            { step: '05', title: 'Drone Tasked', desc: 'Thermal FLIR scrambled' },
            { step: '06', title: 'Ground Crawl', desc: 'Tracked Snowcat ordered' },
            { step: '07', title: 'Field Sync', desc: 'Survivor UI countdown' },
            { step: '08', title: 'HQ Audit', desc: 'Forensic log committed' },
          ].map((s, idx) => {
            const isActive = activeDistress ? true : false;
            return (
              <div
                key={s.step}
                style={{
                  background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'rgba(0,0,0,0.3)',
                  borderColor: isActive ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255,255,255,0.06)'
                }}
                className="p-2.5 rounded-xl border flex flex-col justify-between h-24"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-bold">{s.step}</span>
                  {isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-[11px] leading-tight">{s.title}</p>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* S.A.R. ASSET FLEET & RESPONSE READINESS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-5 rounded-2xl border backdrop-blur-md lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm font-mono text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" /> Designated S.A.R. Rescue Assets & Equipment
            </h3>
            <span className="text-xs font-mono text-slate-400">{sarAssets.length} Assets Staged</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sarAssets.map(asset => (
              <div
                key={asset.id}
                style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}
                className="p-3.5 rounded-xl border flex flex-col justify-between space-y-2 hover:border-cyan-500/40 transition-all font-mono text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{asset.name}</h4>
                    <p className="text-[11px] text-slate-400">{asset.model}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                    asset.status === 'operational'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 bg-black/20 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-500 block">FUEL/BAT</span>
                    <span className="text-emerald-400 font-bold">{asset.fuelOrBatteryPercent}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">COLD LIMIT</span>
                    <span className="text-cyan-300 font-bold">{asset.coldRatingC}°C</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CREW</span>
                    <span className="text-slate-200 font-bold">{asset.crewCapacity} pax</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400 truncate max-w-[180px]">{asset.currentLocation.name}</span>
                  <button
                    onClick={() => onNavigateToMap({ lat: asset.currentLocation.lat, lng: asset.currentLocation.lng })}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick S.A.R. Simulator Tools */}
        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-5 rounded-2xl border backdrop-blur-md space-y-4 font-mono text-xs"
        >
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" /> S.A.R. Emergency Drills & Simulator
          </h3>

          <p className="text-slate-300 text-[11px]">
            Execute tactical stress drills to evaluate automated satellite alert propagation, crew reaction times, and automated dispatch models.
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={onTriggerCrevasseFall}
              style={{ background: 'rgba(239, 68, 68, 0.18)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#FDA4AF' }}
              className="w-full py-2.5 px-3 rounded-xl border font-bold text-left flex items-center justify-between hover:bg-rose-950/40 transition-all cursor-pointer"
            >
              <div>
                <p className="font-bold">SIM CREVASSE FALL (AUTO S.A.R.)</p>
                <p className="text-[10px] text-slate-400">Triggers Leverett Glacier -85.25°, 151.10° breach</p>
              </div>
              <Play className="w-4 h-4 text-rose-400" />
            </button>

            <button
              onClick={onTriggerCrevasseFall}
              style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#FDE68A' }}
              className="w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between hover:bg-amber-950/40 transition-all cursor-pointer"
            >
              <div>
                <p className="font-bold text-[11px]">RE-TEST CREVASSE FALL</p>
                <p className="text-[9px] text-slate-400">Re-evaluates geodesic route & scrambles support</p>
              </div>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={onResolveDistress}
              style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#A7F3D0' }}
              className="w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between hover:bg-emerald-950/40 transition-all cursor-pointer"
            >
              <div>
                <p className="font-bold text-[11px]">FIELD PARTY SAFE — STAND DOWN</p>
                <p className="text-[9px] text-slate-400">Recalls all response assets & archives alert</p>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1 text-[10px] text-slate-400">
            <p className="text-slate-300 font-bold">EMERGENCY PROTOCOL NOTE:</p>
            <p>Stand-down broadcasts zero-state to all paired smartphones, tablets, and field rovers simultaneously via WebSocket mesh.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
