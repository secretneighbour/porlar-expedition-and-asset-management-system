/**
 * Centralized API & Backend Gateway Configuration
 * Single Source of Truth for all frontend API & WebSocket requests.
 * Fully compatible with Vercel Serverless Functions, Web, Mobile browsers, and Tauri Desktop.
 */

import { isTauri, isMobile } from '../platform';

export const API_BASE_STORAGE_KEY = 'polar_api_base_url';

/**
 * Canonical Production Cloudflare Worker Backend Gateway URL.
 * Centralized Single Source of Truth for production phone apps, mobile field units, and remote operations.
 */
export const PRODUCTION_CLOUDFLARE_WORKER_URL =
  'https://porlar-expedition-and-asset-management-system.ggm23768.workers.dev';

export const PRODUCTION_BACKEND_URL = PRODUCTION_CLOUDFLARE_WORKER_URL;

/**
 * Canonical Production WebSocket Gateway URL.
 * Secure WebSocket connection (wss://) to Cloudflare Worker Durable Objects.
 */
export const PRODUCTION_WS_URL =
  'wss://porlar-expedition-and-asset-management-system.ggm23768.workers.dev/ws';

/**
 * Normalizes backend URLs:
 * - Trims whitespace
 * - Automatically prepends https:// (or http:// for localhost/IPs) if scheme is missing
 * - Strips trailing slashes
 */
export function normalizeBackendUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    if (isLocalhost(url)) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  return url.replace(/\/+$/, '');
}

/**
 * Checks whether the current runtime is in production mode
 */
export function isProductionEnvironment(): boolean {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env?.PROD !== 'undefined') {
    return Boolean(import.meta.env.PROD);
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'production';
  }
  return false;
}

/**
 * Checks whether the current runtime is in local development mode
 */
export function isDevelopmentEnvironment(): boolean {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env?.DEV !== 'undefined') {
    return Boolean(import.meta.env.DEV);
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }
  return true;
}

/**
 * Helper to check if a target URL points to loopback/localhost/private network
 */
export function isLocalhost(url?: string | null): boolean {
  if (!url) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?(\/.*)?$/i.test(
    url.trim()
  );
}

/**
 * Checks if a target URL is an ephemeral development tunnel (ngrok, cloudflare tunnel, localtunnel)
 */
export function isTunnelUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    /ngrok(-free)?\.(app|io)/i.test(clean) ||
    /trycloudflare\.com/i.test(clean) ||
    /localtunnel\.me/i.test(clean)
  );
}

export const isNgrokUrl = isTunnelUrl;

/**
 * Checks if a target URL is either a local address or dev tunnel
 */
export function isLocalOrTunnelUrl(url?: string | null): boolean {
  return isLocalhost(url) || isTunnelUrl(url);
}

/**
 * Raw build-time environment variable injected by Vite or build environment.
 * - In DEVELOPMENT: Honors VITE_API_BASE_URL (localhost:3000, ngrok, etc.) so developer
 *   can connect frontend to local backend or expose via ngrok to mobile phones.
 * - In PRODUCTION: If VITE_API_BASE_URL points to localhost or ngrok (leftover from local dev),
 *   it automatically routes to the production Cloudflare Worker URL.
 */
function resolveConfiguredApiBase(): string {
  const envObj =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined' && process.env
      ? process.env
      : {};

  const raw = (
    envObj.VITE_API_BASE_URL ||
    envObj.VITE_API_URL ||
    envObj.VITE_BACKEND_URL ||
    envObj.NEXT_PUBLIC_API_BASE_URL ||
    ''
  ).trim();

  // In production builds (mobile phone app APK / Cloudflare web), strictly prevent routing to localhost or dev tunnels
  if (isProductionEnvironment() && isLocalOrTunnelUrl(raw)) {
    return PRODUCTION_CLOUDFLARE_WORKER_URL;
  }

  if (raw) {
    return normalizeBackendUrl(raw);
  }

  // In production builds or mobile/Tauri environments, default to centralized Cloudflare Worker
  if (isProductionEnvironment() || isTauri()) {
    return PRODUCTION_CLOUDFLARE_WORKER_URL;
  }

  return '';
}

