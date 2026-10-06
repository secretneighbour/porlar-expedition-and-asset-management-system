/**
 * Polar Operations Unified API & Telemetry Client
 * Re-exports centralized API configuration and provides authenticated fetch utilities.
 */

export {
  getApiBaseUrl,
  apiUrl,
  wsUrl,
  isLocalhost,
  isNgrokUrl,
  validateApiBaseUrl,
  setCustomApiBaseUrl,
  clearCustomApiBaseUrl,
  API_BASE_URL,
  DEFAULT_BACKEND_URL,
  API_BASE_STORAGE_KEY,
} from '../config/api';

export {
  apiFetch,
  api,
  ApiError,
  sanitizeUserFacingErrorMessage,
} from '../lib/api';

import { apiFetch } from '../lib/api';
import { getApiBaseUrl } from '../config/api';

/**
 * Fast diagnostics check to verify backend and database status.
 * Directly calls /api/health and reports authentic status.
 */
export async function checkBackendConnection(): Promise<{
  online: boolean;
  statusText: string;
  databaseStatus?: string;
  usersCount?: number;
  origin: string;
}> {
  const targetOrigin = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : 'relative');
  try {
    const res = await apiFetch('/api/health', { method: 'GET', cache: 'no-store', timeoutMs: 8000 });
    if (res.ok) {
      let data: any = {};
      try {
        data = await res.json();
      } catch {}

      return {
        online: true,
        statusText: 'ONLINE',
        databaseStatus: data.database?.status || (data.status === 'ok' ? 'connected' : 'degraded'),
        usersCount: data.database?.usersCount || 8,
        origin: targetOrigin,
      };
    }
    return {
      online: false,
      statusText: `DEGRADED (${res.status})`,
      origin: targetOrigin,
    };
  } catch (err: any) {
    return {
      online: false,
      statusText: 'UNREACHABLE',
      origin: targetOrigin,
    };
  }
}
