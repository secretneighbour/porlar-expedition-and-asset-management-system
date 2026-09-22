import React, { useState } from 'react';
import {
  Play, Pause, RotateCcw, Square, FastForward, AlertTriangle,
  Zap, Clock, Radio, Activity, Eye, ShieldAlert, ChevronDown,
  Layers, Sliders, X, CheckCircle2, ChevronRight, CornerDownRight
} from 'lucide-react';
import { SimulationScenario, SimulationTimelineEvent } from '../../types';
import { MANUAL_EVENT_TEMPLATES } from '../../data/simulationScenarios';

export interface SimulationHudProps {
  t: any;
  sim?: any;
  isActive?: boolean;
  isPaused?: boolean;
  speed?: 1 | 2 | 5 | 10 | 25;
  setSpeed?: (s: 1 | 2 | 5 | 10 | 25) => void;
  elapsedFormatted?: string;
  activeScenario?: SimulationScenario | null;
  currentPhase?: string;
  onTogglePause?: () => void;
  onReset?: () => void;
  onStop?: () => void;
  onExit?: () => void;
  onInjectEvent?: (templateType: string) => void;
  executedEvents?: SimulationTimelineEvent[];
  onOpenControlCenter?: () => void;
}

export function SimulationHud(props: SimulationHudProps) {
  const { t, sim, onOpenControlCenter } = props;
  const isActive = sim ? sim.isActive : props.isActive;
  const isPaused = sim ? sim.isPaused : props.isPaused;
  const speed = sim ? sim.speed : (props.speed || 5);
  const setSpeed = sim ? sim.setSpeed : (props.setSpeed || (() => {}));
  const elapsedFormatted = sim ? sim.elapsedFormatted : (props.elapsedFormatted || 'T+00:00');
  const activeScenario = sim ? sim.activeScenario : props.activeScenario;
  const currentPhase = sim ? sim.currentPhase : (props.currentPhase || 'Sim Active');
  const onTogglePause = sim ? sim.togglePause : (props.onTogglePause || (() => {}));
  const onReset = sim ? sim.resetScenario : (props.onReset || (() => {}));
  const onStop = sim ? () => sim.stopScenario(false) : (props.onStop || (() => {}));
  const onExit = sim ? () => sim.exitSimulation() : (props.onExit || (() => {}));
  const onInjectEvent = sim ? (type: string) => sim.injectManualEvent(type) : (props.onInjectEvent || (() => {}));
  const executedEvents = sim ? sim.executedEvents : (props.executedEvents || []);

  const [isInjectDropdownOpen, setIsInjectDropdownOpen] = useState(false);
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false);

  if (!isActive || !activeScenario) return null;

  return (
    <div className="relative z-40">
      {/* TACTICAL SIMULATION HUD TOPBAR */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(23, 15, 7, 0.95) 20%, rgba(23, 15, 7, 0.95) 80%, rgba(245, 158, 11, 0.18))',
          borderBottom: '2px solid rgba(245, 158, 11, 0.65)',
          boxShadow: '0 4px 25px rgba(245, 158, 11, 0.25)',
        }}
        className="px-6 py-2 flex items-center justify-between gap-4 flex-wrap backdrop-blur-xl"
      >
        {/* Left: Simulation Indicator & Scenario Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[11px] font-black tracking-widest uppercase shadow-sm">
              SIMULATION ACTIVE
            </span>
          </div>

          <span className="text-amber-500/40">|</span>

          <div className="font-mono text-xs">
            <span className="text-amber-200 font-bold uppercase tracking-wide">
              {activeScenario.name}
            </span>
            <span className="text-slate-400 ml-2 hidden sm:inline text-[11px]">
              [{activeScenario.code}]
            </span>
          </div>

          <span className="text-amber-500/40 hidden md:inline">|</span>

          <div className="hidden md:flex items-center gap-2 font-mono text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Phase:</span>
            <span className="text-cyan-300 font-semibold truncate max-w-[200px]">{currentPhase}</span>
          </div>
        </div>

        {/* Center: Playback Controls & Speed */}
        <div className="flex items-center gap-3">
          {/* Elapsed Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{elapsedFormatted}</span>
          </div>

          {/* Play / Pause Toggle */}
          <button
            onClick={onTogglePause}
            style={{
              background: isPaused ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              borderColor: isPaused ? '#10B981' : '#F59E0B',
              color: isPaused ? '#A7F3D0' : '#FDE68A',
            }}
            className="p-1.5 rounded-lg border hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Speed Selector (1x, 2x, 5x, 10x, 25x) */}
          <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5 font-mono text-[11px]">
            {([1, 2, 5, 10, 25] as const).map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  background: speed === s ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                  color: speed === s ? '#FDE68A' : '#94A3B8',
                }}
                className="px-2 py-0.5 rounded font-bold transition-all cursor-pointer hover:text-white"
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Reset Scenario */}
          <button
            onClick={onReset}
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
            className="p-1.5 rounded-lg border text-slate-300 hover:bg-white/10 transition-all cursor-pointer text-xs font-mono"
            title="Reset Scenario to T+00:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick Actions (Inject Event, Timeline Drawer, Exit) */}
        <div className="flex items-center gap-2">
          {/* Manual Event Injection Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsInjectDropdownOpen(!isInjectDropdownOpen)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#FDA4AF'
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold hover:bg-rose-950/40 transition-all cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Inject Event</span>
              <ChevronDown className="w-3 h-3 text-rose-300" />
            </button>

            {/* Dropdown Menu */}
            {isInjectDropdownOpen && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.96)',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.75)'
                }}
                className="absolute right-0 mt-2 w-72 rounded-xl border p-2 backdrop-blur-xl z-50 space-y-1 font-mono text-xs max-h-96 overflow-y-auto"
              >
                <div className="px-2 py-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>Tactical Inject Deck</span>
                  <span className="text-slate-400">{MANUAL_EVENT_TEMPLATES.length} Triggers</span>
                </div>
                {MANUAL_EVENT_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.type}
                    onClick={() => {
                      onInjectEvent(tmpl.type);
                      setIsInjectDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors">
                        {tmpl.name}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {tmpl.category.toUpperCase()} • {tmpl.severity.toUpperCase()}
                      </p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                      {tmpl.safetyLevel}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeline Drawer Toggle */}
          <button
            onClick={() => setIsTimelineDrawerOpen(!isTimelineDrawerOpen)}
            style={{
              background: isTimelineDrawerOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isTimelineDrawerOpen ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)',
              color: isTimelineDrawerOpen ? '#38BDF8' : '#CBD5E1'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium hover:bg-white/10 transition-all cursor-pointer"
            title="Toggle Chronological Mission Timeline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Timeline</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
              {executedEvents.length}
            </span>
          </button>

          {/* Exit Simulation Mode */}
          <button
            onClick={onExit}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              borderColor: '#EF4444',
              color: '#FEE2E2'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold hover:bg-rose-900/40 transition-all cursor-pointer shadow-sm"
            title="End Simulation and return to Live Operations"
          >
            <Square className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit Sim</span>
          </button>
        </div>
      </div>

      {/* FLY-OUT TIMELINE DRAWER */}
      {isTimelineDrawerOpen && (
        <div
          style={{
            background: 'rgba(10, 17, 40, 0.95)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85)'
          }}
          className="absolute right-6 top-14 w-96 rounded-2xl border p-4 backdrop-blur-2xl z-50 space-y-3 font-mono text-xs max-h-[75vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                Mission Execution Timeline
              </h4>
            </div>
            <button
              onClick={() => setIsTimelineDrawerOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {executedEvents.length > 0 ? (
              executedEvents.map(evt => (
                <div
                  key={evt.id}
                  style={{
                    background: evt.isManual ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.35)',
                    borderColor: evt.severity === 'emergency' || evt.severity === 'critical'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : evt.severity === 'warning'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }}
                  className="p-2.5 rounded-xl border space-y-1 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-400">{evt.timeFormatted}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      evt.safetyLevel === 'AUTONOMOUS'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : evt.safetyLevel === 'ASSIST'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {evt.safetyLevel}
                    </span>
                  </div>
                  <p className="font-bold text-white text-xs leading-snug">{evt.title}</p>
                  <p className="text-[10px] text-slate-300 leading-tight">{evt.description}</p>
                  {evt.impactSummary && (
                    <div className="pt-1 flex items-center gap-1 text-[9px] text-cyan-400">
                      <CornerDownRight className="w-3 h-3 text-cyan-500" />
                      <span>{evt.impactSummary}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-slate-500 text-xs">
                No events triggered yet. Advance simulation time or inject manual events.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
