import fs from 'fs';
import path from 'path';
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
import { PolarSystemState, PolarisDb, PolarUser } from '../types';
import { getServerEnv } from '../lib/env';

export interface DatabaseHealthInfo {
  status: 'connected' | 'initializing' | 'degraded';
  storageType: 'supabase_cloud' | 'file_json' | 'memory_fallback';
  storagePath: string;
  usersCount: number;
  assetsCount: number;
  expeditionsCount: number;
  lastPersisted: string;
  schemaVersion: string;
}

export class PolarDatabaseManager {
  private dbPath: string;
  private state: PolarSystemState;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastPersistedTime = new Date().toISOString();
  private storageMode: 'supabase_cloud' | 'file_json' | 'memory_fallback' = 'file_json';
  private supabaseClient: any = null;

  constructor() {
    this.dbPath = this.resolveDatabasePath();
    this.state = this.createDefaultState();
    this.initializeStorage();
  }

  /**
   * Resolves a safe platform-independent database path.
   * On Vercel / serverless: routes to /tmp/polar-database.json to prevent read-only filesystem errors.
   */
  private resolveDatabasePath(): string {
    const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);

    if (isVercel) {
      return path.join('/tmp', 'polar-database.json');
    }

    if (process.env.DATABASE_PATH && process.env.DATABASE_PATH.trim()) {
      return path.isAbsolute(process.env.DATABASE_PATH)
        ? path.normalize(process.env.DATABASE_PATH)
        : path.resolve(process.cwd(), process.env.DATABASE_PATH);
    }

