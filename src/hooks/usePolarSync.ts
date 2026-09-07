import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PolarRegion,
  ConditionLevel,
  PolarAsset,
  Expedition,
  SupplyItem,
  DispatchLog,
  ActiveDistressAlert,
  PolarSystemState,
  SyncMessage,
  AssetStatus,
  ExpeditionPhase,
  ConnectedDevice,
  ResearchStation,
  Waypoint,
  PolarisDb,
} from '../types';
import {
  INITIAL_ASSETS,
  INITIAL_EXPEDITIONS,
  INITIAL_SUPPLIES,
  INITIAL_DISPATCH_LOGS,
  INITIAL_STATIONS,
} from '../data/polarData';
import {
  INITIAL_EXPEDITIONS as INITIAL_POLARIS_EXPEDITIONS,
  INITIAL_PERSONNEL,
  INITIAL_ASSETS as INITIAL_POLARIS_ASSETS,
  INITIAL_INVENTORY,
  INITIAL_SHIPMENTS,
  INITIAL_TRANSPORTATION,
  INITIAL_MAINTENANCE,
  INITIAL_TASKS,
  buildAlerts,
  INITIAL_EXPENSES,
  INITIAL_USERS,
  INITIAL_AUDIT_LOG,
  INITIAL_COMPLETED_WORK_LOGS,
} from '../data/polarisData';
import {
  startEmergencyAlarm,
  stopEmergencyAlarm,
  playTacticalChirp,
  playSuccessChime,
} from '../utils/audioAlert';

export type SyncConnectionStatus = 'connected' | 'connecting' | 'offline';

