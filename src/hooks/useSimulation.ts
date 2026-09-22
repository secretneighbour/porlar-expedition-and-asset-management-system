import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationScenario,
  SimulationTimelineEvent,
  SimulationPlaybackState,
  SimulationReport,
  PolarAsset,
  ActiveDistressAlert,
  PolarisDb,
  ConditionLevel,
  DispatchLog,
  RealtimeWeatherReading
} from '../types';
import { SIMULATION_SCENARIOS, MANUAL_EVENT_TEMPLATES, ManualEventTemplate } from '../data/simulationScenarios';
import { playTacticalChirp, playSuccessChime, startEmergencyAlarm, stopEmergencyAlarm } from '../utils/audioAlert';

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `T+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Coordinate waypoint interpolation path for Convoy PBD-Alpha
const CONVOY_WAYPOINTS = [
  { lat: -70.76, lng: 11.73, name: 'Maitri Depot Gate' },
  { lat: -71.08, lng: 12.02, name: 'Intermediate Staging Gate' },
  { lat: -71.36, lng: 12.15, name: 'Blue-Ice Ridge Bypass' },
  { lat: -71.60, lng: 12.32, name: 'Firn Dome Staging' },
  { lat: -71.78, lng: 12.58, name: 'East Sastrugi Approach' },
  { lat: -71.95, lng: 12.90, name: 'South Pole Inland Depot' }
];

export function useSimulation({
  liveDb,
  liveAssets,
  liveDistress,
  liveConditionLevel,
  soundEnabled = true
}: {
  liveDb: PolarisDb;
  liveAssets: PolarAsset[];
  liveDistress: ActiveDistressAlert | null;
  liveConditionLevel: ConditionLevel;
  soundEnabled?: boolean;
}) {
  // Playback State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 2 | 5 | 10 | 25>(5);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('Initialization');

  // Isolated Simulation State
  const [simDb, setSimDb] = useState<PolarisDb>(liveDb);
  const [simAssets, setSimAssets] = useState<PolarAsset[]>(liveAssets);
  const [simDistress, setSimDistress] = useState<ActiveDistressAlert | null>(null);
  const [simConditionLevel, setSimConditionLevel] = useState<ConditionLevel>('COND-2_CAUTION');
  const [simSyncStatus, setSimSyncStatus] = useState<'synced' | 'connecting' | 'offline'>('synced');
  const [simWeather, setSimWeather] = useState<{
    ambientTempC: number;
    windSpeedKt: number;
    windChillC: number;
    visibilityKm: number;
    barometerHpa: number;
  }>({
    ambientTempC: -35,
    windSpeedKt: 20,
    windChillC: -48,
    visibilityKm: 12.0,
    barometerHpa: 984,
  });

  // Timeline tracking
  const [executedEvents, setExecutedEvents] = useState<SimulationTimelineEvent[]>([]);
  const [simReport, setSimReport] = useState<SimulationReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Metrics counters for reporting
  const [manualInjectionsCount, setManualInjectionsCount] = useState<number>(0);
  const [interventionsCount, setInterventionsCount] = useState<number>(0);

  // Refs for timer loop
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  elapsedRef.current = elapsedSeconds;

  const speedRef = useRef<number>(speed);
  speedRef.current = speed;

  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;

  const activeScenarioRef = useRef<SimulationScenario | null>(activeScenario);
  activeScenarioRef.current = activeScenario;

  // Broadcast AI Action Event to existing AiActionLogsPanel
  const emitSimAiAction = useCallback((
    category: 'logistics' | 'power' | 'weather' | 'sar' | 'inventory' | 'maintenance',
    message: string,
    safetyLevel: 'OBSERVE' | 'ASSIST' | 'AUTONOMOUS',
    stationOrAsset?: string,
    impact?: string
  ) => {
    if (typeof window === 'undefined') return;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = {
      id: `sim-act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timeStr: `${nowTimeStr} [SIM:${safetyLevel}]`,
      category,
      prefix: `AI [${safetyLevel}]:`,
      message: `[SIMULATION] ${message}`,
      stationOrAsset: stationOrAsset || 'Polar Sim Sector',
      impact: impact || `${safetyLevel} Action`
    };
    window.dispatchEvent(new CustomEvent('polar-ai-action-event', { detail: entry }));
  }, []);

  // START SCENARIO
  const startScenario = useCallback((scenarioId: string) => {
    const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId) || SIMULATION_SCENARIOS[0];
    
    // Deep clone live states for complete isolation
    const clonedDb: PolarisDb = JSON.parse(JSON.stringify(liveDb));
    const clonedAssets: PolarAsset[] = JSON.parse(JSON.stringify(liveAssets));

    // Reset convoy asset to starting waypoint
    const updatedAssets = clonedAssets.map(a => {
      if (a.id === 'ast-pb300-1') {
        return {
          ...a,
          status: 'in_transit' as const,
          currentLocation: {
            name: CONVOY_WAYPOINTS[0].name,
            lat: CONVOY_WAYPOINTS[0].lat,
            lng: CONVOY_WAYPOINTS[0].lng,
            elevationM: 1200
          },
          telemetry: {
            ...a.telemetry,
            tempC: scenario.initialStateOverrides?.tempC || -34,
            engineHealthPercent: 94
          }
        };
      }
      return a;
    });

    // Reset events execution state
    const freshEvents: SimulationTimelineEvent[] = scenario.events.map(e => ({
      ...e,
      executed: false,
      executedAt: undefined
    }));

    setActiveScenario({
      ...scenario,
      events: freshEvents
    });

    setSimDb(clonedDb);
    setSimAssets(updatedAssets);
    setSimDistress(null);
    setSimConditionLevel(scenario.initialStateOverrides?.condition || 'COND-2_CAUTION');
    setSimSyncStatus('synced');
    setSimWeather({
      ambientTempC: scenario.initialStateOverrides?.tempC || -35,
      windSpeedKt: scenario.initialStateOverrides?.windKnots || 20,
      windChillC: (scenario.initialStateOverrides?.tempC || -35) - 14,
      visibilityKm: 12.0,
      barometerHpa: 984
    });

    setExecutedEvents([]);
    setElapsedSeconds(0);
    setCurrentPhase('Departure & Telemetry Lock');
    setIsActive(true);
    setIsPaused(false);
    setManualInjectionsCount(0);
    setInterventionsCount(0);
    setIsReportModalOpen(false);

    if (soundEnabled) playSuccessChime();

    emitSimAiAction(
      'logistics',
      `Mission Simulation Started: "${scenario.name}". Initialized isolated simulation container.`,
      'AUTONOMOUS',
      scenario.sector,
      'Simulation Container Ready'
    );
  }, [liveDb, liveAssets, soundEnabled, emitSimAiAction]);

  // PAUSE / RESUME
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const next = !prev;
      if (soundEnabled) playTacticalChirp();
      return next;
    });
  }, [soundEnabled]);

  // RESET SCENARIO
  const resetScenario = useCallback(() => {
    if (activeScenarioRef.current) {
      startScenario(activeScenarioRef.current.id);
    }
  }, [startScenario]);

  // GENERATE AFTER-ACTION REPORT
  const generateReport = useCallback((status: 'COMPLETED' | 'TERMINATED_EARLY'): SimulationReport => {
    const sc = activeScenarioRef.current || SIMULATION_SCENARIOS[0];
    const events = executedEvents;

    const observeCount = events.filter(e => e.safetyLevel === 'OBSERVE').length;
    const assistCount = events.filter(e => e.safetyLevel === 'ASSIST').length;
    const autoCount = events.filter(e => e.safetyLevel === 'AUTONOMOUS').length;

    const autoResolvedAlerts = simDb.alerts.filter(a => a.autoResolved).length;
    const sarSorties = events.filter(e => e.category === 'sar' && e.executed).length;
    const routeChanges = events.filter(e => e.category === 'route' && e.executed).length;

    const rep: SimulationReport = {
      scenarioId: sc.id,
      scenarioName: sc.name,
      durationFormatted: formatSeconds(elapsedRef.current),
      speed: speedRef.current,
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status,
      totalEventsTriggered: events.length,
      manualInjectionsCount,
      alertsGenerated: simDb.alerts.length,
      autoResolvedAlerts,
      aiActionsByLevel: {
        observe: observeCount,
        assist: assistCount,
        autonomous: autoCount
      },
      sarSortiesDispatched: sarSorties > 0 ? 2 : 0,
      routeRecalculations: routeChanges > 0 ? 1 : 0,
      downtimeSavedHours: 48,
      costSavedUsd: 18500,
      interventionsCount,
      performanceGrade: events.length >= 6 ? 'S - OPTIMAL' : 'A - PROFICIENT',
      timelineLog: events
    };

    setSimReport(rep);
    return rep;
  }, [executedEvents, simDb.alerts, manualInjectionsCount, interventionsCount]);

  // STOP / FINISH SCENARIO
  const stopScenario = useCallback((generateAar: boolean = true) => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopEmergencyAlarm();

    if (generateAar) {
      const rep = generateReport('TERMINATED_EARLY');
      setIsReportModalOpen(true);
    }
    setIsPaused(true);
  }, [generateReport]);

  // EXIT SIMULATION (Restores Live Data Completely)
  const exitSimulation = useCallback(() => {
    stopScenario(false);
    setIsActive(false);
    setIsPaused(false);
    setActiveScenario(null);
    setSimDistress(null);
    setIsReportModalOpen(false);
    if (soundEnabled) playTacticalChirp();
  }, [stopScenario, soundEnabled]);

  // MANUAL EVENT INJECTION
  const injectManualEvent = useCallback((templateType: string, customParams?: any) => {
    const tmpl = MANUAL_EVENT_TEMPLATES.find(t => t.type === templateType);
    if (!tmpl) return;

    const currentSec = elapsedRef.current;
    const newEvent: SimulationTimelineEvent = {
      id: `SIM-MAN-${Date.now()}`,
      second: currentSec,
      timeFormatted: formatSeconds(currentSec),
      title: customParams?.title || tmpl.defaultTitle,
      description: customParams?.description || tmpl.defaultDescription,
      category: tmpl.category,
      severity: tmpl.severity,
      safetyLevel: tmpl.safetyLevel,
      executed: true,
      executedAt: formatSeconds(currentSec),
      isManual: true,
      impactSummary: 'Manual Operator Drill Injection'
    };

    setExecutedEvents(prev => [newEvent, ...prev]);
    setManualInjectionsCount(c => c + 1);

    // Apply immediate state effects according to event type
    switch (templateType) {
      case 'INJECT_BLIZZARD':
        setSimConditionLevel('COND-1_SEVERE_BLIZZARD');
        setSimWeather(prev => ({
          ...prev,
          ambientTempC: prev.ambientTempC - 15,
          windSpeedKt: 58,
          windChillC: prev.ambientTempC - 28,
          visibilityKm: 0.1
        }));
        setSimDb(d => ({
          ...d,
          alerts: [
            {
              id: `ALT-SIM-${Date.now()}`,
              type: 'Severe Katabatic Blizzard Injected',
              severity: 'CRITICAL',
              time: 'Just now',
              description: 'Injected Blizzard: Ambient winds 58 kt, -65°C wind chill. Ground traverse suspended.',
              relatedId: 'Weather-Ops',
              read: false
            },
            ...d.alerts
          ]
        }));
        break;

      case 'INJECT_VEHICLE_FAILURE':
        setSimAssets(prev => prev.map(a => {
          if (a.id === 'ast-pb300-1') {
            return {
              ...a,
              status: 'maintenance',
              telemetry: {
                ...a.telemetry,
                tempC: -58,
                engineHealthPercent: 42
              }
            };
          }
          return a;
        }));
        setSimDb(d => ({
          ...d,
          alerts: [
            {
              id: `ALT-SIM-${Date.now()}`,
              type: 'Mechanical Belt Shear Fault',
              severity: 'CRITICAL',
              time: 'Just now',
              description: 'Lead Crawler AST-PB300-1 alternator belt fractured under cold shock. Engine shutdown.',
              relatedId: 'ast-pb300-1',
              read: false
            },
            ...d.alerts
          ]
        }));
        break;

      case 'INJECT_COMMS_LOSS':
        setSimSyncStatus('offline');
        break;

      case 'INJECT_MAYDAY':
        const maydayAlert: ActiveDistressAlert = {
          id: `distress-sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          incidentType: 'Crevasse Fall / Slot Void Collapse (SIMULATED)',
          location: 'Leverett Glacier Approach (-85.25°, 151.10°)',
          coordinates: '-85.25, 151.10',
          summary: 'SIMULATED MAYDAY: Snowcat lead track broken through 25m slot void. 4 souls in emergency bivouac.',
          reporterCallsign: 'EXP-701 FIELD MOBILE',
          reportedByDevice: 'Mobile Phone Field Unit',
          targetLat: -85.25,
          targetLng: 151.10,
          active: true,
          acknowledgedByHQ: false,
          autonomousSAR: {
            nearestBaseName: 'Amundsen-Scott South Pole Station',
            nearestBaseDistanceKm: 530.1,
            nearestBaseCoords: '-89.980, 0.000',
            weatherSummary: '-54°C | Wind: 20 kt | Vis: 9.8 km (Thermal Drone Corridor Open)',
            tempC: -54,
            windSpeedKt: 20,
            visibilityKm: 9.8,
            weatherFlyable: true,
            dispatchedAssetType: 'dual_sortie',
            dispatchedDroneName: 'Autonomous S.A.R. Drone Falcon-X (Long-Range Thermal)',
            dispatchedGroundTeamName: 'P300 Polar Track Rapid Crevasse Rescue Team',
            droneEtaMinutes: 219,
            groundEtaMinutes: 1223,
            dispatchTimestamp: new Date().toISOString(),
            executionTimeMs: 381,
            autonomousDecisionReasoning: 'SIMULATED MAYDAY S.A.R. DISPATCH: Coordinates (-85.25, 151.10) locked. Drone Falcon-X & P300 Scrambled automatically.',
            zeroClickExecuted: true
          }
        };
        setSimDistress(maydayAlert);
        if (soundEnabled) startEmergencyAlarm();
        break;

      case 'INJECT_EXTREME_TEMP':
        setSimWeather(prev => ({
          ...prev,
          ambientTempC: -65,
          windChillC: -82
        }));
        break;

      case 'INJECT_FUEL_CRISIS':
        setSimDb(d => ({
          ...d,
          inventory: d.inventory.map(i => {
            if (i.name.toLowerCase().includes('diesel') || i.name.toLowerCase().includes('fuel')) {
              return { ...i, currentStock: Math.max(1200, i.currentStock - 4500) };
            }
            return i;
          }),
          alerts: [
            {
              id: `ALT-SIM-${Date.now()}`,
              type: 'Critical Fuel Reserve Depletion',
              severity: 'CRITICAL',
              time: 'Just now',
              description: 'Fuel buffer depleted by 4,500L. Projected days of supply drops below safe survival limit.',
              relatedId: 'Fuel-Tank-Alpha',
              read: false
            },
            ...d.alerts
          ]
        }));
        break;

      default:
        break;
    }

    emitSimAiAction(
      tmpl.category,
      `Manual Event Injected by Operator: "${newEvent.title}". Telemetry updated in real time.`,
      tmpl.safetyLevel,
      'Simulation Console',
      newEvent.impactSummary
    );

    if (soundEnabled) playTacticalChirp();
  }, [emitSimAiAction, soundEnabled]);

  // EXECUTE SIMULATED TIMELINE EVENT
  const executeEvent = useCallback((event: SimulationTimelineEvent) => {
    // 1. Mark event as executed
    setExecutedEvents(prev => [
      {
        ...event,
        executed: true,
        executedAt: formatSeconds(elapsedRef.current)
      },
      ...prev
    ]);

    // 2. Apply scenario-specific physics and state changes
    if (event.category === 'weather') {
      setSimWeather(prev => ({
        ...prev,
        ambientTempC: prev.ambientTempC - 8,
        windSpeedKt: Math.min(65, prev.windSpeedKt + 14),
        windChillC: prev.ambientTempC - 22,
        visibilityKm: Math.max(0.2, prev.visibilityKm - 4.5)
      }));
      if (event.severity === 'critical') {
        setSimConditionLevel('COND-1_SEVERE_BLIZZARD');
      }
    } else if (event.category === 'mechanical') {
      setSimAssets(prev => prev.map(a => {
        if (a.id === 'ast-pb300-1') {
          return {
            ...a,
            telemetry: {
              ...a.telemetry,
              tempC: -48,
              engineHealthPercent: Math.max(50, a.telemetry.engineHealthPercent - 15)
            }
          };
        }
        return a;
      }));
    } else if (event.category === 'sar') {
      const maydayAlert: ActiveDistressAlert = {
        id: `distress-sim-${Date.now()}`,
        timestamp: new Date().toISOString(),
        incidentType: 'Crevasse Fall / Slot Void Collapse (SIMULATED)',
        location: 'Leverett Glacier Approach (-85.25°, 151.10°)',
        coordinates: '-85.25, 151.10',
        summary: 'Snowcat lead track broken through 25m slot void. 4 souls in emergency bivouac.',
        reporterCallsign: 'EXP-701 FIELD MOBILE',
        reportedByDevice: 'Mobile Phone Field Unit',
        targetLat: -85.25,
        targetLng: 151.10,
        active: true,
        acknowledgedByHQ: true,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: 'POLAR AI ZERO-CLICK S.A.R. ENGINE',
        dispatchedSARAssetId: 'ast-sar-drone-falcon',
        dispatchedSARName: 'Drone Falcon-X & P300 Crevasse Team',
        autonomousSAR: {
          nearestBaseName: 'Amundsen-Scott South Pole Station',
          nearestBaseDistanceKm: 530.1,
          nearestBaseCoords: '-89.980, 0.000',
          weatherSummary: '-54°C | Wind: 20 kt | Vis: 9.8 km (Thermal Drone Corridor Open)',
          tempC: -54,
          windSpeedKt: 20,
          visibilityKm: 9.8,
          weatherFlyable: true,
          dispatchedAssetType: 'dual_sortie',
          dispatchedDroneName: 'Autonomous S.A.R. Drone Falcon-X (Long-Range Thermal)',
          dispatchedGroundTeamName: 'P300 Polar Track Rapid Crevasse Rescue Team',
          droneEtaMinutes: 219,
          groundEtaMinutes: 1223,
          dispatchTimestamp: new Date().toISOString(),
          executionTimeMs: 381,
          autonomousDecisionReasoning: 'AUTONOMOUS S.A.R. DISPATCH: Leverett Glacier breach detected. Scrambled FLIR Drone and Winch Rescue Team.',
          zeroClickExecuted: true
        }
      };
      setSimDistress(maydayAlert);
      if (soundEnabled) startEmergencyAlarm();
    } else if (event.category === 'comms') {
      setSimSyncStatus(event.severity === 'critical' || event.severity === 'warning' ? 'offline' : 'synced');
    }

    // 3. Create simulated alert entry
    if (event.severity === 'warning' || event.severity === 'critical' || event.severity === 'emergency') {
      setSimDb(d => ({
        ...d,
        alerts: [
          {
            id: `ALT-SIM-${Date.now()}`,
            type: event.title,
            severity: event.severity === 'emergency' ? 'CRITICAL' : (event.severity.toUpperCase() as any),
            time: 'T+' + Math.floor(elapsedRef.current / 60) + 'm',
            description: event.description,
            relatedId: event.targetAssetId || 'Sim-Sector',
            read: false
          },
          ...d.alerts
        ],
        auditLog: [
          {
            id: `AUD-SIM-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            user: 'Polar Simulation Engine',
            action: `SIM_EVENT_${event.category.toUpperCase()}`,
            entity: event.targetAssetId || 'Simulation State',
            details: `[${event.timeFormatted}] ${event.title}: ${event.description}`
          },
          ...d.auditLog
        ]
      }));
    }

    // 4. Broadcast AI Action Log entry with safety level
    emitSimAiAction(
      event.category,
      `${event.title}: ${event.description}`,
      event.safetyLevel,
      event.targetAssetId || 'Convoy Traverse',
      event.impactSummary || event.safetyLevel
    );

    setCurrentPhase(event.title);
  }, [emitSimAiAction, soundEnabled]);

  // MAIN TICKER LOOP
  useEffect(() => {
    if (!isActive || isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const TICK_INTERVAL_MS = 500;

    timerRef.current = window.setInterval(() => {
      const stepSeconds = (TICK_INTERVAL_MS / 1000) * speedRef.current;
      const newElapsed = elapsedRef.current + stepSeconds;
      setElapsedSeconds(newElapsed);

      const scenario = activeScenarioRef.current;
      if (!scenario) return;

      // 1. Move Convoy PBD-Alpha smoothly along waypoint corridor
      const totalDuration = scenario.estimatedDurationSeconds || 2400;
      const progressFraction = Math.min(1, newElapsed / totalDuration);
      const waypointIndex = Math.min(
        CONVOY_WAYPOINTS.length - 2,
        Math.floor(progressFraction * (CONVOY_WAYPOINTS.length - 1))
      );
      const nextIndex = waypointIndex + 1;
      const segmentFraction = (progressFraction * (CONVOY_WAYPOINTS.length - 1)) - waypointIndex;

      const currentWp = CONVOY_WAYPOINTS[waypointIndex];
      const nextWp = CONVOY_WAYPOINTS[nextIndex];

      const interpolatedLat = currentWp.lat + (nextWp.lat - currentWp.lat) * segmentFraction;
      const interpolatedLng = currentWp.lng + (nextWp.lng - currentWp.lng) * segmentFraction;

      setSimAssets(prev => prev.map(a => {
        if (a.id === 'ast-pb300-1') {
          return {
            ...a,
            currentLocation: {
              ...a.currentLocation,
              name: `En Route to ${nextWp.name}`,
              lat: Number(interpolatedLat.toFixed(4)),
              lng: Number(interpolatedLng.toFixed(4))
            }
          };
        }
        return a;
      }));

      // Update simDb.expeditions with convoy coordinates, breadcrumbs, and waypoint progress
      setSimDb(prevDb => {
        const nextExpeditions = (prevDb.expeditions || []).map((exp: any, i: number) => {
          if (i === 0 || exp.id === 'EXP-0001') {
            const prevTrack = exp.actualTrack || [];
            const lastPt = prevTrack[prevTrack.length - 1];
            const shouldAddTrack = !lastPt || 
              Math.abs(lastPt.lat - interpolatedLat) > 0.005 || 
              Math.abs(lastPt.lng - interpolatedLng) > 0.005;

            const updatedTrack = shouldAddTrack
              ? [...prevTrack, { lat: Number(interpolatedLat.toFixed(4)), lng: Number(interpolatedLng.toFixed(4)), timestamp: new Date().toISOString() }]
              : prevTrack;

            const updatedWps = (exp.waypoints || []).map((w: any, wIdx: number) => {
              if (wIdx <= waypointIndex) {
                return { ...w, passed: true, status: 'completed' as const };
              } else if (wIdx === nextIndex) {
                return { ...w, passed: false, status: 'current' as const };
              } else {
                return { ...w, passed: false, status: 'pending' as const };
              }
            });

            return {
              ...exp,
              currentLat: Number(interpolatedLat.toFixed(4)),
              currentLng: Number(interpolatedLng.toFixed(4)),
              actualTrack: updatedTrack,
              waypoints: updatedWps.length > 0 ? updatedWps : exp.waypoints,
            };
          }
          return exp;
        });

        return {
          ...prevDb,
          expeditions: nextExpeditions,
        };
      });

      // 2. Check and trigger scheduled timeline events
      scenario.events.forEach(evt => {
        if (evt.second <= newElapsed && !evt.executed) {
          evt.executed = true;
          executeEvent(evt);
        }
      });

      // 3. Scenario completion check
      if (newElapsed >= totalDuration) {
        stopScenario(true);
        setCurrentPhase('Scenario Complete');
      }
    }, TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isPaused, executeEvent, stopScenario]);

  // Interventions recorder for simulated actions
  const recordIntervention = useCallback(() => {
    setInterventionsCount(c => c + 1);
  }, []);

  return {
    // Playback state
    isActive,
    isPaused,
    speed,
    setSpeed,
    elapsedSeconds,
    elapsedFormatted: formatSeconds(elapsedSeconds),
    activeScenario,
    currentPhase,
    togglePause,
    startScenario,
    resetScenario,
    stopScenario,
    exitSimulation,

    // Simulated States (pass into views when isActive === true)
    simDb,
    setSimDb,
    simAssets,
    setSimAssets,
    simDistress,
    setSimDistress,
    simConditionLevel,
    setSimConditionLevel,
    simSyncStatus,
    simWeather,

    // Events & Reporting
    executedEvents,
    injectManualEvent,
    recordIntervention,
    simReport,
    isReportModalOpen,
    setIsReportModalOpen
  };
}
