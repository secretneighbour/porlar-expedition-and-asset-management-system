import React, { useState } from 'react';
import {
  Play, Pause, RotateCcw, Square, FastForward, AlertTriangle,
  Zap, Clock, Radio, Activity, Eye, ShieldAlert, ChevronDown,
  Layers, Sliders, X, CheckCircle2, ChevronRight, CornerDownRight,
  Flame, CloudSnow, Wrench, Compass, Fuel, Navigation, ThermometerSnowflake,
  ShieldCheck, FileText, ArrowRight, Award, Target, HelpCircle
} from 'lucide-react';
import { SimulationScenario, SimulationTimelineEvent } from '../../types';
import { SIMULATION_SCENARIOS, MANUAL_EVENT_TEMPLATES, ManualEventTemplate } from '../../data/simulationScenarios';
import { PageHeader, Badge, Modal } from './SharedUI';

export interface SimulationControlCenterProps {
  t: any;
  sim?: any;
  db?: any;
  setDb?: any;
  isActive?: boolean;
  isPaused?: boolean;
  speed?: 1 | 2 | 5 | 10 | 25;
  setSpeed?: (s: 1 | 2 | 5 | 10 | 25) => void;
  elapsedFormatted?: string;
  activeScenario?: SimulationScenario | null;
  currentPhase?: string;
  onStartScenario?: (scenarioId: string) => void;
  onTogglePause?: () => void;
  onReset?: () => void;
  onStop?: () => void;
  onExit?: () => void;
  onInjectEvent?: (templateType: string) => void;
  executedEvents?: SimulationTimelineEvent[];
  simWeather?: {
    ambientTempC: number;
    windSpeedKt: number;
    windChillC: number;
    visibilityKm: number;
    barometerHpa: number;
  };
  onNavigateToView?: (view: string) => void;
  onNavigateToMap?: () => void;
}

