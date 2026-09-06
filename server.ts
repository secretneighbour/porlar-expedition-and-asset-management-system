import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ASSETS,
  INITIAL_EXPEDITIONS,
  INITIAL_SUPPLIES,
  INITIAL_DISPATCH_LOGS,
  INITIAL_STATIONS,
} from './src/data/polarData.js';
import { PolarSystemState, ActiveDistressAlert, SyncMessage, ConnectedDevice } from './src/types.js';
import os from 'os';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const HOST = '0.0.0.0';
const STATE_FILE_PATH = path.join(os.tmpdir(), 'polar-state.json');
const LOCAL_FALLBACK_STATE = path.join(process.cwd(), 'polar-state.json');

// Real-time active devices registry (deduplicated by deviceId)
const activeDevices = new Map<string, ConnectedDevice>();

function getDeviceList(): ConnectedDevice[] {
  return Array.from(activeDevices.values());
}

// Initialize system state from disk or defaults
function loadInitialState(): PolarSystemState {
  try {
    const targetPath = fs.existsSync(STATE_FILE_PATH)
      ? STATE_FILE_PATH
      : fs.existsSync(LOCAL_FALLBACK_STATE)
      ? LOCAL_FALLBACK_STATE
      : null;

    if (targetPath) {
      const data = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.assets) && Array.isArray(parsed.expeditions)) {
        if (!parsed.stations || !Array.isArray(parsed.stations)) {
          parsed.stations = INITIAL_STATIONS;
        }
        if (!parsed.customWaypoints || !Array.isArray(parsed.customWaypoints)) {
          parsed.customWaypoints = [];
        }
        console.log(`[POLAR-SERVER] Authoritative state loaded from persistent storage (${targetPath}).`);
        return parsed;
      }
    }
  } catch (err: any) {
    console.error('[POLAR-SERVER] Error reading polar-state.json, defaulting to master manifest:', err.message);
  }

  return {
    region: 'antarctica',
    conditionLevel: 'COND-2_CAUTION',
    assets: INITIAL_ASSETS,
    expeditions: INITIAL_EXPEDITIONS,
    supplies: INITIAL_SUPPLIES,
    dispatchLogs: INITIAL_DISPATCH_LOGS,
    activeDistress: null,
    stations: INITIAL_STATIONS,
    customWaypoints: [],
    lastUpdated: new Date().toISOString(),
  };
}

let systemState: PolarSystemState = loadInitialState();

