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

import { apiUrl, getApiBaseUrl } from '../config/api';

/**
 * Authenticated fetch helper with automatic Authorization header injection
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = apiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include active session token if present
  if (typeof window !== 'undefined' && !headers.has('Authorization')) {
    const token =
      sessionStorage.getItem('polar_auth_token') ||
      localStorage.getItem('polar_auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Fast diagnostics check to verify backend and database status.
 * Directly calls <BACKEND_URL>/api/health and reports authentic status.
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
    const res = await apiFetch('/api/health', { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON payload
      }
      return {
        online: true,
        statusText: 'ONLINE',
        databaseStatus: data.database?.status || 'connected',
        usersCount: data.database?.usersCount || 0,
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
