import React, { useState } from 'react';
import {
  THEME, PERMISSIONS, INITIAL_EXPEDITIONS, INITIAL_PERSONNEL, INITIAL_ASSETS,
  INITIAL_INVENTORY, INITIAL_SHIPMENTS, INITIAL_TRANSPORTATION, INITIAL_MAINTENANCE,
  INITIAL_TASKS, buildAlerts, INITIAL_EXPENSES, INITIAL_USERS, INITIAL_AUDIT_LOG,
  ROLES, FIRST, LAST, pick
} from './data/polarisData';
import { Sidebar, Topbar } from './components/polaris/Shell';
import { LoginView } from './components/polaris/ViewsPart2';
import { DashboardView } from './components/polaris/DashboardView';
import { Expeditions, ExpeditionDetail } from './components/polaris/ExpeditionsView';
import { Personnel, Assets, Inventory, Shipments, Transportation, Maintenance, Tasks } from './components/polaris/Modules';
import { MapView, Alerts, Expenses, Reports, AuditLog, UsersPage, SettingsPage } from './components/polaris/ViewsPart2';
import { ActiveDistressBanner } from './components/ActiveDistressBanner';
import { DevicePairingModal } from './components/DevicePairingModal';
import { EmergencyModal } from './components/EmergencyModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import { PreBootSystemCheck } from './components/polaris/PreBootSystemCheck';
import { usePolarSync } from './hooks/usePolarSync';
import { ShieldAlert, Radio, Key, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const t = THEME[theme];
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
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
  };

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

  const allowed = user ? (PERMISSIONS[user.role] || PERMISSIONS['Super Admin']) : [];
  const canEdit = user ? ['Super Admin', 'Expedition Manager', 'Logistics Officer', 'Asset Manager'].includes(user.role) : false;
  const unread = db.alerts.filter((a: any) => !a.read).length;

  if (!user) {
    return (
      <LoginView
        t={t}
        theme={theme}
        setTheme={setTheme}
        onLogin={(role) => {
          const name = `${pick(FIRST, ROLES.indexOf(role) + 2)} ${pick(LAST, ROLES.indexOf(role) + 4)}`;
          setUser({ name, role });
          setHasCompletedPreBoot(false);
          setActive('dashboard');
        }}
      />
    );
  }

  // Pre-Boot System Check Terminal Screen before initializing dashboard
  if (!hasCompletedPreBoot) {
    return (
      <PreBootSystemCheck
        onComplete={() => setHasCompletedPreBoot(true)}
        onSkip={() => setHasCompletedPreBoot(true)}
      />
    );
  }

  const openDetail = (id: string) => {
    setExpDetailId(id);
    setActive('expedition-detail');
  };

  let page = null;
  if (active === 'dashboard') page = <DashboardView t={t} db={db} user={user} geminiApiKey={geminiApiKey} setActive={setActive} setDb={setDb} />;
  else if (active === 'expeditions') page = <Expeditions t={t} db={db} setDb={setDb} openDetail={openDetail} canEdit={canEdit} />;
  else if (active === 'expedition-detail' && expDetailId) page = <ExpeditionDetail t={t} db={db} expId={expDetailId} onBack={() => setActive('expeditions')} />;
  else if (active === 'personnel') page = <Personnel t={t} db={db} setDb={setDb} canEdit={canEdit} />;
  else if (active === 'assets') page = <Assets t={t} db={db} setDb={setDb} canEdit={canEdit} />;
  else if (active === 'inventory') page = <Inventory t={t} db={db} setDb={setDb} canEdit={canEdit} />;
  else if (active === 'shipments') page = <Shipments t={t} db={db} setDb={setDb} canEdit={canEdit} />;
  else if (active === 'transportation') page = <Transportation t={t} db={db} />;
  else if (active === 'maintenance') page = <Maintenance t={t} db={db} setDb={setDb} canEdit={canEdit} geminiApiKey={geminiApiKey} />;
  else if (active === 'tasks') page = <Tasks t={t} db={db} setDb={setDb} canEdit={canEdit} />;
  else if (active === 'map') page = <MapView t={t} db={db} setDb={setDb} activeDistress={activeDistress} updateDistressLocation={updateDistressLocation} googleMapsApiKey={googleMapsApiKey} onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)} />;
  else if (active === 'alerts') page = <Alerts t={t} db={db} setDb={setDb} />;
  else if (active === 'expenses') page = <Expenses t={t} db={db} />;
  else if (active === 'reports') page = <Reports t={t} db={db} />;
  else if (active === 'audit') page = <AuditLog t={t} db={db} />;
  else if (active === 'users') page = <UsersPage t={t} db={db} />;
  else if (active === 'settings') page = <SettingsPage t={t} theme={theme} setTheme={setTheme} user={user} onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }} className="flex text-slate-100 font-sans">
      <Sidebar
        t={t}
        theme={theme}
        active={active === 'expedition-detail' ? 'expeditions' : active}
        setActive={setActive}
        allowed={allowed}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Topbar
          t={t}
          theme={theme}
          setTheme={setTheme}
          user={user}
          onLogout={() => setUser(null)}
          unread={unread}
          setActive={setActive}
          onOpenPreBoot={() => setIsPreBootModalOpen(true)}
        />

        {/* Real-time Telemetry & Distress Toolbar Sub-header */}
        <div style={{ background: t.panelAlt, borderBottom: `1px solid ${t.border}` }} className="px-6 py-2 flex items-center justify-between text-xs gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono">
              {syncStatus === 'synced' ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
              <span className={syncStatus === 'synced' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {syncStatus === 'synced' ? 'LIVE SYNC' : 'OFFLINE HYBRID'}
              </span>
            </div>
            <span style={{ color: t.textFaint }}>|</span>
            <span style={{ color: t.textDim }}>Connected Terminals: <strong style={{ color: t.text }}>{connectedClients}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAutoSarMode()}
              style={{ background: t.bgAlt, border: `1px solid ${autoSarDispatchEnabled ? 'rgba(16, 185, 129, 0.4)' : t.border}`, color: autoSarDispatchEnabled ? '#34d399' : t.textDim }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-white/10 cursor-pointer text-xs font-semibold"
              title="Toggle between Autonomous S.A.R. Dispatch vs Manual Operator Mode"
            >
              <span className={`w-2 h-2 rounded-full ${autoSarDispatchEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Auto-SAR: {autoSarDispatchEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => triggerCrevasseFallDistress()}
              style={{ background: t.bgAlt, border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fda4af' }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-rose-950/40 cursor-pointer font-medium text-xs shadow-sm"
              title="Simulate Crevasse Fall distress beacon with AI Autonomous Zero-Click Dispatch"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sim Crevasse Fall (Auto S.A.R.)</span>
              <span className="sm:hidden">Auto S.A.R.</span>
            </button>

            <button
              onClick={() => setIsPairingModalOpen(true)}
              style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-white/10 cursor-pointer font-medium"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Nodes & Pair</span>
            </button>

            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.textDim }}
              className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsDistressModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wide cursor-pointer shadow-sm animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS MAYDAY</span>
            </button>
          </div>
        </div>

        {/* Active Emergency Distress Banner */}
        {activeDistress && (
          <div className="px-6 pt-3">
            <ActiveDistressBanner
              distress={activeDistress}
              activeDistress={activeDistress}
              assets={assets}
              isMuted={isAlarmMuted}
              isAlarmMuted={isAlarmMuted}
              autoSarDispatchEnabled={autoSarDispatchEnabled}
              onToggleAutoSar={toggleAutoSarMode}
              onTriggerCrevasseFall={triggerCrevasseFallDistress}
              onToggleMute={toggleMuteAlarm}
              onAcknowledge={acknowledgeDistress}
              onResolve={resolveDistress}
              onLocateOnMap={() => {
                setActive('map');
              }}
            />
          </div>
        )}

        {/* Page Content */}
        <main className="p-6 flex-1">{page}</main>

        {/* Offline Cache Status Footer */}
        <Footer
          t={t}
          db={db}
          currentDeviceId={currentDeviceId}
          currentDeviceType={currentDeviceType}
        />
      </div>

      {/* Emergency Distress Modal */}
      {isDistressModalOpen && (
        <EmergencyModal
          isOpen={isDistressModalOpen}
          assets={assets}
          onClose={() => setIsDistressModalOpen(false)}
          onTriggerEmergencyBroadcast={(incidentData) => {
            triggerDistress(incidentData);
            setIsDistressModalOpen(false);
          }}
          onTriggerDistress={(type, description) => {
            triggerDistress(type, description);
            setIsDistressModalOpen(false);
          }}
          activeDistress={activeDistress}
          onAcknowledge={acknowledgeDistress}
          onResolve={resolveDistress}
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
          onSimulateDistress={() => triggerDistress('Simulated Mobile Mayday', 'Emergency test trigger from pairing modal.')}
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
    </div>
  );
}
