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
import { MapView, Alerts, Expenses, Reports, AuditLog, UsersPage, SettingsPage } from './components/polaris/ViewsPart2';
import { EnvironmentalTelemetry } from './components/EnvironmentalTelemetry';
import { WaypointPlannerPage } from './components/WaypointPlannerPage';
import { SmartRouteOptimizer } from './components/polaris/SmartRouteOptimizer';
import { PredictiveMaintenance } from './components/polaris/PredictiveMaintenance';
import { DynamicWeatherInventory } from './components/polaris/DynamicWeatherInventory';
import { StationsView } from './components/polaris/StationsView';
import { SarConsoleView } from './components/polaris/SarConsoleView';
import { AiActionLogsPanel } from './components/polaris/AiActionLogsPanel';
import { DispatchLogbook } from './components/DispatchLogbook';
import { ActiveDistressBanner } from './components/ActiveDistressBanner';
import { DevicePairingModal } from './components/DevicePairingModal';
import { EmergencyModal } from './components/EmergencyModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import { PreBootSystemCheck } from './components/polaris/PreBootSystemCheck';
import { useSimulation } from './hooks/useSimulation';
import { apiFetch } from './utils/api';
import { SimulationHud } from './components/polaris/SimulationHud';
import { SimulationControlCenter } from './components/polaris/SimulationControlCenter';
import { SimulationReportModal } from './components/polaris/SimulationReportModal';
import { usePolarSync } from './hooks/usePolarSync';
import { useGeolocation } from './hooks/useGeolocation';
import { useRealtimeWeather } from './hooks/useRealtimeWeather';
import { playTacticalChirp, playSuccessChime, startEmergencyAlarm, stopEmergencyAlarm } from './utils/audioAlert';
import { ShieldAlert, Radio, Key, Wifi, WifiOff, Bot, Sparkles, Terminal, QrCode, Target } from 'lucide-react';

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
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('polar_sound_enabled', String(next));
      }
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
  const [expDetailId, setExpDetailId] = useState<string | null>(null);

  // Modals
  const [isDistressModalOpen, setIsDistressModalOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // API Keys state
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('POLAR_GMAPS_KEY') || '' : '';
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('POLAR_GEMINI_KEY') || '' : '';
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
    triggerCrevasseFallDistress,
    assets,
    polarisDb: db,
    syncPolDb: setDb,
  } = usePolarSync();

  // Mission Simulation & Training Engine Hook
  const sim = useSimulation({
    liveDb: db,
    liveAssets: assets,
    liveDistress: activeDistress,
    liveConditionLevel: 'COND-2_CAUTION',
    soundEnabled,
  });

  // Isolated Simulation State Layer:
  // When simulation is running, all operational views seamlessly read and write to simDb / simAssets
  const activeDb = sim.isActive ? sim.simDb : db;
  const setActiveDb = sim.isActive ? sim.setSimDb : setDb;
  const activeAssets = sim.isActive ? sim.simAssets : assets;
  const activeDistressAlert = sim.isActive ? sim.simDistress : activeDistress;
  const activeConditionLevel = sim.isActive ? sim.simConditionLevel : 'COND-2_CAUTION';

  // Trigger audio klaxon on new active distress if not muted
  useEffect(() => {
    if (activeDistressAlert && !isAlarmMuted && soundEnabled) {
      startEmergencyAlarm();
    } else {
      stopEmergencyAlarm();
    }
    return () => {
      stopEmergencyAlarm();
    };
  }, [activeDistressAlert, isAlarmMuted, soundEnabled]);

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
        onAddWaypoint={(wp, expId) => {
          setActiveDb((prev: any) => ({
            ...prev,
            expeditions: (prev.expeditions || []).map((e: any) =>
              e.id === (expId || prev.expeditions[0]?.id)
                ? { ...e, waypoints: [...(e.waypoints || []), wp] }
                : e
            ),
            customWaypoints: [...(prev.customWaypoints || []), wp]
          }));
        }}
        onDeleteWaypoint={(wpId, expId) => {
          setActiveDb((prev: any) => ({
            ...prev,
            expeditions: (prev.expeditions || []).map((e: any) =>
              e.id === (expId || prev.expeditions[0]?.id)
                ? { ...e, waypoints: (e.waypoints || []).filter((w: any) => w.id !== wpId) }
                : e
            ),
            customWaypoints: (prev.customWaypoints || []).filter((w: any) => w.id !== wpId)
          }));
        }}
        onUpdateWaypoint={(wp, expId) => {
          setActiveDb((prev: any) => ({
            ...prev,
            expeditions: (prev.expeditions || []).map((e: any) =>
              e.id === (expId || prev.expeditions[0]?.id)
                ? { ...e, waypoints: (e.waypoints || []).map((w: any) => w.id === wp.id ? wp : w) }
                : e
            ),
            customWaypoints: (prev.customWaypoints || []).map((w: any) => w.id === wp.id ? wp : w)
          }));
        }}
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
    page = <Assets t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} />;
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
      />
    );
  } else if (active === 'inventory') {
    page = <Inventory t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} />;
  } else if (active === 'weather-inventory') {
    page = (
      <DynamicWeatherInventory
        t={t}
        db={activeDb}
        setDb={setActiveDb}
        geminiApiKey={geminiApiKey}
        onNavigateShipments={() => handleSetActiveWithSound('shipments')}
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
        onNavigateToMap={(coords) => {
          handleSetActiveWithSound('map');
        }}
      />
    );
  } else if (active === 'personnel') {
    page = <Personnel t={t} db={activeDb} setDb={setActiveDb} canEdit={canEdit} />;
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
        onToggleAutoSar={toggleAutoSarMode}
        onToggleMuteAlarm={toggleMuteAlarm}
        onTriggerCrevasseFall={sim.isActive ? () => sim.injectManualEvent('INJ-MAYDAY') : triggerCrevasseFallDistress}
        onAcknowledgeDistress={sim.isActive ? () => { if (sim.simDistress) sim.setSimDistress({ ...sim.simDistress, status: 'acknowledged' }); } : acknowledgeDistress}
        onResolveDistress={sim.isActive ? () => { sim.setSimDistress(null); sim.recordIntervention(); } : resolveDistress}
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
        hasActiveDistress={Boolean(activeDistressAlert)}
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
          onOpenPreBoot={() => setIsPreBootModalOpen(true)}
          onOpenPairing={() => setIsPairingModalOpen(true)}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
          onTriggerMayday={() => setIsDistressModalOpen(true)}
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
          hasActiveDistress={Boolean(activeDistressAlert)}
          isSimulationActive={sim.isActive}
          onOpenSimulation={() => handleSetActiveWithSound('simulation')}
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
          className="px-6 py-2.5 flex items-center justify-between text-xs gap-4 flex-wrap"
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
            {/* Simulation Quick Entry Button */}
            <button
              onClick={() => {
                handleSetActiveWithSound('simulation');
              }}
              style={{
                background: sim.isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${sim.isActive ? '#F59E0B' : t.border}`,
                color: sim.isActive ? '#FCD34D' : '#F8FAFC',
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer font-mono text-xs transition-all font-semibold"
              title="Open Simulation Control Center & Training Scenarios"
            >
              <Target className={`w-3.5 h-3.5 ${sim.isActive ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
              <span>{sim.isActive ? 'SIM HUD' : 'TRAIN SIM'}</span>
            </button>

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

            <button
              onClick={() => {
                if (sim.isActive) {
                  sim.injectManualEvent('INJ-MAYDAY');
                } else {
                  triggerCrevasseFallDistress();
                }
                if (soundEnabled) playTacticalChirp();
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FDA4AF',
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-950/40 cursor-pointer font-mono font-semibold text-xs shadow-sm transition-all"
              title="Simulate Crevasse Fall distress beacon with AI Autonomous Zero-Click Dispatch"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sim Crevasse Fall (Auto S.A.R.)</span>
              <span className="sm:hidden">Auto S.A.R.</span>
            </button>

            <button
              onClick={() => {
                setIsPairingModalOpen(true);
                if (soundEnabled) playTacticalChirp();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${t.border}`,
                color: '#F8FAFC',
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer font-mono text-xs transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Nodes &amp; Pair</span>
            </button>

            <button
              onClick={() => {
                setIsApiKeyModalOpen(true);
                if (soundEnabled) playTacticalChirp();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${t.border}`,
                color: t.textDim,
              }}
              className="p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-all"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={() => {
                setIsDistressModalOpen(true);
                if (soundEnabled) playTacticalChirp();
              }}
              style={{
                background: 'linear-gradient(135deg, #EF4444, #9333EA)',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.45)',
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-mono font-bold tracking-wide cursor-pointer hover:opacity-90 transition-all animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS MAYDAY</span>
            </button>
          </div>
        </div>

        {/* Active Emergency Distress Banner */}
        {activeDistressAlert && (
          <div className="px-6 pt-3">
            <ActiveDistressBanner
              distress={activeDistressAlert}
              activeDistress={activeDistressAlert}
              assets={activeAssets}
              isMuted={isAlarmMuted}
              isAlarmMuted={isAlarmMuted}
              autoSarDispatchEnabled={autoSarDispatchEnabled}
              onToggleAutoSar={toggleAutoSarMode}
              onTriggerCrevasseFall={() => {
                if (sim.isActive) sim.injectManualEvent('INJ-MAYDAY');
                else triggerCrevasseFallDistress();
              }}
              onToggleMute={toggleMuteAlarm}
              onAcknowledge={sim.isActive ? () => { if (sim.simDistress) sim.setSimDistress({ ...sim.simDistress, status: 'acknowledged' }); } : acknowledgeDistress}
              onResolve={sim.isActive ? () => { sim.setSimDistress(null); sim.recordIntervention(); } : resolveDistress}
              onLocateOnMap={() => {
                handleSetActiveWithSound('map');
              }}
            />
          </div>
        )}

        {/* Page Content */}
        <main className="p-6 flex-1">{page}</main>

        {/* Offline Cache Status Footer */}
        <Footer
          t={t}
          db={activeDb}
          currentDeviceId={currentDeviceId}
          currentDeviceType={currentDeviceType}
        />
      </div>

      {/* Emergency Distress Modal */}
      {isDistressModalOpen && (
        <EmergencyModal
          isOpen={isDistressModalOpen}
          assets={activeAssets}
          onClose={() => setIsDistressModalOpen(false)}
          onTriggerEmergencyBroadcast={(incidentData) => {
            if (sim.isActive) {
              sim.injectManualEvent('INJ-MAYDAY');
              setIsDistressModalOpen(false);
            } else {
              triggerDistress(incidentData);
              setIsDistressModalOpen(false);
            }
          }}
          onTriggerDistress={(type, description) => {
            if (sim.isActive) {
              sim.injectManualEvent('INJ-MAYDAY');
              setIsDistressModalOpen(false);
            } else {
              triggerDistress(type, description);
              setIsDistressModalOpen(false);
            }
          }}
          activeDistress={activeDistressAlert}
          onAcknowledge={sim.isActive ? () => { if (sim.simDistress) sim.setSimDistress({ ...sim.simDistress, status: 'acknowledged' }); } : acknowledgeDistress}
          onResolve={sim.isActive ? () => { sim.setSimDistress(null); sim.recordIntervention(); } : resolveDistress}
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
            if (sim.isActive) sim.injectManualEvent('INJ-MAYDAY');
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
    </div>
  );
}
