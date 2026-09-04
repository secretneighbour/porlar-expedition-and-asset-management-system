import React, { useState } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  PolarMap 
} from './components/PolarMap';
import { 
  AssetManagement 
} from './components/AssetManagement';
import { 
  ExpeditionTracker 
} from './components/ExpeditionTracker';
import { 
  LogisticsSupplies 
} from './components/LogisticsSupplies';
import { 
  EnvironmentalTelemetry 
} from './components/EnvironmentalTelemetry';
import { 
  DispatchLogbook 
} from './components/DispatchLogbook';
import { 
  EmergencyModal 
} from './components/EmergencyModal';
import { 
  AddAssetModal 
} from './components/AddAssetModal';
import { 
  AddExpeditionModal 
} from './components/AddExpeditionModal';
import {
  ActiveDistressBanner
} from './components/ActiveDistressBanner';
import {
  DevicePairingModal
} from './components/DevicePairingModal';
import {
  INITIAL_STATIONS,
  INITIAL_HAZARDS,
} from './data/polarData';
import { 
  PolarAsset, 
  Expedition, 
  HazardZone,
} from './types';
import { 
  Truck, 
  Navigation, 
  Package, 
  Radio, 
  Smartphone,
  Laptop,
  ShieldAlert,
  Send,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { usePolarSync } from './hooks/usePolarSync';

export default function App() {
  // Real-time authoritative sync hook (HTTP + WebSocket)
  const {
    region,
    conditionLevel,
    assets,
    expeditions,
    supplies,
    dispatchLogs,
    activeDistress,
    connectedClients,
    connectedDevices,
    currentDeviceId,
    currentDeviceType,
    switchDeviceRole,
    syncStatus,
    isAlarmMuted,
    toggleMuteAlarm,
    updateRegion,
    updateConditionLevel,
    updateAssetStatus,
    refuelAsset,
    addAsset,
    advanceWaypoint,
    updateExpeditionPhase,
    addExpedition,
    restockSupply,
    addDispatchLog,
    triggerDistress,
    acknowledgeDistress,
    resolveDistress,
    resetData,
  } = usePolarSync();

  const [hazards] = useState<HazardZone[]>(INITIAL_HAZARDS);

  // Selections & radar focus
  const [selectedAsset, setSelectedAsset] = useState<PolarAsset | null>(null);
  const [selectedExpedition, setSelectedExpedition] = useState<Expedition | null>(null);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<'assets' | 'expeditions' | 'supplies' | 'comms' | 'field_mobile'>('assets');

  // Modals
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddExpeditionModalOpen, setIsAddExpeditionModalOpen] = useState(false);

  // Quick field phone distress trigger form state
  const [mobileCallsign, setMobileCallsign] = useState('FIELD-SCOUT-01');
  const [mobileSector, setMobileSector] = useState('Leverett Glacier Approach');
  const [mobileCoords, setMobileCoords] = useState('-85.25, 151.10');
  const [mobileIncident, setMobileIncident] = useState('Crevasse Fall / Track Fracture');
  const [mobileReport, setMobileReport] = useState('Snowcat lead track dropped into crevasse slot void. 2 crew mild frostbite. Need urgent SAR.');

  // Handlers
  const handleResetData = () => {
    if (window.confirm('Reset all polar operational data to default master manifest across all connected devices?')) {
      resetData();
      setSelectedAsset(null);
      setSelectedExpedition(null);
    }
  };

  const handleRequestAirdrop = (supplyName: string) => {
    addDispatchLog({
      callsign: 'Otter Flight Control',
      severity: 'advisory',
      sector: 'Skiway Flight Corridor',
      message: `Emergency Twin Otter air-drop dispatched for: ${supplyName}. Parachute pallet deployed.`,
    });
  };

  const handleEmergencyBroadcast = (data: {
    incidentType: string;
    location: string;
    coordinates: string;
    summary: string;
    reporterCallsign?: string;
    reportedByDevice?: 'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ';
  }) => {
    // Parse coordinates if available
    let targetLat: number | undefined;
    let targetLng: number | undefined;
    const parts = data.coordinates.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      targetLat = parts[0];
      targetLng = parts[1];
      setFocusCoords({ lat: parts[0], lng: parts[1] });
    }

    triggerDistress({
      ...data,
      targetLat,
      targetLng,
    });
    setActiveTab('comms');
  };

  const handleLocateOnMap = (lat: number, lng: number) => {
    setFocusCoords({ lat, lng });
    // Switch to appropriate region if needed
    if (lat < 0 && region !== 'antarctica') {
      updateRegion('antarctica');
    } else if (lat > 0 && region !== 'arctic') {
      updateRegion('arctic');
    }
  };

  const handleMobileSubmitDistress = (e: React.FormEvent) => {
    e.preventDefault();
    handleEmergencyBroadcast({
      incidentType: mobileIncident,
      location: mobileSector,
      coordinates: mobileCoords,
      summary: mobileReport,
      reporterCallsign: mobileCallsign,
      reportedByDevice: 'Mobile Phone Field Unit',
    });
  };

  const criticalSuppliesCount = supplies.filter((s) => s.currentStock <= s.minThreshold).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Tactical Top Bar with Live Real-Time Sync Indicator */}
      <Header
        currentRegion={region}
        onSelectRegion={updateRegion}
        conditionLevel={conditionLevel}
        onChangeCondition={updateConditionLevel}
        onOpenDistressModal={() => setIsEmergencyModalOpen(true)}
        onOpenPairingModal={() => setIsPairingModalOpen(true)}
        onResetData={handleResetData}
        activeExpeditionsCount={expeditions.filter((e) => e.phase === 'in_progress').length}
        activeAssetsCount={assets.filter((a) => a.status === 'in_transit' || a.status === 'operational').length}
        alertsCount={criticalSuppliesCount}
        syncStatus={syncStatus}
        connectedClients={connectedClients}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        
        {/* Active Emergency Distress Warning Banner across HQ Laptop & Phone */}
        {activeDistress && (
          <ActiveDistressBanner
            distress={activeDistress}
            assets={assets}
            isMuted={isAlarmMuted}
            onToggleMute={toggleMuteAlarm}
            onAcknowledge={acknowledgeDistress}
            onResolve={resolveDistress}
            onLocateOnMap={handleLocateOnMap}
          />
        )}

        {/* Top Grid: Tactical Stereographic Radar Map (Left) & Realtime Sensor Telemetry (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Polar Map with Active Distress Marker & Radar Lock */}
          <div className="lg:col-span-7">
            <PolarMap
              region={region}
              stations={INITIAL_STATIONS}
              assets={assets}
              expeditions={expeditions}
              hazards={hazards}
              activeDistress={activeDistress}
              focusCoords={focusCoords}
              selectedAssetId={selectedAsset?.id}
              selectedExpeditionId={selectedExpedition?.id}
              onSelectAsset={(asset) => {
                setSelectedAsset(asset);
                if (asset) setActiveTab('assets');
              }}
              onSelectExpedition={(exp) => {
                setSelectedExpedition(exp);
                if (exp) setActiveTab('expeditions');
              }}
            />
          </div>

          {/* Environmental Telemetry & Stations Sensor HUD */}
          <div className="lg:col-span-5">
            <EnvironmentalTelemetry conditionLevel={conditionLevel} />
          </div>

        </div>

        {/* Bottom Operations Section: Tabs Navigation */}
        <div className="pt-2">
          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              id="tab-assets-btn"
              type="button"
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'assets'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>FLEET ASSETS & CRAWLERS ({assets.length})</span>
            </button>

            <button
              id="tab-expeditions-btn"
              type="button"
              onClick={() => setActiveTab('expeditions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'expeditions'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>EXPEDITION TRAVERSES ({expeditions.length})</span>
            </button>

            <button
              id="tab-supplies-btn"
              type="button"
              onClick={() => setActiveTab('supplies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'supplies'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>LOGISTICS & SURVIVAL DEPOT</span>
              {criticalSuppliesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="tab-comms-btn"
              type="button"
              onClick={() => setActiveTab('comms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'comms'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>RADIO DISPATCH & LOGS ({dispatchLogs.length})</span>
            </button>

            {/* Field Phone Mode Tab (For mobile data testing) */}
            <button
              id="tab-field-mobile-btn"
              type="button"
              onClick={() => setActiveTab('field_mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'field_mobile'
                  ? 'bg-rose-700 text-white shadow ring-2 ring-rose-400'
                  : 'text-rose-400 hover:text-white hover:bg-rose-950/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>FIELD PHONE MAYDAY TERMINAL</span>
              {activeDistress && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              )}
            </button>
          </div>

          {/* Active Tab Content Panel */}
          <div className="mt-3">
            {activeTab === 'assets' && (
              <AssetManagement
                assets={assets}
                selectedAssetId={selectedAsset?.id}
                onSelectAsset={setSelectedAsset}
                onUpdateAssetStatus={updateAssetStatus}
                onRefuelAsset={refuelAsset}
                onOpenAddModal={() => setIsAddAssetModalOpen(true)}
              />
            )}

            {activeTab === 'expeditions' && (
              <ExpeditionTracker
                expeditions={expeditions}
                selectedExpeditionId={selectedExpedition?.id}
                onSelectExpedition={setSelectedExpedition}
                onAdvanceWaypoint={advanceWaypoint}
                onUpdateExpeditionPhase={updateExpeditionPhase}
                onOpenAddModal={() => setIsAddExpeditionModalOpen(true)}
              />
            )}

            {activeTab === 'supplies' && (
              <LogisticsSupplies
                supplies={supplies}
                onRestockSupply={restockSupply}
                onRequestAirdrop={handleRequestAirdrop}
              />
            )}

            {activeTab === 'comms' && (
              <DispatchLogbook
                logs={dispatchLogs}
                onAddLog={addDispatchLog}
              />
            )}

            {/* Field Mobile Phone Simulation Tab */}
            {activeTab === 'field_mobile' && (
              <div className="bg-slate-900/90 rounded-xl border border-rose-600/60 p-4 sm:p-6 shadow-2xl font-mono text-xs">
                <div className="max-w-2xl mx-auto space-y-4">
                  
                  {/* Phone Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-600 text-rose-400">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                            MOBILE CELLULAR & IRIDIUM FIELD UNIT
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px]">
                            DATA LINK: ACTIVE
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white font-display uppercase tracking-wide">
                          ONE-TOUCH DISTRESS BEACON EMITTER
                        </h2>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block">BASE SERVER STATUS</span>
                      <span className="text-emerald-400 font-bold">{syncStatus.toUpperCase()} ({connectedClients} NODES)</span>
                    </div>
                  </div>

                  {/* Multi-Device Explanation Banner */}
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2 text-sky-400 font-bold uppercase">
                      <Laptop className="w-4 h-4" />
                      <span>HOW THE REAL-TIME LAPTOP-PHONE SYNC WORKS:</span>
                    </div>
                    <p className="text-slate-400">
                      When a field researcher presses the <strong>BROADCAST MAYDAY</strong> button below from their phone (or another browser tab), this event is instantly relayed via the NPM server's WebSocket bus. The operations console on the laptop immediately plays an emergency siren, flashes a full-width red alert banner, and queues a SAR crawler or ski-plane dispatch!
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPairingModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase transition-colors shadow"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SCAN QR CODE TO PAIR PHONE</span>
                      </button>
                      <span className="text-[10px] text-slate-400">
                        Current role: <strong className="text-white">{currentDeviceType === 'mobile_field' ? 'Mobile Field Unit' : 'Base Station HQ Console'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Current Active Distress Status for Phone */}
                  {activeDistress ? (
                    <div className={`p-4 rounded-xl border-2 space-y-3 ${
                      activeDistress.acknowledgedByHQ
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-100'
                        : 'bg-rose-950/80 border-rose-500 text-rose-100 animate-pulse'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/40">
                          {activeDistress.acknowledgedByHQ ? 'TRANSMISSION CONFIRMED BY HQ' : 'TRANSMITTING MAYDAY TO HQ...'}
                        </span>
                        <span className="text-[10px] opacity-80">
                          {new Date(activeDistress.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">
                        {activeDistress.incidentType} — {activeDistress.location}
                      </div>

                      {activeDistress.acknowledgedByHQ ? (
                        <div className="p-3 rounded-lg bg-emerald-900/60 border border-emerald-600 text-xs space-y-1">
                          <div className="flex items-center gap-2 text-white font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>HQ HAS RECEIVED YOUR MAYDAY!</span>
                          </div>
                          <p className="text-emerald-200 text-[11px]">
                            Sign-off by: <strong>{activeDistress.acknowledgedBy || 'Station Director'}</strong>
                          </p>
                          <p className="text-amber-300 font-bold text-[11px]">
                            DEPLOYED RESCUE ASSET: {activeDistress.dispatchedSARName || 'Rapid Response SAR Unit'}
                          </p>
                          <p className="text-slate-200 text-[10px] pt-1">
                            Recommendation: Hold current coordinates ({activeDistress.coordinates}). Conserve generator fuel and maintain radio watch on 121.5 MHz.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-rose-900/60 border border-rose-700 text-[11px] text-rose-200 flex items-center gap-2">
                          <Radio className="w-4 h-4 animate-spin shrink-0" />
                          <span>Pinging Base Operations Laptop... Waiting for dispatcher acknowledgment.</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={resolveDistress}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700 transition-colors"
                        >
                          STAND DOWN / CLEAR DISTRESS
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Mayday Emitter Form */
                    <form onSubmit={handleMobileSubmitDistress} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            PHONE CALLSIGN:
                          </label>
                          <input
                            type="text"
                            required
                            value={mobileCallsign}
                            onChange={(e) => setMobileCallsign(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            EMERGENCY TYPE:
                          </label>
                          <select
                            value={mobileIncident}
                            onChange={(e) => setMobileIncident(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
                          >
                            <option value="Crevasse Fall / Track Fracture">Crevasse Fall / Track Fracture</option>
                            <option value="Total Engine Cold-Seizure / Stranding">Total Engine Cold-Seizure / Stranding</option>
                            <option value="Severe Blizzard Hypothermia Crisis">Severe Blizzard Hypothermia Crisis</option>
                            <option value="Critical Traumatic Injury (MEDEVAC)">Critical Traumatic Injury (MEDEVAC)</option>
                            <option value="Whiteout Navigation Loss">Whiteout Navigation Loss</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            LOCATION / SECTOR:
                          </label>
                          <input
                            type="text"
                            required
                            value={mobileSector}
                            onChange={(e) => setMobileSector(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            COORDINATES (LAT, LNG):
                          </label>
                          <input
                            type="text"
                            required
                            value={mobileCoords}
                            onChange={(e) => setMobileCoords(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                          SITUATION SUMMARY:
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={mobileReport}
                          onChange={(e) => setMobileReport(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-xl shadow-rose-950/80 border border-rose-400"
                      >
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                        <span>BROADCAST MAYDAY OVER MOBILE DATA TO BASE LAPTOP</span>
                      </button>
                    </form>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-xs font-mono text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            INTERNATIONAL POLAR TRAVERSE CONSORTIUM // REAL-TIME DISTRESS & ASSET FLEET CONTROL
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SERVER SYNC: {syncStatus.toUpperCase()} ({connectedClients} ACTIVE NODES)</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        assets={assets}
        onTriggerEmergencyBroadcast={handleEmergencyBroadcast}
      />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onAddAsset={addAsset}
      />

      <AddExpeditionModal
        isOpen={isAddExpeditionModalOpen}
        onClose={() => setIsAddExpeditionModalOpen(false)}
        onAddExpedition={addExpedition}
        defaultRegion={region}
      />

      <DevicePairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        connectedClients={connectedClients}
        connectedDevices={connectedDevices}
        currentDeviceId={currentDeviceId}
        currentDeviceType={currentDeviceType}
        onSwitchDeviceRole={switchDeviceRole}
        onSimulateDistress={() => {
          handleEmergencyBroadcast({
            incidentType: 'Severe Crevasse Fall - Immediate Evac Needed',
            location: 'Union Glacier West Crevasse Field',
            coordinates: '-79.75, -82.90',
            summary: 'Field researcher snowmobile dropped 12 meters into hidden crevasse. Urgent SAR winch required.',
            reporterCallsign: 'FIELD PHONE SIMULATOR',
            reportedByDevice: 'Mobile Phone Field Unit',
          });
        }}
      />

    </div>
  );
}
