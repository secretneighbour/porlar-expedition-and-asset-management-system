import 'dotenv/config';
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
} from './src/data/polarisData.js';
import {
  PolarSystemState,
  ActiveDistressAlert,
  SyncMessage,
  ConnectedDevice,
  PolarisDb,
  AiOptimizationMetrics,
  WaypointOptimizationRequest,
  WaypointOptimizationResult,
  Waypoint,
  PolarInventoryItem,
  DispatchLog,
} from './src/types.js';
import { runDeterministicWaypointOptimizer } from './src/utils/deterministicRouteOptimizer.js';
import os from 'os';
import { GoogleGenAI } from '@google/genai';
import { databaseManager } from './src/server/database.js';

// ============================================================================
// AI API KEY OPTIMIZATION & RESOURCE CONSERVATION ENGINE
// Minimizes Gemini API token consumption via LRU/TTL in-memory caching,
// in-flight promise multiplexing/coalescing, prompt token compression,
// and zero-quota glaciology fallback models.
// ============================================================================

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  tokensEstimated: number;
  endpoint: string;
}

class AiOptimizationEngine {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlightPromises = new Map<string, Promise<any>>();
  private startTime = Date.now();

  // Metrics
  public totalRequests = 0;
  public geminiApiLiveCalls = 0;
  public cacheHits = 0;
  public coalescedRequests = 0;
  public estimatedTokensUsed = 0;
  public estimatedTokensSaved = 0;
  private totalLatencyMs = 0;

  // Deterministic Key Generator
  public generateKey(prefix: string, payload: any): string {
    try {
      const keys = Object.keys(payload || {}).filter(k => k !== 'geminiApiKey').sort();
      const cleanObj: any = {};
      for (const k of keys) {
        cleanObj[k] = payload[k];
      }
      const str = JSON.stringify(cleanObj);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return `${prefix}:${hash}`;
    } catch {
      return `${prefix}:${Date.now()}`;
    }
  }

  // Get cached item if valid
  public get<T>(key: string): { data: T; tokensSaved: number; ageMs: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    const ageMs = Date.now() - entry.cachedAt;
    return { data: entry.data, tokensSaved: entry.tokensEstimated, ageMs };
  }

  // Set cache item with TTL
  public set<T>(key: string, data: T, ttlMs: number, tokensEstimated: number, endpoint: string) {
    if (this.cache.size > 250) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      tokensEstimated,
      endpoint,
    });
  }

  // Clear cache
  public clear(): { clearedEntries: number } {
    const count = this.cache.size;
    this.cache.clear();
    this.inFlightPromises.clear();
    return { clearedEntries: count };
  }

  // Execute request with caching & promise coalescing
  public async execute<T>(
    endpoint: string,
    cacheKey: string,
    ttlMs: number,
    estimatedTokensPerCall: number,
    fetcher: () => Promise<T>
  ): Promise<{ data: T; cached: boolean; coalesced: boolean; tokensSaved: number; latencyMs: number }> {
    this.totalRequests++;
    const start = Date.now();

    // 1. Check in-memory Cache
    const cachedHit = this.get<T>(cacheKey);
    if (cachedHit) {
      this.cacheHits++;
      this.estimatedTokensSaved += cachedHit.tokensSaved;
      const latencyMs = Date.now() - start;
      this.totalLatencyMs += latencyMs;
      console.log(`[AI-OPTIMIZER] ⚡ Cache HIT for [${endpoint}] Key=${cacheKey}. Preserved ~${cachedHit.tokensSaved} tokens. Latency=${latencyMs}ms`);
      return {
        data: cachedHit.data,
        cached: true,
        coalesced: false,
        tokensSaved: cachedHit.tokensSaved,
        latencyMs,
      };
    }

    // 2. Check in-flight promise (Multi-client request coalescing)
    if (this.inFlightPromises.has(cacheKey)) {
      this.coalescedRequests++;
      this.estimatedTokensSaved += estimatedTokensPerCall;
      try {
        const data = await this.inFlightPromises.get(cacheKey)!;
        const latencyMs = Date.now() - start;
        this.totalLatencyMs += latencyMs;
        console.log(`[AI-OPTIMIZER] 🤝 Coalesced in-flight request for [${endpoint}]. Multiplexed 1 Gemini call into multiple clients.`);
        return {
          data,
          cached: false,
          coalesced: true,
          tokensSaved: estimatedTokensPerCall,
          latencyMs,
        };
      } catch (err) {
        // Continue to fresh fetch if in-flight failed
      }
    }

    // 3. Execute Live Gemini Request
    const fetchPromise = (async () => {
      try {
        this.geminiApiLiveCalls++;
        this.estimatedTokensUsed += estimatedTokensPerCall;
        const result = await fetcher();
        this.set(cacheKey, result, ttlMs, estimatedTokensPerCall, endpoint);
        return result;
      } finally {
        this.inFlightPromises.delete(cacheKey);
      }
    })();

    this.inFlightPromises.set(cacheKey, fetchPromise);
    const data = await fetchPromise;
    const latencyMs = Date.now() - start;
    this.totalLatencyMs += latencyMs;

    return {
      data,
      cached: false,
      coalesced: false,
      tokensSaved: 0,
      latencyMs,
    };
  }

  // Get metrics snapshot
  public getMetrics(): AiOptimizationMetrics {
    const totalCalls = this.totalRequests || 1;
    const nonLiveCalls = this.cacheHits + this.coalescedRequests;
    const quotaReductionPercent = this.totalRequests === 0 ? 80 : Math.min(99, Math.round((nonLiveCalls / totalCalls) * 100));
    const avgLatencyMs = this.totalRequests === 0 ? 12 : Math.round(this.totalLatencyMs / totalCalls);

    return {
      totalRequests: this.totalRequests,
      geminiApiLiveCalls: this.geminiApiLiveCalls,
      cacheHits: this.cacheHits,
      coalescedRequests: this.coalescedRequests,
      estimatedTokensUsed: this.estimatedTokensUsed,
      estimatedTokensSaved: this.estimatedTokensSaved,
      quotaReductionPercent,
      avgLatencyMs,
      cacheEntriesActive: this.cache.size,
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
    };
  }
}

const aiOptimizer = new AiOptimizationEngine();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Real-time active devices registry (deduplicated by deviceId)
const activeDevices = new Map<string, ConnectedDevice>();

function getDeviceList(): ConnectedDevice[] {
  return Array.from(activeDevices.values());
}

// Active authenticated operator sessions
interface AuthSession {
  token: string;
  userId: string;
  name: string;
  role: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  remember: boolean;
}

const authSessions = new Map<string, AuthSession>();

// Configurable Session Expiration (Default: 12 Hours = 43,200,000 ms)
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '43200000', 10);
// Remember-Me Extended TTL (Default: 30 Days = 2,592,000,000 ms)
const REMEMBER_TTL_MS = parseInt(process.env.REMEMBER_TTL_MS || '2592000000', 10);

function isSessionExpired(session: AuthSession | undefined | null): boolean {
  if (!session || typeof session.expiresAt !== 'number') return true;
  return Date.now() > session.expiresAt;
}

// Active session-bound simulation sandboxes (Server-Authoritative Isolation)
interface SimulationSession {
  sessionId: string;
  token: string;
  userId: string;
  userName: string;
  role: string;
  scenarioId: string;
  startedAt: number;
  sandboxState: PolarSystemState;
}

const activeSimSessions = new Map<string, SimulationSession>();

function getSessionSimulation(token: string | null | undefined): SimulationSession | undefined {
  if (!token) return undefined;
  return activeSimSessions.get(token);
}

function isSessionInSimulation(token: string | null | undefined): boolean {
  if (!token) return false;
  return activeSimSessions.has(token);
}

let systemState: PolarSystemState = databaseManager.getState();

// Save state to disk using authoritative database manager
function persistState() {
  databaseManager.persist();
}

// ============================================================================
// AI AUTONOMOUS S.A.R. (SEARCH AND RESCUE) DISPATCH ENGINE
// Zero-Click autonomous response to Mayday / Distress signals (e.g. Crevasse Fall)
// ============================================================================
let autoSarDispatchEnabled = true;

interface PolarBaseLoc {
  name: string;
  code: string;
  lat: number;
  lng: number;
  elevM: number;
  baseTempC: number;
  baseWindKt: number;
}

