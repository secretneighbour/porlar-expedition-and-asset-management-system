/**
 * Polar Operations Unified API & Telemetry Client
 * Automatically connects multiple client PCs and mobile units to the shared backend.
 * Re-exports centralized configuration from src/config/api.ts.
 */

import {
  API_BASE_URL,
  API_BASE_STORAGE_KEY,
  getApiBaseUrl,
  apiUrl,
  wsUrl,
  setCustomApiBaseUrl,
  clearCustomApiBaseUrl,
  isLocalhost,
  isNgrokUrl,
  validateApiBaseUrl,
} from '../config/api';

export {
  API_BASE_URL,
  API_BASE_STORAGE_KEY,
  getApiBaseUrl,
  apiUrl,
  wsUrl,
  setCustomApiBaseUrl,
  clearCustomApiBaseUrl,
  isLocalhost,
  isNgrokUrl,
  validateApiBaseUrl,
};

/**
 * Authenticated fetch helper with selective header injection,
 * CORS optimization, and safe diagnostic logging.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = apiUrl(endpoint);
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();
  const isBodyAllowed = method !== 'GET' && method !== 'HEAD';

  // Always inject ngrok-skip-browser-warning to ensure ngrok free tunnels never return HTML warning pages
  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', '69420');
  }

  // Ensure JSON acceptance header
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain, */*');
  }

  // Only inject Content-Type: application/json for requests that actually contain a JSON body.
  // Omitting this for GET/HEAD avoids triggering unnecessary CORS OPTIONS preflights!
  if (isBodyAllowed && options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Do not inject Authorization on public/unauthenticated endpoints
  const isPublic = endpoint.startsWith('/api/health') || endpoint.startsWith('/api/auth/login');
  if (!isPublic && typeof window !== 'undefined' && !headers.has('Authorization')) {
    const token =
      sessionStorage.getItem('polar_auth_token') ||
      localStorage.getItem('polar_auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Safe diagnostic log (no secrets)
  console.log(`[API REQUEST] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    console.log(`[API RESPONSE] ${method} ${endpoint} -> ${response.status} ${response.statusText}`);
    return response;
  } catch (fetchErr: any) {
    console.error(`[API FETCH ERROR] ${method} ${url} failed:`, fetchErr?.message || fetchErr);
    throw fetchErr;
  }
}

/**
 * Fast diagnostics check to verify backend and database status.
 * Executes a clean GET /api/health request and checks for real 200 response.
 */
export async function checkBackendConnection(): Promise<{
  online: boolean;
  statusText: string;
  databaseStatus?: string;
  usersCount?: number;
  origin: string;
}> {
  const activeOrigin = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : 'unknown');

  try {
    const res = await apiFetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
    });

    if (res.ok && res.status === 200) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        const isNgrokPage = text.includes('ngrok') || text.includes('ERR_NGROK');
        return {
          online: false,
          statusText: isNgrokPage
            ? 'NGROK INTERSTITIAL (Tap Check or open ngrok URL in browser to bypass)'
            : `DEGRADED (Non-JSON Response: ${contentType.slice(0, 20)})`,
          origin: activeOrigin,
        };
      }

      const data = await res.json();
      return {
        online: true,
        statusText: 'ONLINE',
        databaseStatus: data.database?.status || 'connected',
        usersCount: data.database?.usersCount || 0,
        origin: activeOrigin,
      };
    }

    return {
      online: false,
      statusText: `DEGRADED (${res.status})`,
      origin: activeOrigin,
    };
  } catch (err: any) {
    const isLoopback = isLocalhost(activeOrigin);
    return {
      online: false,
      statusText: isLoopback
        ? 'UNREACHABLE (Physical mobile devices cannot reach localhost; set VITE_API_BASE_URL to ngrok HTTPS)'
        : 'UNREACHABLE',
      origin: activeOrigin,
    };
  }
}
