/**
 * Centralized API & Backend Gateway Configuration
 * Single Source of Truth for all frontend API & WebSocket requests.
 * Fully compatible with Vercel Serverless Functions, Web, Mobile browsers, and Tauri Desktop.
 */

import { isTauri } from '../platform';

export const API_BASE_STORAGE_KEY = 'polar_api_base_url';

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
  return typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD);
}

/**
 * Checks whether the current runtime is in local development mode
 */
export function isDevelopmentEnvironment(): boolean {
  return typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
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
 *   it automatically resolves to empty string ('') so all production requests stay same-origin
 *   (/api/*) on the Cloudflare deployment domain without depending on localhost or ngrok.
 */
function resolveConfiguredApiBase(): string {
  const raw = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  ).trim();

  if (!raw) return '';

  // In production builds (Cloudflare Pages web), strictly prevent routing to localhost or ngrok!
  if (isProductionEnvironment() && isLocalOrTunnelUrl(raw)) {
    return '';
  }

  return normalizeBackendUrl(raw);
}

export const API_BASE_URL: string = resolveConfiguredApiBase();

/**
 * Default fallback backend gateway URL for standalone environments.
 * Empty string ensures web deployments use same-origin relative paths.
 */
export const DEFAULT_BACKEND_URL = API_BASE_URL || '';

/**
 * Validates the API Base URL against runtime environment constraints.
 */
export function validateApiBaseUrl(url?: string | null): { valid: boolean; warning?: string; error?: string } {
  if (!url || !url.trim()) {
    // Relative paths are expected, secure, and valid on web / Cloudflare
    return { valid: true };
  }

  const clean = normalizeBackendUrl(url);

  if (isLocalhost(clean)) {
    if (isTauri()) {
      return {
        valid: true,
        warning: `[POLAR API CONFIG WARNING] Desktop build is targeting '${clean}'. For field deployment, ensure a remote base station URL is specified.`,
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
 * 3. Environment-configured API Base URL
 * 4. Default for production web deployments: clean relative same-origin paths ('')
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
        // On production public web domains, ignore stale localhost/ngrok overrides from past local sessions
        if (isProductionEnvironment() && isLocalOrTunnelUrl(cleanStored)) {
          // Ignore stale localhost
        } else if (cleanStored) {
          return cleanStored;
        }
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
  }

  // 3. Build-time environment variable configured in .env
  if (API_BASE_URL && API_BASE_URL.trim()) {
    return API_BASE_URL;
  }

  // 4. Default: Same-origin relative paths (/api/...) for unified web deployments
  return '';
}

/**
 * Resolves an API endpoint path to a URL.
 * Guarantees no double slashes, handles trailing slashes, and avoids duplicate /api/api.
 * Web browsers and mobile phones accessing the Vercel web app automatically use clean relative paths.
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
    // Deduplicate /api prefix if base already ends with /api and path starts with /api/
    if (base.endsWith('/api') && path.startsWith('/api/')) {
      path = path.substring(4);
    }

    let fullUrl = `${base}${path}`;

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
 */
export function wsUrl(path: string = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Explicit dedicated WebSocket server URL (e.g. VITE_WS_URL)
  const explicitWs =
    import.meta.env.VITE_WS_URL || import.meta.env.NEXT_PUBLIC_WS_URL || '';
  if (explicitWs && explicitWs.trim()) {
    const cleanWs = explicitWs.trim().replace(/\/+$/, '');
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

  // 3. In browser, derive directly from current origin
  if (typeof window !== 'undefined' && window.location.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  return '';
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