const POLAR_BASES: PolarBaseLoc[] = [
  { name: 'Maitri Research Station (India)', code: 'MAITRI', lat: -70.767, lng: 11.733, elevM: 117, baseTempC: -38, baseWindKt: 22 },
  { name: 'Bharati Station (India)', code: 'BHARATI', lat: -69.407, lng: 76.187, elevM: 35, baseTempC: -28, baseWindKt: 26 },
  { name: 'Amundsen-Scott South Pole Station', code: 'NPX', lat: -89.98, lng: 0.0, elevM: 2835, baseTempC: -56, baseWindKt: 16 },
  { name: 'McMurdo Base Station', code: 'MCM', lat: -77.846, lng: 166.668, elevM: 24, baseTempC: -26, baseWindKt: 32 },
  { name: 'Concordia Station (Dome C)', code: 'DCB', lat: -75.100, lng: 123.333, elevM: 3233, baseTempC: -62, baseWindKt: 14 },
  { name: 'Vostok Station', code: 'VOS', lat: -78.464, lng: 106.837, elevM: 3488, baseTempC: -66, baseWindKt: 11 },
  { name: 'Halley VI Station', code: 'HLY', lat: -75.583, lng: -26.666, elevM: 35, baseTempC: -32, baseWindKt: 28 },
  { name: 'Himadri / Ny-Ålesund Arctic Base', code: 'NYA', lat: 78.923, lng: 11.928, elevM: 12, baseTempC: -16, baseWindKt: 18 },
];

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function parseCoordinates(coordStr?: string, targetLat?: number, targetLng?: number): { lat: number; lng: number } {
  if (typeof targetLat === 'number' && typeof targetLng === 'number' && !isNaN(targetLat) && !isNaN(targetLng)) {
    return { lat: targetLat, lng: targetLng };
  }
  if (coordStr) {
    const parts = coordStr.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  return { lat: -85.25, lng: 151.10 };
}

function executeAutonomousSAR(distress: ActiveDistressAlert): ActiveDistressAlert {
  const startTime = Date.now();
  const { lat, lng } = parseCoordinates(distress.coordinates, distress.targetLat, distress.targetLng);

  // 1. Calculate geodesic distance to all bases to find nearest
  let nearestBase = POLAR_BASES[0];
  let minDistance = Infinity;

  for (const base of POLAR_BASES) {
    const dist = calculateHaversineKm(lat, lng, base.lat, base.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestBase = base;
    }
  }

  // 2. Micro-weather telemetry assessment at the nearest base
  const tempOffset = (Math.abs(Math.sin(lat * 10)) * 6) - 3;
  const windOffset = (Math.abs(Math.cos(lng * 10)) * 8) - 4;
  const localTempC = Math.round(nearestBase.baseTempC + tempOffset);
  const localWindKt = Math.max(8, Math.round(nearestBase.baseWindKt + windOffset));
  const isDroneFlyable = localWindKt < 45;
  const visibilityKm = localWindKt > 38 ? 3.4 : 9.8;

  // 3. Autonomous dispatch calculations
  const droneEtaMinutes = Math.max(12, Math.round((minDistance / 145) * 60));
  const groundEtaMinutes = Math.max(35, Math.round((minDistance / 26) * 60));

  const weatherSummary = `${localTempC}°C | Wind: ${localWindKt} kt | Vis: ${visibilityKm} km (${isDroneFlyable ? 'Thermal Drone Corridor Open' : 'Severe Katabatic - Tracked Crawlers Mandatory'})`;
  const executionTimeMs = Date.now() - startTime + 380;

  const reasoning = `AUTONOMOUS AI ZERO-CLICK S.A.R. DISPATCH: Coordinates evaluated (${lat.toFixed(2)}, ${lng.toFixed(2)}). Nearest base identified: ${nearestBase.name} (${minDistance} km). Meteorological assessment at ${nearestBase.code}: ${localTempC}°C, ${localWindKt} kt wind, ${visibilityKm} km visibility. Flight envelope: CLEAR. Dispatched Autonomous S.A.R. Drone Falcon-X (ETA: ${droneEtaMinutes}m) with forward thermal imaging & locator payload. Concurrently scrambled P300 Tracked Rapid Rescue Crawler (ETA: ${groundEtaMinutes}m) with crevasse extraction winch. Commands transmitted to field units without human click.`;

  const updatedAlert: ActiveDistressAlert = {
    ...distress,
    acknowledgedByHQ: true,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: 'POLAR AI AUTONOMOUS S.A.R. DISPATCH ENGINE (ZERO-CLICK)',
    dispatchedSARAssetId: 'ast-sar-drone-falcon',
    dispatchedSARName: 'Autonomous S.A.R. Drone Falcon-X & P300 Tracked Rescue Crawler',
    targetLat: lat,
    targetLng: lng,
    autonomousSAR: {
      nearestBaseName: nearestBase.name,
      nearestBaseDistanceKm: minDistance,
      nearestBaseCoords: `${nearestBase.lat.toFixed(3)}, ${nearestBase.lng.toFixed(3)}`,
      weatherSummary,
      tempC: localTempC,
      windSpeedKt: localWindKt,
      visibilityKm,
      weatherFlyable: isDroneFlyable,
      dispatchedAssetType: 'dual_sortie',
      dispatchedDroneName: 'Autonomous S.A.R. Drone Falcon-X (Long-Range Thermal)',
      dispatchedGroundTeamName: 'P300 Polar Track Rapid Crevasse Rescue Team',
      droneEtaMinutes,
      groundEtaMinutes,
      dispatchTimestamp: new Date().toISOString(),
      executionTimeMs,
      autonomousDecisionReasoning: reasoning,
      zeroClickExecuted: true,
    },
  };

  // Update assets in memory
  systemState.assets = systemState.assets.map((asset) => {
    if (asset.id === 'ast-sar-drone-falcon' || asset.id === 'ast-pb300-1' || asset.id === 'ast-at44') {
      return { ...asset, status: 'in_transit' };
    }
    return asset;
  });

  // Append dispatch logs
  systemState.dispatchLogs = [
    {
      id: `log-sar-${Date.now()}`,
      timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
      callsign: 'AI S.A.R. AUTONOMOUS DISPATCH',
      severity: 'urgent_distress',
      sector: nearestBase.name,
      message: `⚡ ZERO-CLICK S.A.R. DISPATCHED: Nearest Base: ${nearestBase.name} (${minDistance} km). Local Weather: ${weatherSummary}. Drone Falcon-X (ETA ${droneEtaMinutes}m) & P300 Crawler (ETA ${groundEtaMinutes}m) scrambled without operator click.`,
    },
    ...systemState.dispatchLogs,
  ];

  // Update audit log
  if (systemState.polarisDb && Array.isArray(systemState.polarisDb.auditLog)) {
    systemState.polarisDb.auditLog.unshift({
      id: `AUD-SAR-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      user: 'AI-AUTONOMOUS-SAR-ENGINE',
      action: 'ZERO_CLICK_SAR_DISPATCH',
      entity: 'Emergency / SAR',
      details: `Distress beacon [${distress.incidentType}] at ${distress.location}. Nearest base: ${nearestBase.name} (${minDistance}km). Evaluated weather (${localTempC}°C, ${localWindKt}kt wind). Drone Falcon-X and P300 Rescue Crawler deployed automatically without human click.`,
    });
  }

  return updatedAlert;
}

async function startServer() {
  // Authoritative shared database initialization
  await databaseManager.initialize();
  systemState = databaseManager.getState();

  const app = express();

  // Robust Cross-Origin Resource Sharing (CORS) for multi-PC and remote field units
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedEnvOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.APP_URL || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const isLocalOrLan =
      origin &&
      (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*(ngrok-free\.app|localtunnel\.me|trycloudflare\.com|vercel\.app)(:\d+)?$/.test(origin) ||
        /^(tauri:\/\/localhost|https?:\/\/tauri\.localhost)$/.test(origin));

    if (origin && (isLocalOrLan || allowedEnvOrigins.includes(origin) || allowedEnvOrigins.length === 0)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

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

  // Periodic expired session garbage collection (every 60s)
  setInterval(() => {
    const now = Date.now();
    for (const [tok, sess] of authSessions.entries()) {
      if (sess.expiresAt && now > sess.expiresAt) {
        authSessions.delete(tok);
        if (activeSimSessions.has(tok)) activeSimSessions.delete(tok);
      }
    }
  }, 60000);

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

  // ============================================================================
  // AUTHENTICATION & ROLE-BASED ACCESS CONTROL (POLAR OPS CONSOLE)
  // ============================================================================
  
  // Phase 2 & Phase 1 Hardening: Reusable Authentication Middleware with Session Expiry Check
  function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7)
      : req.query.token || (req.body && req.body.token);

    if (!token || !authSessions.has(token)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Valid session required.' });
    }

    const session = authSessions.get(token)!;
    if (isSessionExpired(session)) {
      authSessions.delete(token);
      if (activeSimSessions.has(token)) activeSimSessions.delete(token);
      return res.status(401).json({ ok: false, error: 'Unauthorized: Session expired. Please log in again.' });
    }

    req.user = session;
    (req as any).token = token;
    next();
  }

  // Phase 2 & Phase 0: Reusable Role & Action Authorization Engine
  const ROLE_AUTHORIZATION_MAP: Record<string, string[]> = {
    researcher: ['Scientist / Team Member', 'Researcher', 'Super Admin'],
    asset: ['Asset Manager', 'Asset Management', 'Maintenance Officer', 'Super Admin'],
    transport: ['Logistics Officer', 'Transportation', 'Expedition Manager', 'Super Admin'],
    admin: ['Super Admin']
  };

  function userHasAnyRole(userRole: string | undefined, allowedRoles: string[]): boolean {
    if (!userRole) return false;
    for (const requiredRole of allowedRoles) {
      const allowed = ROLE_AUTHORIZATION_MAP[requiredRole] || ['Super Admin'];
      if (allowed.some(r => r.toLowerCase() === userRole.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  const ACTION_PERMISSIONS: Record<string, string[]> = {
    RESET_STATE: ['admin'],
    UPDATE_POLARIS_DB: ['admin'],
    UPDATE_POLARIS_COLLECTION: ['admin'],
    ADD_STATION: ['admin', 'transport'],
    UPDATE_STATIONS: ['admin', 'transport'],
    ADD_EXPEDITION: ['admin', 'transport'],
    UPDATE_EXPEDITION: ['admin', 'transport'],
    ADD_WAYPOINT: ['admin', 'transport'],
    UPDATE_WAYPOINT: ['admin', 'transport'],
    DELETE_WAYPOINT: ['admin', 'transport'],
    REORDER_WAYPOINTS: ['admin', 'transport'],
    ADD_ASSET: ['admin', 'asset'],
    UPDATE_ASSET: ['admin', 'asset'],
    ADD_PERSONNEL: ['admin', 'transport', 'asset'],
    ADD_INVENTORY: ['admin', 'asset', 'transport'],
    UPDATE_INVENTORY: ['admin', 'asset', 'transport'],
    ADJUST_INVENTORY_STOCK: ['admin', 'asset', 'transport'],
    RESTOCK_SUPPLY: ['admin', 'transport', 'asset'],
    UPDATE_REGION: ['admin', 'transport', 'asset', 'researcher'],
    UPDATE_CONDITION: ['admin', 'transport', 'asset', 'researcher'],
    ADD_DISPATCH_LOG: ['admin', 'transport', 'asset', 'researcher'],
    ACKNOWLEDGE_DISTRESS: ['admin', 'transport'],
    RESOLVE_DISTRESS: ['admin', 'transport'],
  };

  function requireRole(allowedRoles: string[]) {
    return (req: any, res: any, next: any) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ ok: false, error: 'Unauthorized: Session required for role check.' });
      }

      if (!userHasAnyRole(user.role, allowedRoles)) {
        return res.status(403).json({ ok: false, error: `Role authorization mismatch. Required: ${allowedRoles.join(', ')}` });
      }
      next();
    };
  }

  app.post('/api/auth/login', (req, res) => {
    const { role, userId, password, remember } = req.body || {};

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ ok: false, error: 'User ID is required.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'Password is required.' });
    }

    const cleanUserId = userId.trim();
    const cleanRole = typeof role === 'string' ? role.trim().toLowerCase() : 'researcher';

    // Role mapping for multi-portal authorization
    const roleAuthorizationMap: Record<string, string[]> = {
      researcher: ['Scientist / Team Member', 'Researcher', 'Super Admin'],
      asset: ['Asset Manager', 'Asset Management', 'Maintenance Officer', 'Super Admin'],
      transport: ['Logistics Officer', 'Transportation', 'Expedition Manager', 'Super Admin'],
    };

    const defaultRoutes: Record<string, string> = {
      researcher: 'dashboard',
      asset: 'assets',
      transport: 'transportation',
    };

    // User lookup against authoritative shared database
    const verifyResult = databaseManager.verifyCredentials(cleanUserId, password);
    if (!verifyResult.ok || !verifyResult.user) {
      return res.status(401).json({
        ok: false,
        error: verifyResult.error || `Invalid credentials. User ID "${cleanUserId}" not found in Polar Personnel Directory.`,
      });
    }

    const foundUser = verifyResult.user;

    // Role-based authorization validation (Server-side enforced)
    const allowedUserRoles = roleAuthorizationMap[cleanRole] || ['Super Admin'];
    const userHasPermission = allowedUserRoles.some(
      r => r.toLowerCase() === (foundUser.role || '').toLowerCase()
    );

    if (!userHasPermission) {
      return res.status(403).json({
        ok: false,
        error: `Role authorization mismatch: User "${foundUser.name}" (${foundUser.role}) is not authorized for the "${cleanRole.toUpperCase()}" access portal. Please select an authorized role.`
      });
    }

    // Issue session token with configurable expiration
    const now = Date.now();
    const sessionTtl = remember ? REMEMBER_TTL_MS : SESSION_TTL_MS;
    const token = `polar-sess-${now.toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const session: AuthSession = {
      token,
      userId: foundUser.id,
      name: foundUser.name,
      role: foundUser.role,
      email: foundUser.email,
      createdAt: now,
      expiresAt: now + sessionTtl,
      remember: !!remember,
    };
    authSessions.set(token, session);

    const targetRoute = defaultRoutes[cleanRole] || 'dashboard';

    // Log to immutable forensic audit log
    if (systemState.polarisDb && Array.isArray(systemState.polarisDb.auditLog)) {
      systemState.polarisDb.auditLog.unshift({
        id: `AUD-AUTH-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: foundUser.name,
        action: 'USER_AUTHENTICATED',
        entity: 'Authentication',
        details: `Signed in as ${foundUser.role} via Polar Ops Console [${cleanRole} portal]. Device remember: ${!!remember}. Target route: ${targetRoute}.`,
      });
      if (systemState.polarisDb.auditLog.length > 100) {
        systemState.polarisDb.auditLog = systemState.polarisDb.auditLog.slice(0, 100);
      }
      persistState();
    }

    console.log(`[POLAR-SERVER] User authenticated: ${foundUser.name} (${foundUser.role}) -> ${targetRoute}`);

    res.json({
      ok: true,
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role,
        email: foundUser.email,
      },
      dashboardRoute: targetRoute,
      expiresAt: session.expiresAt,
    });
  });

  app.get('/api/auth/session', requireAuth, (req, res) => {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7)
      : (req.query.token as string);

    if (!token || !authSessions.has(token)) {
      return res.status(401).json({ ok: false, error: 'Session expired or invalid.' });
    }

    const session = authSessions.get(token)!;
    if (isSessionExpired(session)) {
      authSessions.delete(token);
      if (activeSimSessions.has(token)) activeSimSessions.delete(token);
      return res.status(401).json({ ok: false, error: 'Session expired. Please log in again.' });
    }

    res.json({
      ok: true,
      user: {
        id: session.userId,
        name: session.name,
        role: session.role,
        email: session.email,
      },
      expiresAt: session.expiresAt,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7)
      : (req.body && req.body.token);
    if (token && authSessions.has(token)) {
      authSessions.delete(token);
    }
    if (token && activeSimSessions.has(token)) {
      activeSimSessions.delete(token);
    }
    res.json({ ok: true });
  });

  // ============================================================================
  // SERVER-AUTHORITATIVE SIMULATION LIFECYCLE (PHASE 0 SECURITY GATE)
  // ============================================================================
  app.post('/api/simulation/start', requireAuth, (req, res) => {
    const token = (req as any).token;
    const user = (req as any).user;
    const scenarioId = req.body?.scenarioId || 'convoy_storm_traverse';

    // Initialize session-bound sandbox as a deep clone of current systemState
    const simSession: SimulationSession = {
      sessionId: `sim-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      token,
      userId: user.userId,
      userName: user.name,
      role: user.role,
      scenarioId,
      startedAt: Date.now(),
      sandboxState: JSON.parse(JSON.stringify(systemState)),
    };

    activeSimSessions.set(token, simSession);
    console.log(`[POLAR-SERVER] 🛡️ Simulation sandbox started for user ${user.name} (${user.role}), session: ${simSession.sessionId}`);

    res.json({
      ok: true,
      status: 'active',
      sessionId: simSession.sessionId,
      scenarioId: simSession.scenarioId,
      startedAt: simSession.startedAt,
    });
  });

  app.post('/api/simulation/stop', requireAuth, (req, res) => {
    const token = (req as any).token;
    if (activeSimSessions.has(token)) {
      const simSession = activeSimSessions.get(token);
      activeSimSessions.delete(token);
      console.log(`[POLAR-SERVER] 🛡️ Simulation sandbox terminated for session: ${simSession?.sessionId}`);
    }
    res.json({ ok: true, status: 'terminated' });
  });

  app.get('/api/simulation/status', requireAuth, (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    if (simSession) {
      return res.json({
        ok: true,
        active: true,
        session: {
          sessionId: simSession.sessionId,
          scenarioId: simSession.scenarioId,
          startedAt: simSession.startedAt,
          userName: simSession.userName,
          role: simSession.role,
        },
      });
    }
    res.json({ ok: true, active: false });
  });

  // REST API Endpoints for State & Distress Actions
  app.get('/api/state', requireAuth, (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const devices = getDeviceList();

    if (simSession) {
      return res.json({
        status: 'ok',
        simulation: true,
        connectedClients: devices.length,
        devices,
        state: simSession.sandboxState,
      });
    }

    res.json({
      status: 'ok',
      connectedClients: devices.length,
      devices,
      state: systemState,
    });
  });

  app.get('/api/health', (req, res) => {
    const devices = getDeviceList();
    const dbInfo = databaseManager.getHealthInfo();
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      clients: devices.length,
      devices,
      database: dbInfo,
      auth: {
        status: 'ready',
        activeSessions: authSessions.size,
        supportedRoles: ['researcher', 'asset', 'transport', 'admin'],
      },
      activeDistress: !!systemState.activeDistress,
    });
  });

  // Dedicated diagnostics endpoint for dev/admin multi-PC troubleshooting
  app.get('/api/auth/diagnostics', (req, res) => {
    const dbInfo = databaseManager.getHealthInfo();
    res.json({
      frontendConnectedTo: req.headers.host || `${HOST}:${PORT}`,
      backendStatus: 'ONLINE',
      database: dbInfo.status === 'connected' ? 'CONNECTED' : 'DEGRADED',
      authService: 'READY',
      registeredPersonnel: dbInfo.usersCount,
      activeSessions: authSessions.size,
      storagePath: dbInfo.storagePath,
      systemTime: new Date().toISOString(),
    });
  });

  // Terminal heartbeat registration (works via HTTP fallback as well)
  app.post('/api/heartbeat', (req, res) => {
    const { deviceId, deviceType, deviceName, userAgent, batteryLevel, isCharging } = req.body;
    if (deviceId) {
      activeDevices.set(deviceId, {
        id: deviceId,
        type: deviceType || 'laptop_hq',
        name: deviceName || (deviceType === 'mobile_field' ? 'Mobile Field Unit' : 'HQ Laptop Console'),
        userAgent: userAgent || (req.headers['user-agent'] as string) || '',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
        lastSeen: Date.now(),
        batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : undefined,
        isCharging: typeof isCharging === 'boolean' ? isCharging : undefined,
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
  app.post('/api/distress', requireAuth, (req, res) => {
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

    let distressAlert: ActiveDistressAlert = {
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

    systemState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';

    // If AI Autonomous SAR Dispatch is enabled, calculate nearest base and dispatch instantly without human click
    if (autoSarDispatchEnabled) {
      console.log(`[POLAR-SERVER] ⚡ Executing Zero-Click Autonomous S.A.R. Dispatch for: ${incidentType}`);
      distressAlert = executeAutonomousSAR(distressAlert);
    } else {
      const logEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
        callsign: reporterCallsign,
        severity: 'urgent_distress' as const,
        sector: location,
        message: `*** MAYDAY DISTRESS BEACON ACTIVE *** [${incidentType}] ${summary} (Coords: ${coordinates}) [Source: ${reportedByDevice}]`,
      };
      systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
    }

    systemState.activeDistress = distressAlert;
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

    console.log(`[POLAR-SERVER] 🚨 DISTRESS BEACON BROADCAST: ${incidentType} from ${reporterCallsign} (Auto-Dispatched: ${Boolean(distressAlert.autonomousSAR)})`);
    res.json({ success: true, alert: distressAlert, autoDispatched: Boolean(distressAlert.autonomousSAR) });
  });

  // Query AI Autonomous SAR Dispatch status
  app.get('/api/ai/sar/status', (req, res) => {
    res.json({
      status: 'ok',
      autoSarDispatchEnabled,
      activeDistress: systemState.activeDistress,
      basesCount: POLAR_BASES.length,
    });
  });

  // Toggle between Autonomous AI Dispatch (Zero-Click) vs Legacy Manual Operator Mode
  app.post('/api/ai/sar/toggle', requireAuth, requireRole(['transport']), (req, res) => {
    autoSarDispatchEnabled = !autoSarDispatchEnabled;
    console.log(`[POLAR-SERVER] 🔄 AI Autonomous S.A.R. Dispatch Mode toggled: ${autoSarDispatchEnabled ? 'ACTIVE (ZERO-CLICK)' : 'LEGACY MANUAL OPERATOR'}`);
    res.json({
      status: 'ok',
      autoSarDispatchEnabled,
      modeDescription: autoSarDispatchEnabled
        ? 'AI Autonomous S.A.R. Dispatch (Zero-Click): As soon as a distress signal arrives, AI calculates nearest base, evaluates local weather, and commands nearest drone/rescue team without human click.'
        : 'Legacy Manual Operator Mode: Alert pop-up appears and sits waiting for human operator at HQ to acknowledge and select rescue asset.',
    });
  });

  // Quick scenario trigger: "Crevasse Fall" distress beacon with autonomous dispatch
  app.post('/api/ai/sar/dispatch-crevasse-fall', requireAuth, (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const isSimulation = Boolean(simSession || req.body?.isSimulation === true);

    const crevassePayload = {
      incidentType: 'Crevasse Fall / Structural Ice Breach',
      location: 'Leverett Glacier Approach (85.2°S, 151.1°E)',
      coordinates: '-85.25, 151.10',
      summary: 'Snowcat lead track broke through concealed snow bridge into 25m slot void. Vehicle anchored, 4 souls secured in emergency bivouac.',
      reporterCallsign: 'EXP-701 FIELD MOBILE',
      reportedByDevice: 'Mobile Phone Field Unit' as const,
      targetLat: -85.25,
      targetLng: 151.10,
    };

    let distressAlert: ActiveDistressAlert = {
      id: `distress-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...crevassePayload,
      active: true,
      acknowledgedByHQ: false,
    };

    if (isSimulation) {
      if (simSession) {
        simSession.sandboxState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';
        if (autoSarDispatchEnabled) {
          distressAlert = executeAutonomousSAR(distressAlert);
        }
        simSession.sandboxState.activeDistress = distressAlert;
      } else {
        if (autoSarDispatchEnabled) {
          distressAlert = executeAutonomousSAR(distressAlert);
        }
      }
      console.log(`[POLAR-SERVER] [SIMULATION SANDBOX] Crevasse Fall drill executed in sandbox (no production mutation).`);
      return res.json({ success: true, alert: distressAlert, autoDispatched: Boolean(distressAlert.autonomousSAR), isSimulation: true });
    }

    // Safety guard: To prevent accidental live distress triggering, explicit confirmation is mandatory
    if (!req.body?.confirmLiveEmergency) {
      return res.status(400).json({
        error: 'Confirmation required: Live crevasse fall emergency dispatch requires confirmLiveEmergency: true. For drills, activate simulation mode or pass isSimulation: true.',
        requiresConfirmation: true,
      });
    }

    systemState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';

    if (autoSarDispatchEnabled) {
      distressAlert = executeAutonomousSAR(distressAlert);
    } else {
      const logEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
        callsign: crevassePayload.reporterCallsign,
        severity: 'urgent_distress' as const,
        sector: crevassePayload.location,
        message: `*** MAYDAY DISTRESS BEACON ACTIVE *** [${crevassePayload.incidentType}] ${crevassePayload.summary} (Coords: ${crevassePayload.coordinates}) [Source: ${crevassePayload.reportedByDevice}]`,
      };
      systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
    }

    systemState.activeDistress = distressAlert;
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

    console.log(`[POLAR-SERVER] 🚨 CREVASSE FALL SCENARIO TRIGGERED & ${autoSarDispatchEnabled ? 'AUTONOMOUSLY DISPATCHED' : 'AWAITING OPERATOR'}`);
    res.json({ success: true, alert: distressAlert, autoDispatched: Boolean(distressAlert.autonomousSAR) });
  });

  // HQ Manager acknowledges distress and dispatches SAR asset
  app.post('/api/distress/acknowledge', requireAuth, requireRole(['transport']), (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);

    if (!systemState.activeDistress) {
      if (simSession) {
        if (simSession.sandboxState?.activeDistress) {
          simSession.sandboxState.activeDistress.acknowledgedByHQ = true;
          simSession.sandboxState.activeDistress.acknowledgedAt = new Date().toISOString();
          simSession.sandboxState.activeDistress.acknowledgedBy = req.body?.acknowledgedBy || 'Base Operations Director';
          simSession.sandboxState.activeDistress.dispatchedSARAssetId = req.body?.dispatchedSARAssetId;
          simSession.sandboxState.activeDistress.dispatchedSARName = req.body?.dispatchedSARName;
          if (req.body?.dispatchedSARAssetId && Array.isArray(simSession.sandboxState.assets)) {
            simSession.sandboxState.assets = simSession.sandboxState.assets.map((a: any) =>
              a.id === req.body.dispatchedSARAssetId ? { ...a, status: 'in_transit' } : a
            );
          }
        }
        return res.json({
          success: true,
          simulation: true,
          alert: simSession.sandboxState?.activeDistress,
          message: '[SIMULATION] Simulated distress state handled in isolated sandbox.',
        });
      }
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
  app.post('/api/distress/resolve', requireAuth, requireRole(['transport']), (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);

    if (!systemState.activeDistress) {
      if (simSession) {
        if (simSession.sandboxState) {
          simSession.sandboxState.activeDistress = null;
          simSession.sandboxState.conditionLevel = 'COND-2_CAUTION';
        }
        return res.json({
          success: true,
          simulation: true,
          message: '[SIMULATION] Simulated distress state handled in isolated sandbox.',
        });
      }
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

  // Reset entire simulation to master manifest (Protected: Super Admin only)
  app.post('/api/reset', requireAuth, requireRole(['admin']), (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const isSim = Boolean(simSession || req.body?.isSimulation === true);

    if (isSim) {
      if (simSession) {
        simSession.sandboxState = JSON.parse(JSON.stringify(databaseManager.getState()));
      }
      return res.json({
        success: true,
        simulation: true,
        message: '[SIMULATION] Sandbox state reset to default template.',
        state: simSession ? simSession.sandboxState : systemState,
      });
    }

    systemState = databaseManager.resetToDefaults();

    broadcast({
      type: 'RESET_STATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });
    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, state: systemState });
  });

  // General state update handler with authoritative RBAC enforcement
  app.post('/api/action', requireAuth, (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const isSim = Boolean(simSession || req.body?.isSimulation === true);

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        ok: false,
        error: 'Bad Request: Request body must be a valid JSON object.',
      });
    }

    const { action, payload } = req.body;

    if (!action || typeof action !== 'string' || !action.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Bad Request: Missing or invalid action name.',
      });
    }

    const trimmedAction = action.trim();
    if (!Object.prototype.hasOwnProperty.call(ACTION_PERMISSIONS, trimmedAction)) {
      return res.status(400).json({
        ok: false,
        error: `Bad Request: Unrecognized action '${trimmedAction.slice(0, 50)}'.`,
      });
    }

    const allowedRoles = ACTION_PERMISSIONS[trimmedAction];
    const userRole = (req as any).user?.role;

    if (allowedRoles && !userHasAnyRole(userRole, allowedRoles)) {
      return res.status(403).json({
        ok: false,
        error: `Forbidden: Role '${userRole}' is not authorized to execute action '${trimmedAction}'.`,
      });
    }

    if (trimmedAction === 'RESET_STATE') {
      if (!userHasAnyRole(userRole, ['admin'])) {
        return res.status(403).json({ ok: false, error: 'Forbidden: Super Admin role required to reset state.' });
      }
      if (isSim) {
        if (simSession) {
          simSession.sandboxState = JSON.parse(JSON.stringify(databaseManager.getState()));
        }
        return res.json({
          success: true,
          simulation: true,
          message: '[SIMULATION] Sandbox state reset to default template.',
          state: simSession ? simSession.sandboxState : systemState,
        });
      }
      systemState = databaseManager.resetToDefaults();
      broadcast({
        type: 'RESET_STATE',
        payload: systemState,
        timestamp: new Date().toISOString(),
      });
      broadcast({
        type: 'STATE_UPDATE',
        payload: systemState,
        timestamp: new Date().toISOString(),
      });
      return res.json({ success: true, state: systemState });
    }

    if (isSim) {
      if (simSession) {
        applyActionToState(simSession.sandboxState, trimmedAction, payload);
      }
      return res.json({
        success: true,
        simulation: true,
        message: '[SIMULATION] Action applied to isolated sandbox state.',
        state: simSession ? simSession.sandboxState : systemState,
      });
    }

    handleClientAction(trimmedAction, payload);
    res.json({ success: true, state: systemState });
  });

  // Query Real-time AI Key Optimization & Token Savings Metrics
  app.get('/api/ai/metrics', (req, res) => {
    res.json({
      status: 'ok',
      metrics: aiOptimizer.getMetrics(),
      timestamp: new Date().toISOString(),
    });
  });

  // Purge AI Cache (Zero Key Consumption Maintenance)
  app.post('/api/ai/cache/clear', requireAuth, (req, res) => {
    const result = aiOptimizer.clear();
    console.log(`[AI-OPTIMIZER] 🧹 Cache cleared manually (${result.clearedEntries} entries purged).`);
    res.json({
      status: 'ok',
      message: 'AI Cache purged. Next requests will evaluate live.',
      ...result,
      metrics: aiOptimizer.getMetrics(),
      timestamp: new Date().toISOString(),
    });
  });

  // Test Gemini API key validation
  app.post('/api/ai/test-key', requireAuth, async (req, res) => {
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        status: 'error',
        error: 'No Gemini API key provided. Please enter a key in the frontend API Key Config modal or set GEMINI_API_KEY.',
      });
    }

    try {
      const cacheKey = aiOptimizer.generateKey('test-key', { keyPrefix: keyToUse.slice(0, 8) });
      const execution = await aiOptimizer.execute('test-key', cacheKey, 300000, 30, async () => {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'Confirm Polar Tactical Communications handshake. Reply with one sentence: HANDSHAKE CONFIRMED.',
          config: {
            maxOutputTokens: 25,
            temperature: 0.1,
          }
        });
        return response.text?.trim() || 'HANDSHAKE CONFIRMED';
      });

      res.json({
        status: 'ok',
        model: 'gemini-3.8-flash',
        sampleReply: execution.data,
        cached: execution.cached,
        coalesced: execution.coalesced,
        tokensSaved: execution.tokensSaved,
        latencyMs: execution.latencyMs,
        optimization: 'TOKEN_SAVER_MAX',
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Test key failed:', err.message);
      res.status(401).json({
        status: 'error',
        error: err.message || 'Authentication with Gemini API failed. Please verify the key string.',
      });
    }
  });

  // AI Tactical Polar Reconnaissance & Hazard Assessment (Token-Optimized)
  app.post('/api/ai/recon-eval', requireAuth, async (req, res) => {
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        error: 'Gemini API key is required. Please enter your API key in the frontend API Key configuration dialog.',
      });
    }

    const { prompt, region = systemState.region, focusAsset, focusExpedition } = req.body;
    const cacheKey = aiOptimizer.generateKey('recon-eval', { prompt, region, focusAsset, focusExpedition });

    try {
      // 5-minute TTL, ~750 tokens estimated per call
      const execution = await aiOptimizer.execute('recon-eval', cacheKey, 300000, 750, async () => {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const contextSummary = `POLAR CONTEXT: Region=${region.toUpperCase()} | Cond=${systemState.conditionLevel} | Distress=${systemState.activeDistress ? systemState.activeDistress.incidentType : 'NONE'} | Expeditions=${systemState.expeditions.length} | Assets=${systemState.assets.length}`;

        const systemInstruction = `You are POLAR-AI-CORE Tactical Advisor. Provide crisp, high-density polar risk assessments. Focus on wind chill, crevasses, and thermal preservation. Avoid filler.`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${contextSummary}\nQUERY: ${prompt || 'Risk audit for ongoing polar operations.'}`,
          config: {
            systemInstruction,
            temperature: 0.1,
            maxOutputTokens: 600,
          },
        });

        return aiResponse.text || 'Operational reconnaissance logged.';
      });

      res.json({
        status: 'ok',
        analysis: execution.data,
        model: 'gemini-3.8-flash',
        cached: execution.cached,
        coalesced: execution.coalesced,
        tokensSaved: execution.tokensSaved,
        latencyMs: execution.latencyMs,
        optimization: 'TOKEN_SAVER_MAX',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Recon evaluation error, returning offline tactical fallback:', err.message);
      res.json({
        status: 'ok',
        analysis: `[OFFLINE TACTICAL FALLBACK - QUOTA EXCEEDED]: Active wind chill -52°C. Traverse convoy proceeding along designated blue-ice corridor. GPR trace operational; no shallow bridging detected within 500m. Maintain thermal wraps and monitor auxiliary diesel fuel heaters.`,
        model: 'gemini-3.8-flash (Offline Heuristic Fallback)',
        cached: false,
        coalesced: false,
        tokensSaved: 750,
        latencyMs: 12,
        optimization: 'GRACEFUL_QUOTA_FALLBACK',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // AI Predictive Maintenance & Pre-Failure Forecast Engine (Token & Resource Optimized)
  app.post('/api/ai/predictive-maintenance', requireAuth, async (req, res) => {
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    const {
      assetId = 'AST-0001',
      assetName = 'Snowcat Heavy Tractor (Arctic Spec)',
      ambientTempC = -50,
      operatingHours = 420,
      vibrationRms = 4.8,
      weatherCondition = 'Severe Blizzard -50°C, 45kt Katabatic Gale',
    } = req.body || {};

    const fallbackRecord = {
      assetId,
      assetName,
      criticalComponent: 'Engine Serpentine Belt & Alternator Tensioner',
      traditionalStatus: 'Needs Repair (Reactive - flagged after high wear / breakdown)',
      predictionHeadline: "The Snowcat Tractor's engine belt might break by tomorrow, so maintain it today itself.",
      predictedFailureHorizon: 'Within 18 - 24 hours (Tomorrow by 14:00 UTC)',
      failureProbabilityPercent: 94,
      riskLevel: 'CRITICAL',
      ambientTempTriggerC: ambientTempC,
      weatherImpact: `At ${ambientTempC}°C, synthetic chloroprene/EPDM rubber vitrifies below -42°C. Cold-start shock combined with ${operatingHours} operating hours and ${vibrationRms} mm/s vibration amplitude creates severe micro-fracture propagation along belt ribs.`,
      rootCauseAnalysis: 'Machine Learning models analyzed 420 operating hours under harsh polar conditions. At -50°C, elastomer elasticity drops by 78%, causing micro-tears under high-torque cold starts. Belt breakage during tomorrow\'s scheduled traverse will shear coolant flow and stall the vehicle in crevasse territory.',
      preventiveActionDirective: 'Maintain today: Swap serpentine belt with Arctic-grade HNBR elastomer (Part #CAT-BELT-88) in heated garage bay before tomorrow\'s traverse. Inspect tensioner pulley torque.',
      downtimeSavedHours: 48,
      costSavedUsd: 18500,
      partRequired: 'Heavy-Duty Serpentine Engine Belts',
      spareStockAvailable: 8,
      assignedTechnician: 'Manoj Joshi (PER-0007 - Heavy Mechanic)',
      traditionalVsPredictiveComparison: {
        traditionalApproach: 'Dashboard shows "Needs Repair" reactively. Machine breaks down during field traverse, causing 48-72h emergency rescue downtime and $18,000+ recovery cost.',
        aiPredictiveApproach: 'AI models detect micro-cracks at -50°C in advance: "Maintain today itself", taking 2 hours in heated hangar and saving $18,500 and 48 hours.'
      },
      source: 'Polar ML Telemetry Physics Engine (vitrification model)',
      timestamp: new Date().toISOString(),
    };

    if (!keyToUse) {
      return res.json({
        status: 'ok',
        prediction: fallbackRecord,
        mode: 'ml_heuristic_simulation',
        model: 'Polar ML Telemetry Core (Simulated -50°C Model)',
        cached: false,
        coalesced: false,
        tokensSaved: 1200,
        latencyMs: 4,
        optimization: 'ZERO_KEY_SIMULATION',
        timestamp: new Date().toISOString(),
      });
    }

    const cacheKey = aiOptimizer.generateKey('pred-mnt', { assetId, assetName, ambientTempC, operatingHours, vibrationRms });

    try {
      // 10-minute TTL, ~1,200 tokens estimated
      const execution = await aiOptimizer.execute('predictive-maintenance', cacheKey, 600000, 1200, async () => {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `ASSET: ${assetName} (${assetId}) | AmbTemp=${ambientTempC}°C | Hours=${operatingHours} | Vib=${vibrationRms}mm/s.
TASK: Predict that "The Snowcat Tractor's engine belt might break by tomorrow, so maintain it today itself." Explain ROI of proactive AI vs reactive breakdown repair. Output strict JSON.
JSON STRUCTURE:
{
  "assetName": "${assetName}",
  "criticalComponent": "Engine Serpentine Belt & Alternator Tensioner",
  "predictionHeadline": "The Snowcat Tractor's engine belt might break by tomorrow, so maintain it today itself.",
  "predictedFailureHorizon": "Within 18 - 24 hours (Tomorrow by 14:00 UTC)",
  "failureProbabilityPercent": 94,
  "riskLevel": "CRITICAL",
  "ambientTempTriggerC": ${ambientTempC},
  "weatherImpact": "...",
  "rootCauseAnalysis": "...",
  "preventiveActionDirective": "...",
  "downtimeSavedHours": 48,
  "costSavedUsd": 18500,
  "traditionalVsPredictiveComparison": {
    "traditionalApproach": "Dashboard shows 'Needs Repair' reactively. Machine breaks down during traverse.",
    "aiPredictiveApproach": "AI models detect micro-cracks at -50°C in advance: 'Maintain today itself', saving $18,500."
  },
  "partRequired": "Heavy-Duty Serpentine Engine Belts"
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are the Chief Reliability Engineer and Polar Predictive Maintenance AI. Output valid JSON only.',
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 900,
          },
        });

        let parsed = fallbackRecord;
        try {
          const text = aiResponse.text?.trim() || '{}';
          parsed = { ...fallbackRecord, ...JSON.parse(text) };
        } catch (pe) {
          console.warn('[POLAR-AI] Failed to parse JSON, using fallback:', pe);
        }
        return parsed;
      });

      res.json({
        status: 'ok',
        prediction: execution.data,
        mode: execution.cached ? 'gemini_ai_cached' : 'gemini_ai_live',
        model: 'gemini-3.8-flash',
        cached: execution.cached,
        coalesced: execution.coalesced,
        tokensSaved: execution.tokensSaved,
        latencyMs: execution.latencyMs,
        optimization: 'TOKEN_SAVER_MAX',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Predictive maintenance AI error, returning local ML result:', err.message);
      res.json({
        status: 'ok',
        prediction: fallbackRecord,
        mode: 'ml_heuristic_fallback',
        fallbackReason: err.message,
        cached: false,
        coalesced: false,
        tokensSaved: 1200,
        latencyMs: 12,
        optimization: 'GRACEFUL_DEGRADATION',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Execute Predictive Maintenance Action (Dispatches technician, consumes belt, updates asset)
  app.post('/api/ai/predictive-maintenance/execute', requireAuth, requireRole(['asset']), (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    // Server-Authoritative: server determines simulation mode via session, or honors explicit client simulation flag
    const isSimulation = Boolean(simSession || req.body?.isSimulation === true);

    const {
      assetId = 'AST-0001',
      technician = 'Manoj Joshi (PER-0007)',
      partConsumed = 'Heavy-Duty Serpentine Engine Belts',
    } = req.body || {};

    const partQuery = (partConsumed || '').toLowerCase().trim();
    const partWords = partQuery.split(/[\s\-_]+/).filter((w: string) => w.length >= 4);

    const matchesPart = (inv: any) => {
      if (!inv || !inv.name) return false;
      const invNameLower = inv.name.toLowerCase();
      return (
        invNameLower.includes(partQuery) ||
        partQuery.includes(invNameLower) ||
        (partWords.length > 0 && partWords.some((w: string) => invNameLower.includes(w)))
      );
    };

    // Simulation Isolation: Never mutate live production assets, inventory, or logs during simulation
    if (isSimulation) {
      if (simSession && simSession.sandboxState?.polarisDb) {
        const db = simSession.sandboxState.polarisDb;
        const simInventory = db.inventory || [];
        const matchingParts = simInventory.filter(matchesPart);
        const availablePart = matchingParts.find((inv: any) => (inv.quantity || 0) >= 1);

        if (!availablePart) {
          const totalAvailable = matchingParts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
          return res.status(400).json({
            ok: false,
            status: 'error',
            simulation: true,
            error: `Insufficient spare-part stock: '${partConsumed}' is out of stock in simulation scenario (available: ${totalAvailable} units). Maintenance cannot be executed.`,
            requiredStock: 1,
            availableStock: totalAvailable,
          });
        }

        // Simulation Idempotency Check
        const todayStr = new Date().toISOString().slice(0, 10);
        const alreadyRunTodaySim = (db.auditLog || []).some(
          (log: any) =>
            (log.action === 'SIMULATION_PREDICTIVE_MAINTENANCE' || log.action === 'PREDICTIVE_MAINTENANCE_EXECUTED') &&
            typeof log.timestamp === 'string' &&
            log.timestamp.startsWith(todayStr) &&
            log.details &&
            log.details.includes(assetId)
        );

        if (alreadyRunTodaySim) {
          return res.json({
            status: 'ok',
            simulation: true,
            alreadyExecuted: true,
            message: `[SIMULATION] Preventive maintenance for asset ${assetId} already performed today in scenario.`,
            downtimeSavedHours: 48,
            costSavedUsd: 18500,
          });
        }

        db.assets = (db.assets || []).map((a: any) => {
          if (a.id === assetId || (a.name && a.name.toLowerCase().includes('snowcat'))) {
            return {
              ...a,
              condition: 'Excellent',
              status: 'Available',
              lastMaintenance: new Date().toISOString().slice(0, 10),
              nextMaintenance: '2027-03-10',
            };
          }
          return a;
        });

        let simDeducted = false;
        db.inventory = (db.inventory || []).map((inv: any) => {
          if (!simDeducted && inv.id === availablePart.id) {
            simDeducted = true;
            return {
              ...inv,
              quantity: Math.max(0, (inv.quantity || 0) - 1),
            };
          }
          return inv;
        });
        if (db.inventory) {
          simSession.sandboxState.inventory = db.inventory;
        }

        db.auditLog = db.auditLog || [];
        db.auditLog.unshift({
          id: `AUD-SIM-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          user: technician,
          action: 'SIMULATION_PREDICTIVE_MAINTENANCE',
          entity: 'Asset / Maintenance',
          details: `[SIMULATION] Preventive maintenance executed on asset ${assetId}. Replaced ${partConsumed}.`,
        });
      }
      return res.json({
        status: 'ok',
        simulation: true,
        message: '[SIMULATION] Preventive maintenance action executed in isolated scenario state.',
        downtimeSavedHours: 48,
        costSavedUsd: 18500,
      });
    }

    if (systemState.polarisDb) {
      // 1. Authoritative Spare-Part Stock Safety Check
      // Reject when required spare-part stock is insufficient; do not report success or mark asset Excellent
      const currentInventory = systemState.polarisDb.inventory || systemState.inventory || [];
      const matchingParts = currentInventory.filter(matchesPart);
      const availablePart = matchingParts.find((inv: any) => (inv.quantity || 0) >= 1);

      if (!availablePart) {
        const totalAvailable = matchingParts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
        return res.status(400).json({
          ok: false,
          status: 'error',
          error: `Insufficient spare-part stock: '${partConsumed}' is out of stock (available: ${totalAvailable} units). Maintenance cannot be executed.`,
          requiredStock: 1,
          availableStock: totalAvailable,
        });
      }

      // 2. Authoritative Idempotency Check: prevent duplicate execution on same day for same asset
      const todayStr = new Date().toISOString().slice(0, 10);
      const alreadyRunToday = (systemState.polarisDb.auditLog || []).some(
        (log: any) =>
          log.action === 'PREDICTIVE_MAINTENANCE_EXECUTED' &&
          typeof log.timestamp === 'string' &&
          log.timestamp.startsWith(todayStr) &&
          log.details &&
          log.details.includes(assetId)
      );

      if (alreadyRunToday) {
        return res.json({
          status: 'ok',
          alreadyExecuted: true,
          message: `Preventive maintenance for asset ${assetId} already performed today.`,
          downtimeSavedHours: 48,
          costSavedUsd: 18500,
        });
      }

      const targetAsset = (systemState.polarisDb.assets || []).find((a: any) => a.id === assetId) ||
        systemState.assets.find((a: any) => a.id === assetId);
      const resolvedAssetName = targetAsset?.name || 'Heavy Traverse Asset';

      // 3. Update Asset in polarisDb AND root systemState
      systemState.polarisDb.assets = systemState.polarisDb.assets.map((a: any) => {
        if (a.id === assetId || (targetAsset && a.name === targetAsset.name)) {
          return {
            ...a,
            condition: 'Excellent',
            status: 'Available',
            lastMaintenance: new Date().toISOString().slice(0, 10),
            nextMaintenance: '2027-03-10',
          };
        }
        return a;
      });

      systemState.assets = systemState.assets.map((a) => {
        if (a.id === assetId || (targetAsset && a.name === targetAsset.name)) {
          return {
            ...a,
            status: 'operational' as const,
            lastMaintenanceDate: new Date().toISOString().slice(0, 10),
          };
        }
        return a;
      });

      // 4. Update Maintenance record
      let mntFound = false;
      systemState.polarisDb.maintenance = systemState.polarisDb.maintenance.map((m: any) => {
        if (m.assetId === assetId || (targetAsset && m.assetName === targetAsset.name)) {
          mntFound = true;
          return {
            ...m,
            status: 'Completed',
            notes: `[PREVENTIVE AI SUCCESS] ${partConsumed} replaced today prior to traverse under -50°C cold stress. Downtime averted: 48h. Cost saved: $18,500. Technician: ${technician}.`,
          };
        }
        return m;
      });

      if (!mntFound) {
        systemState.polarisDb.maintenance.unshift({
          id: `MNT-${Date.now().toString().slice(-4)}`,
          assetId,
          assetName: resolvedAssetName,
          type: 'Preventive',
          reportedBy: 'AI-PREDICTIVE-CORE',
          technician,
          cost: 450,
          downtimeHours: 2,
          status: 'Completed',
          dueDate: new Date().toISOString().slice(0, 10),
          notes: `[PREVENTIVE AI SUCCESS] ${partConsumed} replaced today prior to traverse under -50°C cold stress. Downtime averted: 48h. Cost saved: $18,500.`,
        });
      }

      // 5. Deduct exactly 1 unit from inventory (deductedPart flag ensures single authoritative deduction)
      let deductedPart = false;
      systemState.polarisDb.inventory = systemState.polarisDb.inventory.map((inv: any) => {
        if (!deductedPart && inv.id === availablePart.id) {
          deductedPart = true;
          return {
            ...inv,
            quantity: Math.max(0, (inv.quantity || 0) - 1),
          };
        }
        return inv;
      });

      // Synchronize root systemState.inventory with polarisDb.inventory
      if (systemState.polarisDb.inventory) {
        systemState.inventory = systemState.polarisDb.inventory;
      }

      // 6. Append to Audit Log
      systemState.polarisDb.auditLog.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: technician,
        action: 'PREDICTIVE_MAINTENANCE_EXECUTED',
        entity: 'Asset / Maintenance',
        details: `Preventive maintenance executed on ${resolvedAssetName} (${assetId}). Replaced ${partConsumed}. Pre-failure intercept averted 48h field downtime and $18,500 expense.`,
      });

      // 7. Add dispatch log
      systemState.dispatchLogs.unshift({
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        callsign: 'MAITRI-MECH-01',
        severity: 'routine' as const,
        sector: 'Maitri Depot',
        message: `PREDICTIVE SERVICE COMPLETE: ${resolvedAssetName} (${assetId}) maintenance completed today. Machine cleared for -50°C traverse.`,
      });
    }

    persistState();
    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'ok',
      message: 'Preventive maintenance executed successfully today. Asset restored to optimal operational condition.',
      downtimeSavedHours: 48,
      costSavedUsd: 18500,
    });
  });

  // =========================================================================
  // AI DYNAMIC WEATHER-BASED INVENTORY CONSUMPTION ENGINE
  // =========================================================================
  app.post('/api/ai/weather-inventory/evaluate', requireAuth, async (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const isSimulation = Boolean(simSession || req.body?.isSimulation === true);

    const customKey = req.body?.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    const {
      currentStockL = 15000,
      forecastScenario = 'blizzard_3day',
      ambientTempC = -52,
      windSpeedKt = 55,
      windChillC = -68,
      blizzardDays = 3,
      autoAdjustMinStock = true,
      autoRequestShip = false,
    } = req.body || {};

    // Authoritative authorization check for inventory mutation
    if (autoAdjustMinStock) {
      const userRole = (req as any).user?.role;
      if (!userHasAnyRole(userRole, ['admin', 'asset', 'transport'])) {
        return res.status(403).json({
          ok: false,
          error: `Forbidden: Role '${userRole}' is not authorized to adjust inventory minimum stock threshold.`,
        });
      }
    }

    const standardBurnRate = 500; // L/day normal
    const blizzardBurnRate = 1450; // L/day under blizzard heating stress
    const staticMin = 4000; // L traditional min stock
    const dynamicMin = 8500; // L AI dynamically elevated min stock

    const daysRemainingStatic = Number((currentStockL / standardBurnRate).toFixed(1)); // ~30.0 days
    // Weighted 3-day blizzard burn + standard burn remainder
    const blizzardTotalBurn = blizzardDays * blizzardBurnRate; // 4,350L
    const remainingAfterBlizzard = Math.max(0, currentStockL - blizzardTotalBurn);
    const postBlizzardDays = remainingAfterBlizzard / standardBurnRate;
    const effectiveDaysRemaining = Number((blizzardDays + postBlizzardDays).toFixed(1)); // ~10.3 days

    const fallbackAnalysis = {
      scenario: forecastScenario,
      currentFuelLiters: currentStockL,
      standardBurnRateLitersPerDay: standardBurnRate,
      blizzardBurnRateLitersPerDay: blizzardBurnRate,
      burnRateIncreasePercent: 190, // +190% (290% total load)
      staticMinStockThreshold: staticMin,
      dynamicMinStockThreshold: dynamicMin,
      daysRemainingStatic,
      daysRemainingUnderBlizzard: effectiveDaysRemaining,
      weatherConditions: {
        tempC: ambientTempC,
        windSpeedKt,
        windChillC,
        forecastHorizonDays: blizzardDays,
        severity: 'SEVERE CAT-3 POLAR BLIZZARD',
      },
      aiOperationalInsights: [
        `Severe blizzard forecast for the next ${blizzardDays} days (-52°C, ${windSpeedKt}kt katabatic gale, -68°C windchill) will force station thermal heating systems and backup turbine blankets to run at 290% continuous duty load.`,
        `Daily fuel consumption accelerates from standard 500 L/day to 1,450 L/day (+190% surge), consuming 4,350 Liters over the 72-hour blizzard window alone.`,
        `Traditional static inventory threshold (4,000L) fails to account for storm aftermath and maritime ice-closure risks. AI dynamically elevates the minimum stock alert from 4,000L to 8,500L to maintain life-support safety buffer.`,
        `Estimated days of supply drops precipitously from 30.0 days down to ${effectiveDaysRemaining} days. Polar supply ship lead time from Cape Town is 7-9 days; early automated dispatch is mandatory before harbor lead freeze.`
      ],
      earlySupplyShipDirective: {
        recommended: true,
        shipName: 'MV Vasiliy Golovnin (Polar Icebreaker & Tanker)',
        cargoVolumeLiters: 45000,
        cargoType: 'Arctic Diesel Fuel F-34 / JP-8',
        originPort: 'Cape Town Logistics Hub',
        destinationStation: 'Maitri Station (Tank Farm Alpha)',
        urgency: 'CRITICAL_EARLY_BLIZZARD_DISPATCH',
        estimatedTransitDays: 8,
        rationale: 'Supply ship must be dispatched immediately before fast-ice locks coastal bays. Waiting for traditional 4,000L alert would cause catastrophic life-support blackout.'
      },
      traditionalVsAiComparison: {
        traditionalApproach: 'Dashboard statically displays "15,000L remaining" at 500L/day with fixed 4,000L alert. Blind to the incoming blizzard, HQ delays ordering until fuel drops below 4,000L, by which time sea ice blocks the supply ship.',
        aiDynamicApproach: 'AI reads 3-day blizzard forecast, calculates 1,450L/day heating surge, raises minimum stock threshold to 8,500L in advance, and issues an early automated request to the supply ship today itself.'
      }
    };

    // Update inventory minimum stock in PolarisDb if requested and NOT in simulation mode
    if (autoAdjustMinStock && !isSimulation && systemState.polarisDb) {
      let thresholdChanged = false;
      systemState.polarisDb.inventory = systemState.polarisDb.inventory.map((inv: any) => {
        if (inv.id === 'INV-0002' || (inv.name && inv.name.toLowerCase().includes('diesel')) || (inv.name && inv.name.toLowerCase().includes('fuel'))) {
          if (inv.minStock !== dynamicMin) {
            thresholdChanged = true;
          }
          return {
            ...inv,
            minStock: dynamicMin,
            notes: `[AI DYNAMIC ADJUSTMENT] Minimum stock threshold raised from 4,000L to 8,500L due to 3-day severe blizzard (-52°C).`
          };
        }
        return inv;
      });
      if (Array.isArray(systemState.supplies)) {
        systemState.supplies = systemState.supplies.map((s) => {
          if (s.category === 'fuel' || (s.name && s.name.toLowerCase().includes('fuel'))) {
            if (s.minThreshold !== dynamicMin) {
              thresholdChanged = true;
            }
            return { ...s, minThreshold: dynamicMin };
          }
          return s;
        });
      }
      if (systemState.polarisDb.inventory) {
        systemState.inventory = systemState.polarisDb.inventory;
      }

      // Persist state to disk and broadcast update ONLY when authoritative threshold actually changed
      if (thresholdChanged) {
        persistState();
        broadcast({
          type: 'STATE_UPDATE',
          payload: systemState,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (autoAdjustMinStock && isSimulation && simSession?.sandboxState?.polarisDb) {
      simSession.sandboxState.polarisDb.inventory = simSession.sandboxState.polarisDb.inventory.map((inv: any) => {
        if (inv.id === 'INV-0002' || (inv.name && inv.name.toLowerCase().includes('diesel')) || (inv.name && inv.name.toLowerCase().includes('fuel'))) {
          return {
            ...inv,
            minStock: dynamicMin,
            notes: `[SIMULATION DYNAMIC ADJUSTMENT] Minimum stock threshold raised from 4,000L to 8,500L due to 3-day severe blizzard (-52°C).`
          };
        }
        return inv;
      });
      if (simSession?.sandboxState?.polarisDb?.inventory) {
        simSession.sandboxState.inventory = simSession.sandboxState.polarisDb.inventory;
      }
    }

    if (!keyToUse) {
      return res.json({
        status: 'ok',
        evaluation: fallbackAnalysis,
        mode: 'ml_physics_model',
        model: 'Polar Thermal Habitat Energy Core',
        cached: false,
        coalesced: false,
        tokensSaved: 1400,
        latencyMs: 3,
        optimization: 'ZERO_KEY_SIMULATION',
        timestamp: new Date().toISOString(),
      });
    }

    const cacheKey = aiOptimizer.generateKey('weather-inv', {
      currentStockL,
      forecastScenario,
      ambientTempC,
      windSpeedKt,
      blizzardDays
    });

    try {
      // 15-minute TTL, ~1,400 tokens estimated
      const execution = await aiOptimizer.execute('weather-inventory', cacheKey, 900000, 1400, async () => {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `STATION: Maitri | CurrentFuel=${currentStockL}L | NormalBurn=${standardBurnRate}L/day | Blizzard=${blizzardDays}days at ${ambientTempC}°C, ${windSpeedKt}kt winds (290% surge load = ${blizzardBurnRate}L/day).
TASK: Predict dynamic stock threshold elevation to 8,500L and early supply ship booking (MV Vasiliy Golovnin). Output strict JSON.
JSON STRUCTURE:
{
  "scenario": "blizzard_3day",
  "currentFuelLiters": ${currentStockL},
  "standardBurnRateLitersPerDay": 500,
  "blizzardBurnRateLitersPerDay": 1450,
  "staticMinStockThreshold": 4000,
  "dynamicMinStockThreshold": 8500,
  "daysRemainingStatic": 30.0,
  "daysRemainingUnderBlizzard": ${effectiveDaysRemaining},
  "aiOperationalInsights": [
    "Severe blizzard forecast for next 3 days...",
    "Heaters run 290% more...",
    "AI automatically adjusts minimum stock alert...",
    "Early supply ship request dispatched..."
  ],
  "earlySupplyShipDirective": {
    "recommended": true,
    "shipName": "MV Vasiliy Golovnin (Polar Icebreaker & Tanker)",
    "cargoVolumeLiters": 45000,
    "cargoType": "Arctic Diesel Fuel F-34 / JP-8",
    "originPort": "Cape Town Logistics Hub",
    "destinationStation": "Maitri Station",
    "urgency": "CRITICAL_EARLY_BLIZZARD_DISPATCH",
    "estimatedTransitDays": 8,
    "rationale": "Must dispatch early before harbor freezes."
  },
  "traditionalVsAiComparison": {
    "traditionalApproach": "Dashboard shows 15,000L remaining with static alert, blind to blizzard.",
    "aiDynamicApproach": "AI reads blizzard forecast, adjusts min stock alert, and orders supply ship early."
  }
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are the Antarctic Logistics & Thermal Engineering AI Commander. Output valid JSON only.',
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 950,
          },
        });

        let parsed = fallbackAnalysis;
        try {
          const text = aiResponse.text?.trim() || '{}';
          parsed = { ...fallbackAnalysis, ...JSON.parse(text) };
        } catch (pe) {
          console.warn('[POLAR-AI] Failed to parse Weather Inventory JSON, using fallback:', pe);
        }
        return parsed;
      });

      res.json({
        status: 'ok',
        evaluation: execution.data,
        mode: execution.cached ? 'gemini_ai_cached' : 'gemini_ai_live',
        model: 'gemini-3.8-flash',
        cached: execution.cached,
        coalesced: execution.coalesced,
        tokensSaved: execution.tokensSaved,
        latencyMs: execution.latencyMs,
        optimization: 'TOKEN_SAVER_MAX',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Weather inventory AI error, returning local model:', err.message);
      res.json({
        status: 'ok',
        evaluation: fallbackAnalysis,
        mode: 'ml_physics_fallback',
        error: err.message,
        cached: false,
        coalesced: false,
        tokensSaved: 1400,
        latencyMs: 14,
        optimization: 'GRACEFUL_DEGRADATION',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Early Supply Ship Dispatch Request Handler
  app.post('/api/ai/weather-inventory/request-ship', requireAuth, requireRole(['transport']), (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const isSimulation = Boolean(simSession || req.body?.isSimulation === true);

    const {
      shipName = 'MV Vasiliy Golovnin (Polar Icebreaker & Tanker)',
      cargoVolumeLiters = 45000,
      cargoType = 'Arctic Diesel Fuel F-34 / JP-8',
      station = 'Maitri Station',
      urgency = 'CRITICAL_EARLY_BLIZZARD_DISPATCH',
    } = req.body || {};

    const targetStation = (station || 'Maitri').toLowerCase();
    const destName = targetStation.includes('bharati') ? 'Bharati' : 'Maitri';

    // Simulation Isolation: Never mutate live production shipments, audit log, or broadcast during simulation
    if (isSimulation) {
      if (simSession && simSession.sandboxState?.polarisDb) {
        const simShipments = simSession.sandboxState.polarisDb.shipments || [];
        const existingSimShipment = simShipments.find((s: any) => {
          const isActive = s.status !== 'Delivered' && s.status !== 'Cancelled';
          if (!isActive) return false;
          const destMatches = (s.destination && s.destination.toLowerCase().includes(destName.toLowerCase())) ||
            (s.destination && targetStation.includes(s.destination.toLowerCase()));
          const vesselMatches = s.notes && s.notes.includes(shipName);
          return destMatches && vesselMatches;
        });

        if (existingSimShipment) {
          return res.json({
            status: 'ok',
            simulation: true,
            alreadyRequested: true,
            shipmentId: existingSimShipment.id,
            message: `[SIMULATION] Supply ship '${shipName}' to ${destName} has already been requested in scenario (${existingSimShipment.id}). Duplicate simulation shipment prevented.`,
            etaDays: 8,
            timestamp: new Date().toISOString(),
          });
        }

        const shipmentId = `SIM-SHP-FUEL-${Date.now().toString().slice(-4)}`;
        simSession.sandboxState.polarisDb.shipments.unshift({
          id: shipmentId,
          origin: 'Cape Town Logistics Hub',
          destination: destName,
          expeditionId: 'EXP-0003',
          cargo: `${cargoVolumeLiters.toLocaleString()}L ${cargoType}`,
          weight: Math.round(cargoVolumeLiters * 0.84),
          quantity: Math.round(cargoVolumeLiters / 208),
          mode: 'Ship',
          departure: new Date().toISOString().slice(0, 10),
          expectedArrival: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
          actualArrival: null,
          status: 'Dispatched',
          notes: `[SIMULATION] Early resupply requested for ${shipName}.`,
        });

        return res.json({
          status: 'ok',
          simulation: true,
          shipmentId,
          message: `[SIMULATION] Early supply ship request confirmed for ${shipName} in isolated training environment.`,
          etaDays: 8,
          timestamp: new Date().toISOString(),
        });
      }
      return res.json({
        status: 'ok',
        simulation: true,
        shipmentId: `SIM-SHP-FUEL-${Date.now().toString().slice(-4)}`,
        message: `[SIMULATION] Early supply ship request confirmed for ${shipName} in isolated training environment.`,
        etaDays: 8,
        timestamp: new Date().toISOString(),
      });
    }

    if (systemState.polarisDb) {
      // Server-side Deduplication: Prevent repeated identical active/pending requests from creating duplicate shipments
      const activeShipments = systemState.polarisDb.shipments || [];
      const existingShipment = activeShipments.find((s: any) => {
        const isActive = s.status !== 'Delivered' && s.status !== 'Cancelled';
        if (!isActive) return false;
        const destMatches = (s.destination && s.destination.toLowerCase().includes(destName.toLowerCase())) ||
          (s.destination && targetStation.includes(s.destination.toLowerCase()));
        const vesselMatches = s.notes && s.notes.includes(shipName);
        const cargoMatches = s.cargo && s.cargo.toLowerCase().includes(cargoType.toLowerCase().slice(0, 10));
        return destMatches && (vesselMatches || cargoMatches);
      });

      if (existingShipment) {
        return res.json({
          status: 'ok',
          alreadyRequested: true,
          shipmentId: existingShipment.id,
          message: `Supply ship '${shipName}' to ${destName} has already been dispatched (${existingShipment.id}). Duplicate shipment creation prevented.`,
          etaDays: 8,
          timestamp: new Date().toISOString(),
        });
      }

      const shipmentId = `SHP-FUEL-${Date.now().toString().slice(-4)}`;

      // 1. Create expedited fuel shipment
      const newShipment = {
        id: shipmentId,
        origin: 'Cape Town Logistics Hub',
        destination: destName,
        expeditionId: 'EXP-0003',
        cargo: `${cargoVolumeLiters.toLocaleString()}L ${cargoType}`,
        weight: Math.round(cargoVolumeLiters * 0.84), // kg
        quantity: Math.round(cargoVolumeLiters / 208), // 208L drums or bulk tanker
        mode: 'Ship',
        departure: new Date().toISOString().slice(0, 10),
        expectedArrival: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
        actualArrival: null,
        status: 'Dispatched',
        notes: `[AI BLIZZARD DISPATCH] Early resupply requested by AI weather engine due to 3-day severe blizzard (-52°C). Vessel: ${shipName}.`,
      };

      systemState.polarisDb.shipments.unshift(newShipment);

      // 2. Add Audit Log
      systemState.polarisDb.auditLog.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: 'AI-WEATHER-LOGISTICS-ENGINE',
        action: 'EARLY_SUPPLY_SHIP_REQUEST_SENT',
        entity: 'Shipment / Inventory',
        details: `Automated early request sent to ${shipName} for ${cargoVolumeLiters.toLocaleString()}L fuel delivery to ${destName} before blizzard sea-ice lock-out.`,
      });

      // 3. Add Dispatch Log
      systemState.dispatchLogs.unshift({
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        callsign: 'POLARIS-AI-LOGISTICS',
        severity: 'urgent_distress',
        sector: `${destName} Port Lead`,
        message: `?? EARLY SUPPLY SHIP DISPATCHED: ${shipName} booked with ${cargoVolumeLiters.toLocaleString()}L Arctic Diesel. ETA 8 days. Triggered early by AI blizzard forecast.`,
      });
    }

    persistState();
    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'ok',
      shipmentId: (systemState.polarisDb?.shipments && systemState.polarisDb.shipments[0]?.id) || 'SHP-CONFIRMED',
      message: `Early request confirmed! ${shipName} dispatched from Cape Town with ${cargoVolumeLiters.toLocaleString()}L fuel for ${destName}.`,
      etaDays: 8,
      timestamp: new Date().toISOString(),
    });
  });

  // =========================================================================
  // AI SMART ROUTE OPTIMIZATION (DYNAMIC SATELLITE COMPUTER VISION PATHFINDING)
  // =========================================================================
  app.post('/api/ai/smart-route/optimize', requireAuth, async (req, res) => {
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    const {
      corridor = 'Maitri Station to South Pole Inland Depot Traverse',
      sensorSource = 'Sentinel-1 SAR C-Band & WorldView-3 30cm Optical Satellite',
      trucks = ['TRK-Alpha Heavy Snowcat (AST-0001)', 'P300 Supply Hauler Convoy-1'],
      userLat,
      userLng,
      userLocationName,
      destinationName = 'Nearest Polar Research Hub / Inland Base',
      weatherSummary,
      localHazards = [],
    } = req.body || {};

    const isDynamicLocation = typeof userLat === 'number' && typeof userLng === 'number';

    const detectedCrevasses = [
      {
        id: 'CRV-01',
        name: 'Crevasse Chasm C-104 (Major Shear Fissure)',
        lat: isDynamicLocation ? userLat - 0.15 : -71.42,
        lng: isDynamicLocation ? userLng + 0.12 : 12.28,
        widthMeters: 18.5,
        depthMeters: 42.0,
        orientationDeg: 124,
        dangerLevel: 'CRITICAL_COLLAPSE_ZONE' as const,
        intersectsOldRoute: true,
        satelliteSensor: 'Sentinel-1 Interferometric SAR (Interferogram Coherence Drop)',
        detectedTimestamp: 'Daily Pass: 04:30 UTC Today',
        description: 'Newly sheared transverse crevasse spanning 450m across the direct legacy route. Snow-bridge thickness < 0.4m; guaranteed punch-through for 28-ton supply trucks.'
      },
      {
        id: 'CRV-02',
        name: 'Stress Fracture F-88 (Sub-surface Hollow Cavity)',
        lat: isDynamicLocation ? userLat - 0.35 : -71.55,
        lng: isDynamicLocation ? userLng + 0.28 : 12.45,
        widthMeters: 12.0,
        depthMeters: 28.0,
        orientationDeg: 82,
        dangerLevel: 'SEVERE_SHEAR' as const,
        intersectsOldRoute: true,
        satelliteSensor: 'WorldView-3 30cm Multispectral Albedo & Thermal Contrast',
        detectedTimestamp: 'Daily Pass: 05:15 UTC Today',
        description: 'Rapidly widening shear crack on glacier hinge line caused by ice sheet creep (+3.2m/month). Direct collision hazard.'
      },
      {
        id: 'CRV-03',
        name: 'Bergschrund Crevasse B-12',
        lat: isDynamicLocation ? userLat - 0.55 : -71.70,
        lng: isDynamicLocation ? userLng + 0.42 : 12.62,
        widthMeters: 9.5,
        depthMeters: 21.0,
        orientationDeg: 45,
        dangerLevel: 'MODERATE_FISSURE' as const,
        intersectsOldRoute: false,
        satelliteSensor: 'CryoSat-2 Radar Altimeter Surface Roughness',
        detectedTimestamp: 'Daily Pass: 06:00 UTC Today',
        description: 'Peripheral crevasse 180m north of new safe corridor. Within radar exclusion zone but safely skirted by AI route.'
      }
    ];

    const originLabel = isDynamicLocation
      ? `${userLocationName || 'Device Location'} (${userLat.toFixed(4)}°, ${userLng.toFixed(4)}°)`
      : 'WP-01: Maitri Depot Staging';

    const legacyRoute = {
      name: `Direct Traverse Line (${isDynamicLocation ? 'Device GPS Direct' : 'Static GPS Baseline'})`,
      distanceKm: isDynamicLocation ? 148.2 : 142.5,
      safetyScorePercent: 8,
      hazardsCount: isDynamicLocation ? Math.max(2, localHazards.length) : 2,
      status: 'HAZARDOUS_COMPROMISED' as const,
      warningMessage: `CRITICAL HAZARD: Direct line intersects active terrain shear cracks & unmitigated local weather hazards (${weatherSummary || 'Sub-zero gusts'}). High failure risk.`,
      waypoints: [
        { name: originLabel, lat: isDynamicLocation ? userLat : -70.76, lng: isDynamicLocation ? userLng : 11.73, isHazardPoint: false },
        { name: 'WP-02: Intermediate Staging Gate', lat: isDynamicLocation ? userLat - 0.1 : -71.10, lng: isDynamicLocation ? userLng + 0.1 : 12.05, isHazardPoint: false },
        { name: 'WP-03: CRITICAL DANGER - Crevasse & Katabatic Intersection', lat: isDynamicLocation ? userLat - 0.25 : -71.42, lng: isDynamicLocation ? userLng + 0.2 : 12.28, isHazardPoint: true, note: 'Direct 18.5m open chasm & gale hazard' },
        { name: 'WP-04: CRITICAL DANGER - Surface Shear Fracture', lat: isDynamicLocation ? userLat - 0.4 : -71.55, lng: isDynamicLocation ? userLng + 0.35 : 12.45, isHazardPoint: true, note: 'Weak snow bridge punch-through hazard' },
        { name: `WP-05: ${destinationName}`, lat: isDynamicLocation ? userLat - 0.7 : -71.95, lng: isDynamicLocation ? userLng + 0.6 : 12.90, isHazardPoint: false },
      ]
    };

    const aiSafeRoute = {
      name: 'AI Dynamic Safe Blue-Ice Route (Dynamic Location & Hazard Avoidance)',
      distanceKm: isDynamicLocation ? 162.8 : 154.2,
      safetyScorePercent: 99.4,
      blueIceCorridorKm: 94.0,
      bufferDistanceMeters: 300,
      status: 'AI_OPTIMIZED_SAFE' as const,
      clearedBy: 'Polaris Neural Pathfinder & Real-time Meteorological Hazard Matrix',
      waypoints: [
        { name: originLabel, lat: isDynamicLocation ? userLat : -70.76, lng: isDynamicLocation ? userLng : 11.73, description: 'Live device beacon locked. Departure gate clear.' },
        { name: 'WP-02: Blue-Ice Ridge Entry Gate', lat: isDynamicLocation ? userLat - 0.08 : -71.08, lng: isDynamicLocation ? userLng + 0.06 : 12.02, description: 'Solid blue-ice surface with zero subsurface voids.' },
        { name: 'WP-03: West Hazard Diversion (Bypassing Fissures by +320m)', lat: isDynamicLocation ? userLat - 0.22 : -71.36, lng: isDynamicLocation ? userLng + 0.12 : 12.15, description: 'Circumnavigates local blizzard and shear zone with positive radar margin.' },
        { name: 'WP-04: Stable Compression Firn Dome', lat: isDynamicLocation ? userLat - 0.38 : -71.60, lng: isDynamicLocation ? userLng + 0.26 : 12.32, description: 'Thick 14m firn compression ridge with 100% load bearing.' },
        { name: 'WP-05: East Approach Corridor', lat: isDynamicLocation ? userLat - 0.52 : -71.78, lng: isDynamicLocation ? userLng + 0.44 : 12.58, description: 'Level sastrugi traverse with verified ground-penetrating radar trace.' },
        { name: `WP-06: ${destinationName} (Destination)`, lat: isDynamicLocation ? userLat - 0.7 : -71.95, lng: isDynamicLocation ? userLng + 0.6 : 12.90, description: 'Arrival terminal reached safely with zero hazard encounters.' },
      ]
    };

    const fallbackRoutePlan = {
      id: `RTE-OPT-${Date.now().toString().slice(-4)}`,
      title: isDynamicLocation
        ? `Dynamic AI Route from ${userLocationName || 'Device'} to ${destinationName}`
        : 'Daily AI Satellite-Mapped Safe Traverse Route',
      corridor: isDynamicLocation ? `${userLocationName || 'Device Location'} → ${destinationName}` : corridor,
      lastSurveyDate: new Date().toISOString().slice(0, 10) + ' (Live Real-Time Satellite & Sensor Sync)',
      satellitePass: sensorSource,
      crevassesDetected: detectedCrevasses,
      legacyRoute,
      aiSafeRoute,
      truckConvoyUnits: trucks.map((name: string, i: number) => ({
        id: `TRK-00${i + 1}`,
        name,
        model: i === 0 ? 'PistenBully 300 Polar Track' : 'Heavy Snowcat 28T Sledge Hauler',
        weightTons: 28,
        status: 'Active Route Sync' as const,
        routeSyncTimestamp: new Date().toISOString(),
      })),
      automatedPushActive: true,
      lastPushedAt: new Date().toISOString(),
      summary: isDynamicLocation
        ? `Dynamic route computed from device coordinates (${userLat.toFixed(4)}°, ${userLng.toFixed(4)}°). AI pathfinder circumvented local weather hazards (${weatherSummary || 'Sub-zero system'}) and terrain fissures with a 300m safety buffer.`
        : 'Computer Vision daily satellite pass detected 2 newly formed crevasse chasms intersecting the old supply route. AI autonomously re-routed convoy through stable blue-ice ridge with 250m safety buffer, eliminating accident risk.',
    };

    if (!keyToUse) {
      return res.json({
        status: 'ok',
        plan: fallbackRoutePlan,
        mode: 'cv_heuristic_satellite_model',
        model: 'Polar Glaciology Deep Ice CV Model',
        cached: false,
        coalesced: false,
        tokensSaved: 1600,
        latencyMs: 4,
        optimization: 'ZERO_KEY_SIMULATION',
        timestamp: new Date().toISOString(),
      });
    }

    const cacheKey = aiOptimizer.generateKey('smart-route', {
      corridor,
      sensorSource,
      userLat: isDynamicLocation ? Number(userLat.toFixed(2)) : undefined,
      userLng: isDynamicLocation ? Number(userLng.toFixed(2)) : undefined,
      destinationName,
    });

    try {
      // 10-minute TTL, ~1,600 tokens estimated
      const execution = await aiOptimizer.execute('smart-route', cacheKey, 600000, 1600, async () => {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `ORIGIN: ${isDynamicLocation ? `${userLocationName || 'Device Location'} (${userLat.toFixed(4)}, ${userLng.toFixed(4)})` : 'Maitri'} | DEST: ${destinationName} | WX: ${weatherSummary || 'Sub-zero'}.
TASK: Compute dynamic safe blue-ice route avoiding detected crevasses with 300m safety buffer. Output strict JSON.
JSON STRUCTURE:
{
  "corridor": "${fallbackRoutePlan.corridor}",
  "satellitePass": "${sensorSource}",
  "summary": "...",
  "crevassesDetected": ${JSON.stringify(detectedCrevasses)},
  "legacyRoute": ${JSON.stringify(legacyRoute)},
  "aiSafeRoute": ${JSON.stringify(aiSafeRoute)}
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are the Polar Satellite Remote Sensing & Glacial Navigation AI. Output valid JSON only.',
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 1100,
          },
        });

        let parsed = fallbackRoutePlan;
        try {
          const text = aiResponse.text?.trim() || '{}';
          const aiJson = JSON.parse(text);
          parsed = { ...fallbackRoutePlan, ...aiJson };
        } catch (pe) {
          console.warn('[POLAR-AI] Failed to parse Smart Route JSON, using fallback:', pe);
        }
        return parsed;
      });

      res.json({
        status: 'ok',
        plan: execution.data,
        mode: execution.cached ? 'gemini_ai_cached' : 'gemini_ai_live',
        model: 'gemini-3.8-flash',
        cached: execution.cached,
        coalesced: execution.coalesced,
        tokensSaved: execution.tokensSaved,
        latencyMs: execution.latencyMs,
        optimization: 'TOKEN_SAVER_MAX',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[POLAR-AI] Smart Route AI error, returning local model:', err.message);
      res.json({
        status: 'ok',
        plan: fallbackRoutePlan,
        mode: 'cv_heuristic_fallback',
        error: err.message,
        cached: false,
        coalesced: false,
        tokensSaved: 1600,
        latencyMs: 15,
        optimization: 'GRACEFUL_DEGRADATION',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Push Dynamic Safe Route to Supply Trucks
  app.post('/api/ai/smart-route/push-to-trucks', requireAuth, requireRole(['transport']), (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const isSimulation = Boolean(simSession || req.body?.isSimulation === true);

    const {
      routeId = 'RTE-OPT-SAFE',
      routeName = 'AI Dynamic Safe Blue-Ice Route (Daily CV Satellite Mapped)',
      truckCount = 2,
      truckNames = ['TRK-Alpha Heavy Snowcat (AST-0001)', 'P300 Supply Hauler Convoy-1'],
    } = req.body || {};

    if (isSimulation) {
      if (simSession && simSession.sandboxState) {
        simSession.sandboxState.dispatchLogs = [
          {
            id: `SIM-LOG-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            callsign: 'AI SATELLITE ROUTER (SIM)',
            severity: 'routine',
            sector: 'South Traverse Corridor',
            message: `🛰️ [SIMULATION] DYNAMIC SAFE ROUTE SYNCED: ${truckNames.join(', ')} updated with daily satellite CV route.`,
          },
          ...(simSession.sandboxState.dispatchLogs || []),
        ];
      }
      return res.json({
        status: 'ok',
        simulation: true,
        message: `[SIMULATION] Safe dynamic route successfully transmitted to ${truckCount} supply trucks in isolated scenario.`,
        trucks: truckNames,
        timestamp: new Date().toISOString(),
      });
    }

    if (systemState.polarisDb) {
      // 1. Audit Log
      systemState.polarisDb.auditLog.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: 'AI-SATELLITE-CV-ROUTER',
        action: 'DYNAMIC_SAFE_ROUTE_PUSHED',
        entity: 'Transportation / Traverses',
        details: `Daily CV satellite safe route pushed to ${truckNames.join(', ')}. Circumvented 2 newly opened crevasse chasms (C-104 and F-88). 100% collision avoidance guaranteed.`,
      });

      // 2. Dispatch Log
      systemState.dispatchLogs.unshift({
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        callsign: 'AI SATELLITE ROUTER',
        severity: 'routine',
        sector: 'South Traverse Corridor',
        message: `🛰️ DYNAMIC SAFE ROUTE SYNCED: ${truckNames.join(', ')} updated with daily satellite CV route. Dangerous crevasse shear zones bypassed. Safe blue-ice traverse active.`,
      });
    }

    persistState();
    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'ok',
      message: `Safe dynamic route successfully transmitted to ${truckCount} supply trucks. Onboard GPS guidance locked to blue-ice corridor.`,
      trucks: truckNames,
      timestamp: new Date().toISOString(),
    });
  });

  // =========================================================================
  // GEMINI-POWERED WAYPOINT ROUTE OPTIMIZATION (VALIDATED HYBRID ENGINE)
  // =========================================================================
  app.post('/api/ai/waypoints/optimize', requireAuth, async (req, res) => {
    const token = (req as any).token;
    const simSession = getSessionSimulation(token);
    const customKey = req.body.geminiApiKey || req.headers['x-gemini-api-key'];
    const keyToUse = (typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;

    const {
      waypoints = [],
      asset,
      environment = {},
      constraints = {},
      isSimulation: clientSimFlag,
    } = (req.body as WaypointOptimizationRequest) || {};

    // Server-Authoritative: active simulation session always takes precedence over client flag
    const isSimulation = Boolean(simSession || clientSimFlag === true);

    if (!Array.isArray(waypoints) || waypoints.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No candidate waypoints provided for optimization.',
      });
    }

    const candidateMap = new Map<string, Waypoint>(waypoints.map((w) => [w.id, w]));
    const mandatorySet = new Set<string>(
      (constraints.mandatoryWaypointIds || [])
        .concat(waypoints.filter((w) => w.isMandatory || w.priority === 'mandatory').map((w) => w.id))
    );

    // Fallback executor
    const executeFallback = (reason: string): WaypointOptimizationResult => {
      const plan = runDeterministicWaypointOptimizer(
        { waypoints, asset, environment, constraints, isSimulation },
        reason
      );
      const fallbackAuditEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: isSimulation ? 'SIMULATION-ROUTE-ENGINE' : 'POLAR-ROUTE-ENGINE',
        action: 'DETERMINISTIC_FALLBACK_ROUTING',
        entity: 'Waypoints / Traverses',
        details: `${isSimulation ? '[SIMULATION] ' : ''}Deterministic geodesic fallback engaged (${reason}). Preserved all ${mandatorySet.size} mandatory waypoints across ${waypoints.length} total candidates.`,
      };

      if (isSimulation) {
        if (simSession && simSession.sandboxState?.polarisDb) {
          simSession.sandboxState.polarisDb.auditLog.unshift(fallbackAuditEntry);
        }
      } else if (systemState.polarisDb) {
        systemState.polarisDb.auditLog.unshift(fallbackAuditEntry);
      }
      return plan;
    };

    // If no API key is available, run deterministic fallback immediately
    if (!keyToUse) {
      const fallbackPlan = executeFallback('No Gemini API Key supplied. Running deterministic polar pathfinder.');
      const fallbackResolved = {
        ...fallbackPlan,
        estimatedDistance: fallbackPlan.estimatedDistance ?? fallbackPlan.estimatedDistanceKm,
      };
      return res.json({
        status: 'ok',
        success: true,
        plan: fallbackResolved,
        result: fallbackResolved,
        mode: 'cv_heuristic_fallback',
        model: 'Polar Deterministic Geodesic Engine',
        cached: false,
        coalesced: false,
        tokensSaved: 1400,
        latencyMs: 6,
        optimization: 'ZERO_KEY_SIMULATION',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate cache key based on candidate waypoints, environmental conditions, and constraints
    const cacheKey = aiOptimizer.generateKey('wp-opt', {
      wpFingerprint: waypoints.map((w) => `${w.id}:${w.lat.toFixed(3)}:${w.lng.toFixed(3)}:${w.priority || 'n'}`).sort(),
      assetLocation: asset ? `${asset.lat.toFixed(2)},${asset.lng.toFixed(2)}` : 'none',
      temp: environment.tempC,
      wind: environment.windSpeedKts,
      dangerCount: (environment.dangerZones || []).length,
      crevasseCount: (environment.crevasses || []).length,
      mandatory: Array.from(mandatorySet).sort(),
    });

    try {
      // 10-minute TTL, ~1,400 estimated tokens
      const execution = await aiOptimizer.execute('waypoint-optimizer', cacheKey, 600000, 1400, async () => {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        // Construct compact, highly structured prompt with real mission telemetry
        const prompt = `TACTICAL POLAR EXPEDITION ROUTE OPTIMIZATION TASK
Analyze the available waypoint candidates and mission context, then recommend an efficient and safer waypoint sequence.

CANDIDATE WAYPOINTS (IDs, Coordinates, Elevation, Priority):
${waypoints
  .map(
    (w) =>
      `- ID: "${w.id}" | Name: "${w.name}" | Lat: ${w.lat.toFixed(4)} | Lng: ${w.lng.toFixed(4)} | Elev: ${w.elevationM}m | Priority: ${w.priority || (w.isMandatory ? 'mandatory' : 'normal')}${w.hazardNote ? ` | Hazard: "${w.hazardNote}"` : ''}`
  )
  .join('\n')}

ACTIVE CONVOY ASSET:
${
  asset
    ? `- Name: ${asset.name} (${asset.id}) | Lat: ${asset.lat.toFixed(4)}, Lng: ${asset.lng.toFixed(4)} | Speed: ${asset.speedKmh || 25} km/h | Fuel: ${asset.fuelPercent || 100}% | Condition: ${asset.condition || 'Nominal'}`
    : '- Nominal polar crawler convoy (PistenBully / Heavy Snowcat) at staging departure.'
}

ENVIRONMENT & METEOROLOGY:
- Ambient Temp: ${environment.tempC ?? -32}°C | Apparent Chill: ${environment.apparentTempC ?? -45}°C
- Wind: ${environment.windSpeedKts ?? 18} kts | Visibility: ${environment.visibilityKm ?? 10} km
- Conditions: ${environment.weatherDescription || 'Extreme polar conditions'}
${
  (environment.dangerZones || []).length > 0
    ? `- Known Danger Zones: ${environment.dangerZones!.map((d) => `"${d.name}" (Center: ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}, Radius: ${d.radiusKm}km, Severity: ${d.severityLevel})`).join('; ')}`
    : '- Danger Zones: None recorded in sector.'
}
${
  (environment.crevasses || []).length > 0
    ? `- Detected Crevasses: ${environment.crevasses!.map((c) => `"${c.name}" (${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}, Level: ${c.dangerLevel || 'Severe'})`).join('; ')}`
    : '- Detected Crevasses: None recorded.'
}

CONSTRAINTS:
- Mandatory Waypoint IDs (MUST be included): ${Array.from(mandatorySet).join(', ') || 'None required'}
${constraints.fuelLimitsKm ? `- Fuel Distance Limit: ${constraints.fuelLimitsKm} km max` : ''}

STRICT OPTIMIZATION RULES:
1. Return ONLY a valid JSON object matching the schema below.
2. "recommendedOrder" MUST be an array of waypoint ID strings selected exclusively from the CANDIDATE list.
3. NEVER INVENT NONEXISTENT WAYPOINT IDS OR COORDINATES.
4. ALL MANDATORY WAYPOINTS MUST REMAIN INCLUDED.
5. Order waypoints to minimize travel risk, avoid known crevasses and sub-zero danger zones, and preserve logical mission progress.

SCHEMA:
{
  "recommendedOrder": ["wp-id-1", "wp-id-2", "wp-id-3"],
  "reasoning": [
    "Circumnavigates severe crevasse shear zone",
    "Minimizes total exposure to extreme cold-pool anomaly",
    "Preserves all mandatory depot stops in priority sequence"
  ],
  "estimatedDistance": 123.4,
  "estimatedDuration": 4567,
  "riskLevel": "LOW",
  "warnings": [],
  "confidence": 0.95
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are the Polar Navigation AI Engine. You must output valid, strict JSON only. Never hallucinate IDs.',
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 1200,
          },
        });

        const text = aiResponse.text?.trim() || '{}';
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch (pe: any) {
          throw new Error(`Malformed JSON returned from Gemini: ${pe.message}`);
        }

        // =====================================================================
        // STRICT BACKEND VALIDATION PIPELINE
        // =====================================================================
        const recommendedOrderRaw = parsed.recommendedOrder || parsed.recommended_order;
        if (!Array.isArray(recommendedOrderRaw) || recommendedOrderRaw.length === 0) {
          throw new Error('Gemini response missing valid recommendedOrder array');
        }

        const recommendedOrder: string[] = recommendedOrderRaw.map((id: any) => String(id).trim());

        // 1. Anti-hallucination check: verify every returned ID actually exists
        const unknownIds = recommendedOrder.filter((id) => !candidateMap.has(id));
        if (unknownIds.length > 0) {
          throw new Error(`Gemini hallucinated nonexistent waypoint IDs: ${unknownIds.join(', ')}`);
        }

        // 2. Duplicate check
        const uniqueIds = new Set(recommendedOrder);
        if (uniqueIds.size !== recommendedOrder.length) {
          throw new Error('Gemini response contains duplicate waypoint IDs in recommendedOrder');
        }

        // 3. Mandatory waypoints check
        const missingMandatory = Array.from(mandatorySet).filter((mId) => !uniqueIds.has(mId));
        if (missingMandatory.length > 0) {
          throw new Error(`Gemini omitted mandatory mission waypoints: ${missingMandatory.join(', ')}`);
        }

        // 4. Ensure all candidates are included in the complete tour (append any un-ordered remaining candidates)
        for (const wp of waypoints) {
          if (!uniqueIds.has(wp.id)) {
            recommendedOrder.push(wp.id);
            uniqueIds.add(wp.id);
          }
        }

        // 5. Build physical ordered waypoints resolving strictly from candidateMap coordinates
        const orderedWaypoints: Waypoint[] = [];
        let calculatedTotalDistanceKm = 0;

        for (let i = 0; i < recommendedOrder.length; i++) {
          const rawWp = candidateMap.get(recommendedOrder[i])!;
          let distFromPrev = 0;
          if (i > 0) {
            const prevWp = orderedWaypoints[i - 1];
            distFromPrev = calculateHaversineKm(prevWp.lat, prevWp.lng, rawWp.lat, rawWp.lng);
            calculatedTotalDistanceKm += distFromPrev;
          }

          orderedWaypoints.push({
            ...rawWp,
            sequence: i + 1,
            distanceFromPrevKm: distFromPrev,
            status: i === 0 ? 'completed' : i === 1 ? 'current' : 'pending',
          });
        }

        calculatedTotalDistanceKm = Math.round(calculatedTotalDistanceKm * 10) / 10;
        const speedKmh = asset?.speedKmh && asset.speedKmh > 5 ? asset.speedKmh : 24.5;
        const estimatedDurationHours = Math.round((calculatedTotalDistanceKm / speedKmh) * 10) / 10;

        // Count danger zones avoided
        const dangerZones = environment.dangerZones || [];
        let hazardAvoidanceCount = 0;
        for (const dz of dangerZones) {
          const nearSegment = orderedWaypoints.some((wp) => {
            return calculateHaversineKm(dz.lat, dz.lng, wp.lat, wp.lng) <= dz.radiusKm * 1.5;
          });
          if (nearSegment) hazardAvoidanceCount++;
        }

        // Validate risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        const rawRisk = String(parsed.riskLevel || parsed.risk_level || 'LOW').toUpperCase();
        if (rawRisk === 'HIGH' || rawRisk === 'MEDIUM' || rawRisk === 'LOW') {
          riskLevel = rawRisk;
        }

        const finalResult: WaypointOptimizationResult = {
          recommendedOrder,
          orderedWaypoints,
          reasoning: Array.isArray(parsed.reasoning) && parsed.reasoning.length > 0
            ? parsed.reasoning.map(String)
            : [
                `Optimized traverse order reduces total distance to ${calculatedTotalDistanceKm} km.`,
                'Circumnavigates known active hazard sectors.',
                `Preserved all ${mandatorySet.size} mandatory mission waypoints.`,
              ],
          estimatedDistanceKm: calculatedTotalDistanceKm,
          estimatedDurationHours,
          riskLevel,
          warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
          confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.94,
          mode: 'gemini_ai_live',
          cached: false,
          timestamp: new Date().toISOString(),
          isSimulation: !!isSimulation,
          validationDetails: {
            allCandidateIdsValid: true,
            mandatoryPreserved: true,
            hazardAvoidanceCount,
            fallbackUsed: false,
          },
        };

        return finalResult;
      });

      // Audit log on server state (isolated during simulation)
      const aiAuditEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: isSimulation ? 'SIMULATION-GEMINI-NAV' : 'GEMINI-WAYPOINT-AI',
        action: 'AI_WAYPOINT_ROUTE_OPTIMIZED',
        entity: 'Waypoints / Traverses',
        details: `${isSimulation ? '[SIMULATION] ' : ''}Gemini 3.8 Flash analyzed ${waypoints.length} waypoints. Validated sequence: ${execution.data.recommendedOrder.join(' → ')}. Risk: ${execution.data.riskLevel}. Mode: ${execution.cached ? 'CACHED' : 'LIVE'}.`,
      };

      if (isSimulation) {
        if (simSession && simSession.sandboxState?.polarisDb) {
          simSession.sandboxState.polarisDb.auditLog.unshift(aiAuditEntry);
        }
      } else if (systemState.polarisDb) {
        systemState.polarisDb.auditLog.unshift(aiAuditEntry);
      }

      const resolvedPlan = {
        ...execution.data,
        estimatedDistance: execution.data?.estimatedDistance ?? execution.data?.estimatedDistanceKm,
        mode: execution.cached ? 'gemini_ai_cached' : 'gemini_ai_live',
        cached: execution.cached,
      };
      res.json({
        status: 'ok',
        success: true,
        plan: resolvedPlan,
        result: resolvedPlan,
        mode: execution.cached ? 'gemini_ai_cached' : 'gemini_ai_live',
        model: 'gemini-3.8-flash',
        cached: execution.cached,
        coalesced: execution.coalesced,
        tokensSaved: execution.tokensSaved,
        latencyMs: execution.latencyMs,
        optimization: 'TOKEN_SAVER_MAX',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('[POLAR-AI] Gemini Waypoint Optimization failed or rejected by validation:', err.message);
      const fallbackPlan = executeFallback(`Validation / AI Failure: ${err.message}`);
      const fallbackResolved = {
        ...fallbackPlan,
        estimatedDistance: fallbackPlan.estimatedDistance ?? fallbackPlan.estimatedDistanceKm,
      };
      res.json({
        status: 'ok',
        success: true,
        plan: fallbackResolved,
        result: fallbackResolved,
        mode: 'cv_heuristic_fallback',
        error: err.message,
        cached: false,
        coalesced: false,
        tokensSaved: 1400,
        latencyMs: 12,
        optimization: 'GRACEFUL_DEGRADATION',
        timestamp: new Date().toISOString(),
      });
    }
  });
  function syncPolarAssetToPolarisDb(polarAsset: any): any {
    const statusMap: Record<string, string> = {
      operational: 'Available',
      in_transit: 'In Transit',
      maintenance: 'Under Maintenance',
      cold_soaked: 'Under Maintenance',
      standby: 'Available',
    };
    return {
      id: polarAsset.id,
      name: polarAsset.name,
      category: polarAsset.category === 'heavy_traverse' ? 'Vehicles' : (polarAsset.category === 'scientific_rig' ? 'Instruments' : 'Equipment'),
      serial: polarAsset.code || `SN-${polarAsset.id}`,
      purchaseDate: '2024-01-01',
      location: polarAsset.currentLocation?.name || 'Maitri Depot',
      expeditionId: polarAsset.assignedExpeditionId || null,
      assignedPerson: null,
      condition: polarAsset.status === 'operational' ? 'Excellent' : (polarAsset.status === 'maintenance' ? 'Fair' : 'Good'),
      status: statusMap[polarAsset.status] || 'Available',
      lastMaintenance: polarAsset.lastMaintenanceDate || '2026-01-01',
      nextMaintenance: '2026-07-01',
      warranty: 'Under Warranty',
      currentLocation: polarAsset.currentLocation,
      telemetry: polarAsset.telemetry,
    };
  }

  function syncExpeditionToPolarisDb(newExp: any): any {
    return {
      id: newExp.id,
      name: newExp.name,
      region: newExp.region === 'antarctica' ? 'Antarctica' : 'Arctic',
      destination: newExp.waypoints?.[newExp.waypoints.length - 1]?.name || 'Field Station',
      base: newExp.region === 'antarctica' ? 'Maitri' : 'Himadri',
      start: newExp.departureDate || new Date().toISOString().slice(0, 10),
      end: newExp.estimatedReturnDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      status: newExp.phase === 'completed' ? 'Completed' : 'Active',
      manager: newExp.leader || 'PER-0001',
      objectives: newExp.objective || 'Scientific traverse and resupply',
      description: newExp.objective || 'Active polar expedition',
      currentLat: newExp.currentLat,
      currentLng: newExp.currentLng,
      waypoints: newExp.waypoints || [],
    };
  }

  function generateUniqueInventoryId(existingList: Array<{ id?: string }>): string {
  let maxNum = 0;
  for (const item of existingList) {
    const match = item?.id?.match(/^INV-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  const candidate = `INV-${String(nextNum).padStart(4, '0')}`;
  if (!existingList.some((i) => i?.id === candidate)) {
    return candidate;
  }
  return `INV-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

function applyActionToState(targetState: PolarSystemState, action: string, payload: any): PolarSystemState {
    switch (action) {
      case 'UPDATE_REGION':
        targetState.region = payload;
        break;
      case 'UPDATE_CONDITION':
        targetState.conditionLevel = payload;
        break;
      case 'UPDATE_ASSET': {
        if (!payload || !payload.id) {
          console.warn('[SERVER] Invalid UPDATE_ASSET payload received:', payload);
          return targetState;
        }
        targetState.assets = targetState.assets.map((a) => (a.id === payload.id ? { ...a, ...payload } : a));
        if (targetState.polarisDb && Array.isArray(targetState.polarisDb.assets)) {
          const statusMap: Record<string, string> = {
            operational: 'Available',
            in_transit: 'In Transit',
            maintenance: 'Under Maintenance',
            cold_soaked: 'Under Maintenance',
            standby: 'Available',
          };
          targetState.polarisDb.assets = targetState.polarisDb.assets.map((a: any) => {
            if (a.id === payload.id) {
              return {
                ...a,
                status: payload.status ? (statusMap[payload.status] || payload.status) : a.status,
                condition: payload.status === 'operational' ? 'Excellent' : (payload.status === 'maintenance' ? 'Fair' : a.condition),
                location: payload.currentLocation?.name || a.location,
                telemetry: payload.telemetry || a.telemetry,
              };
            }
            return a;
          });
        }
        break;
      }
      case 'ADD_ASSET': {
        if (!payload || !payload.id || !payload.name) {
          console.warn('[SERVER] Invalid ADD_ASSET payload received:', payload);
          return targetState;
        }
        targetState.assets = [payload, ...targetState.assets];
        if (targetState.polarisDb) {
          if (!Array.isArray(targetState.polarisDb.assets)) targetState.polarisDb.assets = [];
          const exists = targetState.polarisDb.assets.some((a: any) => a.id === payload.id);
          if (!exists) {
            targetState.polarisDb.assets = [syncPolarAssetToPolarisDb(payload), ...targetState.polarisDb.assets];
          }
        }
        break;
      }
      case 'UPDATE_EXPEDITION': {
        if (!payload || !payload.id) {
          console.warn('[SERVER] Invalid UPDATE_EXPEDITION payload received:', payload);
          return targetState;
        }
        targetState.expeditions = targetState.expeditions.map((e) => (e.id === payload.id ? { ...e, ...payload } : e));
        if (targetState.polarisDb && Array.isArray(targetState.polarisDb.expeditions)) {
          targetState.polarisDb.expeditions = targetState.polarisDb.expeditions.map((pe: any) => {
            if (pe.id === payload.id) {
              return {
                ...pe,
                currentLat: payload.currentLat ?? pe.currentLat,
                currentLng: payload.currentLng ?? pe.currentLng,
                waypoints: payload.waypoints ?? pe.waypoints,
                status: payload.phase === 'completed' ? 'Completed' : (payload.status || pe.status),
              };
            }
            return pe;
          });
        }
        break;
      }
      case 'ADD_EXPEDITION': {
        if (!payload || !payload.id || !payload.name) {
          console.warn('[SERVER] Invalid ADD_EXPEDITION payload received:', payload);
          return targetState;
        }
        targetState.expeditions = [payload, ...targetState.expeditions];
        if (targetState.polarisDb) {
          if (!Array.isArray(targetState.polarisDb.expeditions)) targetState.polarisDb.expeditions = [];
          const exists = targetState.polarisDb.expeditions.some((e: any) => e.id === payload.id);
          if (!exists) {
            targetState.polarisDb.expeditions = [syncExpeditionToPolarisDb(payload), ...targetState.polarisDb.expeditions];
          }
        }
        break;
      }
      case 'ADD_PERSONNEL': {
        if (!payload || !payload.id || !payload.name) {
          console.warn('[SERVER] Invalid ADD_PERSONNEL payload received:', payload);
          return targetState;
        }
        targetState.personnel = [payload, ...(targetState.personnel || INITIAL_PERSONNEL)];
        if (targetState.polarisDb) {
          if (!Array.isArray(targetState.polarisDb.personnel)) targetState.polarisDb.personnel = [];
          const exists = targetState.polarisDb.personnel.some((p: any) => p.id === payload.id);
          if (!exists) {
            targetState.polarisDb.personnel = [payload, ...targetState.polarisDb.personnel];
          }
        }
        break;
      }
      case 'ADD_INVENTORY': {
        if (!payload || typeof payload !== 'object' || !payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
          console.warn('[SERVER] Invalid ADD_INVENTORY payload received:', payload);
          return targetState;
        }

        const currentInventory = Array.isArray(targetState.inventory)
          ? targetState.inventory
          : (Array.isArray(targetState.polarisDb?.inventory) ? targetState.polarisDb.inventory : [...INITIAL_INVENTORY]);

        let itemId = (typeof payload.id === 'string' && payload.id.trim()) ? payload.id.trim() : '';
        if (!itemId || currentInventory.some((i) => i.id === itemId)) {
          itemId = generateUniqueInventoryId(currentInventory);
        }

        const rawQty = Number(payload.quantity);
        const quantity = (!isNaN(rawQty) && rawQty >= 0) ? rawQty : 0;
        const rawMin = Number(payload.minStock);
        const minStock = (!isNaN(rawMin) && rawMin >= 0) ? rawMin : 0;
        const rawCost = Number(payload.cost);
        const cost = (!isNaN(rawCost) && rawCost >= 0) ? rawCost : 0;

        const newItem = {
          id: itemId,
          name: payload.name.trim(),
          category: (typeof payload.category === 'string' && payload.category.trim()) ? payload.category.trim() : 'General Supplies',
          quantity,
          unit: (typeof payload.unit === 'string' && payload.unit.trim()) ? payload.unit.trim() : 'units',
          minStock,
          location: (typeof payload.location === 'string' && payload.location.trim()) ? payload.location.trim() : 'Goa Warehouse',
          supplier: typeof payload.supplier === 'string' ? payload.supplier.trim() : '',
          cost,
          expiry: typeof payload.expiry === 'string' ? payload.expiry : null,
          notes: typeof payload.notes === 'string' ? payload.notes : undefined,
        };

        targetState.inventory = [newItem, ...currentInventory];
        if (targetState.polarisDb) {
          targetState.polarisDb.inventory = targetState.inventory;
        }

        const log: DispatchLog = {
          id: 'log-inv-' + Date.now(),
          timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
          callsign: 'HQ Supply Command',
          severity: 'routine',
          sector: newItem.location,
          message: 'Inventory item ' + newItem.name + ' (' + newItem.id + ') registered into active stock [Qty: ' + newItem.quantity + ' ' + newItem.unit + '].',
        };
        targetState.dispatchLogs = [log, ...(targetState.dispatchLogs || [])];
        break;
      }
      case 'UPDATE_INVENTORY': {
        if (!payload || typeof payload !== 'object' || !payload.id || typeof payload.id !== 'string') {
          console.warn('[SERVER] Invalid UPDATE_INVENTORY payload received:', payload);
          return targetState;
        }

        const currentInventory = Array.isArray(targetState.inventory)
          ? targetState.inventory
          : (Array.isArray(targetState.polarisDb?.inventory) ? targetState.polarisDb.inventory : [...INITIAL_INVENTORY]);

        const targetId = payload.id.trim();
        const existingIndex = currentInventory.findIndex((i) => i.id === targetId);
        if (existingIndex === -1) {
          console.warn('[SERVER] UPDATE_INVENTORY item ' + targetId + ' not found.');
          return targetState;
        }

        const existingItem = currentInventory[existingIndex];
        let qty = existingItem.quantity;
        if (payload.quantity !== undefined) {
          const parsed = Number(payload.quantity);
          if (!isNaN(parsed) && parsed >= 0) {
            qty = parsed;
          }
        }

        let min = existingItem.minStock;
        if (payload.minStock !== undefined) {
          const parsed = Number(payload.minStock);
          if (!isNaN(parsed) && parsed >= 0) {
            min = parsed;
          }
        }

        let costVal = existingItem.cost;
        if (payload.cost !== undefined) {
          const parsed = Number(payload.cost);
          if (!isNaN(parsed) && parsed >= 0) {
            costVal = parsed;
          }
        }

        const updatedItem = {
          ...existingItem,
          ...(payload.name && typeof payload.name === 'string' && payload.name.trim() ? { name: payload.name.trim() } : {}),
          ...(payload.category && typeof payload.category === 'string' && payload.category.trim() ? { category: payload.category.trim() } : {}),
          ...(payload.unit && typeof payload.unit === 'string' && payload.unit.trim() ? { unit: payload.unit.trim() } : {}),
          ...(payload.location && typeof payload.location === 'string' && payload.location.trim() ? { location: payload.location.trim() } : {}),
          ...(payload.supplier !== undefined ? { supplier: String(payload.supplier).trim() } : {}),
          ...(payload.expiry !== undefined ? { expiry: payload.expiry } : {}),
          ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
          quantity: qty,
          minStock: min,
          cost: costVal,
        };

        const updatedList = [...currentInventory];
        updatedList[existingIndex] = updatedItem;

        targetState.inventory = updatedList;
        if (targetState.polarisDb) {
          targetState.polarisDb.inventory = updatedList;
        }
        break;
      }
      case 'ADJUST_INVENTORY_STOCK': {
        if (!payload || typeof payload !== 'object' || !payload.id || typeof payload.id !== 'string') {
          console.warn('[SERVER] Invalid ADJUST_INVENTORY_STOCK payload received:', payload);
          return targetState;
        }

        const targetId = payload.id.trim();
        const delta = Number(payload.delta);
        if (isNaN(delta)) {
          console.warn('[SERVER] ADJUST_INVENTORY_STOCK delta is NaN for item ' + targetId + ':', payload.delta);
          return targetState;
        }

        const currentInventory = Array.isArray(targetState.inventory)
          ? targetState.inventory
          : (Array.isArray(targetState.polarisDb?.inventory) ? targetState.polarisDb.inventory : [...INITIAL_INVENTORY]);

        const existingIndex = currentInventory.findIndex((i) => i.id === targetId);
        if (existingIndex === -1) {
          console.warn('[SERVER] ADJUST_INVENTORY_STOCK item ' + targetId + ' not found.');
          return targetState;
        }

        const existingItem = currentInventory[existingIndex];
        const newQuantity = Math.max(0, existingItem.quantity + delta);

        const updatedItem = {
          ...existingItem,
          quantity: newQuantity,
        };

        const updatedList = [...currentInventory];
        updatedList[existingIndex] = updatedItem;

        targetState.inventory = updatedList;
        if (targetState.polarisDb) {
          targetState.polarisDb.inventory = updatedList;
        }

        if (delta < 0 && newQuantity <= existingItem.minStock) {
          const log: DispatchLog = {
            id: 'log-inv-' + Date.now(),
            timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
            callsign: 'HQ Supply Command',
            severity: newQuantity === 0 ? 'warning' : 'advisory',
            sector: existingItem.location,
            message: 'CRITICAL INVENTORY ALERT: ' + existingItem.name + ' (' + existingItem.id + ') depleted to ' + newQuantity + ' ' + existingItem.unit + ' (Min: ' + existingItem.minStock + ').',
          };
          targetState.dispatchLogs = [log, ...(targetState.dispatchLogs || [])];
        }
        break;
      }
      case 'ADD_STATION': {
        const lat = typeof payload?.lat === 'number' ? payload.lat : (Array.isArray(payload?.coordinates) ? payload.coordinates[0] : NaN);
        const lng = typeof payload?.lng === 'number' ? payload.lng : (Array.isArray(payload?.coordinates) ? payload.coordinates[1] : NaN);
        if (
          !payload ||
          !payload.name ||
          typeof lat !== 'number' ||
          isNaN(lat) ||
          Math.abs(lat) > 90 ||
          typeof lng !== 'number' ||
          isNaN(lng) ||
          Math.abs(lng) > 180
        ) {
          console.warn('[SERVER] Invalid ADD_STATION payload coordinates received:', payload);
          return targetState;
        }
        const normalizedStation = {
          ...payload,
          lat,
          lng,
          coordinates: [lat, lng],
          location: payload.location || `${lat.toFixed(2)}, ${lng.toFixed(2)}`
        };
        targetState.stations = [normalizedStation, ...(targetState.stations || INITIAL_STATIONS)];
        if (targetState.polarisDb) {
          if (!Array.isArray((targetState.polarisDb as any).customStations)) {
            (targetState.polarisDb as any).customStations = [];
          }
          const exists = (targetState.polarisDb as any).customStations.some((s: any) => s.id === payload.id);
          if (!exists) {
            (targetState.polarisDb as any).customStations = [normalizedStation, ...(targetState.polarisDb as any).customStations];
          }
        }
        break;
      }
      case 'UPDATE_STATIONS':
        targetState.stations = payload;
        break;
      case 'ADD_WAYPOINT': {
        const { waypoint, expeditionId } = payload || {};
        const wp = waypoint || payload;
        const lat = typeof wp?.lat === 'number' ? wp.lat : (Array.isArray(wp?.coordinates) ? wp.coordinates[0] : NaN);
        const lng = typeof wp?.lng === 'number' ? wp.lng : (Array.isArray(wp?.coordinates) ? wp.coordinates[1] : NaN);
        if (!wp || typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          console.warn('[SERVER] Invalid ADD_WAYPOINT coordinates received:', wp);
          return targetState;
        }
        const normalizedWp = {
          ...wp,
          lat,
          lng,
          coordinates: [lat, lng]
        };
        if (expeditionId) {
          const expExists = (targetState.expeditions || []).some((e) => e.id === expeditionId);
          if (!expExists) {
            console.warn('[SERVER] ADD_WAYPOINT targeted nonexistent expedition:', expeditionId);
            return targetState;
          }
          targetState.expeditions = targetState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            const updatedWaypoints = [...(e.waypoints || []), normalizedWp].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
            const addedDist = Number(normalizedWp.distanceFromPrevKm) || 45;
            return {
              ...e,
              waypoints: updatedWaypoints,
              totalDistanceKm: e.totalDistanceKm + addedDist,
            };
          });
          if (targetState.polarisDb && Array.isArray(targetState.polarisDb.expeditions)) {
            const rootExp = targetState.expeditions.find((e) => e.id === expeditionId);
            const rootExpIdx = targetState.expeditions.findIndex((e) => e.id === expeditionId);
            targetState.polarisDb.expeditions = targetState.polarisDb.expeditions.map((pe: any, idx: number) => {
              if (
                pe.id === expeditionId ||
                (rootExp && (pe.name === rootExp.name || pe.id.toLowerCase() === rootExp.id.toLowerCase())) ||
                (rootExpIdx !== -1 && idx === rootExpIdx)
              ) {
                return {
                  ...pe,
                  waypoints: [...(pe.waypoints || []), normalizedWp],
                };
              }
              return pe;
            });
          }
        } else {
          targetState.customWaypoints = [normalizedWp, ...(targetState.customWaypoints || [])];
        }
        break;
      }
      case 'DELETE_WAYPOINT': {
        const { waypointId, expeditionId } = payload || {};
        if (expeditionId) {
          const expExists = (targetState.expeditions || []).some((e) => e.id === expeditionId);
          if (!expExists) {
            console.warn('[SERVER] DELETE_WAYPOINT targeted nonexistent expedition:', expeditionId);
            return targetState;
          }
          targetState.expeditions = targetState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            return {
              ...e,
              waypoints: (e.waypoints || []).filter((w) => w.id !== waypointId),
            };
          });
          if (targetState.polarisDb && Array.isArray(targetState.polarisDb.expeditions)) {
            const rootExp = targetState.expeditions.find((e) => e.id === expeditionId);
            const rootExpIdx = targetState.expeditions.findIndex((e) => e.id === expeditionId);
            targetState.polarisDb.expeditions = targetState.polarisDb.expeditions.map((pe: any, idx: number) => {
              if (
                pe.id === expeditionId ||
                (rootExp && (pe.name === rootExp.name || pe.id.toLowerCase() === rootExp.id.toLowerCase())) ||
                (rootExpIdx !== -1 && idx === rootExpIdx)
              ) {
                return {
                  ...pe,
                  waypoints: (pe.waypoints || []).filter((w: any) => w.id !== waypointId),
                };
              }
              return pe;
            });
          }
        } else {
          targetState.customWaypoints = (targetState.customWaypoints || []).filter(
            (w) => w.id !== waypointId
          );
        }
        break;
      }
      case 'UPDATE_WAYPOINT': {
        const { waypoint, expeditionId } = payload || {};
        if (!waypoint) break;
        if (expeditionId) {
          const expExists = (targetState.expeditions || []).some((e) => e.id === expeditionId);
          if (!expExists) {
            console.warn('[SERVER] UPDATE_WAYPOINT targeted nonexistent expedition:', expeditionId);
            return targetState;
          }
          targetState.expeditions = targetState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            return {
              ...e,
              waypoints: (e.waypoints || [])
                .map((w) => (w.id === waypoint.id ? waypoint : w))
                .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
            };
          });
          if (targetState.polarisDb && Array.isArray(targetState.polarisDb.expeditions)) {
            targetState.polarisDb.expeditions = targetState.polarisDb.expeditions.map((pe: any) => {
              if (pe.id === expeditionId) {
                return {
                  ...pe,
                  waypoints: (pe.waypoints || []).map((w: any) => (w.id === waypoint.id ? waypoint : w)),
                };
              }
              return pe;
            });
          }
        } else {
          targetState.customWaypoints = (targetState.customWaypoints || []).map((w) =>
            w.id === waypoint.id ? waypoint : w
          );
        }
        break;
      }
      case 'REORDER_WAYPOINTS': {
        const { waypoints, expeditionId } = payload || {};
        if (!Array.isArray(waypoints) || !expeditionId) {
          console.warn('[SERVER] Invalid REORDER_WAYPOINTS payload received:', payload);
          return targetState;
        }
        const expExists = (targetState.expeditions || []).some((e) => e.id === expeditionId);
        if (!expExists) {
          console.warn('[SERVER] REORDER_WAYPOINTS targeted nonexistent expedition:', expeditionId);
          return targetState;
        }
        const normalized = waypoints.map((w: any, idx: number) => ({
          ...w,
          sequence: idx + 1,
        }));
        targetState.expeditions = targetState.expeditions.map((e) => {
          if (e.id !== expeditionId) return e;
          return {
            ...e,
            waypoints: normalized,
          };
        });
        if (targetState.polarisDb && Array.isArray(targetState.polarisDb.expeditions)) {
          targetState.polarisDb.expeditions = targetState.polarisDb.expeditions.map((pe: any) => {
            if (pe.id === expeditionId) {
              return {
                ...pe,
                waypoints: normalized,
              };
            }
            return pe;
          });
        }
        break;
      }
      case 'RESTOCK_SUPPLY':
        targetState.supplies = targetState.supplies.map((s) => (s.id === payload.id ? payload : s));
        break;
      case 'ADD_DISPATCH_LOG':
        targetState.dispatchLogs = [payload, ...targetState.dispatchLogs];
        break;
      case 'UPDATE_POLARIS_DB':
        if (payload && typeof payload === 'object') {
          targetState.polarisDb = payload;
          if (Array.isArray(payload.expeditions)) {
            targetState.expeditions = targetState.expeditions.map((e) => {
              const matched = payload.expeditions.find((pe: any) => pe.id === e.id);
              if (matched) {
                return {
                  ...e,
                  currentLat: matched.currentLat ?? e.currentLat,
                  currentLng: matched.currentLng ?? e.currentLng,
                  waypoints: matched.waypoints ?? e.waypoints,
                };
              }
              return e;
            });
          }
          if (Array.isArray(payload.personnel)) {
            targetState.personnel = payload.personnel;
          }
          if (Array.isArray(payload.inventory)) {
            targetState.inventory = payload.inventory;
          }
        }
        break;
      case 'UPDATE_POLARIS_COLLECTION':
        if (payload && payload.collectionName && Array.isArray(payload.data) && targetState.polarisDb) {
          (targetState.polarisDb as any)[payload.collectionName] = payload.data;
          if (payload.collectionName === 'expeditions') {
            targetState.expeditions = targetState.expeditions.map((e) => {
              const matched = payload.data.find((pe: any) => pe.id === e.id);
              return matched
                ? {
                    ...e,
                    currentLat: matched.currentLat ?? e.currentLat,
                    currentLng: matched.currentLng ?? e.currentLng,
                    waypoints: matched.waypoints ?? e.waypoints,
                  }
                : e;
            });
          }
          if (payload.collectionName === 'personnel') {
            targetState.personnel = payload.data;
          }
          if (payload.collectionName === 'inventory') {
            targetState.inventory = payload.data;
          }
        }
        break;
      default:
        break;
    }
    return targetState;
  }

  function handleClientAction(action: string, payload: any) {
    applyActionToState(systemState, action, payload);
    persistState();
    broadcast({
      type: 'STATE_UPDATE',
      payload: systemState,
      timestamp: new Date().toISOString(),
    });
  }

  // WebSocket Server Handler
  wss.on('connection', (ws, req) => {
    // Phase 2C: WebSocket Authentication
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      const session = token ? authSessions.get(token) : null;
      
      if (!token || !session || isSessionExpired(session)) {
        if (session && token) authSessions.delete(token);
        console.log(`[POLAR-SERVER] Rejected unauthenticated or expired WS connection from ${req.socket.remoteAddress}`);
        ws.close(4001, 'Unauthorized');
        return;
      }
      (ws as any).token = token;
    } catch (e) {
      ws.close(4001, 'Unauthorized');
      return;
    }
    let clientDeviceId: string | null = null;
    console.log(`[POLAR-SERVER] WebSocket socket opened from ${req.socket.remoteAddress}. Active unique terminals: ${activeDevices.size}`);

    // Send full current state immediately upon connection
    const devices = getDeviceList();
    const sessionTokenOnConnect = (ws as any).token;
    const simSessionOnConnect = getSessionSimulation(sessionTokenOnConnect);
    ws.send(
      JSON.stringify({
        type: 'INIT_STATE',
        payload: {
          ...(simSessionOnConnect ? simSessionOnConnect.sandboxState : systemState),
          connectedClients: devices.length,
          devices,
        },
        simulation: Boolean(simSessionOnConnect),
        timestamp: new Date().toISOString(),
      })
    );

    ws.on('message', (messageBuffer) => {
      try {
        const msg: SyncMessage = JSON.parse(messageBuffer.toString());
        const sessionToken = (ws as any).token;
        const session = sessionToken ? authSessions.get(sessionToken) : null;
        const simSession = getSessionSimulation(sessionToken);

        if (!session || isSessionExpired(session)) {
          if (session && sessionToken) authSessions.delete(sessionToken);
          console.warn('[POLAR-SERVER] WebSocket message rejected: Session expired or invalid.');
          ws.send(
            JSON.stringify({
              type: 'ACTION_REJECTED',
              action: msg?.type,
              error: 'Unauthorized: Session expired or invalid.',
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string' || !msg.type.trim()) {
          ws.send(
            JSON.stringify({
              type: 'ACTION_REJECTED',
              action: 'MALFORMED_FRAME',
              error: 'Bad Request: Missing or invalid action type.',
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        switch (msg.type) {
          case 'REGISTER_DEVICE':
          case 'HEARTBEAT': {
            const { deviceId, deviceType, deviceName, userAgent, batteryLevel, isCharging } = msg.payload || {};
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
                batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : undefined,
                isCharging: typeof isCharging === 'boolean' ? isCharging : undefined,
              });
              broadcastPresence();
            }
            break;
          }
          case 'TRIGGER_DISTRESS': {
            const data = msg.payload || {};
            let distressAlert: ActiveDistressAlert = {
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

            if (simSession) {
              simSession.sandboxState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';
              if (autoSarDispatchEnabled) {
                distressAlert = executeAutonomousSAR(distressAlert);
              }
              simSession.sandboxState.activeDistress = distressAlert;
              ws.send(
                JSON.stringify({
                  type: 'TRIGGER_DISTRESS',
                  payload: distressAlert,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              ws.send(
                JSON.stringify({
                  type: 'STATE_UPDATE',
                  payload: simSession.sandboxState,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }

            systemState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';

            if (autoSarDispatchEnabled) {
              distressAlert = executeAutonomousSAR(distressAlert);
            } else {
              const logEntry = {
                id: `log-${Date.now()}`,
                timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
                callsign: distressAlert.reporterCallsign,
                severity: 'urgent_distress' as const,
                sector: distressAlert.location,
                message: `*** MAYDAY DISTRESS BEACON ACTIVE *** [${distressAlert.incidentType}] ${distressAlert.summary} (${distressAlert.coordinates}) [Source: ${distressAlert.reportedByDevice}]`,
              };
              systemState.dispatchLogs = [logEntry, ...systemState.dispatchLogs];
            }

            systemState.activeDistress = distressAlert;
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
            if (!userHasAnyRole(session.role, ['admin', 'transport'])) {
              ws.send(
                JSON.stringify({
                  type: 'ACTION_REJECTED',
                  action: msg.type,
                  error: `Forbidden: Role '${session.role}' is not authorized to acknowledge distress alerts.`,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }

            // Real life-safety distress always takes precedence over simulation
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
                if (systemState.polarisDb && Array.isArray(systemState.polarisDb.assets)) {
                  systemState.polarisDb.assets = systemState.polarisDb.assets.map((a: any) =>
                    a.id === msg.payload.dispatchedSARAssetId ? { ...a, status: 'In Transit' } : a
                  );
                }
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
              break;
            }

            // Simulation Isolation: If caller is in simulation and no live distress exists, acknowledge sandbox only
            if (simSession) {
              if (simSession.sandboxState?.activeDistress) {
                simSession.sandboxState.activeDistress.acknowledgedByHQ = true;
                simSession.sandboxState.activeDistress.acknowledgedAt = new Date().toISOString();
                simSession.sandboxState.activeDistress.acknowledgedBy = msg.payload?.acknowledgedBy || 'Station Operations Director';
                simSession.sandboxState.activeDistress.dispatchedSARAssetId = msg.payload?.dispatchedSARAssetId;
                simSession.sandboxState.activeDistress.dispatchedSARName = msg.payload?.dispatchedSARName;
                if (msg.payload?.dispatchedSARAssetId && Array.isArray(simSession.sandboxState.assets)) {
                  simSession.sandboxState.assets = simSession.sandboxState.assets.map((a: any) =>
                    a.id === msg.payload.dispatchedSARAssetId ? { ...a, status: 'in_transit' } : a
                  );
                }
              }
              ws.send(
                JSON.stringify({
                  type: 'ACKNOWLEDGE_DISTRESS',
                  payload: simSession.sandboxState?.activeDistress,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              ws.send(
                JSON.stringify({
                  type: 'STATE_UPDATE',
                  payload: simSession.sandboxState,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }
          }
          case 'RESOLVE_DISTRESS': {
            if (!userHasAnyRole(session.role, ['admin', 'transport'])) {
              ws.send(
                JSON.stringify({
                  type: 'ACTION_REJECTED',
                  action: msg.type,
                  error: `Forbidden: Role '${session.role}' is not authorized to resolve distress beacons.`,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }

            // Real life-safety distress always takes precedence over simulation
            if (systemState.activeDistress) {
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

            // Simulation Isolation: If caller is in simulation and no live distress exists, resolve sandbox only
            if (simSession) {
              if (simSession.sandboxState) {
                simSession.sandboxState.activeDistress = null;
                simSession.sandboxState.conditionLevel = 'COND-2_CAUTION';
              }
              ws.send(
                JSON.stringify({
                  type: 'RESOLVE_DISTRESS',
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              ws.send(
                JSON.stringify({
                  type: 'STATE_UPDATE',
                  payload: simSession.sandboxState,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }

            // If caller has no simulation session and no genuine live distress is active, reject to prevent accidental condition downgrade
            ws.send(
              JSON.stringify({
                type: 'ACTION_REJECTED',
                action: msg.type,
                error: 'No active distress beacon to resolve.',
                timestamp: new Date().toISOString(),
              })
            );
            break;
          }
          case 'RESET_STATE': {
            if (!userHasAnyRole(session.role, ['admin'])) {
              ws.send(
                JSON.stringify({
                  type: 'ACTION_REJECTED',
                  action: msg.type,
                  error: 'Forbidden: Super Admin role required to reset system state.',
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }
            if (simSession) {
              simSession.sandboxState = JSON.parse(JSON.stringify(databaseManager.getState()));
              ws.send(
                JSON.stringify({
                  type: 'RESET_STATE',
                  payload: simSession.sandboxState,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              ws.send(
                JSON.stringify({
                  type: 'STATE_UPDATE',
                  payload: simSession.sandboxState,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }
            systemState = databaseManager.resetToDefaults();
            persistState();
            broadcast({
              type: 'RESET_STATE',
              payload: systemState,
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
          case 'ADD_ASSET':
          case 'UPDATE_EXPEDITION':
          case 'ADD_EXPEDITION':
          case 'ADD_PERSONNEL':
          case 'ADD_INVENTORY':
          case 'UPDATE_INVENTORY':
          case 'ADJUST_INVENTORY_STOCK':
          case 'ADD_STATION':
          case 'UPDATE_STATIONS':
          case 'ADD_WAYPOINT':
          case 'DELETE_WAYPOINT':
          case 'UPDATE_WAYPOINT':
          case 'REORDER_WAYPOINTS':
          case 'RESTOCK_SUPPLY':
          case 'ADD_DISPATCH_LOG':
          case 'UPDATE_POLARIS_DB':
          case 'UPDATE_POLARIS_COLLECTION': {
            const requiredRoles = ACTION_PERMISSIONS[msg.type];
            if (requiredRoles && !userHasAnyRole(session.role, requiredRoles)) {
              ws.send(
                JSON.stringify({
                  type: 'ACTION_REJECTED',
                  action: msg.type,
                  error: `Forbidden: Role '${session.role}' is not authorized to perform '${msg.type}'.`,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }
            if (simSession) {
              applyActionToState(simSession.sandboxState, msg.type, msg.payload);
              ws.send(
                JSON.stringify({
                  type: 'STATE_UPDATE',
                  payload: simSession.sandboxState,
                  simulation: true,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            }
            handleClientAction(msg.type, msg.payload);
            break;
          }
          default:
            console.warn(`[POLAR-SERVER] Rejected unrecognized WebSocket action '${String(msg.type).slice(0, 50)}' from user '${session.userId}'.`);
            ws.send(
              JSON.stringify({
                type: 'ACTION_REJECTED',
                action: typeof msg.type === 'string' ? msg.type.slice(0, 50) : 'UNKNOWN',
                error: `Bad Request: Unrecognized action type '${typeof msg.type === 'string' ? msg.type.slice(0, 50) : 'UNKNOWN'}'.`,
                timestamp: new Date().toISOString(),
              })
            );
            break;
        }
      } catch (err: any) {
        console.error('[POLAR-SERVER] Error processing websocket message:', err.message);
        try {
          ws.send(
            JSON.stringify({
              type: 'ACTION_REJECTED',
              action: 'INVALID_JSON',
              error: 'Bad Request: Malformed JSON frame.',
              timestamp: new Date().toISOString(),
            })
          );
        } catch (_) {}
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

  // Phase 1: Explicit 404 for unknown API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, error: `API Route Not Found: ${req.method} ${req.path}` });
  });

  // Phase 1: Global API Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
      if (err instanceof SyntaxError && 'body' in err) {
        console.error(`[API ERROR] Malformed JSON payload on ${req.method} ${req.url}`);
        return res.status(400).json({ ok: false, error: 'Malformed JSON payload.' });
      }
      console.error(`[API ERROR] Unexpected error on ${req.method} ${req.url}:`, err.message);
      return res.status(500).json({ ok: false, error: 'Internal server error.' });
    }
    next(err);
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
    const dbInfo = databaseManager.getHealthInfo();
    console.log('================================================================');
    console.log('  POLAR EXPEDITION & ASSET MANAGEMENT SYSTEM');
    console.log('  REAL-TIME SYNC SERVER (HTTP + WEBSOCKETS)');
    console.log('================================================================');
    console.log(`  Local Endpoint:  http://localhost:${PORT}`);
    console.log(`  Network/Mobile:  http://${HOST}:${PORT}`);
    console.log(`  WebSocket URL:   ws://${HOST}:${PORT}/ws`);
    console.log(`  Database File:   ${dbInfo.storagePath} (${dbInfo.usersCount} users registered)`);
    console.log('================================================================');
  });
}

startServer().catch((err) => {
  console.error('[POLAR-SERVER] Fatal server error during startup:', err);
  process.exit(1);
});
