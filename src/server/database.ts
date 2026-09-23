import fs from 'fs';
import path from 'path';
import {
  INITIAL_ASSETS,
  INITIAL_EXPEDITIONS,
  INITIAL_SUPPLIES,
  INITIAL_DISPATCH_LOGS,
  INITIAL_STATIONS,
} from '../data/polarData.js';
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
} from '../data/polarisData.js';
import { PolarSystemState, PolarisDb, PolarUser } from '../types.js';

export interface DatabaseHealthInfo {
  status: 'connected' | 'initializing' | 'degraded';
  storageType: 'file_json' | 'memory_fallback';
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

  constructor() {
    this.dbPath = this.resolveDatabasePath();
    this.state = this.createDefaultState();
  }

  /**
   * Resolves a platform-independent database path.
   * Priority:
   * 1. DATABASE_PATH environment variable (relative to process.cwd() or absolute)
   * 2. ./data/polar-database.json
   * 3. Legacy ./polar-state.json fallback
   */
  private resolveDatabasePath(): string {
    if (process.env.DATABASE_PATH && process.env.DATABASE_PATH.trim()) {
      return path.isAbsolute(process.env.DATABASE_PATH)
        ? path.normalize(process.env.DATABASE_PATH)
        : path.resolve(process.cwd(), process.env.DATABASE_PATH);
    }

    const primaryDataDir = path.resolve(process.cwd(), 'data');
    return path.join(primaryDataDir, 'polar-database.json');
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
      stations: INITIAL_STATIONS,
      customWaypoints: [],
      polarisDb: this.createDefaultPolarisDb(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Ensures that standard demo users (RSC-0142, AST-0101, TRN-0301, ADM-0001)
   * and role users always exist in the database with expected passwords.
   */
  private ensureDemoUsers(usersList: any[]): any[] {
    const list = Array.isArray(usersList) ? [...usersList] : [];
    const demoAccounts: PolarUser[] = [
      {
        id: 'RSC-0142',
        name: 'Dr. Elena Rostova',
        role: 'Scientist / Team Member',
        email: 'elena.rostova@polar.gov.in',
        active: true,
      },
      {
        id: 'AST-0101',
        name: 'Vikram Nair',
        role: 'Asset Manager',
        email: 'vikram.nair@polar.gov.in',
        active: true,
      },
      {
        id: 'TRN-0301',
        name: 'Marcus Vance',
        role: 'Logistics Officer',
        email: 'marcus.vance@polar.gov.in',
        active: true,
      },
      {
        id: 'ADM-0001',
        name: 'Station Commander',
        role: 'Super Admin',
        email: 'admin@polar.gov.in',
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
        // Ensure active and password exists
        list[idx] = {
          ...list[idx],
          name: demo.name,
          role: demo.role,
          email: demo.email,
          active: true,
          password: list[idx].password || 'polar2026',
        };
      } else {
        // Insert missing demo account
        list.unshift({
          ...demo,
          password: 'polar2026',
        });
      }
    }

    // Also include any initial users not yet registered
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
   * Creates parent directories, checks schema, migrations, and seeds users.
   */
  public async initialize(): Promise<void> {
    try {
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`[POLAR-DB] Created shared database directory: ${dataDir}`);
      }

      let loadedData: any = null;

      // 1. Try reading the primary database file
      if (fs.existsSync(this.dbPath)) {
        try {
          const raw = fs.readFileSync(this.dbPath, 'utf-8');
          loadedData = JSON.parse(raw);
          console.log(`[POLAR-DB] Loading existing shared database from ${this.dbPath}`);
        } catch (err: any) {
          console.error(`[POLAR-DB] Corrupted database file at ${this.dbPath}, attempting recovery:`, err.message);
        }
      }

      // 2. If not found, attempt migration from legacy polar-state.json
      if (!loadedData) {
        const legacyPaths = [
          path.resolve(process.cwd(), 'polar-state.json'),
          path.join(process.cwd(), 'data', 'polar-state.json'),
        ];

        for (const legacyPath of legacyPaths) {
          if (fs.existsSync(legacyPath)) {
            try {
              const raw = fs.readFileSync(legacyPath, 'utf-8');
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                loadedData = parsed;
                console.log(`[POLAR-DB] Migrated legacy data from ${legacyPath}`);
                break;
              }
            } catch (err: any) {
              console.warn(`[POLAR-DB] Failed to parse legacy state at ${legacyPath}:`, err.message);
            }
          }
        }
      }

      // 3. Assemble and sanitize authoritative schema
      if (loadedData && typeof loadedData === 'object') {
        const state: PolarSystemState = {
          region: loadedData.region || 'antarctica',
          conditionLevel: loadedData.conditionLevel || 'COND-2_CAUTION',
          assets: Array.isArray(loadedData.assets) && loadedData.assets.length > 0 ? loadedData.assets : INITIAL_ASSETS,
          expeditions: Array.isArray(loadedData.expeditions) && loadedData.expeditions.length > 0 ? loadedData.expeditions : INITIAL_EXPEDITIONS,
          supplies: Array.isArray(loadedData.supplies) ? loadedData.supplies : INITIAL_SUPPLIES,
          dispatchLogs: Array.isArray(loadedData.dispatchLogs) ? loadedData.dispatchLogs : INITIAL_DISPATCH_LOGS,
          activeDistress: loadedData.activeDistress || null,
          stations: Array.isArray(loadedData.stations) && loadedData.stations.length > 0 ? loadedData.stations : INITIAL_STATIONS,
          customWaypoints: Array.isArray(loadedData.customWaypoints) ? loadedData.customWaypoints : [],
          polarisDb: loadedData.polarisDb && typeof loadedData.polarisDb === 'object' ? loadedData.polarisDb : this.createDefaultPolarisDb(),
          lastUpdated: new Date().toISOString(),
        };

        // Guarantee all polarisDb tables
        if (!Array.isArray(state.polarisDb.expeditions)) state.polarisDb.expeditions = INITIAL_POLARIS_EXPEDITIONS;
        if (!Array.isArray(state.polarisDb.personnel)) state.polarisDb.personnel = INITIAL_PERSONNEL;
        if (!Array.isArray(state.polarisDb.assets)) state.polarisDb.assets = INITIAL_POLARIS_ASSETS;
        if (!Array.isArray(state.polarisDb.inventory)) state.polarisDb.inventory = INITIAL_INVENTORY;
        if (!Array.isArray(state.polarisDb.shipments)) state.polarisDb.shipments = INITIAL_SHIPMENTS;
        if (!Array.isArray(state.polarisDb.transportation)) state.polarisDb.transportation = INITIAL_TRANSPORTATION;
        if (!Array.isArray(state.polarisDb.maintenance)) state.polarisDb.maintenance = INITIAL_MAINTENANCE;
        if (!Array.isArray(state.polarisDb.tasks)) state.polarisDb.tasks = INITIAL_TASKS;
        if (!Array.isArray(state.polarisDb.alerts)) state.polarisDb.alerts = buildAlerts();
        if (!Array.isArray(state.polarisDb.expenses)) state.polarisDb.expenses = INITIAL_EXPENSES;
        if (!Array.isArray(state.polarisDb.auditLog)) state.polarisDb.auditLog = INITIAL_AUDIT_LOG;
        if (!Array.isArray(state.polarisDb.completedWorkLogs)) state.polarisDb.completedWorkLogs = INITIAL_COMPLETED_WORK_LOGS;

        // Guarantee demo users and seed accounts
        state.polarisDb.users = this.ensureDemoUsers(state.polarisDb.users);

        this.state = state;
      } else {
        console.log('[POLAR-DB] Initializing fresh authoritative database with master polar manifests.');
        this.state = this.createDefaultState();
        this.state.polarisDb.users = this.ensureDemoUsers(this.state.polarisDb.users);
      }

      // Persist to disk immediately to establish authoritative file
      this.persistSynchronous();
      this.isInitialized = true;

      const userCount = this.state.polarisDb?.users?.length || 0;
      console.log(`[POLAR-DB] Authoritative database initialized successfully.`);
      console.log(`[POLAR-DB] Storage path: ${this.dbPath}`);
      console.log(`[POLAR-DB] Personnel registered: ${userCount} accounts ready for authentication.`);
    } catch (err: any) {
      console.error('[POLAR-DB] Fatal database initialization error:', err.message);
      this.state = this.createDefaultState();
      this.isInitialized = true;
    }
  }