export function SimulationControlCenter(props: SimulationControlCenterProps) {
  const { t, sim, onNavigateToMap, onNavigateToView } = props;
  const isActive = sim ? sim.isActive : (props.isActive || false);
  const isPaused = sim ? sim.isPaused : (props.isPaused || false);
  const speed = sim ? sim.speed : (props.speed || 5);
  const setSpeed = sim ? sim.setSpeed : (props.setSpeed || (() => {}));
  const elapsedFormatted = sim ? sim.elapsedFormatted : (props.elapsedFormatted || 'T+00:00');
  const activeScenario = sim ? sim.activeScenario : props.activeScenario;
  const currentPhase = sim ? sim.currentPhase : (props.currentPhase || 'Standby');
  const onStartScenario = sim ? (scId: string) => sim.startScenario(scId) : (props.onStartScenario || (() => {}));
  const onTogglePause = sim ? sim.togglePause : (props.onTogglePause || (() => {}));
  const onReset = sim ? sim.resetScenario : (props.onReset || (() => {}));
  const onStop = sim ? () => sim.stopScenario(false) : (props.onStop || (() => {}));
  const onExit = sim ? () => sim.exitSimulation() : (props.onExit || (() => {}));
  const onInjectEvent = sim ? (type: string) => sim.injectManualEvent(type) : (props.onInjectEvent || (() => {}));
  const executedEvents = sim ? sim.executedEvents : (props.executedEvents || []);
  const simWeather = sim ? sim.simWeather : (props.simWeather || {
    ambientTempC: -35,
    windSpeedKt: 20,
    windChillC: -48,
    visibilityKm: 12.0,
    barometerHpa: 984,
  });

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    activeScenario?.id || SIMULATION_SCENARIOS[0].id
  );
  const [inspectEvent, setInspectEvent] = useState<SimulationTimelineEvent | null>(null);

  const selectedScenario = SIMULATION_SCENARIOS.find(s => s.id === selectedScenarioId) || SIMULATION_SCENARIOS[0];

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudSnow': return <CloudSnow className="w-4 h-4 text-cyan-400" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'Radio': return <Radio className="w-4 h-4 text-rose-400" />;
      case 'Compass': return <Compass className="w-4 h-4 text-sky-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />;
      case 'Fuel': return <Fuel className="w-4 h-4 text-amber-400" />;
      case 'AlertTriangle': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'ThermometerSnowflake': return <ThermometerSnowflake className="w-4 h-4 text-cyan-300" />;
      case 'Flame': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'Navigation': return <Navigation className="w-4 h-4 text-sky-400" />;
      default: return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        t={t}
        title="Mission Simulation & Operational Training Center"
        subtitle="Tactical Training Deck: Rehearse hazardous polar scenarios, evaluate autonomous AI decisions, and execute manual event injections in an isolated sandbox."
        action={
          isActive ? (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-pulse">
                SIMULATION ACTIVE: {elapsedFormatted}
              </span>
              <button
                onClick={onExit}
                style={{ background: 'rgba(239, 68, 68, 0.25)', borderColor: '#EF4444', color: '#FEE2E2' }}
                className="px-4 py-2 rounded-xl border text-xs font-mono font-bold hover:bg-rose-900/40 transition-all cursor-pointer shadow-md"
              >
                <span>Exit Simulation</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onStartScenario(selectedScenario.id)}
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.35)',
                color: '#000000'
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all hover:opacity-95 cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Training Scenario</span>
            </button>
          )
        }
      />

      {/* LIVE SIMULATED METRICS GAUGES (WHEN ACTIVE) */}
      {isActive && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-3.5 rounded-xl border backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase">Sim Ambient Temp</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 block">{simWeather.ambientTempC}°C</span>
            <span className="text-[10px] text-slate-500">Wind Chill: {simWeather.windChillC}°C</span>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-3.5 rounded-xl border backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase">Sim Katabatic Gale</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{simWeather.windSpeedKt} kt</span>
            <span className="text-[10px] text-slate-500">Visibility: {simWeather.visibilityKm.toFixed(1)} km</span>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-3.5 rounded-xl border backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase">Convoy Vibration</span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">4.6 mm/s</span>
            <span className="text-[10px] text-rose-400/80">3rd Harmonic Anomaly</span>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-3.5 rounded-xl border backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase">Fuel Depletion Rate</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">1,450 L/d</span>
            <span className="text-[10px] text-amber-400">+190% Blizzard Surge</span>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-3.5 rounded-xl border backdrop-blur-md">
            <span className="text-slate-400 block text-[10px] uppercase">Events Triggered</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{executedEvents.length}</span>
            <span className="text-[10px] text-cyan-400">Phase: {currentPhase.slice(0, 16)}</span>
          </div>
        </div>
      )}

      {/* SCENARIO SELECTION CAROUSEL / GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm font-mono text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" /> Pre-Built Training Scenarios
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Select a scenario to inspect briefing &amp; objectives
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SIMULATION_SCENARIOS.map(sc => {
            const isSelected = selectedScenario.id === sc.id;
            const isRunningThis = isActive && activeScenario?.id === sc.id;

            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                style={{
                  background: isRunningThis
                    ? 'rgba(245, 158, 11, 0.12)'
                    : isSelected
                    ? 'rgba(56, 189, 248, 0.12)'
                    : t.cardBg,
                  borderColor: isRunningThis
                    ? '#F59E0B'
                    : isSelected
                    ? '#38BDF8'
                    : t.cardBorder,
                  boxShadow: isSelected ? t.cardShadow : 'none'
                }}
                className="p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between space-y-3 cursor-pointer hover:border-amber-400/60 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-amber-400 font-bold">SCENARIO 0{sc.scenarioNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      sc.difficulty === 'BLACKOUT' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                      sc.difficulty === 'SEVERE' ? 'bg-rose-950 text-rose-300 border border-rose-500/30' :
                      'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {sc.difficulty}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs font-mono mt-1 group-hover:text-amber-300 transition-colors">
                    {sc.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {sc.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {Math.round(sc.estimatedDurationSeconds / 60)} mins
                  </span>
                  <span className="text-cyan-400 font-semibold">{sc.events.length} Events</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED SCENARIO MISSION BRIEFING CARD */}
      <div
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
        className="p-6 rounded-2xl border backdrop-blur-md space-y-4"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 text-amber-300 font-mono text-[10px] font-bold">
                SCENARIO BRIEFING: {selectedScenario.code}
              </span>
              <span className="text-slate-400 text-xs font-mono">• Sector: {selectedScenario.sector}</span>
            </div>
            <h2 className="text-lg font-bold font-mono text-white mt-1">
              {selectedScenario.name}
            </h2>
            <p className="text-xs text-slate-300 max-w-4xl mt-1">
              {selectedScenario.description}
            </p>
          </div>

          {!isActive && (
            <button
              onClick={() => onStartScenario(selectedScenario.id)}
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#000000'
              }}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all hover:opacity-95 cursor-pointer shadow-lg flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start {selectedScenario.name}</span>
            </button>
          )}
        </div>

        {/* Objectives & Expected Failure Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Primary Training Objectives
            </span>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              {selectedScenario.primaryObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> Potential Failure Hazards Under Test
            </span>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              {selectedScenario.expectedFailureModes.map((fm, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{fm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: CHRONOLOGICAL TIMELINE (LEFT) & MANUAL EVENT INJECT DECK (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chronological Timeline Visualizer */}
        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-5 rounded-2xl border backdrop-blur-md lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm font-mono text-white uppercase tracking-wider">
                Scenario Timeline &amp; Autonomous Event Sequence
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {isActive ? `Running: ${elapsedFormatted}` : 'Standby'}
            </span>
          </div>

          {/* Timeline Cards */}
          <div className="space-y-2.5 font-mono text-xs max-h-[520px] overflow-y-auto pr-1">
            {selectedScenario.events.map((evt, idx) => {
              const isExecuted = executedEvents.some(e => e.id === evt.id) || (isActive && evt.executed);

              return (
                <div
                  key={evt.id}
                  onClick={() => setInspectEvent(evt)}
                  style={{
                    background: isExecuted
                      ? 'rgba(0, 242, 254, 0.08)'
                      : 'rgba(0, 0, 0, 0.35)',
                    borderColor: isExecuted
                      ? 'rgba(0, 242, 254, 0.35)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }}
                  className="p-3.5 rounded-xl border flex items-start justify-between gap-3 hover:border-amber-400/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-amber-400">{evt.timeFormatted}</span>
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${isExecuted ? 'bg-cyan-400 shadow-sm' : 'bg-slate-600'}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                          {evt.title}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          evt.safetyLevel === 'AUTONOMOUS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : evt.safetyLevel === 'ASSIST'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {evt.safetyLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">{evt.description}</p>
                      {evt.impactSummary && (
                        <p className="text-[10px] text-cyan-400 mt-0.5 flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3 text-cyan-500" />
                          <span>{evt.impactSummary}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                    isExecuted
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    {isExecuted ? 'TRIGGERED' : 'PENDING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Manual Event Injection Deck */}
        <div
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          className="p-5 rounded-2xl border backdrop-blur-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm font-mono text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-400" /> Manual Event Injection Deck
            </h3>
            <span className="text-[10px] font-mono text-slate-400">11 Tactical Triggers</span>
          </div>

          <p className="text-slate-300 text-xs font-mono">
            Inject immediate operational anomalies into the active simulation to evaluate system resilience and automated response chains.
          </p>

          <div className="space-y-2 font-mono text-xs">
            {MANUAL_EVENT_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.type}
                onClick={() => onInjectEvent(tmpl.type)}
                disabled={!isActive}
                style={{
                  background: isActive ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.2)',
                  borderColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  opacity: isActive ? 1 : 0.6
                }}
                className="w-full p-2.5 rounded-xl border flex items-center justify-between text-left hover:border-amber-400/60 hover:bg-white/5 transition-all cursor-pointer disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                    {getTemplateIcon(tmpl.icon)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors">
                      {tmpl.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {tmpl.category.toUpperCase()} • {tmpl.severity.toUpperCase()}
                    </p>
                  </div>
                </div>

                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-bold">
                  {tmpl.safetyLevel}
                </span>
              </button>
            ))}
          </div>

          {!isActive && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] font-mono text-amber-300">
              Launch a scenario first to enable real-time manual event injection into the active sandbox.
            </div>
          )}

          {/* Quick Links to Observe Downstream Systems */}
          <div className="pt-2 border-t border-white/10 space-y-2 font-mono text-xs">
            <span className="text-[10px] text-slate-400 block uppercase">Inspect Downstream Response Systems</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => onNavigateToView && onNavigateToView('map')}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-cyan-300 text-left flex items-center justify-between cursor-pointer"
              >
                <span>Polar GIS Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigateToView && onNavigateToView('predictive-maintenance')}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-amber-300 text-left flex items-center justify-between cursor-pointer"
              >
                <span>Maintenance</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigateToView && onNavigateToView('sar')}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-rose-300 text-left flex items-center justify-between cursor-pointer"
              >
                <span>S.A.R. Console</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigateToView && onNavigateToView('ai-action-logs')}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-emerald-300 text-left flex items-center justify-between cursor-pointer"
              >
                <span>AI Action Stream</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EVENT INSPECTION MODAL */}
      {inspectEvent && (
        <Modal
          t={t}
          title={`Simulation Event Inspector: ${inspectEvent.title}`}
          onClose={() => setInspectEvent(null)}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Time:</span>
                <span className="text-amber-400 font-bold">{inspectEvent.timeFormatted} (T+{inspectEvent.second}s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Domain Category:</span>
                <span className="text-cyan-400 uppercase font-bold">{inspectEvent.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity Level:</span>
                <span className="text-rose-400 uppercase font-bold">{inspectEvent.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Safety Directive:</span>
                <span className="text-emerald-400 font-bold">{inspectEvent.safetyLevel}</span>
              </div>
              {inspectEvent.targetAssetId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Impacted Asset:</span>
                  <span className="text-white font-bold">{inspectEvent.targetAssetId}</span>
                </div>
              )}
              {inspectEvent.coordinates && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Incident Coordinates:</span>
                  <span className="text-cyan-300">{inspectEvent.coordinates.lat.toFixed(4)}°, {inspectEvent.coordinates.lng.toFixed(4)}°</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">Detailed Technical Narrative</span>
              <p className="text-slate-200">{inspectEvent.description}</p>
            </div>

            {inspectEvent.impactSummary && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-[11px]">
                <strong className="block text-cyan-200">Simulated Cascade Impact:</strong>
                {inspectEvent.impactSummary}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
