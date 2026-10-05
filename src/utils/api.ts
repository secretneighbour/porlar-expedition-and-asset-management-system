/**
 * Polar Operations Unified API & Telemetry Client
 * Automatically connects multiple client PCs and mobile units to the shared backend.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__POLAR_API_BASE_URL__) {
    return String((window as any).__POLAR_API_BASE_URL__).replace(/\/+$/, '');
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '';
}

/**
 * Resolves an API endpoint path to a complete URL
 */
export function apiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Resolves a WebSocket URL based on base URL or current window host
 */
export function wsUrl(path: string = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();

  if (base) {
    try {
      const parsed = new URL(base);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}${cleanPath}`;
    } catch {
      // ignore parse error and fallback
    }
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  return `ws://localhost:3000${cleanPath}`;
}

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
 * Fast diagnostics check to verify backend and database status
 */
export async function checkBackendConnection(): Promise<{
  online: boolean;
  statusText: string;
  databaseStatus?: string;
  usersCount?: number;
  origin: string;
}> {
  try {
    const res = await apiFetch('/api/health', { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        statusText: 'ONLINE',
        databaseStatus: data.database?.status || 'connected',
        usersCount: data.database?.usersCount || 0,
        origin: getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'),
      };
    }
    return {
      online: false,
      statusText: `DEGRADED (${res.status})`,
      origin: getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : 'unknown'),
    };
  } catch (err: any) {
    return {
      online: false,
      statusText: 'UNREACHABLE',
      origin: getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : 'unknown'),
    };
  }
}
