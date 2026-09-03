import React, { useState, useEffect } from 'react';
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
  INITIAL_STATIONS,
  INITIAL_ASSETS,
  INITIAL_EXPEDITIONS,
  INITIAL_SUPPLIES,
  INITIAL_HAZARDS,
  INITIAL_DISPATCH_LOGS,
} from './data/polarData';
import { 
  PolarRegion, 
  ConditionLevel, 
  PolarAsset, 
  Expedition, 
  SupplyItem, 
  DispatchLog, 
  HazardZone, 
  AssetStatus, 
  ExpeditionPhase 
} from './types';
import { Truck, Navigation, Package, Radio, CloudSnow } from 'lucide-react';

const STORAGE_KEYS = {
  REGION: 'polar_sys_region_v1',
  CONDITION: 'polar_sys_condition_v1',
  ASSETS: 'polar_sys_assets_v1',
  EXPEDITIONS: 'polar_sys_expeditions_v1',
  SUPPLIES: 'polar_sys_supplies_v1',
  LOGS: 'polar_sys_logs_v1',
};

export default function App() {
  // State with LocalStorage hydration
  const [region, setRegion] = useState<PolarRegion>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGION);
    return saved === 'arctic' ? 'arctic' : 'antarctica';
  });

  const [conditionLevel, setConditionLevel] = useState<ConditionLevel>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONDITION);
    return (saved as ConditionLevel) || 'COND-2_CAUTION';
  });

  const [assets, setAssets] = useState<PolarAsset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved assets', e);
      }
    }
    return INITIAL_ASSETS;
  });

  const [expeditions, setExpeditions] = useState<Expedition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPEDITIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved expeditions', e);
      }
    }
    return INITIAL_EXPEDITIONS;
  });

  const [supplies, setSupplies] = useState<SupplyItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved supplies', e);
      }
    }
    return INITIAL_SUPPLIES;
  });

  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved logs', e);
      }
    }
    return INITIAL_DISPATCH_LOGS;
  });

  const [hazards] = useState<HazardZone[]>(INITIAL_HAZARDS);

  // Selections
  const [selectedAsset, setSelectedAsset] = useState<PolarAsset | null>(null);
  const [selectedExpedition, setSelectedExpedition] = useState<Expedition | null>(null);

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<'assets' | 'expeditions' | 'supplies' | 'telemetry' | 'comms'>('assets');

  // Modals
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddExpeditionModalOpen, setIsAddExpeditionModalOpen] = useState(false);

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGION, region);
  }, [region]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONDITION, conditionLevel);
  }, [conditionLevel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPEDITIONS, JSON.stringify(expeditions));
  }, [expeditions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIES, JSON.stringify(supplies));
  }, [supplies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(dispatchLogs));
  }, [dispatchLogs]);

  // Handlers
  const handleResetData = () => {
    if (window.confirm('Reset all polar operational data to default master manifest?')) {
      localStorage.clear();
      setRegion('antarctica');
      setConditionLevel('COND-2_CAUTION');
      setAssets(INITIAL_ASSETS);
      setExpeditions(INITIAL_EXPEDITIONS);
      setSupplies(INITIAL_SUPPLIES);
      setDispatchLogs(INITIAL_DISPATCH_LOGS);
      setSelectedAsset(null);
      setSelectedExpedition(null);
    }
  };

  const handleUpdateAssetStatus = (assetId: string, newStatus: AssetStatus) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: newStatus } : a))
    );
  };

  const handleRefuelAsset = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, fuelOrBatteryPercent: 100 } : a))
    );
  };

  const handleAddAsset = (newAsset: PolarAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    // Also record dispatch log
    const log: DispatchLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'HQ Logistics Desk',
      severity: 'routine',
      sector: newAsset.currentLocation.name,
      message: `Asset ${newAsset.code} (${newAsset.name}) commissioned into active polar inventory.`,
    };
    setDispatchLogs((prev) => [log, ...prev]);
  };

  const handleAdvanceWaypoint = (expeditionId: string) => {
    setExpeditions((prev) =>
      prev.map((exp) => {
        if (exp.id !== expeditionId) return exp;
        const nextWpIndex = exp.waypoints.findIndex((w) => !w.passed);
        if (nextWpIndex === -1) return exp; // all already passed

        const updatedWaypoints = exp.waypoints.map((w, i) =>
          i === nextWpIndex ? { ...w, passed: true } : w
        );

        const advancedWp = exp.waypoints[nextWpIndex];
        const newDistance = Math.min(
          exp.totalDistanceKm,
          exp.distanceCoveredKm + (advancedWp.distanceFromPrevKm || 150)
        );

        // Update current coordinates
        return {
          ...exp,
          distanceCoveredKm: newDistance,
          currentLat: advancedWp.lat,
          currentLng: advancedWp.lng,
          waypoints: updatedWaypoints,
          phase: newDistance >= exp.totalDistanceKm ? 'completed' : exp.phase,
        };
      })
    );
  };

  const handleUpdateExpeditionPhase = (expeditionId: string, phase: ExpeditionPhase) => {
    setExpeditions((prev) =>
      prev.map((exp) => (exp.id === expeditionId ? { ...exp, phase } : exp))
    );
  };

  const handleAddExpedition = (newExp: Expedition) => {
    setExpeditions((prev) => [newExp, ...prev]);
    const log: DispatchLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'Operations Command',
      severity: 'routine',
      sector: newExp.region === 'antarctica' ? 'Antarctic Hub' : 'Arctic Hub',
      message: `Expedition ${newExp.code} (${newExp.name}) initiated by ${newExp.leader}. Target distance: ${newExp.totalDistanceKm}km.`,
    };
    setDispatchLogs((prev) => [log, ...prev]);
  };

  const handleRestockSupply = (supplyId: string, amount: number) => {
    setSupplies((prev) =>
      prev.map((item) =>
        item.id === supplyId
          ? {
              ...item,
              currentStock: item.currentStock + amount,
              status: item.currentStock + amount > item.minThreshold ? 'optimal' : 'low',
            }
          : item
      )
    );
  };

  const handleRequestAirdrop = (supplyName: string) => {
    const log: DispatchLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'Otter Flight Control',
      severity: 'advisory',
      sector: 'Skiway Flight Corridor',
      message: `Emergency Twin Otter air-drop dispatched for: ${supplyName}. Parachute pallet deployed.`,
    };
    setDispatchLogs((prev) => [log, ...prev]);
  };

  const handleAddDispatchLog = (newLog: Omit<DispatchLog, 'id' | 'timestamp'>) => {
    const log: DispatchLog = {
      ...newLog,
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
    };
    setDispatchLogs((prev) => [log, ...prev]);
  };

  const handleEmergencyBroadcast = (data: {
    incidentType: string;
    location: string;
    coordinates: string;
    summary: string;
  }) => {
    // Elevate condition to condition 1 blizzard/lockdown
    setConditionLevel('COND-1_SEVERE_BLIZZARD');

    const log: DispatchLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'MAYDAY RELAY HQ',
      severity: 'urgent_distress',
      sector: data.location,
      message: `*** MAYDAY DISTRESS BEACON ACTIVE *** Nature: ${data.incidentType}. Coords: ${data.coordinates}. Report: ${data.summary}`,
    };

    setDispatchLogs((prev) => [log, ...prev]);
    setActiveTab('comms');
  };

  const criticalSuppliesCount = supplies.filter((s) => s.currentStock <= s.minThreshold).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Tactical Top Bar */}
      <Header
        currentRegion={region}
        onSelectRegion={setRegion}
        conditionLevel={conditionLevel}
        onChangeCondition={setConditionLevel}
        onOpenDistressModal={() => setIsEmergencyModalOpen(true)}
        onResetData={handleResetData}
        activeExpeditionsCount={expeditions.filter((e) => e.phase === 'in_progress').length}
        activeAssetsCount={assets.filter((a) => a.status === 'in_transit' || a.status === 'operational').length}
        alertsCount={criticalSuppliesCount}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        
        {/* Top Grid: Tactical Stereographic Radar Map (Left) & Realtime Environmental Sensor Telemetry (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Polar Map (7 cols on large displays) */}
          <div className="lg:col-span-7">
            <PolarMap
              region={region}
              stations={INITIAL_STATIONS}
              assets={assets}
              expeditions={expeditions}
              hazards={hazards}
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

          {/* Environmental Telemetry & Stations Sensor HUD (5 cols on large displays) */}
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
              <span>RADIO DISPATCH & EVENT LOGS ({dispatchLogs.length})</span>
            </button>
          </div>

          {/* Active Tab Content Panel */}
          <div className="mt-3">
            {activeTab === 'assets' && (
              <AssetManagement
                assets={assets}
                selectedAssetId={selectedAsset?.id}
                onSelectAsset={setSelectedAsset}
                onUpdateAssetStatus={handleUpdateAssetStatus}
                onRefuelAsset={handleRefuelAsset}
                onOpenAddModal={() => setIsAddAssetModalOpen(true)}
              />
            )}

            {activeTab === 'expeditions' && (
              <ExpeditionTracker
                expeditions={expeditions}
                selectedExpeditionId={selectedExpedition?.id}
                onSelectExpedition={setSelectedExpedition}
                onAdvanceWaypoint={handleAdvanceWaypoint}
                onUpdateExpeditionPhase={handleUpdateExpeditionPhase}
                onOpenAddModal={() => setIsAddExpeditionModalOpen(true)}
              />
            )}

            {activeTab === 'supplies' && (
              <LogisticsSupplies
                supplies={supplies}
                onRestockSupply={handleRestockSupply}
                onRequestAirdrop={handleRequestAirdrop}
              />
            )}

            {activeTab === 'comms' && (
              <DispatchLogbook
                logs={dispatchLogs}
                onAddLog={handleAddDispatchLog}
              />
            )}
          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-xs font-mono text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            INTERNATIONAL POLAR TRAVERSE CONSORTIUM // OPERATIONAL WGS84 STEREOGRAPHIC SYSTEM
          </div>
          <div className="text-[11px] text-slate-600">
            ENCRYPTION: AES-256 IRIDIUM SATELLITE RELAY
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
        onAddAsset={handleAddAsset}
      />

      <AddExpeditionModal
        isOpen={isAddExpeditionModalOpen}
        onClose={() => setIsAddExpeditionModalOpen(false)}
        onAddExpedition={handleAddExpedition}
        defaultRegion={region}
      />

    </div>
  );
}