const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'terminal-init';
  try {
    let id = sessionStorage.getItem('polar_terminal_id');
    if (!id) {
      id = `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('polar_terminal_id', id);
    }
    return id;
  } catch {
    return `term-${Date.now().toString(36)}`;
  }
};

export function usePolarSync() {
  const [region, setRegion] = useState<PolarRegion>('antarctica');
  const [conditionLevel, setConditionLevel] = useState<ConditionLevel>('COND-2_CAUTION');
  const [assets, setAssets] = useState<PolarAsset[]>(INITIAL_ASSETS);
  const [expeditions, setExpeditions] = useState<Expedition[]>(INITIAL_EXPEDITIONS);
  const [supplies, setSupplies] = useState<SupplyItem[]>(INITIAL_SUPPLIES);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(INITIAL_DISPATCH_LOGS);
  const [activeDistress, setActiveDistress] = useState<ActiveDistressAlert | null>(null);
  const [stations, setStations] = useState<ResearchStation[]>(INITIAL_STATIONS);
  const [customWaypoints, setCustomWaypoints] = useState<Waypoint[]>([]);

  // POLARIS Main Database Realtime State
  const [polarisDb, setPolarisDbState] = useState<PolarisDb>(() => ({
    expeditions: INITIAL_POLARIS_EXPEDITIONS,
    personnel: INITIAL_PERSONNEL,
    assets: INITIAL_POLARIS_ASSETS,
    inventory: INITIAL_INVENTORY,
    shipments: INITIAL_SHIPMENTS,
    transportation: INITIAL_TRANSPORTATION,
    maintenance: INITIAL_MAINTENANCE,
    tasks: INITIAL_TASKS,
    alerts: buildAlerts(),
    expenses: INITIAL_EXPENSES,
    users: INITIAL_USERS,
    auditLog: INITIAL_AUDIT_LOG,
    completedWorkLogs: INITIAL_COMPLETED_WORK_LOGS,
  }));

  // Auto-detect mobile vs desktop
  const isMobileClient = typeof window !== 'undefined' && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
  const [currentDeviceId] = useState<string>(getOrCreateDeviceId);
  const [currentDeviceType, setCurrentDeviceType] = useState<'laptop_hq' | 'mobile_field'>(
    isMobileClient ? 'mobile_field' : 'laptop_hq'
  );

  // Real physical battery status monitoring via W3C Battery Status API
  const [localBattery, setLocalBattery] = useState<{ level?: number; isCharging?: boolean }>({});
  const localBatteryRef = useRef(localBattery);
  localBatteryRef.current = localBattery;

  useEffect(() => {
    let batteryObj: any = null;

    const updateBatteryStatus = () => {
      if (batteryObj) {
        setLocalBattery({
          level: Math.round((batteryObj.level ?? 1) * 100),
          isCharging: Boolean(batteryObj.charging),
        });
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryObj = battery;
          updateBatteryStatus();

          battery.addEventListener('levelchange', updateBatteryStatus);
          battery.addEventListener('chargingchange', updateBatteryStatus);
        })
        .catch((err: any) => {
          console.warn('[BATTERY] Battery Status API error or unsupported:', err);
        });
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', updateBatteryStatus);
        batteryObj.removeEventListener('chargingchange', updateBatteryStatus);
      }
    };
  }, []);

  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([
    {
      id: getOrCreateDeviceId(),
      type: isMobileClient ? 'mobile_field' : 'laptop_hq',
      name: isMobileClient ? 'Mobile Phone Field Unit' : 'Base Station HQ Console',
      lastSeen: Date.now(),
    }
  ]);
  const [syncStatus, setSyncStatus] = useState<SyncConnectionStatus>('connecting');
  const [isAlarmMuted, setIsAlarmMuted] = useState<boolean>(false);
  const [autoSarDispatchEnabled, setAutoSarDispatchEnabled] = useState<boolean>(true);

  // Check backend Autonomous SAR Dispatch status on mount
  useEffect(() => {
    fetch('/api/ai/sar/status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.autoSarDispatchEnabled === 'boolean') {
          setAutoSarDispatchEnabled(data.autoSarDispatchEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isAlarmMutedRef = useRef(isAlarmMuted);
  isAlarmMutedRef.current = isAlarmMuted;

  // Send message over WebSocket or fallback to HTTP
  const sendSyncMessage = useCallback((msg: SyncMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      // Fallback via HTTP REST
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: msg.type, payload: msg.payload }),
      }).catch((e) => console.warn('[SYNC] HTTP fallback failed:', e));
    }
  }, []);

  // Sync state from server object
  const applyServerState = useCallback((state: PolarSystemState) => {
    if (!state) return;
    if (state.region) setRegion(state.region);
    if (state.conditionLevel) setConditionLevel(state.conditionLevel);
    if (Array.isArray(state.assets)) setAssets(state.assets);
    if (Array.isArray(state.expeditions)) setExpeditions(state.expeditions);
    if (Array.isArray(state.supplies)) setSupplies(state.supplies);
    if (Array.isArray(state.dispatchLogs)) setDispatchLogs(state.dispatchLogs);
    if (Array.isArray(state.stations)) setStations(state.stations);
    if (Array.isArray(state.customWaypoints)) setCustomWaypoints(state.customWaypoints);
    if (state.polarisDb && typeof state.polarisDb === 'object') {
      setPolarisDbState(state.polarisDb);
    }

    // Distress state management
    if (state.activeDistress) {
      setActiveDistress(state.activeDistress);
      if (!state.activeDistress.acknowledgedByHQ && !isAlarmMutedRef.current) {
        startEmergencyAlarm();
      } else if (state.activeDistress.acknowledgedByHQ) {
        stopEmergencyAlarm();
      }
    } else {
      setActiveDistress(null);
      stopEmergencyAlarm();
    }
  }, []);

  const syncPolDb = useCallback(
    (updater: PolarisDb | ((prev: PolarisDb) => PolarisDb)) => {
      setPolarisDbState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        sendSyncMessage({
          type: 'UPDATE_POLARIS_DB',
          payload: next,
        });
        return next;
      });
    },
    [sendSyncMessage]
  );

  // Fetch initial state via HTTP
  const fetchInitialState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
        }
        if (data.connectedClients !== undefined) {
          setConnectedClients(data.connectedClients);
        }
        if (Array.isArray(data.devices)) {
          setConnectedDevices(data.devices);
        }
      }
    } catch (err) {
      console.warn('[SYNC] Initial HTTP state fetch failed, waiting for WebSocket:', err);
    }
  }, [applyServerState]);

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    setSyncStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[SYNC] Real-time WebSocket channel established with Polar Operations Server');
        setSyncStatus('connected');
        playTacticalChirp();

        // Immediately register this terminal
        const regMsg = {
          type: 'REGISTER_DEVICE' as const,
          payload: {
            deviceId: currentDeviceId,
            deviceType: currentDeviceType,
            deviceName: currentDeviceType === 'mobile_field' ? 'Mobile Phone Field Unit' : 'Base Station HQ Console',
            userAgent: navigator.userAgent,
            batteryLevel: localBatteryRef.current.level,
            isCharging: localBatteryRef.current.isCharging,
          },
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(regMsg));
      };

      ws.onmessage = (event) => {
        try {
          const msg: SyncMessage = JSON.parse(event.data);
          switch (msg.type) {
            case 'INIT_STATE':
              if (msg.payload) {
                applyServerState(msg.payload);
                if (msg.payload.connectedClients !== undefined) {
                  setConnectedClients(msg.payload.connectedClients);
                }
                if (Array.isArray(msg.payload.devices)) {
                  setConnectedDevices(msg.payload.devices);
                }
              }
              break;
            case 'STATE_UPDATE':
              if (msg.payload) {
                applyServerState(msg.payload);
              }
              break;
            case 'TRIGGER_DISTRESS':
              setActiveDistress(msg.payload);
              setConditionLevel('COND-1_SEVERE_BLIZZARD');
              if (!isAlarmMutedRef.current) {
                startEmergencyAlarm();
              }
              break;
            case 'ACKNOWLEDGE_DISTRESS':
              setActiveDistress(msg.payload);
              stopEmergencyAlarm();
              playSuccessChime();
              break;
            case 'RESOLVE_DISTRESS':
              setActiveDistress(null);
              stopEmergencyAlarm();
              setConditionLevel('COND-2_CAUTION');
              break;
            case 'PRESENCE_UPDATE':
              if (msg.payload?.connectedClients !== undefined) {
                setConnectedClients(msg.payload.connectedClients);
              }
              if (Array.isArray(msg.payload?.devices)) {
                setConnectedDevices(msg.payload.devices);
              }
              break;
            default:
              break;
          }
        } catch (e) {
          console.error('[SYNC] Failed to parse incoming WebSocket message:', e);
        }
      };

      ws.onerror = () => {
        // Silent error handler to avoid unhandled browser rejections
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Re-attempt WebSocket connection after 5 seconds
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = window.setTimeout(connectWebSocket, 5000);
        }
      };
    } catch (err) {
      wsRef.current = null;
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = window.setTimeout(connectWebSocket, 5000);
      }
    }
  }, [applyServerState]);

  useEffect(() => {
    fetchInitialState();
    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      stopEmergencyAlarm();
    };
  }, [fetchInitialState, connectWebSocket]);

  // Terminal heartbeat and state polling loop (every 3s)
  // Ensures active presence deduplication & seamless fallback even if WebSockets are blocked by proxies
  useEffect(() => {
    const sendHeartbeat = () => {
      const payload = {
        deviceId: currentDeviceId,
        deviceType: currentDeviceType,
        deviceName: currentDeviceType === 'mobile_field' ? 'Mobile Phone Field Unit' : 'Base Station HQ Console',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        batteryLevel: localBatteryRef.current.level,
        isCharging: localBatteryRef.current.isCharging,
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'HEARTBEAT',
            payload,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        // HTTP REST fallback for heartbeat and state sync
        fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.connectedClients !== undefined) setConnectedClients(data.connectedClients);
            if (Array.isArray(data.devices)) setConnectedDevices(data.devices);
            setSyncStatus('connected');
          })
          .catch(() => {
            setSyncStatus('offline');
          });

        // Sync full operational state over HTTP if WebSocket is closed
        fetch('/api/state')
          .then((r) => r.json())
          .then((data) => {
            if (data.state) {
              applyServerState(data.state);
            }
          })
          .catch(() => {});
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 3000);
    return () => clearInterval(interval);
  }, [currentDeviceId, currentDeviceType, applyServerState]);

  // Operational Actions (propagated across all connected devices)

  const triggerDistress = useCallback(
    (
      dataOrType:
        | string
        | {
            incidentType: string;
            location: string;
            coordinates: string;
            summary: string;
            reporterCallsign?: string;
            reportedByDevice?: 'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ';
            targetLat?: number;
            targetLng?: number;
          },
      maybeDescription?: string
    ) => {
      let payload: any;
      if (typeof dataOrType === 'string') {
        payload = {
          incidentType: dataOrType,
          location: 'Leverett Glacier Approach (85.2°S, 151.1°E)',
          coordinates: '-85.25, 151.10',
          summary: maybeDescription || 'Emergency beacon triggered from remote field device.',
          reporterCallsign: 'EXP-701 FIELD MOBILE',
          reportedByDevice: 'Mobile Phone Field Unit',
          targetLat: -85.25,
          targetLng: 151.10,
        };
      } else {
        payload = dataOrType;
      }

      sendSyncMessage({
        type: 'TRIGGER_DISTRESS',
        payload,
        timestamp: new Date().toISOString(),
      });
      // Start local alarm immediately
      if (!isAlarmMutedRef.current) {
        startEmergencyAlarm();
      }
    },
    [sendSyncMessage]
  );

  const toggleAutoSarMode = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/sar/toggle', { method: 'POST' });
      const data = await res.json();
      if (typeof data.autoSarDispatchEnabled === 'boolean') {
        setAutoSarDispatchEnabled(data.autoSarDispatchEnabled);
        return data.autoSarDispatchEnabled;
      }
    } catch (e) {
      console.error('Failed to toggle auto SAR mode:', e);
    }
    return autoSarDispatchEnabled;
  }, [autoSarDispatchEnabled]);

  const triggerCrevasseFallDistress = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/sar/dispatch-crevasse-fall', { method: 'POST' });
      const data = await res.json();
      if (data.alert) {
        setActiveDistress(data.alert);
      }
      playSuccessChime();
    } catch (e) {
      console.error('Failed to trigger crevasse fall scenario:', e);
    }
  }, []);

  const acknowledgeDistress = useCallback(
    (data: { acknowledgedBy: string; dispatchedSARAssetId?: string; dispatchedSARName?: string }) => {
      sendSyncMessage({
        type: 'ACKNOWLEDGE_DISTRESS',
        payload: data,
        timestamp: new Date().toISOString(),
      });
      stopEmergencyAlarm();
      playSuccessChime();
    },
    [sendSyncMessage]
  );

  const resolveDistress = useCallback(() => {
    sendSyncMessage({
      type: 'RESOLVE_DISTRESS',
      timestamp: new Date().toISOString(),
    });
    stopEmergencyAlarm();
  }, [sendSyncMessage]);

  const updateDistressLocation = useCallback(
    (lat: number, lng: number) => {
      if (activeDistress) {
        const updated = {
          ...activeDistress,
          targetLat: lat,
          targetLng: lng,
          coordinates: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          location: `Device Locked Fix (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
        };
        setActiveDistress(updated);
        sendSyncMessage({
          type: 'TRIGGER_DISTRESS',
          payload: updated,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [activeDistress, sendSyncMessage]
  );

  const toggleMuteAlarm = useCallback(() => {
    setIsAlarmMuted((prev) => {
      const next = !prev;
      if (next) {
        stopEmergencyAlarm();
      } else if (activeDistress && !activeDistress.acknowledgedByHQ) {
        startEmergencyAlarm();
      }
      return next;
    });
  }, [activeDistress]);

  const updateRegion = useCallback(
    (newRegion: PolarRegion) => {
      setRegion(newRegion);
      sendSyncMessage({ type: 'UPDATE_REGION', payload: newRegion });
    },
    [sendSyncMessage]
  );

  const updateConditionLevel = useCallback(
    (newLevel: ConditionLevel) => {
      setConditionLevel(newLevel);
      sendSyncMessage({ type: 'UPDATE_CONDITION', payload: newLevel });
    },
    [sendSyncMessage]
  );

  const updateAssetStatus = useCallback(
    (assetId: string, status: AssetStatus) => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return;
      const updated = { ...asset, status };
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
      sendSyncMessage({ type: 'UPDATE_ASSET', payload: updated });
    },
    [assets, sendSyncMessage]
  );

  const refuelAsset = useCallback(
    (assetId: string) => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return;
      const updated = { ...asset, fuelOrBatteryPercent: 100 };
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
      sendSyncMessage({ type: 'UPDATE_ASSET', payload: updated });
    },
    [assets, sendSyncMessage]
  );

  const addAsset = useCallback(
    (newAsset: PolarAsset) => {
      setAssets((prev) => [newAsset, ...prev]);
      sendSyncMessage({ type: 'UPDATE_ASSET', payload: newAsset });
      // Add log
      const log: DispatchLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
        callsign: 'HQ Logistics Desk',
        severity: 'routine',
        sector: newAsset.currentLocation.name,
        message: `Asset ${newAsset.code} (${newAsset.name}) commissioned into active polar inventory.`,
      };
      setDispatchLogs((prev) => [log, ...prev]);
      sendSyncMessage({ type: 'ADD_DISPATCH_LOG', payload: log });
    },
    [sendSyncMessage]
  );

  const advanceWaypoint = useCallback(
    (expeditionId: string) => {
      const exp = expeditions.find((e) => e.id === expeditionId);
      if (!exp) return;
      const nextWpIndex = exp.waypoints.findIndex((w) => !w.passed);
      if (nextWpIndex === -1) return;

      const updatedWaypoints = exp.waypoints.map((w, i) =>
        i === nextWpIndex ? { ...w, passed: true } : w
      );

      const advancedWp = exp.waypoints[nextWpIndex];
      const newDistance = Math.min(
        exp.totalDistanceKm,
        exp.distanceCoveredKm + (advancedWp.distanceFromPrevKm || 150)
      );

      const updatedExp: Expedition = {
        ...exp,
        distanceCoveredKm: newDistance,
        currentLat: advancedWp.lat,
        currentLng: advancedWp.lng,
        waypoints: updatedWaypoints,
        phase: newDistance >= exp.totalDistanceKm ? 'completed' : exp.phase,
      };

      setExpeditions((prev) => prev.map((e) => (e.id === expeditionId ? updatedExp : e)));
      sendSyncMessage({ type: 'UPDATE_EXPEDITION', payload: updatedExp });
    },
    [expeditions, sendSyncMessage]
  );

  const updateExpeditionPhase = useCallback(
    (expeditionId: string, phase: ExpeditionPhase) => {
      const exp = expeditions.find((e) => e.id === expeditionId);
      if (!exp) return;
      const updated = { ...exp, phase };
      setExpeditions((prev) => prev.map((e) => (e.id === expeditionId ? updated : e)));
      sendSyncMessage({ type: 'UPDATE_EXPEDITION', payload: updated });
    },
    [expeditions, sendSyncMessage]
  );

  const addExpedition = useCallback(
    (newExp: Expedition) => {
      setExpeditions((prev) => [newExp, ...prev]);
      sendSyncMessage({ type: 'UPDATE_EXPEDITION', payload: newExp });
      const log: DispatchLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
        callsign: 'Operations Command',
        severity: 'routine',
        sector: newExp.region === 'antarctica' ? 'Antarctic Hub' : 'Arctic Hub',
        message: `Expedition ${newExp.code} (${newExp.name}) initiated by ${newExp.leader}. Target distance: ${newExp.totalDistanceKm}km.`,
      };
      setDispatchLogs((prev) => [log, ...prev]);
      sendSyncMessage({ type: 'ADD_DISPATCH_LOG', payload: log });
    },
    [sendSyncMessage]
  );

  const restockSupply = useCallback(
    (supplyId: string, amount: number) => {
      const item = supplies.find((s) => s.id === supplyId);
      if (!item) return;
      const updated: SupplyItem = {
        ...item,
        currentStock: item.currentStock + amount,
        status: item.currentStock + amount > item.minThreshold ? 'optimal' : 'low',
      };
      setSupplies((prev) => prev.map((s) => (s.id === supplyId ? updated : s)));
      sendSyncMessage({ type: 'RESTOCK_SUPPLY', payload: updated });
    },
    [supplies, sendSyncMessage]
  );

  const addDispatchLog = useCallback(
    (newLog: Omit<DispatchLog, 'id' | 'timestamp'>) => {
      const log: DispatchLog = {
        ...newLog,
        id: `log-${Date.now()}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      };
      setDispatchLogs((prev) => [log, ...prev]);
      sendSyncMessage({ type: 'ADD_DISPATCH_LOG', payload: log });
    },
    [sendSyncMessage]
  );

  const addStation = useCallback(
    (newStation: ResearchStation) => {
      setStations((prev) => [newStation, ...prev]);
      sendSyncMessage({ type: 'ADD_STATION', payload: newStation });
      const log: DispatchLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
        callsign: 'Operations Command',
        severity: 'routine',
        sector: newStation.name,
        message: `New polar base station ${newStation.code} (${newStation.name}) commissioned in sector ${newStation.region.toUpperCase()}. Elevation: ${newStation.elevationM}m, Runway: ${newStation.runwayType}.`,
      };
      setDispatchLogs((prev) => [log, ...prev]);
      sendSyncMessage({ type: 'ADD_DISPATCH_LOG', payload: log });
      playSuccessChime();
    },
    [sendSyncMessage]
  );

  const addWaypoint = useCallback(
    (newWaypoint: Waypoint, expeditionId?: string) => {
      if (expeditionId) {
        setExpeditions((prev) =>
          prev.map((e) => {
            if (e.id !== expeditionId) return e;
            const updatedWaypoints = [...e.waypoints, newWaypoint];
            const distAdd = Number(newWaypoint.distanceFromPrevKm) || 45;
            return {
              ...e,
              waypoints: updatedWaypoints,
              totalDistanceKm: e.totalDistanceKm + distAdd,
            };
          })
        );
        sendSyncMessage({
          type: 'ADD_WAYPOINT',
          payload: { waypoint: newWaypoint, expeditionId },
        });
        const log: DispatchLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
          callsign: 'Navigations Desk',
          severity: 'routine',
          sector: newWaypoint.name,
          message: `Waypoint ${newWaypoint.name} (${newWaypoint.lat.toFixed(2)}°, ${newWaypoint.lng.toFixed(2)}°) added to Expedition ${expeditionId}.`,
        };
        setDispatchLogs((prev) => [log, ...prev]);
        sendSyncMessage({ type: 'ADD_DISPATCH_LOG', payload: log });
      } else {
        setCustomWaypoints((prev) => [newWaypoint, ...prev]);
        sendSyncMessage({
          type: 'ADD_WAYPOINT',
          payload: { waypoint: newWaypoint },
        });
        const log: DispatchLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
          callsign: 'Field Unit',
          severity: 'routine',
          sector: newWaypoint.name,
          message: `Tactical field waypoint ${newWaypoint.name} registered at ${newWaypoint.lat.toFixed(4)}°, ${newWaypoint.lng.toFixed(4)}°.`,
        };
        setDispatchLogs((prev) => [log, ...prev]);
        sendSyncMessage({ type: 'ADD_DISPATCH_LOG', payload: log });
      }
      playSuccessChime();
    },
    [sendSyncMessage]
  );

  const deleteWaypoint = useCallback(
    (waypointId: string, expeditionId?: string) => {
      if (expeditionId) {
        setExpeditions((prev) =>
          prev.map((e) => {
            if (e.id !== expeditionId) return e;
            const updatedWaypoints = e.waypoints.filter((w) => w.id !== waypointId);
            return {
              ...e,
              waypoints: updatedWaypoints,
            };
          })
        );
        sendSyncMessage({
          type: 'DELETE_WAYPOINT',
          payload: { waypointId, expeditionId },
        });
      } else {
        setCustomWaypoints((prev) => prev.filter((w) => w.id !== waypointId));
        setExpeditions((prev) =>
          prev.map((e) => ({
            ...e,
            waypoints: e.waypoints.filter((w) => w.id !== waypointId),
          }))
        );
        sendSyncMessage({
          type: 'DELETE_WAYPOINT',
          payload: { waypointId },
        });
      }
      playSuccessChime();
    },
    [sendSyncMessage]
  );

  const updateWaypoint = useCallback(
    (updatedWaypoint: Waypoint, expeditionId?: string) => {
      if (expeditionId) {
        setExpeditions((prev) =>
          prev.map((e) => {
            if (e.id !== expeditionId) return e;
            const updatedWaypoints = e.waypoints.map((w) =>
              w.id === updatedWaypoint.id ? updatedWaypoint : w
            );
            return {
              ...e,
              waypoints: updatedWaypoints,
            };
          })
        );
        sendSyncMessage({
          type: 'UPDATE_WAYPOINT',
          payload: { waypoint: updatedWaypoint, expeditionId },
        });
      } else {
        setCustomWaypoints((prev) =>
          prev.map((w) => (w.id === updatedWaypoint.id ? updatedWaypoint : w))
        );
        setExpeditions((prev) =>
          prev.map((e) => ({
            ...e,
            waypoints: e.waypoints.map((w) => (w.id === updatedWaypoint.id ? updatedWaypoint : w)),
          }))
        );
        sendSyncMessage({
          type: 'UPDATE_WAYPOINT',
          payload: { waypoint: updatedWaypoint },
        });
      }
      playSuccessChime();
    },
    [sendSyncMessage]
  );

  const resetData = useCallback(() => {
    fetch('/api/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.state) applyServerState(data.state);
      })
      .catch(() => {
        sendSyncMessage({ type: 'RESET_STATE' });
      });
  }, [applyServerState, sendSyncMessage]);

  return {
    region,
    conditionLevel,
    assets,
    expeditions,
    supplies,
    dispatchLogs,
    activeDistress,
    stations,
    customWaypoints,
    connectedClients,
    syncStatus,
    isAlarmMuted,
    toggleMuteAlarm,
    updateRegion,
    updateConditionLevel,
    updateAssetStatus,
    refuelAsset,
    addAsset,
    addStation,
    addWaypoint,
    deleteWaypoint,
    updateWaypoint,
    advanceWaypoint,
    updateExpeditionPhase,
    addExpedition,
    restockSupply,
    addDispatchLog,
    triggerDistress,
    acknowledgeDistress,
    resolveDistress,
    updateDistressLocation,
    autoSarDispatchEnabled,
    toggleAutoSarMode,
    triggerCrevasseFallDistress,
    resetData,
    polarisDb,
    syncPolDb,
    sendSyncMessage,
    currentDeviceId,
    currentDeviceType,
    connectedDevices,
    switchDeviceRole: (role: 'laptop_hq' | 'mobile_field') => setCurrentDeviceType(role),
  };
}