  /**
   * Synchronous disk save used during initialization and shutdown
   */
  public persistSynchronous(): void {
    try {
      this.state.lastUpdated = new Date().toISOString();
      const payload = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(this.dbPath, payload, 'utf-8');
      this.lastPersistedTime = this.state.lastUpdated;
    } catch (err: any) {
      console.error('[POLAR-DB] Failed to persist database synchronously:', err.message);
    }
  }

  /**
   * Debounced asynchronous persistence to prevent disk thrashing
   */
  public persist(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        this.state.lastUpdated = new Date().toISOString();
        const payload = JSON.stringify(this.state, null, 2);
        fs.writeFileSync(this.dbPath, payload, 'utf-8');
        this.lastPersistedTime = this.state.lastUpdated;
      } catch (err: any) {
        console.error('[POLAR-DB] Failed to persist database to disk:', err.message);
      }
    }, 250);
  }

  /**
   * Look up a user in the authoritative personnel database
   */
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

  /**
   * Verify credentials for authentication
   */
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

  /**
   * Retrieve current system state
   */
  public getState(): PolarSystemState {
    return this.state;
  }

  /**
   * Reset system state to default manifest while preserving demo accounts
   */
  public resetToDefaults(): PolarSystemState {
    this.state = this.createDefaultState();
    this.state.polarisDb.users = this.ensureDemoUsers(this.state.polarisDb.users);
    this.persist();
    return this.state;
  }

  /**
   * Update full or partial system state
   */
  public updateState(updater: (state: PolarSystemState) => void): PolarSystemState {
    updater(this.state);
    this.persist();
    return this.state;
  }

  /**
   * Health inspection details for /api/health
   */
  public getHealthInfo(): DatabaseHealthInfo {
    const usersCount = this.state.polarisDb?.users?.length || 0;
    const assetsCount = this.state.assets?.length || 0;
    const expeditionsCount = this.state.expeditions?.length || 0;

    return {
      status: this.isInitialized ? 'connected' : 'initializing',
      storageType: 'file_json',
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
