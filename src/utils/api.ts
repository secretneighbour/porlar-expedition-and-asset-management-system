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
  const targetOrigin = getApiBaseUrl() || 'same-origin';
  try {
    const res = await apiFetch('/api/health', { method: 'GET', cache: 'no-store', timeoutMs: 8000 });
    const contentType = res.headers.get('content-type') || '';

    // Strictly require authentic JSON response from Polar Operations Backend
    if (res.ok && contentType.includes('application/json')) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (data && (data.status === 'ok' || data.success)) {
        return {
          online: true,
          statusText: 'ONLINE',
          databaseStatus: data.database?.status || 'connected',
          usersCount: data.database?.usersCount,
          origin: targetOrigin,
        };
      }
    }

    // Response was non-JSON (e.g. static HTML page) or HTTP error
    return {
      online: false,
      statusText: res.ok ? 'INVALID_BACKEND_RESPONSE' : `HTTP_${res.status}`,
      origin: targetOrigin,
    };
  } catch (err: any) {
    return {
      online: false,
      statusText: err?.code === 'TIMEOUT' ? 'TIMEOUT' : 'UNREACHABLE',
      origin: targetOrigin,
    };
  }
}