// Save state to disk asynchronously with debounce
let saveTimeout: NodeJS.Timeout | null = null;
function persistState() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      systemState.lastUpdated = new Date().toISOString();
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(systemState, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[POLAR-SERVER] Failed to persist state to disk:', err.message);
    }
  }, 300);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Broadcast to all active WebSocket clients
  function broadcast(msg: SyncMessage) {
    const data = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  function broadcastPresence() {
    const devices = getDeviceList();
    broadcast({
      type: 'PRESENCE_UPDATE',
      payload: { 
        connectedClients: devices.length,
        devices,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Periodic inactive terminal cleanup (runs every 2.5s)
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, dev] of activeDevices.entries()) {
      // If no heartbeat for 8 seconds, prune dead terminal
      if (now - dev.lastSeen > 8000) {
        activeDevices.delete(id);
        changed = true;
        console.log(`[POLAR-SERVER] Terminal timed out / disconnected: ${dev.name} (${id})`);
      }
    }
    if (changed) {
      broadcastPresence();
    }
  }, 2500);

  // Simulated Polar Battery & Fuel Drain Loop (every 4 seconds)
  // Slowly drains battery based on active status: in_transit (high), operational (medium), cold_soaked (subzero parasitic)
  setInterval(() => {
    if (!systemState.assets || systemState.assets.length === 0) return;
    let anyChanged = false;

    systemState.assets = systemState.assets.map((asset) => {
      let drainAmount = 0;
      let chargeAmount = 0;

      switch (asset.status) {
        case 'in_transit':
          // Active traverse or flight in progress (high discharge)
          drainAmount = 1;
          break;
        case 'operational':
          // Systems online, generator / equipment running (moderate discharge)
          drainAmount = Math.random() > 0.4 ? 1 : 0;
          break;
        case 'cold_soaked':
          // Extreme sub-zero parasitic battery drain
          drainAmount = Math.random() > 0.7 ? 1 : 0;
          break;
        case 'standby':
          // Very low standby idle discharge
          drainAmount = Math.random() > 0.9 ? 1 : 0;
          break;
        case 'maintenance':
          // In maintenance depot: slowly recharge
          if (asset.fuelOrBatteryPercent < 100) {
            chargeAmount = 2;
          }
          break;
        default:
          break;
      }

      let newPercent = asset.fuelOrBatteryPercent;
      if (drainAmount > 0) {
        newPercent = Math.max(0, asset.fuelOrBatteryPercent - drainAmount);
      } else if (chargeAmount > 0) {
        newPercent = Math.min(100, asset.fuelOrBatteryPercent + chargeAmount);
      }

      if (newPercent !== asset.fuelOrBatteryPercent) {
        anyChanged = true;
        return {
          ...asset,
          fuelOrBatteryPercent: newPercent,
          status: newPercent === 0 && asset.status === 'in_transit' ? 'cold_soaked' : asset.status,
        };
      }
      return asset;
    });

    if (anyChanged) {
      persistState();
      broadcast({
        type: 'STATE_UPDATE',
        payload: systemState,
        timestamp: new Date().toISOString(),
      });
    }
  }, 4000);

  // REST API Endpoints for State & Distress Actions
  app.get('/api/state', (req, res) => {
    const devices = getDeviceList();
    res.json({
      status: 'ok',
      connectedClients: devices.length,
      devices,
      state: systemState,
    });
  });

  app.get('/api/health', (req, res) => {
    const devices = getDeviceList();
    res.json({ status: 'ok', time: new Date().toISOString(), clients: devices.length, devices });
  });

  // Terminal heartbeat registration (works via HTTP fallback as well)
  app.post('/api/heartbeat', (req, res) => {
    const { deviceId, deviceType, deviceName, userAgent } = req.body;
    if (deviceId) {
      activeDevices.set(deviceId, {
        id: deviceId,
        type: deviceType || 'laptop_hq',
        name: deviceName || (deviceType === 'mobile_field' ? 'Mobile Field Unit' : 'HQ Laptop Console'),
        userAgent: userAgent || (req.headers['user-agent'] as string) || '',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
        lastSeen: Date.now(),
      });
      broadcastPresence();
    }
    const devices = getDeviceList();
    res.json({
      status: 'ok',
      connectedClients: devices.length,
      devices,
    });
  });

  // Mobile or field POST to trigger Mayday / Distress Beacon
  app.post('/api/distress', (req, res) => {
    const {
      incidentType = 'General Emergency',
      location = 'Polar Field Sector',
      coordinates = '-78.00, 166.00',
      summary = 'Emergency distress beacon activated from field unit.',
      reporterCallsign = 'FIELD MOBILE MAYDAY',
      reportedByDevice = 'Mobile Phone Field Unit',
      targetLat,
      targetLng,
    } = req.body;

    const distressAlert: ActiveDistressAlert = {
      id: `distress-${Date.now()}`,
      timestamp: new Date().toISOString(),
      incidentType,
      location,
      coordinates,
      summary,
      reporterCallsign,
      reportedByDevice,
      active: true,
      acknowledgedByHQ: false,
      targetLat: targetLat ? Number(targetLat) : undefined,
      targetLng: targetLng ? Number(targetLng) : undefined,
    };

    systemState.activeDistress = distressAlert;
    systemState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: reporterCallsign,
      severity: 'urgent_distress' as const,
      sector: location,
      message: `*** MAYDAY DISTRESS BEACON ACTIVE *** [${incidentType}] ${summary} (Coords: ${coordinates}) [Source: ${reportedByDevice}]`,
    };

    systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
    persistState();

    // Broadcast immediate emergency alert
    broadcast({
      type: 'TRIGGER_DISTRESS',
      payload: distressAlert,
      timestamp: new Date().toISOString(),
    });

    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    console.log(`[POLAR-SERVER] 🚨 DISTRESS BEACON BROADCAST: ${incidentType} from ${reporterCallsign}`);
    res.json({ success: true, alert: distressAlert });
  });

  // HQ Manager acknowledges distress and dispatches SAR asset
  app.post('/api/distress/acknowledge', (req, res) => {
    if (!systemState.activeDistress) {
      return res.status(404).json({ error: 'No active distress beacon to acknowledge' });
    }

    const { acknowledgedBy = 'Base Operations Director', dispatchedSARAssetId, dispatchedSARName } = req.body;

    systemState.activeDistress.acknowledgedByHQ = true;
    systemState.activeDistress.acknowledgedAt = new Date().toISOString();
    systemState.activeDistress.acknowledgedBy = acknowledgedBy;
    systemState.activeDistress.dispatchedSARAssetId = dispatchedSARAssetId;
    systemState.activeDistress.dispatchedSARName = dispatchedSARName;

    // Update SAR asset status if specified
    if (dispatchedSARAssetId) {
      systemState.assets = systemState.assets.map((a) =>
        a.id === dispatchedSARAssetId ? { ...a, status: 'in_transit' } : a
      );
    }

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'HQ DISPATCH CONSOLE',
      severity: 'warning' as const,
      sector: systemState.activeDistress.location,
      message: `MAYDAY ACKNOWLEDGED by ${acknowledgedBy}. ${
        dispatchedSARName ? `SAR ASSET [${dispatchedSARName}] SCRAMBLED to rescue sector.` : 'SAR scramble underway.'
      }`,
    };

    systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
    persistState();

    broadcast({
      type: 'ACKNOWLEDGE_DISTRESS',
      payload: systemState.activeDistress,
      timestamp: new Date().toISOString(),
    });

    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    console.log(`[POLAR-SERVER] ✅ Distress acknowledged by ${acknowledgedBy}`);
    res.json({ success: true, alert: systemState.activeDistress });
  });

  // Stand down / resolve distress
  app.post('/api/distress/resolve', (req, res) => {
    if (!systemState.activeDistress) {
      return res.status(404).json({ error: 'No active distress beacon' });
    }

    const resolvedLocation = systemState.activeDistress.location;
    systemState.activeDistress = null;
    systemState.conditionLevel = 'COND-2_CAUTION';

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'HQ DISPATCH CONSOLE',
      severity: 'routine' as const,
      sector: resolvedLocation,
      message: 'DISTRESS BEACON STAND-DOWN: Field party secured. SAR units returning to base station.',
    };

    systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
    persistState();

    broadcast({
      type: 'RESOLVE_DISTRESS',
      timestamp: new Date().toISOString(),
    });

    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    console.log('[POLAR-SERVER] Distress beacon resolved / stand-down confirmed.');
    res.json({ success: true });
  });

  // Reset entire simulation to master manifest
  app.post('/api/reset', (req, res) => {
    systemState = {
      region: 'antarctica',
      conditionLevel: 'COND-2_CAUTION',
      assets: INITIAL_ASSETS,
      expeditions: INITIAL_EXPEDITIONS,
      supplies: INITIAL_SUPPLIES,
      dispatchLogs: INITIAL_DISPATCH_LOGS,
      activeDistress: null,
      stations: INITIAL_STATIONS,
      customWaypoints: [],
      lastUpdated: new Date().toISOString(),
    };
    persistState();

    broadcast({
      type: 'RESET_STATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, state: systemState });
  });

  // General state update handler
  app.post('/api/action', (req, res) => {
    const { action, payload } = req.body;
    handleClientAction(action, payload);
    res.json({ success: true, state: systemState });
  });

  // Test Gemini API key validation
  app.post('/api/ai/test-key', async (req, res) => {
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        status: 'error',
        error: 'No Gemini API key provided. Please enter a key in the frontend API Key Config modal or set GEMINI_API_KEY.',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Confirm Polar Tactical Communications handshake. Reply with one sentence: HANDSHAKE CONFIRMED.',
      });

      res.json({
        status: 'ok',
        model: 'gemini-2.5-flash',
        sampleReply: response.text?.trim() || 'HANDSHAKE CONFIRMED',
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Test key failed:', err.message);
      res.status(401).json({
        status: 'error',
        error: err.message || 'Authentication with Gemini API failed. Please verify the key string.',
      });
    }
  });

  // AI Tactical Polar Reconnaissance & Hazard Assessment
  app.post('/api/ai/recon-eval', async (req, res) => {
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        error: 'Gemini API key is required. Please enter your API key in the frontend API Key configuration dialog.',
      });
    }

    const { prompt, region = systemState.region, focusAsset, focusExpedition } = req.body;

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });

      const contextSummary = `
POLAR SECTOR CONTEXT:
- Operational Region: ${region.toUpperCase()}
- Active Base Condition Level: ${systemState.conditionLevel}
- Active Distress Beacon: ${systemState.activeDistress ? `${systemState.activeDistress.incidentType} at ${systemState.activeDistress.location} (${systemState.activeDistress.coordinates})` : 'NONE'}
- Active Expeditions: ${systemState.expeditions.map(e => `${e.name} (${e.code}): Phase ${e.phase}, Covered ${e.distanceCoveredKm}/${e.totalDistanceKm}km, Leader: ${e.leader}`).join('; ')}
- Field Assets: ${systemState.assets.map(a => `${a.name} (${a.code}): Status ${a.status}, Fuel/Battery ${a.fuelOrBatteryPercent}%, Position: ${a.currentLocation.lat.toFixed(4)}, ${a.currentLocation.lng.toFixed(4)}`).join('; ')}
- Recent Dispatch Logs: ${systemState.dispatchLogs.slice(0, 5).map(l => `[${l.severity.toUpperCase()}] ${l.callsign}: ${l.message}`).join(' | ')}
`;

      const systemInstruction = `You are the Antarctic & Arctic Tactical Operations AI Advisor (POLAR-AI-CORE). 
Provide crisp, highly professional, tactical polar survival, route risk assessments, and cold-weather mechanical mitigation directives. 
Focus on wind chill, crevasse hazards, whiteout navigation, battery thermal preservation, and logistics prioritization. Avoid filler. Structure response cleanly with bulleted action directives.`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${contextSummary}\n\nOPERATIONAL QUERY / RECON TASK:\n${prompt || 'Provide a complete situational risk audit and tactical recommendations for all ongoing polar traverses and extreme cold assets.'}`,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({
        status: 'ok',
        analysis: aiResponse.text || 'No response generated.',
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Recon evaluation error:', err.message);
      res.status(500).json({
        error: err.message || 'Failed to complete AI tactical evaluation.',
      });
    }
  });

  // Shared action processor
  function handleClientAction(action: string, payload: any) {
    switch (action) {
      case 'UPDATE_REGION':
        systemState.region = payload;
        break;
      case 'UPDATE_CONDITION':
        systemState.conditionLevel = payload;
        break;
      case 'UPDATE_ASSET':
        systemState.assets = systemState.assets.map((a) => (a.id === payload.id ? payload : a));
        break;
      case 'ADD_ASSET':
        systemState.assets = [payload, ...systemState.assets];
        break;
      case 'UPDATE_EXPEDITION':
        systemState.expeditions = systemState.expeditions.map((e) => (e.id === payload.id ? payload : e));
        break;
      case 'ADD_EXPEDITION':
        systemState.expeditions = [payload, ...systemState.expeditions];
        break;
      case 'ADD_STATION':
        systemState.stations = [payload, ...(systemState.stations || INITIAL_STATIONS)];
        break;
      case 'UPDATE_STATIONS':
        systemState.stations = payload;
        break;
      case 'ADD_WAYPOINT': {
        const { waypoint, expeditionId } = payload || {};
        const wp = waypoint || payload;
        if (expeditionId) {
          systemState.expeditions = systemState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            const updatedWaypoints = [...(e.waypoints || []), wp];
            const addedDist = Number(wp.distanceFromPrevKm) || 45;
            return {
              ...e,
              waypoints: updatedWaypoints,
              totalDistanceKm: e.totalDistanceKm + addedDist,
            };
          });
        } else {
          systemState.customWaypoints = [wp, ...(systemState.customWaypoints || [])];
        }
        break;
      }
      case 'DELETE_WAYPOINT': {
        const { waypointId, expeditionId } = payload || {};
        if (expeditionId) {
          systemState.expeditions = systemState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            return {
              ...e,
              waypoints: (e.waypoints || []).filter((w) => w.id !== waypointId),
            };
          });
        } else {
          systemState.customWaypoints = (systemState.customWaypoints || []).filter(
            (w) => w.id !== waypointId
          );
        }
        break;
      }
      case 'UPDATE_WAYPOINT': {
        const { waypoint, expeditionId } = payload || {};
        if (!waypoint) break;
        if (expeditionId) {
          systemState.expeditions = systemState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            return {
              ...e,
              waypoints: (e.waypoints || []).map((w) => (w.id === waypoint.id ? waypoint : w)),
            };
          });
        } else {
          systemState.customWaypoints = (systemState.customWaypoints || []).map((w) =>
            w.id === waypoint.id ? waypoint : w
          );
        }
        break;
      }
      case 'RESTOCK_SUPPLY':
        systemState.supplies = systemState.supplies.map((s) => (s.id === payload.id ? payload : s));
        break;
      case 'ADD_DISPATCH_LOG':
        systemState.dispatchLogs = [payload, ...systemState.dispatchLogs];
        break;
      default:
        break;
    }
    persistState();
    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });
  }

  // WebSocket Server Handler
  wss.on('connection', (ws, req) => {
    let clientDeviceId: string | null = null;
    console.log(`[POLAR-SERVER] WebSocket socket opened from ${req.socket.remoteAddress}. Active unique terminals: ${activeDevices.size}`);

    // Send full current state immediately upon connection
    const devices = getDeviceList();
    ws.send(
      JSON.stringify({
        type: 'INIT_STATE',
        payload: {
          ...systemState,
          connectedClients: devices.length,
          devices,
        },
        timestamp: new Date().toISOString(),
      })
    );

    ws.on('message', (messageBuffer) => {
      try {
        const msg: SyncMessage = JSON.parse(messageBuffer.toString());
        switch (msg.type) {
          case 'REGISTER_DEVICE':
          case 'HEARTBEAT': {
            const { deviceId, deviceType, deviceName, userAgent } = msg.payload || {};
            if (deviceId) {
              clientDeviceId = deviceId;
              (ws as any).clientDeviceId = deviceId;
              activeDevices.set(deviceId, {
                id: deviceId,
                type: deviceType || 'laptop_hq',
                name: deviceName || (deviceType === 'mobile_field' ? 'Mobile Field Unit' : 'HQ Laptop Console'),
                userAgent: userAgent || '',
                ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
                lastSeen: Date.now(),
              });
              broadcastPresence();
            }
            break;
          }
          case 'TRIGGER_DISTRESS': {
            const data = msg.payload;
            const distressAlert: ActiveDistressAlert = {
              id: `distress-${Date.now()}`,
              timestamp: new Date().toISOString(),
              incidentType: data.incidentType || 'General Emergency',
              location: data.location || 'Polar Sector',
              coordinates: data.coordinates || '-78.00, 166.00',
              summary: data.summary || 'Emergency beacon triggered from remote device.',
              reporterCallsign: data.reporterCallsign || 'FIELD MOBILE UNIT',
              reportedByDevice: data.reportedByDevice || 'Mobile Phone Field Unit',
              active: true,
              acknowledgedByHQ: false,
              targetLat: data.targetLat,
              targetLng: data.targetLng,
            };
            systemState.activeDistress = distressAlert;
            systemState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';

            const logEntry = {
              id: `log-${Date.now()}`,
              timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
              callsign: distressAlert.reporterCallsign,
              severity: 'urgent_distress' as const,
              sector: distressAlert.location,
              message: `*** MAYDAY DISTRESS BEACON ACTIVE *** [${distressAlert.incidentType}] ${distressAlert.summary} (${distressAlert.coordinates}) [Source: ${distressAlert.reportedByDevice}]`,
            };
            systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
            persistState();

            broadcast({
              type: 'TRIGGER_DISTRESS',
              payload: distressAlert,
              timestamp: new Date().toISOString(),
            });
            broadcast({
              type: 'STATE_UPDATE',
              payload: systemState,
              timestamp: new Date().toISOString(),
            });
            break;
          }
          case 'ACKNOWLEDGE_DISTRESS': {
            if (systemState.activeDistress) {
              systemState.activeDistress.acknowledgedByHQ = true;
              systemState.activeDistress.acknowledgedAt = new Date().toISOString();
              systemState.activeDistress.acknowledgedBy = msg.payload?.acknowledgedBy || 'Station Operations Director';
              systemState.activeDistress.dispatchedSARAssetId = msg.payload?.dispatchedSARAssetId;
              systemState.activeDistress.dispatchedSARName = msg.payload?.dispatchedSARName;

              if (msg.payload?.dispatchedSARAssetId) {
                systemState.assets = systemState.assets.map((a) =>
                  a.id === msg.payload.dispatchedSARAssetId ? { ...a, status: 'in_transit' } : a
                );
              }

              const logEntry = {
                id: `log-${Date.now()}`,
                timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
                callsign: 'HQ DISPATCH CONSOLE',
                severity: 'warning' as const,
                sector: systemState.activeDistress.location,
                message: `MAYDAY ACKNOWLEDGED by ${systemState.activeDistress.acknowledgedBy}. SAR asset ${
                  systemState.activeDistress.dispatchedSARName || 'unit'
                } dispatched.`,
              };
              systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
              persistState();

              broadcast({
                type: 'ACKNOWLEDGE_DISTRESS',
                payload: systemState.activeDistress,
                timestamp: new Date().toISOString(),
              });
              broadcast({
                type: 'STATE_UPDATE',
                payload: systemState,
                timestamp: new Date().toISOString(),
              });
            }
            break;
          }
          case 'RESOLVE_DISTRESS': {
            systemState.activeDistress = null;
            systemState.conditionLevel = 'COND-2_CAUTION';
            persistState();
            broadcast({
              type: 'RESOLVE_DISTRESS',
              timestamp: new Date().toISOString(),
            });
            broadcast({
              type: 'STATE_UPDATE',
              payload: systemState,
              timestamp: new Date().toISOString(),
            });
            break;
          }
          case 'UPDATE_REGION':
          case 'UPDATE_CONDITION':
          case 'UPDATE_ASSET':
          case 'UPDATE_EXPEDITION':
          case 'ADD_WAYPOINT':
          case 'DELETE_WAYPOINT':
          case 'UPDATE_WAYPOINT':
          case 'RESTOCK_SUPPLY':
          case 'ADD_DISPATCH_LOG':
          case 'RESET_STATE': {
            handleClientAction(msg.type, msg.payload);
            break;
          }
          default:
            break;
        }
      } catch (err: any) {
        console.error('[POLAR-SERVER] Error processing websocket message:', err.message);
      }
    });

    ws.on('close', () => {
      console.log(`[POLAR-SERVER] Socket closed for terminal ${clientDeviceId || 'anonymous'}`);
      if (clientDeviceId) {
        // Only delete device if no other open socket has this deviceId
        const hasOtherSockets = Array.from(wss.clients).some(
          (c: any) => c !== ws && c.clientDeviceId === clientDeviceId && c.readyState === WebSocket.OPEN
        );
        if (!hasOtherSockets) {
          activeDevices.delete(clientDeviceId);
          broadcastPresence();
        }
      }
    });
  });

  // Integrate Vite for development or static files for production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log('================================================================');
    console.log('  POLAR EXPEDITION & ASSET MANAGEMENT SYSTEM');
    console.log('  REAL-TIME SYNC SERVER (HTTP + WEBSOCKETS)');
    console.log('================================================================');
    console.log(`  Local Endpoint:  http://localhost:${PORT}`);
    console.log(`  Network/Mobile:  http://${HOST}:${PORT}`);
    console.log(`  WebSocket URL:   ws://${HOST}:${PORT}/ws`);
    console.log(`  Persistent File: ${STATE_FILE_PATH}`);
    console.log('================================================================');
  });
}

startServer().catch((err) => {
  console.error('[POLAR-SERVER] Fatal server error during startup:', err);
  process.exit(1);
});
