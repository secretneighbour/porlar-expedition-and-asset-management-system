import React, { useState, useEffect } from 'react';
import {
  THEME, PERMISSIONS, INITIAL_EXPEDITIONS, INITIAL_PERSONNEL, INITIAL_ASSETS,
  INITIAL_INVENTORY, INITIAL_SHIPMENTS, INITIAL_TRANSPORTATION, INITIAL_MAINTENANCE,
  INITIAL_TASKS, buildAlerts, INITIAL_EXPENSES, INITIAL_USERS, INITIAL_AUDIT_LOG,
  ROLES, FIRST, LAST, pick, STATIONS
} from './data/polarisData';
import { INITIAL_STATIONS, INITIAL_DISPATCH_LOGS, INITIAL_EXPEDITIONS as POLAR_EXPEDITIONS } from './data/polarData';
import { Sidebar, Topbar } from './components/polaris/Shell';
import { PolarLoginView } from './components/PolarLoginView';
import { DashboardView } from './components/polaris/DashboardView';
import { Expeditions, ExpeditionDetail } from './components/polaris/ExpeditionsView';
import { Personnel, Assets, Inventory, Shipments, Transportation, Maintenance, Tasks } from './components/polaris/Modules';
const Alerts = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.Alerts })));
import { StationsView } from './components/polaris/StationsView';
import { AiActionLogsPanel } from './components/polaris/AiActionLogsPanel';
import { ActiveDistressBanner } from './components/ActiveDistressBanner';
import { Footer } from './components/Footer';
import { PreBootSystemCheck } from './components/polaris/PreBootSystemCheck';
import { useSimulation } from './hooks/useSimulation';
import { apiFetch } from './utils/api';
import { SimulationHud } from './components/polaris/SimulationHud';
import { SimulationControlCenter } from './components/polaris/SimulationControlCenter';
import { TacticalLoadingFallback } from './components/TacticalLoadingFallback';

// Phase 3 Performance Hardening: Code-split heavy subsystems & dialogs
const MapView = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.MapView })));
const Expenses = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.Expenses })));
const Reports = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.Reports })));
const AuditLog = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.AuditLog })));
const UsersPage = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.UsersPage })));
const SettingsPage = React.lazy(() => import('./components/polaris/ViewsPart2').then(m => ({ default: m.SettingsPage })));
const EnvironmentalTelemetry = React.lazy(() => import('./components/EnvironmentalTelemetry').then(m => ({ default: m.EnvironmentalTelemetry })));
const WaypointPlannerPage = React.lazy(() => import('./components/WaypointPlannerPage').then(m => ({ default: m.WaypointPlannerPage })));
const SmartRouteOptimizer = React.lazy(() => import('./components/polaris/SmartRouteOptimizer').then(m => ({ default: m.SmartRouteOptimizer })));
const PredictiveMaintenance = React.lazy(() => import('./components/polaris/PredictiveMaintenance').then(m => ({ default: m.PredictiveMaintenance })));
const DynamicWeatherInventory = React.lazy(() => import('./components/polaris/DynamicWeatherInventory').then(m => ({ default: m.DynamicWeatherInventory })));
const SarConsoleView = React.lazy(() => import('./components/polaris/SarConsoleView').then(m => ({ default: m.SarConsoleView })));
const DispatchLogbook = React.lazy(() => import('./components/DispatchLogbook').then(m => ({ default: m.DispatchLogbook })));
const DevicePairingModal = React.lazy(() => import('./components/DevicePairingModal').then(m => ({ default: m.DevicePairingModal })));
const EmergencyModal = React.lazy(() => import('./components/EmergencyModal').then(m => ({ default: m.EmergencyModal })));
const ApiKeyModal = React.lazy(() => import('./components/ApiKeyModal').then(m => ({ default: m.ApiKeyModal })));
const SimulationReportModal = React.lazy(() => import('./components/polaris/SimulationReportModal').then(m => ({ default: m.SimulationReportModal })));
import { usePolarSync } from './hooks/usePolarSync';
import { useGeolocation } from './hooks/useGeolocation';
import { useRealtimeWeather } from './hooks/useRealtimeWeather';
import { playTacticalChirp, playSuccessChime, startEmergencyAlarm, stopEmergencyAlarm, setSoundEffectsEnabled } from './utils/audioAlert';
import { ShieldAlert, Radio, Key, Wifi, WifiOff, Bot, Sparkles, Terminal, QrCode, Target, ChevronDown } from 'lucide-react';