export const API_BASE_URL: string = resolveConfiguredApiBase();

/**
 * Default fallback backend gateway URL for standalone environments.
 */
export const DEFAULT_BACKEND_URL = API_BASE_URL || PRODUCTION_BACKEND_URL;

/**
 * Validates the API Base URL against runtime environment constraints.
 */
export function validateApiBaseUrl(url?: string | null): { valid: boolean; warning?: string; error?: string } {
  if (!url || !url.trim()) {
    return { valid: true };
  }

  const clean = normalizeBackendUrl(url);

  if (isLocalhost(clean)) {
    if (isTauri() || (typeof window !== 'undefined' && isMobile())) {
      return {
        valid: false,
        warning: `[POLAR API CONFIG WARNING] Mobile/Desktop device is targeting '${clean}'. Physical devices cannot reach loopback localhost. Target ${PRODUCTION_CLOUDFLARE_WORKER_URL} or an ngrok tunnel.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Retrieves the effective API Base URL with precedence:
 * 1. Global runtime override (__POLAR_API_BASE_URL__)
 * 2. User-configured override in localStorage ('polar_api_base_url')
 *    (in production, stale localhost/ngrok overrides are ignored)
 * 3. Localhost laptop development check (allows testing against local Express server)
 * 4. Environment-configured API Base URL
 * 5. Default Canonical Gateway: Production Cloudflare Worker URL
 */
export function getApiBaseUrl(): string {
  // 1. Explicit global runtime override (e.g. injected by test harnesses)
  if (typeof globalThis !== 'undefined' && (globalThis as any).__POLAR_API_BASE_URL__) {
    const override = normalizeBackendUrl(String((globalThis as any).__POLAR_API_BASE_URL__));
    if (override) return override;
  }

  // 2. User-configured override in localStorage (from Operations Gateway modal on device)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
      if (stored && stored.trim()) {
        const cleanStored = normalizeBackendUrl(stored);
        if (isProductionEnvironment()) {
          // In production mobile / web mode, never route to localhost, 127.0.0.1, LAN IP, or dev tunnels
          if (isLocalOrTunnelUrl(cleanStored)) {
            // Ignore stale localhost/ngrok override from dev sessions
          } else if (cleanStored) {
            return cleanStored;
          }
        } else {
          // In development mode: allow localhost, ngrok, LAN IP, or remote URL
          if (cleanStored) return cleanStored;
        }
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
  }

  // 3. Localhost laptop development check:
  // When testing locally in development mode on desktop browser (visiting http://localhost:...):
  // Allow relative paths to local Express server on port 3000 if no explicit tunnel/external URL is set
  if (
    isDevelopmentEnvironment() &&
    !isTauri() &&
    typeof window !== 'undefined' &&
    isLocalhost(window.location.hostname) &&
    (!API_BASE_URL || isLocalhost(API_BASE_URL))
  ) {
    return '';
  }

  // 4. Build-time environment variable configured in .env
  if (API_BASE_URL && API_BASE_URL.trim()) {
    if (isProductionEnvironment() && isLocalOrTunnelUrl(API_BASE_URL)) {
      return PRODUCTION_CLOUDFLARE_WORKER_URL;
    }
    return API_BASE_URL;
  }

  // 5. Default Canonical Gateway: Production Cloudflare Worker URL
  return PRODUCTION_CLOUDFLARE_WORKER_URL;
}

/**
 * Resolves an API endpoint path to a URL.
 * Guarantees no double slashes, handles trailing slashes, and avoids duplicate /api/api.
 * Production mobile apps and web browsers resolve to the Cloudflare Worker URL.
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  let path = (endpoint || '').trim();

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // If a live backend base URL is configured, prepend it:
  if (base) {
    const cleanBase = base.replace(/\/+$/, '');

    // Deduplicate /api prefix if base already ends with /api and path starts with /api/
    if (cleanBase.endsWith('/api') && path.startsWith('/api/')) {
      path = path.substring(4);
    }

    let fullUrl = `${cleanBase}${path}`;

    // For ngrok endpoints, append ngrok-skip-browser-warning=true as query parameter.
    if (fullUrl.includes('ngrok') && !fullUrl.includes('ngrok-skip-browser-warning')) {
      const separator = fullUrl.includes('?') ? '&' : '?';
      fullUrl = `${fullUrl}${separator}ngrok-skip-browser-warning=true`;
    }

    return fullUrl;
  }

  // If no base URL is configured, return the relative path
  if (path.includes('ngrok') && !path.includes('ngrok-skip-browser-warning')) {
    const separator = path.includes('?') ? '&' : '?';
    path = `${path}${separator}ngrok-skip-browser-warning=true`;
  }

  return path;
}

/**
 * Resolves a WebSocket URL based on configured base URL or current window host.
 * Automatically derives wss:// for https and ws:// for http.
 * Production Cloudflare Worker WebSocket strictly derives wss://.
 */
export function wsUrl(path: string = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Explicit dedicated WebSocket server URL (e.g. VITE_WS_URL)
  const envObj =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined' && process.env
      ? process.env
      : {};
  const explicitWs = (envObj.VITE_WS_URL || envObj.NEXT_PUBLIC_WS_URL || '').trim();
  if (explicitWs) {
    const cleanWs = explicitWs.replace(/\/+$/, '');
    return `${cleanWs}${cleanPath}`;
  }

  const base = getApiBaseUrl();

  // 2. Base URL configured
  if (base) {
    try {
      const parsed = new URL(base);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}${cleanPath}`;
    } catch (e) {
      console.warn(`[POLAR API] Failed to parse API Base URL '${base}' for WebSocket, using fallback`, e);
    }
  }

  // 3. Fallback for production or native Tauri: Canonical Cloudflare Worker WSS URL
  if (isProductionEnvironment() || isTauri()) {
    return `${PRODUCTION_WS_URL.replace(/\/ws$/, '')}${cleanPath}`;
  }

  // 4. In browser, derive directly from current origin
  if (typeof window !== 'undefined' && window.location.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  return PRODUCTION_WS_URL;
}

/**
 * Sets a runtime custom API Base URL (persisted to localStorage)
 */
export function setCustomApiBaseUrl(url: string): void {
  const clean = normalizeBackendUrl(url);
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__POLAR_API_BASE_URL__ = clean;
  }
  if (typeof window !== 'undefined') {
    if (clean) {
      try {
        localStorage.setItem(API_BASE_STORAGE_KEY, clean);
      } catch {}
    } else {
      try {
        localStorage.removeItem(API_BASE_STORAGE_KEY);
      } catch {}
    }
    try {
      window.dispatchEvent(new CustomEvent('polar:api_base_changed', { detail: clean }));
    } catch {}
  }
}

/**
 * Clears runtime custom API Base URL override
 */
export function clearCustomApiBaseUrl(): void {
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).__POLAR_API_BASE_URL__;
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(API_BASE_STORAGE_KEY);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('polar:api_base_changed', { detail: '' }));
    } catch {}
  }
}

// Global automatic ngrok bypass injection for browser/webview environments
if (typeof window !== 'undefined') {
  try {
    document.cookie = 'ngrok-skip-browser-warning=69420; path=/; max-age=31536000; SameSite=None; Secure';
  } catch {}

  if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let isNgrok = false;
      if (typeof input === 'string') {
        isNgrok = isNgrokUrl(input);
      } else if (input instanceof URL) {
        isNgrok = isNgrokUrl(input.toString());
      } else if (input instanceof Request) {
        isNgrok = isNgrokUrl(input.url);
      }

      if (isNgrok || (API_BASE_URL && isNgrokUrl(API_BASE_URL))) {
        init = init || {};
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
        if (!headers.has('ngrok-skip-browser-warning')) {
          headers.set('ngrok-skip-browser-warning', '69420');
        }
        init.headers = headers;
      }
      return originalFetch.call(this, input, init);
    };
  }
}