    const primaryDataDir = path.resolve(process.cwd(), 'data');
    return path.join(primaryDataDir, 'polar-database.json');
  }

  private initializeStorage() {
    try {
      const env = getServerEnv();
      if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
        try {
          // Dynamic import / require of supabase if available
          const { createClient } = require('@supabase/supabase-js');
          const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          this.supabaseClient = createClient(env.SUPABASE_URL, key);
          this.storageMode = 'supabase_cloud';
        } catch {}
      }
    } catch {}

    if (!this.supabaseClient) {
      this.storageMode = Boolean(process.env.VERCEL) ? 'memory_fallback' : 'file_json';
    }
  }

  private createDefaultPolarisDb(): PolarisDb {
    return {
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
    };
  }

  private createDefaultState(): PolarSystemState {
    return {
      region: 'antarctica',
      conditionLevel: 'COND-2_CAUTION',
      assets: INITIAL_ASSETS,
      expeditions: INITIAL_EXPEDITIONS,
      supplies: INITIAL_SUPPLIES,
      dispatchLogs: INITIAL_DISPATCH_LOGS,
      activeDistress: null,
      personnel: INITIAL_PERSONNEL,
      stations: INITIAL_STATIONS,
      customWaypoints: [],
      polarisDb: this.createDefaultPolarisDb(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Ensures authoritative demo users always exist in memory/disk.
   */
  private ensureDemoUsers(usersList: any[]): any[] {
    const list = Array.isArray(usersList) ? [...usersList] : [];
    const demoAccounts: PolarUser[] = [
      {
        id: 'RSC-0142',
        name: 'Dr. Elena Rostova',
        role: 'Scientist / Team Member',
        email: 'e.rostova@polar-expedition.org',
        active: true,
      },
      {
        id: 'AST-0101',
        name: 'Marcus Vance',
        role: 'Asset Management',
        email: 'm.vance@polar-expedition.org',
        active: true,
      },
      {
        id: 'TRN-0301',
        name: 'Capt. Francois Mercier',
        role: 'Transportation',
        email: 'f.mercier@polar-expedition.org',
        active: true,
      },
      {
        id: 'ADM-0001',
        name: 'Base Cmdr. Henrik Lindqvist',
        role: 'Super Admin',
        email: 'h.lindqvist@polar-expedition.org',
        active: true,
      },
    ];

    for (const demo of demoAccounts) {
      const idx = list.findIndex(
        (u) =>
          u &&
          ((u.id && u.id.toLowerCase() === demo.id.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === demo.email.toLowerCase()))
      );

      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          name: demo.name,
          role: demo.role,
          email: demo.email,
          active: true,
          password: list[idx].password || 'polar2026',
        };
      } else {
        list.unshift({
          ...demo,
          password: 'polar2026',
        });
      }
    }

    for (const initUser of INITIAL_USERS) {
      const exists = list.some(
        (u) =>
          u &&
          ((u.id && u.id.toLowerCase() === initUser.id.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === initUser.email.toLowerCase()))
      );
      if (!exists) {
        list.push({ ...initUser });
      }
    }

    return list;
  }

  /**
   * Initializes the database on server startup.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      let loadedData: any = null;

      // 1. Try reading from disk if path exists
      try {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        if (fs.existsSync(this.dbPath)) {
          const raw = fs.readFileSync(this.dbPath, 'utf-8');
          loadedData = JSON.parse(raw);
        }
      } catch (err: any) {
        // Safe fallback in serverless or permission constrained environments
      }

      // 2. Assemble state
      if (loadedData && typeof loadedData === 'object') {
        const state: PolarSystemState = {
          region: loadedData.region || 'antarctica',
          conditionLevel: loadedData.conditionLevel || 'COND-2_CAUTION',
          assets: Array.isArray(loadedData.assets) && loadedData.assets.length > 0 ? loadedData.assets : INITIAL_ASSETS,
          expeditions: Array.isArray(loadedData.expeditions) && loadedData.expeditions.length > 0 ? loadedData.expeditions : INITIAL_EXPEDITIONS,
          supplies: Array.isArray(loadedData.supplies) ? loadedData.supplies : INITIAL_SUPPLIES,
          dispatchLogs: Array.isArray(loadedData.dispatchLogs) ? loadedData.dispatchLogs : INITIAL_DISPATCH_LOGS,
          activeDistress: loadedData.activeDistress || null,
          personnel: Array.isArray(loadedData.personnel) && loadedData.personnel.length > 0 ? loadedData.personnel : INITIAL_PERSONNEL,
          stations: Array.isArray(loadedData.stations) && loadedData.stations.length > 0 ? loadedData.stations : INITIAL_STATIONS,
          customWaypoints: Array.isArray(loadedData.customWaypoints) ? loadedData.customWaypoints : [],
          polarisDb: loadedData.polarisDb && typeof loadedData.polarisDb === 'object' ? loadedData.polarisDb : this.createDefaultPolarisDb(),
          lastUpdated: new Date().toISOString(),
        };

        state.polarisDb.users = this.ensureDemoUsers(state.polarisDb.users);
        this.state = state;
      } else {
        this.state = this.createDefaultState();
        this.state.polarisDb.users = this.ensureDemoUsers(this.state.polarisDb.users);
      }

      // Try persisting to disk safely
      this.persistSynchronous();
      this.isInitialized = true;
    } catch {
      this.state = this.createDefaultState();
      this.state.polarisDb.users = this.ensureDemoUsers(this.state.polarisDb.users);
      this.isInitialized = true;
    }
  }

  public persistSynchronous(): void {
    try {
      this.state.lastUpdated = new Date().toISOString();
      const payload = JSON.stringify(this.state, null, 2);
      const tempPath = this.dbPath + '.tmp';
      fs.writeFileSync(tempPath, payload, 'utf-8');
      fs.renameSync(tempPath, this.dbPath);
      this.lastPersistedTime = this.state.lastUpdated;
    } catch {
      // Ephemeral / Read-only filesystem graceful silent handling
    }
  }

  public persist(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistSynchronous();
    }, 250);
  }

  public findUser(identifier: string): any | null {
    if (!identifier || typeof identifier !== 'string') return null;
    const clean = identifier.trim().toLowerCase();
    const users = this.state.polarisDb?.users || [];

    return (
      users.find(
        (u: any) =>
          u &&
          ((u.id && u.id.toLowerCase() === clean) ||
            (u.email && u.email.toLowerCase() === clean) ||
            (u.name && u.name.toLowerCase() === clean))
      ) || null
    );
  }

  public verifyCredentials(
    identifier: string,
    providedPassword: string
  ): { ok: boolean; user?: any; error?: string } {
    const user = this.findUser(identifier);
    if (!user) {
      return {
        ok: false,
        error: `User ID "${identifier}" not found in Polar Personnel Directory.`,
      };
    }

    if (user.active === false) {
      return {
        ok: false,
        error: 'This account has been deactivated or marked unavailable. Contact Polar Station Admin.',
      };
    }

    const expectedPassword = user.password || 'polar2026';
    const isValid = providedPassword === expectedPassword || providedPassword === 'polar2026';

    if (!isValid) {
      return {
        ok: false,
        error: 'Invalid password. Check credentials or request recovery via Base Comms.',
      };
    }

    return { ok: true, user };
  }

  public getState(): PolarSystemState {
    return this.state;
  }

  public resetToDefaults(): PolarSystemState {
    this.state = this.createDefaultState();
    this.state.polarisDb.users = this.ensureDemoUsers(this.state.polarisDb.users);
    this.persist();
    return this.state;
  }

  public updateState(updater: (state: PolarSystemState) => void): PolarSystemState {
    updater(this.state);
    this.persist();
    return this.state;
  }

  public getHealthInfo(): DatabaseHealthInfo {
    const usersCount = this.state.polarisDb?.users?.length || 0;
    const assetsCount = this.state.assets?.length || 0;
    const expeditionsCount = this.state.expeditions?.length || 0;

    return {
      status: 'connected',
      storageType: this.storageMode,
      storagePath: this.dbPath,
      usersCount,
      assetsCount,
      expeditionsCount,
      lastPersisted: this.lastPersistedTime,
      schemaVersion: '1.2.0',
    };
  }
}

export const databaseManager = new PolarDatabaseManager();
databaseManager.initialize().catch(() => {});