export default function App() {
  // Theme: 'cyan' (Polar default) | 'green' (Phosphor) | 'amber' (CRT) | 'light' (Daylight)
  const [theme, setTheme] = useState<'cyan' | 'green' | 'amber' | 'light'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('polar_tactical_theme');
      if (saved && (saved === 'cyan' || saved === 'green' || saved === 'amber' || saved === 'light')) {
        return saved as any;
      }
    }
    return 'cyan';
  });

  const [crtEnabled, setCrtEnabled] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('polar_crt_scanlines') === 'true';
    }
    return false;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('polar_sound_enabled') !== 'false';
    }
    return true;
  });

  const [selectedStation, setSelectedStation] = useState<string>('Maitri');

  const handleSetTheme = (newTheme: 'cyan' | 'green' | 'amber' | 'light') => {
    setTheme(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('polar_tactical_theme', newTheme);
    }
    if (soundEnabled) playTacticalChirp();
  };

  const handleToggleCrt = () => {
    setCrtEnabled(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('polar_crt_scanlines', String(next));
      }
      return next;
    });
    if (soundEnabled) playTacticalChirp();
  };

  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      setSoundEffectsEnabled(next);
      if (next) playTacticalChirp();
      return next;
    });
  };

  const t = THEME[theme] || THEME.cyan;

  const [user, setUser] = useState<{ name: string; role: string; id?: string; email?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const remembered = localStorage.getItem('polar_auth_user') || sessionStorage.getItem('polar_auth_user');
        if (remembered) {
          return JSON.parse(remembered);
        }
      } catch {}
    }
    return null;
  });

  const [hasCompletedPreBoot, setHasCompletedPreBoot] = useState(false);
  const [isPreBootModalOpen, setIsPreBootModalOpen] = useState(false);
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expDetailId, setExpDetailId] = useState<string | null>(null);

  // Modals & Emergency State
  const [isDistressModalOpen, setIsDistressModalOpen] = useState(false);
  const [isDistressMarkedSafe, setIsDistressMarkedSafe] = useState(false);
  const [isDispatchingMayday, setIsDispatchingMayday] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // API Keys state
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('POLAR_GMAPS_KEY') || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || ''
      : (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('POLAR_GEMINI_KEY') || (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
      : (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  const handleSaveKeys = (gmapsKey: string, geminiKey: string) => {
    setGoogleMapsApiKey(gmapsKey);
    setGeminiApiKey(geminiKey);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('POLAR_GMAPS_KEY', gmapsKey);
      localStorage.setItem('POLAR_GEMINI_KEY', geminiKey);
    }
    if (soundEnabled) playSuccessChime();
  };

  const handleLoginSuccess = (authUser: any, targetRoute: string, remember: boolean) => {
    setUser({
      name: authUser.name,
      role: authUser.role,
      id: authUser.id,
      email: authUser.email,
    });
    setHasCompletedPreBoot(false);
    if (targetRoute) {
      setActive(targetRoute);
    }
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('polar_auth_user', JSON.stringify({
        name: authUser.name,
        role: authUser.role,
        id: authUser.id,
        email: authUser.email,
      }));
    } catch (err) {
      console.warn('Unable to persist session storage:', err);
    }
    if (soundEnabled) playSuccessChime();
  };

  const handleLogout = () => {
    setUser(null);
    setHasCompletedPreBoot(false);
    try {
      localStorage.removeItem('polar_auth_user');
      sessionStorage.removeItem('polar_auth_user');
      localStorage.removeItem('polar_auth_token');
      sessionStorage.removeItem('polar_auth_token');
    } catch {}
    apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  // Real-time Geolocation Hook
  const geo = useGeolocation(true);

  // Real-time Polar Weather Engine Hook
  const weather = useRealtimeWeather({
    stations: INITIAL_STATIONS,
    expeditions: POLAR_EXPEDITIONS,
    userLat: geo.latitude,
    userLng: geo.longitude,
    region: 'antarctica',
  });

  const sensorHealth = React.useMemo(() => {
    // Only AWOS fault is globally exposed by the current codebase architecture via weather.error.
    // The GPR simulated fault in PreBootSystemCheck is purely localized state and cannot be identified globally without refactoring.
    if (weather.error) {
      return { status: 'degraded' as const, affectedSensor: 'AWOS' };
    }
    return { status: 'nominal' as const };
  }, [weather.error]);

  // Real-time WebSocket + State sync hook
  const {
    activeDistress,
    connectedClients,
    connectedDevices,
    currentDeviceId,
    currentDeviceType,
    switchDeviceRole,
    syncStatus,
    isAlarmMuted,
    toggleMuteAlarm,
    triggerDistress,
    acknowledgeDistress,
    resolveDistress,
    updateDistressLocation,
    autoSarDispatchEnabled,
    toggleAutoSarMode,
    assets,
    personnel,
    stations,
    inventory,
    addInventory: syncAddInventory,
    updateInventory: syncUpdateInventory,
    adjustInventoryStock: syncAdjustInventoryStock,
    polarisDb: db,
    syncPolDb: setDb,
    addWaypoint: syncAddWaypoint,
    updateWaypoint: syncUpdateWaypoint,
    reorderWaypoints: syncReorderWaypoints,
    updateAsset: syncUpdateAsset,
    deleteWaypoint: syncDeleteWaypoint,
    addAsset: syncAddAsset,
    addPersonnel: syncAddPersonnel,
    updateAssetStatus: syncUpdateAssetStatus,
    addStation: syncAddStation,
  } = usePolarSync();

  // Mission Simulation & Training Engine Hook
  const sim = useSimulation({
    liveDb: db,
    liveAssets: assets,
    liveStations: stations,
    liveDistress: activeDistress,
    liveConditionLevel: 'COND-2_CAUTION',
    soundEnabled,
  });

  // Isolated Simulation State Layer:
  // When simulation is running, all operational views seamlessly read and write to simDb / simAssets
  const activeDb = sim.isActive ? sim.simDb : db;
  const setActiveDb = sim.isActive ? sim.setSimDb : setDb;
  const activeAssets = sim.isActive ? sim.simAssets : assets;
  const activeStations = sim.isActive ? sim.simStations : stations;
  const hasRealLiveDistress = Boolean(activeDistress && activeDistress.active);
  const hasSimDistress = Boolean(sim.isActive && sim.simDistress && sim.simDistress.active);
  // Life-safety mandate: Genuine real-world distress is never suppressed by simulation
  const activeDistressAlert = hasRealLiveDistress ? activeDistress : (sim.isActive ? sim.simDistress : activeDistress);
  const activeConditionLevel = sim.isActive ? sim.simConditionLevel : 'COND-2_CAUTION';
  
  const activeAddWaypoint = sim.isActive ? sim.addWaypoint : syncAddWaypoint;
  const activeUpdateWaypoint = sim.isActive ? sim.updateWaypoint : syncUpdateWaypoint;
  const activeReorderWaypoints = sim.isActive ? sim.reorderWaypoints : syncReorderWaypoints;
  const activeUpdateAsset = sim.isActive ? sim.updateAsset : syncUpdateAsset;
  const activeDeleteWaypoint = sim.isActive ? sim.deleteWaypoint : syncDeleteWaypoint;
  
  const activeAddPersonnel = sim.isActive ? sim.addPersonnel : syncAddPersonnel;
  const activeAddAsset = sim.isActive ? sim.addAsset : syncAddAsset;
  const activeUpdateAssetStatus = sim.isActive ? sim.updateAssetStatus : syncUpdateAssetStatus;

  const activeAddStation = sim.isActive ? sim.addStation : syncAddStation;
  const activeAddInventory = sim.isActive ? sim.addInventory : syncAddInventory;
  const activeUpdateInventory = sim.isActive ? sim.updateInventory : syncUpdateInventory;
  const activeAdjustInventoryStock = sim.isActive ? sim.adjustInventoryStock : syncAdjustInventoryStock;

  // Trigger audio klaxon on new active distress (live distress takes absolute precedence)
  useEffect(() => {
    const shouldAlarm = (hasRealLiveDistress || hasSimDistress) && !isAlarmMuted && soundEnabled;
    if (shouldAlarm) {
      startEmergencyAlarm();
    } else {
      stopEmergencyAlarm();
    }
    return () => {
      stopEmergencyAlarm();
    };
  }, [hasRealLiveDistress, hasSimDistress, isAlarmMuted, soundEnabled]);

  // Reset Field Party Safe state when distress is resolved or inactive
  useEffect(() => {
    if (!hasRealLiveDistress && !hasSimDistress) {
      setIsDistressMarkedSafe(false);
    }
  }, [hasRealLiveDistress, hasSimDistress]);

  // F1.1: Automated One-Click Emergency MAYDAY Dispatch
  const handleOneClickMayday = async () => {
    if (isDispatchingMayday) return;
    if (hasRealLiveDistress || hasSimDistress) {
      // Alert already active — navigate operator to SAR operations console
      handleSetActiveWithSound('sar');
      return;
    }

    setIsDispatchingMayday(true);
    setIsDistressMarkedSafe(false);

    try {
      if (sim.isActive) {
        // Simulation mode: strictly isolate, never dispatch live alert over network
        sim.injectManualEvent('INJECT_MAYDAY');
        if (soundEnabled) playTacticalChirp();
      } else {
        // Live mode: Attempt GPS fix with 3-second timeout race
        let coordStr = 'LOCATION UNVERIFIED';
        let locationName = `${selectedStation} Sector (GPS UNVERIFIED)`;
        let targetLat = geo.latitude || (selectedStation === 'Maitri' ? -70.77 : -85.25);
        let targetLng = geo.longitude || (selectedStation === 'Maitri' ? 11.73 : 151.10);

        try {
          const fixPromise = geo.acquireSingleFix();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GPS timeout')), 3000)
          );
          const fix = (await Promise.race([fixPromise, timeoutPromise])) as any;
          if (fix && typeof fix.lat === 'number' && typeof fix.lng === 'number') {
            coordStr = `${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}`;
            targetLat = fix.lat;
            targetLng = fix.lng;
            locationName = `Real-Time GPS Fix (${fix.lat > 0 ? 'Arctic/North' : 'Antarctica/South'}) (±${Math.round(fix.accuracy || 10)}m)`;
          }
        } catch {
          // GPS timed out or failed — never silently substitute fabricated coordinates
          if (geo.latitude && geo.longitude) {
            coordStr = `${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)} (STALE/UNVERIFIED)`;
            locationName = `${selectedStation} Perimeter (STALE GPS)`;
          }
        }

        const callerName = user ? `${user.name.toUpperCase()} (${user.role})` : 'FIELD OPERATOR';
        const callerDevice = currentDeviceType === 'mobile_field' ? 'Mobile Phone Field Unit' : 'Station HQ';

        const payload = {
          incidentType: 'Severe Cold Exposure / Life Safety Distress',
          location: locationName,
          coordinates: coordStr,
          targetLat,
          targetLng,
          summary: `AUTOMATED ONE-CLICK MAYDAY BROADCAST from ${selectedStation} Station. Station Condition: ${activeConditionLevel}. Immediate search & rescue extraction requested.`,
          reporterCallsign: callerName,
          reportedByDevice: callerDevice,
        };

        triggerDistress(payload);
        if (soundEnabled) startEmergencyAlarm();
      }
    } finally {
      setIsDispatchingMayday(false);
    }
  };

  const handleSetActiveWithSound = (newActive: string) => {
    if (soundEnabled && newActive !== active) {
      playTacticalChirp();
    }
    setActive(newActive);
  };

  const allowed = user ? (PERMISSIONS[user.role] || PERMISSIONS['Super Admin']) : [];
  const canEdit = user ? ['Super Admin', 'Expedition Manager', 'Logistics Officer', 'Asset Manager'].includes(user.role) : false;
  const unread = activeDb.alerts.filter((a: any) => !a.read).length;

  if (!user) {
    return (
      <PolarLoginView onLoginSuccess={handleLoginSuccess} />
    );
  }

  // Pre-Boot System Check Terminal Screen before initializing dashboard
  if (!hasCompletedPreBoot) {
    return (
      <PreBootSystemCheck
        onComplete={() => {
          setHasCompletedPreBoot(true);
          if (soundEnabled) playSuccessChime();
        }}
        onSkip={() => {
          setHasCompletedPreBoot(true);
          if (soundEnabled) playTacticalChirp();
        }}
      />
    );
  }

  const openDetail = (id: string) => {
    setExpDetailId(id);
    handleSetActiveWithSound('expedition-detail');
  };

  // Route Dispatcher
  let page = null;
  if (active === 'dashboard') {
    page = (
      <DashboardView
        t={t}
        db={activeDb}
        user={user}
        geminiApiKey={geminiApiKey}
        setActive={handleSetActiveWithSound}
        setDb={setActiveDb}
        isSimulation={sim.isActive}
      />
    );
  } else if (active === 'live-ops') {
    page = (
      <div className="space-y-4">
        <EnvironmentalTelemetry
          conditionLevel={activeConditionLevel}
          region="antarctica"
          stations={INITIAL_STATIONS}
          expeditions={POLAR_EXPEDITIONS}
          stationWeather={weather.stationWeather}
          userLocationWeather={weather.userLocationWeather}
          expeditionWeather={weather.expeditionWeather}
          loadingWeather={weather.loading}
          weatherLastUpdated={weather.lastUpdated}
          onRefreshWeather={weather.refreshAllWeather}
          userLat={geo.latitude}
          userLng={geo.longitude}
          onAcquireGps={geo.acquireSingleFix}
          onFlyToLocation={(coords) => {
            handleSetActiveWithSound('map');
          }}
        />
      </div>
    );
  } else if (active === 'map') {
    page = (
      <MapView
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        activeDistress={activeDistressAlert}
        updateDistressLocation={updateDistressLocation}
        googleMapsApiKey={googleMapsApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isSimulation={sim.isActive}
        onAddWaypoint={activeAddWaypoint}
        onUpdateWaypoint={activeUpdateWaypoint}
        onReorderWaypoints={activeReorderWaypoints}
        onDeleteWaypoint={activeDeleteWaypoint}
        onAddStation={activeAddStation}
      />
    );
  } else if (active === 'expeditions') {
    page = <Expeditions t={t} db={activeDb} setDb={setActiveDb} openDetail={openDetail} canEdit={canEdit} />;
  } else if (active === 'expedition-detail' && expDetailId) {
    page = <ExpeditionDetail t={t} db={activeDb} expId={expDetailId} onBack={() => handleSetActiveWithSound('expeditions')} />;
  } else if (active === 'waypoints') {
    page = (
      <WaypointPlannerPage
        expeditions={activeDb.expeditions || INITIAL_EXPEDITIONS}
        onAddWaypoint={(wp, expId) => activeAddWaypoint(wp, expId)}
        onDeleteWaypoint={(wpId, expId) => activeDeleteWaypoint(wpId, expId)}
        onUpdateWaypoint={(wp, expId) => activeUpdateWaypoint(wp, expId)}
        onReorderWaypoints={(wps, expId) => activeReorderWaypoints(wps, expId)}
        userLat={geo.latitude}
        userLng={geo.longitude}
      />
    );
  } else if (active === 'routes' || active === 'smart-route') {
    page = (
      <SmartRouteOptimizer
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        geminiApiKey={geminiApiKey}
        onNavigateToMap={() => handleSetActiveWithSound('map')}
        isSimulation={sim.isActive}
      />
    );
  } else if (active === 'transportation') {
    page = <Transportation t={t} db={activeDb} />;
  } else if (active === 'assets') {
    page = <Assets t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} assets={activeAssets} onAddAsset={activeAddAsset} onUpdateAssetStatus={activeUpdateAssetStatus} onUpdateAsset={activeUpdateAsset} />;
  } else if (active === 'maintenance') {
    page = <Maintenance t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} geminiApiKey={geminiApiKey} />;
  } else if (active === 'predictive-maintenance') {
    page = (
      <PredictiveMaintenance
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        canEdit={canEdit}
        geminiApiKey={geminiApiKey}
        onViewTraditional={() => handleSetActiveWithSound('maintenance')}
        isSimulation={sim.isActive}
      />
    );
  } else if (active === 'inventory') {
    const mergedInventory = [
      ...(sim.isActive ? (sim.simDb?.inventory || []) : (inventory || [])),
      ...(activeDb.inventory || [])
    ].reduce((acc: any[], curr: any) => {
      if (!acc.find(i => i.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
    page = (
      <Inventory
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        canEdit={canEdit}
        inventory={mergedInventory}
        onAddInventory={activeAddInventory}
        onUpdateInventory={activeUpdateInventory}
        onAdjustInventoryStock={activeAdjustInventoryStock}
        isSimulation={sim.isActive}
      />
    );
  } else if (active === 'weather-inventory') {
    const mergedInventory = [
      ...(sim.isActive ? (sim.simDb?.inventory || []) : (inventory || [])),
      ...(activeDb.inventory || [])
    ].reduce((acc: any[], curr: any) => {
      if (!acc.find(i => i.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
    page = (
      <DynamicWeatherInventory
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        geminiApiKey={geminiApiKey}
        onNavigateShipments={() => handleSetActiveWithSound('shipments')}
        isSimulation={sim.isActive}
        inventory={mergedInventory}
        onUpdateInventory={activeUpdateInventory}
      />
    );
  } else if (active === 'shipments') {
    page = <Shipments t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} />;
  } else if (active === 'stations') {
    page = (
      <StationsView
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        stations={activeStations}
        onAddStation={activeAddStation}
        onNavigateToMap={(coords) => {
          handleSetActiveWithSound('map');
        }}
      />
    );
  } else if (active === 'personnel') {
    const mergedPersonnel = [
      ...(personnel || []),
      ...(activeDb.personnel || [])
    ].reduce((acc: any[], curr: any) => {
      if (!acc.find(p => p.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
    page = <Personnel t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} personnel={mergedPersonnel} onAddPersonnel={activeAddPersonnel} />;
  } else if (active === 'ai-action-logs') {
    page = (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              AI Autonomous Action Telemetry Feed
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Continuous streaming real-time operational decisions, route reroutes, fuel optimizations, and automated work resolutions.
            </p>
          </div>
        </div>
        <AiActionLogsPanel
          t={t}
          compact={false}
          maxHeight={650}
          onAutoResolveAlert={(alertId) => handleSetActiveWithSound('alerts')}
        />
      </div>
    );
  } else if (active === 'ai-alerts' || active === 'alerts') {
    page = <Alerts t={t} db={activeDb} setDb={setActiveDb} />;
  } else if (active === 'ai-cleared-work' || active === 'tasks') {
    page = <Tasks t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} />;
  } else if (active === 'sar') {
    page = (
      <SarConsoleView
        t={t}
        activeDistress={activeDistressAlert}
        autoSarDispatchEnabled={autoSarDispatchEnabled}
        isAlarmMuted={isAlarmMuted}
        isMarkedSafe={isDistressMarkedSafe}
        onMarkSafe={() => {
          setIsDistressMarkedSafe(true);
          if (soundEnabled) playSuccessChime();
        }}
        onToggleAutoSar={toggleAutoSarMode}
        onToggleMuteAlarm={toggleMuteAlarm}
        onTriggerCrevasseFall={() => {
          setIsDistressMarkedSafe(false);
          if (!sim.isActive) {
            sim.startScenario('SIM-SCEN-05');
          }
          sim.injectManualEvent('INJECT_MAYDAY');
          if (soundEnabled) playTacticalChirp();
        }}
        onAcknowledgeDistress={hasRealLiveDistress ? acknowledgeDistress : (sim.isActive ? () => { if (sim.simDistress) sim.setSimDistress({ ...sim.simDistress, status: 'acknowledged' }); } : acknowledgeDistress)}
        onResolveDistress={() => {
          if (hasRealLiveDistress) {
            resolveDistress();
          } else if (sim.isActive) {
            sim.setSimDistress(null);
            sim.recordIntervention();
          } else {
            resolveDistress();
          }
          setIsDistressMarkedSafe(false);
        }}
        onNavigateToMap={(coords) => {
          handleSetActiveWithSound('map');
        }}
        onOpenEmergencyModal={() => setIsDistressModalOpen(true)}
      />
    );
  } else if (active === 'simulation') {
    page = (
      <SimulationControlCenter
        t={t}
        sim={sim}
        db={activeDb}
        setDb={setActiveDb}
        onNavigateToMap={() => handleSetActiveWithSound('map')}
      />
    );
  } else if (active === 'emergency-events') {
    page = (
      <div className="space-y-4">
        <DispatchLogbook
          logs={activeDb.dispatchLogs || INITIAL_DISPATCH_LOGS}
          onAddLog={(newLog) => {
            const created = {
              ...newLog,
              id: `log-${Date.now()}`,
              timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
            };
            setActiveDb((prev: any) => ({
              ...prev,
              dispatchLogs: [created, ...(prev.dispatchLogs || INITIAL_DISPATCH_LOGS)]
            }));
          }}
          geminiApiKey={geminiApiKey}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />
      </div>
    );
  } else if (active === 'reports') {
    page = <Reports t={t} db={activeDb} />;
  } else if (active === 'expenses') {
    page = <Expenses t={t} db={activeDb} />;
  } else if (active === 'audit') {
    page = <AuditLog t={t} db={activeDb} />;
  } else if (active === 'device-pairing') {
    page = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              Connected Terminals &amp; Mobile Mesh Pairing
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Synchronize field handheld smartphones, rugged tablets, vehicle terminals, and HQ workstations over local Wi-Fi or SATCOM.
            </p>
          </div>
          <button
            onClick={() => setIsPairingModalOpen(true)}
            style={{ background: t.btnGradient, color: '#FFFFFF' }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
          >
            <QrCode className="w-4 h-4" />
            <span>Open Pairing QR Modal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-5 rounded-2xl border backdrop-blur-md">
            <span className="text-xs font-mono text-slate-400 block uppercase">Current Terminal ID</span>
            <span className="text-sm font-bold font-mono text-cyan-400 block mt-1">{currentDeviceId || 'HQ-DESKTOP-01'}</span>
            <span className="text-[11px] font-mono text-slate-500 mt-2 block">Role: {currentDeviceType.toUpperCase()}</span>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-5 rounded-2xl border backdrop-blur-md">
            <span className="text-xs font-mono text-slate-400 block uppercase">Active Terminals Online</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">{connectedClients}</span>
            <span className="text-[11px] font-mono text-slate-500 mt-2 block">Protocol: WebSocket JSON State Mesh</span>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-5 rounded-2xl border backdrop-blur-md">
            <span className="text-xs font-mono text-slate-400 block uppercase">SATCOM State</span>
            <span className="text-sm font-bold font-mono text-emerald-400 block mt-1">
              {syncStatus === 'synced' ? 'NOMINAL SYNCHRONIZED' : 'LOCAL CACHE / RECONNECTING'}
            </span>
            <span className="text-[11px] font-mono text-slate-500 mt-2 block">Encryption: AES-GCM Polar Link</span>
          </div>
        </div>

        <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-6 rounded-2xl border backdrop-blur-md space-y-4">
          <h3 className="font-bold text-sm font-mono text-white">Registered Field Terminals</h3>
          <div className="divide-y divide-white/10">
            {connectedDevices && connectedDevices.length > 0 ? (
              connectedDevices.map((dev: any) => (
                <div key={dev.deviceId} className="py-3 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="font-bold text-white">{dev.deviceId}</span>
                    <span className="text-slate-400 ml-2">({dev.deviceType})</span>
                  </div>
                  <span className="text-emerald-400">ACTIVE HEARTBEAT</span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs font-mono text-slate-400">
                Primary HQ Operator Workstation connected. Scan QR code from mobile device to join mesh.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (active === 'api-config') {
    page = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              API Key &amp; AI Autonomous Resource Configuration
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Manage Gemini 3.8 Flash inference parameters, request coalescence caching, and Google Maps polar overlays.
            </p>
          </div>
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            style={{ background: t.btnGradient, color: '#FFFFFF' }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
          >
            <Key className="w-4 h-4" />
            <span>Open API Key Configuration Modal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-5 rounded-2xl border backdrop-blur-md">
            <span className="text-xs font-mono text-slate-400 block uppercase">Gemini 3.8 Flash Status</span>
            <span className="text-sm font-bold font-mono text-cyan-400 block mt-1">
              {geminiApiKey ? 'CUSTOM KEY INSTALLED (CLIENT OVERRIDE)' : 'SERVER-SIDE ZERO-CONFIG ACTIVE'}
            </span>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Server operates with built-in GEMINI_API_KEY environment variable. Client key takes precedence if specified.
            </p>
          </div>

          <div style={{ background: t.cardBg, borderColor: t.cardBorder }} className="p-5 rounded-2xl border backdrop-blur-md">
            <span className="text-xs font-mono text-slate-400 block uppercase">Request Coalescing Cache</span>
            <span className="text-sm font-bold font-mono text-emerald-400 block mt-1">ACTIVE (15-MIN TTL)</span>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Reduces satellite bandwidth consumption by 84% through telemetry hashing and deduplication.
            </p>
          </div>
        </div>
      </div>
    );
  } else if (active === 'post-diagnostics') {
    page = (
      <div className="space-y-4">
        <PreBootSystemCheck
          standaloneModal={false}
          onComplete={() => handleSetActiveWithSound('dashboard')}
          onSkip={() => handleSetActiveWithSound('dashboard')}
        />
      </div>
    );
  } else if (active === 'users') {
    page = <UsersPage t={t} db={activeDb} />;
  } else if (active === 'settings') {
    page = (
      <SettingsPage
        t={t}
        theme={theme}
        setTheme={handleSetTheme}
        user={user}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />
    );
  }

  return (
    <div
      style={{
        background: t.bg,
        minHeight: '100vh',
      }}
      className={`flex text-slate-100 font-sans relative ${crtEnabled ? 'crt-scanlines' : ''}`}
    >
      <Sidebar
        t={t}
        theme={theme}
        active={active === 'expedition-detail' ? 'expeditions' : active}
        setActive={handleSetActiveWithSound}
        allowed={allowed}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        unreadAlerts={unread}
        hasActiveDistress={hasRealLiveDistress || hasSimDistress}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Topbar
          t={t}
          theme={theme}
          setTheme={handleSetTheme}
          user={user}
          onLogout={handleLogout}
          unread={unread}
          setActive={handleSetActiveWithSound}
          syncStatus={syncStatus}
          connectedClients={connectedClients}
          currentDeviceId={currentDeviceId}
          selectedStation={selectedStation}
          onSelectStation={(st) => {
            setSelectedStation(st);
            if (soundEnabled) playTacticalChirp();
          }}
          crtEnabled={crtEnabled}
          onToggleCrt={handleToggleCrt}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          hasActiveDistress={hasRealLiveDistress || hasSimDistress}
          isSimulationActive={sim.isActive}
          onOpenSimulation={() => handleSetActiveWithSound('simulation')}
          stationWeather={weather.stationWeather}
          sensorHealth={sensorHealth}
          mobileOpen={mobileNavOpen}
          setMobileOpen={setMobileNavOpen}
        />

        {/* Persistent Simulation HUD banner when Simulation Mode is running */}
        {sim.isActive && (
          <SimulationHud
            t={t}
            sim={sim}
            onOpenControlCenter={() => handleSetActiveWithSound('simulation')}
          />
        )}

        {/* Real-time Telemetry & Distress Toolbar Sub-header */}
        <div
          style={{
            background: 'rgba(10, 17, 40, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${t.border}`,
          }}
          className="px-3 sm:px-6 py-2.5 flex items-center justify-between text-xs gap-3 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono">
              {sim.isActive ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold tracking-wider animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  SIMULATION RUNNING (ISOLATED)
                </span>
              ) : syncStatus === 'synced' ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
              {!sim.isActive && (
                <span className={syncStatus === 'synced' ? 'text-emerald-400 font-bold tracking-wide' : 'text-amber-400 font-bold tracking-wide'}>
                  {syncStatus === 'synced' ? 'LIVE SATCOM SYNC' : 'OFFLINE CACHE'}
                </span>
              )}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: t.textDim }} className="font-mono">
              {sim.isActive ? (
                <>Sim Target: <strong className="text-amber-300 font-mono">{sim.activeScenario?.title || 'Active Scenario'}</strong></>
              ) : (
                <>Mesh Nodes: <strong className="text-white font-mono">{connectedClients}</strong></>
              )}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: t.textDim }} className="font-mono hidden sm:inline">
              Station: <strong className="text-cyan-300 font-mono">{selectedStation}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-SAR Dispatch Toggle (unique operational control — not in sidebar) */}
            <button
              onClick={() => {
                toggleAutoSarMode();
                if (soundEnabled) playTacticalChirp();
              }}
              style={{
                background: autoSarDispatchEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${autoSarDispatchEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.14)'}`,
                color: autoSarDispatchEnabled ? '#10B981' : t.textDim,
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer text-xs font-mono font-semibold transition-all"
              title="Toggle between Autonomous S.A.R. Dispatch vs Manual Operator Mode"
            >
              <span className={`w-2 h-2 rounded-full ${autoSarDispatchEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Auto-SAR: {autoSarDispatchEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Crevasse Fall Quick Test (Simulation Drill Sandbox) */}
            <button
              onClick={() => {
                setIsDistressMarkedSafe(false);
                if (!sim.isActive) {
                  sim.startScenario('SIM-SCEN-05');
                }
                sim.injectManualEvent('INJECT_MAYDAY');
                if (soundEnabled) playTacticalChirp();
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FDA4AF',
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-950/40 cursor-pointer font-mono font-semibold text-xs transition-all"
              title="Launch simulated Crevasse Fall distress drill in isolated sandbox"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/25 text-rose-300 border border-rose-500/35">SIM DRILL</span>
              <span>Test Crevasse Fall</span>
            </button>

            {/* SOS MAYDAY — Primary One-Click Action with Secondary Detailed Modal */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleOneClickMayday}
                disabled={isDispatchingMayday}
                style={{
                  background: activeDistressAlert
                    ? 'linear-gradient(135deg, #DC2626, #991B1B)'
                    : 'linear-gradient(135deg, #EF4444, #DC2626)',
                  boxShadow: activeDistressAlert
                    ? '0 8px 25px rgba(239, 68, 68, 0.65)'
                    : '0 6px 18px rgba(239, 68, 68, 0.35)',
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-xl text-white font-mono font-bold tracking-wide cursor-pointer hover:opacity-95 transition-all text-xs outline-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                  activeDistressAlert ? 'animate-pulse ring-2 ring-rose-400' : ''
                }`}
                title={
                  activeDistressAlert
                    ? 'MAYDAY DISTRESS ACTIVE — Click to view active SAR Operations Console'
                    : 'Instant One-Click Automated Emergency MAYDAY Broadcast'
                }
                aria-label={
                  activeDistressAlert
                    ? 'MAYDAY DISTRESS ACTIVE — Click to open SAR Console'
                    : 'Trigger Instant One-Click Automated Emergency MAYDAY Broadcast'
                }
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {isDispatchingMayday
                    ? 'DISPATCHING...'
                    : activeDistressAlert
                    ? 'MAYDAY ACTIVE'
                    : 'SOS MAYDAY'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDistressModalOpen(true);
                  if (soundEnabled) playTacticalChirp();
                }}
                style={{
                  background: activeDistressAlert
                    ? 'rgba(185, 28, 28, 0.9)'
                    : 'rgba(239, 68, 68, 0.85)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                }}
                className="px-2 py-1.5 rounded-r-xl text-white hover:bg-rose-700 cursor-pointer transition-colors text-xs flex items-center justify-center outline-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 focus:ring-offset-slate-900"
                title="Open Detailed Manual MAYDAY Form (custom coordinates, soul count, notes)"
                aria-label="Open Detailed Manual MAYDAY Form"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Genuine Real-World Live Distress Priority Warning Banner during Simulation */}
        {sim.isActive && hasRealLiveDistress && activeDistress && (
          <div className="px-3 sm:px-6 pt-3">
            <div className="p-4 rounded-2xl bg-rose-950/95 border-2 border-rose-500 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 flex-wrap animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                  <ShieldAlert className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                      REAL-WORLD LIVE MAYDAY IN PROGRESS
                    </span>
                    <span className="text-xs font-mono text-rose-300 font-bold">
                      {activeDistress.incidentType}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-200 mt-1">
                    Sector: <strong className="text-white">{activeDistress.location}</strong> ({activeDistress.coordinates}) | Reported by: {activeDistress.reporterCallsign} ({activeDistress.reportedByDevice})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sim.exitSimulation();
                    handleSetActiveWithSound('sar');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-rose-900 font-mono font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-lg"
                >
                  EXIT SIMULATION &amp; MANAGE REAL SAR
                </button>
                <button
                  type="button"
                  onClick={() => handleSetActiveWithSound('sar')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-mono font-bold text-xs hover:bg-rose-500 transition-colors cursor-pointer"
                >
                  OPEN LIVE SAR CONSOLE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Real-World Live Distress Banner */}
        {hasRealLiveDistress && activeDistress && (
          <div className="px-3 sm:px-6 pt-3">
            <ActiveDistressBanner
              distress={activeDistress}
              activeDistress={activeDistress}
              assets={assets}
              isSimulation={false}
              isMuted={isAlarmMuted}
              isAlarmMuted={isAlarmMuted}
              isMarkedSafe={isDistressMarkedSafe}
              onMarkSafe={() => {
                setIsDistressMarkedSafe(true);
                if (soundEnabled) playSuccessChime();
              }}
              autoSarDispatchEnabled={autoSarDispatchEnabled}
              onToggleAutoSar={toggleAutoSarMode}
              onToggleMute={toggleMuteAlarm}
              onAcknowledge={acknowledgeDistress}
              onResolve={() => {
                resolveDistress();
                setIsDistressMarkedSafe(false);
              }}
              onLocateOnMap={() => {
                handleSetActiveWithSound('map');
              }}
            />
          </div>
        )}

        {/* Simulated Scenario Distress Banner (visible when simulation is running, distinguishable from live distress) */}
        {sim.isActive && sim.simDistress && sim.simDistress.active && !hasRealLiveDistress && (
          <div className="px-3 sm:px-6 pt-3">
            <ActiveDistressBanner
              distress={sim.simDistress}
              activeDistress={sim.simDistress}
              assets={activeAssets}
              isSimulation={true}
              isMuted={isAlarmMuted}
              isAlarmMuted={isAlarmMuted}
              isMarkedSafe={isDistressMarkedSafe}
              onMarkSafe={() => {
                setIsDistressMarkedSafe(true);
                if (soundEnabled) playSuccessChime();
              }}
              autoSarDispatchEnabled={autoSarDispatchEnabled}
              onToggleAutoSar={toggleAutoSarMode}
              onTriggerCrevasseFall={() => sim.injectManualEvent('INJECT_MAYDAY')}
              onToggleMute={toggleMuteAlarm}
              onAcknowledge={() => {
                if (sim.simDistress) sim.setSimDistress({ ...sim.simDistress, status: 'acknowledged' });
              }}
              onResolve={() => {
                sim.setSimDistress(null);
                sim.recordIntervention();
                setIsDistressMarkedSafe(false);
              }}
              onLocateOnMap={() => {
                handleSetActiveWithSound('map');
              }}
            />
          </div>
        )}

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6 flex-1 min-w-0">
          <React.Suspense fallback={<TacticalLoadingFallback />}>
            {page}
          </React.Suspense>
        </main>

        {/* Offline Cache Status Footer */}
        <Footer
          t={t}
          db={activeDb}
          currentDeviceId={currentDeviceId}
          currentDeviceType={currentDeviceType}
        />
      </div>

      <React.Suspense fallback={null}>
      {/* Emergency Distress Modal */}
      {isDistressModalOpen && (
        <EmergencyModal
          isOpen={isDistressModalOpen}
          assets={activeAssets}
          onClose={() => setIsDistressModalOpen(false)}
          onTriggerEmergencyBroadcast={(incidentData) => {
            setIsDistressMarkedSafe(false);
            if (sim.isActive) {
              sim.injectManualEvent('INJECT_MAYDAY');
              setIsDistressModalOpen(false);
            } else {
              triggerDistress(incidentData);
              setIsDistressModalOpen(false);
            }
          }}
          onTriggerDistress={(type, description) => {
            setIsDistressMarkedSafe(false);
            if (sim.isActive) {
              sim.injectManualEvent('INJECT_MAYDAY');
              setIsDistressModalOpen(false);
            } else {
              triggerDistress(type, description);
              setIsDistressModalOpen(false);
            }
          }}
          activeDistress={activeDistressAlert}
          onAcknowledge={
            hasRealLiveDistress
              ? acknowledgeDistress
              : sim.isActive
              ? () => {
                  if (sim.simDistress) sim.setSimDistress({ ...sim.simDistress, status: 'acknowledged' });
                }
              : acknowledgeDistress
          }
          onResolve={() => {
            if (hasRealLiveDistress) {
              resolveDistress();
            } else if (sim.isActive) {
              sim.setSimDistress(null);
              sim.recordIntervention();
            } else {
              resolveDistress();
            }
            setIsDistressMarkedSafe(false);
          }}
        />
      )}

      {/* Multi-Device Pairing Modal */}
      {isPairingModalOpen && (
        <DevicePairingModal
          isOpen={isPairingModalOpen}
          connectedClients={connectedClients}
          connectedDevices={connectedDevices}
          currentDeviceId={currentDeviceId}
          currentDeviceType={currentDeviceType}
          onSwitchDeviceRole={switchDeviceRole}
          onSimulateDistress={() => {
            if (sim.isActive) sim.injectManualEvent('INJECT_MAYDAY');
            else triggerDistress('Simulated Mobile Mayday', 'Emergency test trigger from pairing modal.');
          }}
          onClose={() => setIsPairingModalOpen(false)}
        />
      )}

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          googleMapsApiKey={googleMapsApiKey}
          geminiApiKey={geminiApiKey}
          onSaveKeys={handleSaveKeys}
          onClose={() => setIsApiKeyModalOpen(false)}
        />
      )}

      {/* Pre-Boot System Check Diagnostic Terminal Modal */}
      {isPreBootModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-cyan-500/40">
            <PreBootSystemCheck
              onComplete={() => setIsPreBootModalOpen(false)}
              standaloneModal={true}
              onCloseModal={() => setIsPreBootModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Simulation After-Action Report (AAR) Modal */}
      {sim.isReportModalOpen && sim.simReport && (
        <SimulationReportModal
          t={t}
          report={sim.simReport}
          onClose={() => sim.setIsReportModalOpen(false)}
          onReplayScenario={() => {
            const scId = sim.simReport?.scenarioId;
            sim.setIsReportModalOpen(false);
            if (scId) {
              sim.startScenario(scId);
            }
          }}
          onExitSimulation={() => {
            sim.setIsReportModalOpen(false);
            sim.stopScenario(false);
            sim.exitSimulation();
          }}
        />
      )}
      </React.Suspense>
    </div>
  );
}
